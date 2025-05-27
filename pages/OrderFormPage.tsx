import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Customer, Order, ProductItem, OrderSection, Currency, ExchangeRates, OrderStatus, Discount } from '../types';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { CURRENCIES_SUPPORTED, DEFAULT_CURRENCY, INITIAL_EXCHANGE_RATES, ORDER_STATUSES, generateId, DEFAULT_TAX_RATE, ORDER_STATUS_TRANSLATIONS } from '../constants';
import { formatCurrency, convertTRYToCurrency, calculateOrderFinancials } from '../utils/currencyUtils';

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;

type OrderFormData = Partial<Omit<Order, 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY'>> & {
    sections: OrderSection[];
    discounts: Discount[];
    taxRate?: number;
    displayItemsTotalTRY?: number;
    displayTotalDiscountAmountTRY?: number;
    displaySubTotalAfterDiscountsTRY?: number;
    displayTaxAmountTRY?: number;
    displayGrandTotalTRY?: number;
};

interface ProductFormItem extends ProductItem {
    rawUnitPrice?: number; 
}
interface OrderSectionForm extends Omit<OrderSection, 'products'> {
    products: ProductFormItem[];
}
interface OrderFormDataWithRawPrices extends Omit<OrderFormData, 'sections'> {
    sections: OrderSectionForm[];
}


export const OrderFormPage: React.FC = () => {
  const { 
    customers, addOrder, updateOrder, getOrderById, 
    currentCurrency: globalCurrency, exchangeRates: globalRates,
    productUnits, getOrderStatusTranslation,
    productNameSuggestions, productDescriptionSuggestions,
    addProductNameSuggestion, addProductDescriptionSuggestion
  } = useAppContext();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const isEditing = Boolean(orderId);

  const initialDefaultUnit = productUnits.length > 0 ? productUnits[0] : 'Adet';
  const initialPassedCustomerId = useRef(location.state?.initialCustomerId);


  const [orderData, setOrderData] = useState<OrderFormDataWithRawPrices>({
    date: new Date().toISOString().split('T')[0],
    sections: [{ id: generateId(), name: 'Ana Bölüm', products: [] }],
    currency: globalCurrency,
    exchangeRatesSnapshot: globalRates,
    status: OrderStatus.QUOTATION,
    discounts: [],
    taxRate: undefined,
    notes: '',
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [applyTax, setApplyTax] = useState<boolean>(false);

  const mapOrderToFormData = (order: Order): OrderFormDataWithRawPrices => {
    return {
      ...order,
      date: new Date(order.date).toISOString().split('T')[0],
      discounts: order.discounts || [],
      taxRate: order.taxRate,
      sections: order.sections.map(section => ({
        ...section,
        products: section.products.map(product => ({
          ...product,
          rawUnitPrice: order.currency !== Currency.TRY && order.exchangeRatesSnapshot[order.currency as keyof ExchangeRates]
            ? parseFloat((product.unitPriceTRY / order.exchangeRatesSnapshot[order.currency as keyof ExchangeRates]).toFixed(2))
            : undefined
        }))
      }))
    };
  };

  useEffect(() => {
    // Clear location.state on the first relevant render pass after storing its value
    if (location.state?.initialCustomerId) {
        navigate(location.pathname, { replace: true, state: {} });
    }

    if (isEditing && orderId) {
        const existingOrder = getOrderById(orderId);
        if (existingOrder) {
            const formData = mapOrderToFormData(existingOrder);
            setOrderData(formData);
            setSelectedCustomerId(existingOrder.customerId);
            setApplyTax(typeof existingOrder.taxRate === 'number' && existingOrder.taxRate > 0);
        } else {
            navigate('/orders', { replace: true });
        }
    } else { // This is a new order (not editing)
        const customerToPreselect = initialPassedCustomerId.current;

        setOrderData({
            date: new Date().toISOString().split('T')[0],
            sections: [{ id: generateId(), name: 'Ana Bölüm', products: [] }],
            currency: globalCurrency,
            exchangeRatesSnapshot: globalRates,
            status: OrderStatus.QUOTATION,
            discounts: [],
            taxRate: undefined,
            notes: '',
        });
        setApplyTax(false); 

        if (customerToPreselect) {
            setSelectedCustomerId(customerToPreselect);
        } else {
            setSelectedCustomerId(''); 
        }
        initialPassedCustomerId.current = undefined; 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isEditing, getOrderById, navigate, globalCurrency, globalRates]);
  
  useEffect(() => {
    // This effect updates currency/rates if global context changes AND it's a new form.
    // It should not interfere with initial customer ID setting.
    if (!isEditing && !orderId) { 
        setOrderData(prev => ({
            ...prev,
            currency: globalCurrency,
            exchangeRatesSnapshot: globalRates,
        }));
    }
  }, [globalCurrency, globalRates, isEditing, orderId]);
  
  useEffect(() => {
    const financials = calculateOrderFinancials(orderData.sections, orderData.discounts, orderData.taxRate);
    setOrderData(prev => ({
      ...prev,
      displayItemsTotalTRY: financials.itemsTotalTRY,
      displayTotalDiscountAmountTRY: financials.totalDiscountAmountTRY,
      displaySubTotalAfterDiscountsTRY: financials.subTotalAfterDiscountsTRY,
      displayTaxAmountTRY: financials.taxAmountTRY,
      displayGrandTotalTRY: financials.grandTotalTRY,
    }));
  }, [orderData.sections, orderData.discounts, orderData.taxRate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
    if (name === 'customerId') setSelectedCustomerId(value);
    if (name === 'taxRate') {
        const rate = parseFloat(value);
        setOrderData(prev => ({ ...prev, taxRate: isNaN(rate) || rate < 0 ? undefined : rate }));
    }
  };
  
  const handleApplyTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setApplyTax(checked);
    if (checked) {
      setOrderData(prev => ({ ...prev, taxRate: prev.taxRate === undefined || prev.taxRate <=0 ? DEFAULT_TAX_RATE : prev.taxRate }));
    } else {
      setOrderData(prev => ({ ...prev, taxRate: undefined }));
    }
  };

  const handleCurrencySettingsChange = (field: 'currency' | keyof ExchangeRates, value: string) => {
    setOrderData(prev => {
        let newOrderData = { ...prev };
        if (field === 'currency') {
            newOrderData = { ...newOrderData, currency: value as Currency };
        } else {
            const rate = parseFloat(value);
            if (!isNaN(rate) && rate > 0) {
                newOrderData = {
                    ...newOrderData,
                    exchangeRatesSnapshot: {
                        ...(newOrderData.exchangeRatesSnapshot || INITIAL_EXCHANGE_RATES),
                        [field as keyof ExchangeRates]: rate
                    }
                };
            } else {
                return prev; 
            }
        }
        const targetCurrency = newOrderData.currency!;
        const rates = newOrderData.exchangeRatesSnapshot!;
        
        newOrderData.sections = newOrderData.sections.map(section => ({
            ...section,
            products: section.products.map(p => {
                let newUnitPriceTRY = p.unitPriceTRY;
                let newRawUnitPrice = p.rawUnitPrice;

                if (targetCurrency === Currency.TRY) {
                    newRawUnitPrice = undefined; 
                } else {
                    const currentRate = rates[targetCurrency as keyof ExchangeRates];
                    if(currentRate && currentRate > 0) {
                        if(p.rawUnitPrice !== undefined && p.rawUnitPrice >= 0){ 
                           newUnitPriceTRY = p.rawUnitPrice * currentRate;
                        } else { 
                           newRawUnitPrice = parseFloat((p.unitPriceTRY / currentRate).toFixed(2));
                        }
                    }
                }
                return { ...p, unitPriceTRY: parseFloat(newUnitPriceTRY.toFixed(2)), rawUnitPrice: newRawUnitPrice };
            })
        }));
        return newOrderData;
    });
  };

  const addSection = () => {
    setOrderData(prev => ({
      ...prev,
      sections: [...prev.sections, { id: generateId(), name: `Bölüm ${prev.sections.length + 1}`, products: [] }],
    }));
  };

  const updateSectionName = (sectionId: string, name: string) => {
    setOrderData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, name } : s),
    }));
  };

  const removeSection = (sectionId: string) => {
    setOrderData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const addProductToSection = (sectionId: string) => {
    setOrderData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, products: [...s.products, { id: generateId(), name: '', quantity: 1, unitPriceTRY: 0, unit: initialDefaultUnit, rawUnitPrice: orderData.currency !== Currency.TRY ? 0 : undefined }] } : s
      ),
    }));
  };

  const updateProductInSection = (sectionId: string, productId: string, field: keyof ProductFormItem, value: string | number) => {
    setOrderData(prev => {
        const newSections = prev.sections.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    products: s.products.map(p => {
                        if (p.id === productId) {
                            let updatedProduct = { ...p, [field]: value };
                            
                            const currentOrderCurrency = prev.currency!;
                            const currentOrderRates = prev.exchangeRatesSnapshot!;
                            
                            if (currentOrderCurrency !== Currency.TRY) {
                                if (field === 'rawUnitPrice') {
                                    const rawPrice = Number(value);
                                    const rate = currentOrderRates[currentOrderCurrency as keyof ExchangeRates];
                                    if (!isNaN(rawPrice) && rawPrice >=0 && rate && rate > 0) {
                                        updatedProduct.unitPriceTRY = parseFloat((rawPrice * rate).toFixed(2));
                                        updatedProduct.rawUnitPrice = rawPrice;
                                    }
                                } else if (field === 'unitPriceTRY' && (updatedProduct.rawUnitPrice === undefined || updatedProduct.rawUnitPrice === 0) ) {
                                     const tryPrice = Number(value);
                                     const rate = currentOrderRates[currentOrderCurrency as keyof ExchangeRates];
                                     if (!isNaN(tryPrice) && rate && rate > 0) {
                                        updatedProduct.unitPriceTRY = parseFloat(tryPrice.toFixed(2));
                                        updatedProduct.rawUnitPrice = parseFloat((tryPrice / rate).toFixed(2));
                                     } else {
                                        updatedProduct.unitPriceTRY = parseFloat(tryPrice.toFixed(2));
                                        updatedProduct.rawUnitPrice = undefined;
                                     }
                                }
                            } else { 
                                if (field === 'unitPriceTRY') {
                                    const tryPrice = Number(value);
                                    updatedProduct.unitPriceTRY = parseFloat(tryPrice.toFixed(2));
                                }
                                updatedProduct.rawUnitPrice = undefined; 
                            }

                            if (field === 'quantity' || field === 'unitPriceTRY' || field === 'rawUnitPrice') {
                                updatedProduct[field as 'quantity' | 'unitPriceTRY' | 'rawUnitPrice'] = Number(value) >= 0 ? Number(value) : 0;
                            }
                            return updatedProduct;
                        }
                        return p;
                    })
                };
            }
            return s;
        });
        return { ...prev, sections: newSections };
    });
  };

  const handleProductInputBlur = (sectionId: string, productId: string, field: 'name' | 'description', value: string) => {
    if (field === 'name') {
        addProductNameSuggestion(value);
    } else if (field === 'description') {
        addProductDescriptionSuggestion(value);
    }
  };

  const removeProductFromSection = (sectionId: string, productId: string) => {
    setOrderData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, products: s.products.filter(p => p.id !== productId) } : s
      ),
    }));
  };
  
  const addDiscount = () => {
    setOrderData(prev => ({
        ...prev,
        discounts: [...prev.discounts, { id: generateId(), type: 'percentage', value: 0, description: ''}]
    }));
  };

  const updateDiscount = (discountId: string, field: keyof Discount, value: string | number) => {
    setOrderData(prev => ({
        ...prev,
        discounts: prev.discounts.map(d =>
            d.id === discountId ? { ...d, [field]: (field === 'value') ? Number(value) : value } : d
        )
    }));
  };

  const removeDiscount = (discountId: string) => {
    setOrderData(prev => ({
        ...prev,
        discounts: prev.discounts.filter(d => d.id !== discountId)
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!selectedCustomerId) errors.customerId = 'Müşteri seçimi zorunludur.';
    if (!orderData.date) errors.date = 'Tarih zorunludur.';
    if (!orderData.sections || orderData.sections.length === 0) errors.sections = 'En az bir bölüm eklenmelidir.';
    
    orderData.sections?.forEach((section, sIdx) => {
        if (!section.name.trim()) errors[`sectionName_${sIdx}`] = `Bölüm ${sIdx+1} adı boş olamaz.`;
        if(section.products.length === 0) errors[`sectionProducts_${sIdx}`] = `Bölüm ${sIdx+1} en az bir ürün içermelidir.`;
        section.products.forEach((product, pIdx) => {
            if (!product.name.trim()) errors[`productName_${sIdx}_${pIdx}`] = `Bölüm ${sIdx+1}, Ürün ${pIdx+1} adı boş olamaz.`;
            if (product.quantity <= 0) errors[`productQty_${sIdx}_${pIdx}`] = `Bölüm ${sIdx+1}, Ürün ${pIdx+1} miktarı pozitif olmalıdır.`;
            
            const priceToValidate = orderData.currency !== Currency.TRY ? product.rawUnitPrice : product.unitPriceTRY;
            if (priceToValidate === undefined || priceToValidate < 0) errors[`productPrice_${sIdx}_${pIdx}`] = `Bölüm ${sIdx+1}, Ürün ${pIdx+1} fiyatı negatif olamaz veya girilmelidir.`;
            
            if (!product.unit) errors[`productUnit_${sIdx}_${pIdx}`] = `Bölüm ${sIdx+1}, Ürün ${pIdx+1} birimi seçilmelidir.`;
        });
    });

    orderData.discounts?.forEach((discount, dIdx) => {
        if(discount.value < 0) errors[`discountValue_${dIdx}`] = `İskonto ${dIdx+1} değeri negatif olamaz.`;
        if(discount.type === 'percentage' && discount.value > 100) errors[`discountValue_${dIdx}`] = `İskonto ${dIdx+1} oranı %100'den büyük olamaz.`;
    });

    if(applyTax && (orderData.taxRate === undefined || orderData.taxRate < 0)) {
        errors.taxRate = 'Geçerli bir KDV oranı giriniz.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = () => {
    if (!validateForm()) return;

    const finalSections = orderData.sections.map(section => ({
        ...section,
        products: section.products.map(p => {
            const { rawUnitPrice, ...productToSave } = p;
            return productToSave;
        })
    }));

    const finalOrderPayload: Omit<Order, 'id' | 'orderNumber' | 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'> = {
      customerId: selectedCustomerId,
      date: new Date(orderData.date!).toISOString(),
      sections: finalSections, 
      currency: orderData.currency!,
      exchangeRatesSnapshot: orderData.exchangeRatesSnapshot!,
      status: orderData.status!,
      notes: orderData.notes,
      discounts: orderData.discounts || [],
      taxRate: applyTax ? (orderData.taxRate || 0) : undefined,
    };
    
    if (isEditing && orderId && orderData.orderNumber) {
        updateOrder({ ...finalOrderPayload, id: orderId, orderNumber: orderData.orderNumber });
    } else {
        addOrder(finalOrderPayload);
    }
    navigate('/orders');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  ).map(c => ({ value: c.id, label: c.name }));

  const statusOptions = ORDER_STATUSES.map(s => ({ value: s, label: getOrderStatusTranslation(s) }));
  const currencyOptions = CURRENCIES_SUPPORTED.map(c => ({ value: c, label: c }));
  const productUnitOptions = productUnits.map(u => ({value: u, label: u}));
  const discountTypeOptions = [
    { value: 'percentage', label: 'Oran (%)' },
    { value: 'amount', label: 'Tutar (TRY)' }
  ];

  const currentOrderCurrency = orderData.currency || DEFAULT_CURRENCY;
  const currentOrderRates = orderData.exchangeRatesSnapshot || INITIAL_EXCHANGE_RATES;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 shadow-xl rounded-lg max-w-5xl mx-auto my-8">
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-8 border-b pb-4 border-gray-300 dark:border-gray-600">
        {isEditing ? 'Sipariş/Teklif Düzenle' : 'Yeni Sipariş/Teklif Oluştur'}
        {isEditing && orderData.orderNumber && <span className="text-lg text-gray-500 dark:text-gray-400 ml-2 block sm:inline">({orderData.orderNumber})</span>}
      </h1>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <div>
            <Input 
              label="Müşteri Ara"
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              placeholder="Müşteri adıyla arayın..."
              containerClassName="!mb-2"
            />
            <Select
              label="Müşteri*"
              name="customerId"
              options={filteredCustomers}
              value={selectedCustomerId}
              onChange={handleInputChange}
              placeholder="Müşteri Seçiniz"
              error={formErrors.customerId}
              containerClassName="!mb-0"
            />
          </div>
          <Input
            label="Tarih*"
            type="date"
            name="date"
            value={orderData.date}
            onChange={handleInputChange}
            error={formErrors.date}
          />
        </div>

        <div className="p-4 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Para Birimi Ayarları</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Select
                    label="Para Birimi"
                    options={currencyOptions}
                    value={currentOrderCurrency}
                    onChange={(e) => handleCurrencySettingsChange('currency', e.target.value)}
                />
                {currentOrderCurrency === Currency.USD && (
                    <Input label={`1 USD = TRY Kuru`} type="number" step="0.0001" 
                           value={currentOrderRates[Currency.USD]} 
                           onChange={(e) => handleCurrencySettingsChange(Currency.USD, e.target.value)} />
                )}
                {currentOrderCurrency === Currency.EUR && (
                    <Input label={`1 EUR = TRY Kuru`} type="number" step="0.0001" 
                           value={currentOrderRates[Currency.EUR]} 
                           onChange={(e) => handleCurrencySettingsChange(Currency.EUR, e.target.value)} />
                )}
            </div>
        </div>

        <div className="space-y-6">
          {orderData.sections?.map((section, sectionIndex) => (
            <div key={section.id} className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <Input
                  label = {`Bölüm ${sectionIndex + 1} Adı`}
                  value={section.name}
                  onChange={(e) => updateSectionName(section.id, e.target.value)}
                  containerClassName="flex-grow mr-2 !mb-0"
                  className="text-lg font-semibold"
                  error={formErrors[`sectionName_${sectionIndex}`]}
                />
                { (orderData.sections?.length || 0) > 1 &&
                    <Button variant="danger" size="sm" onClick={() => removeSection(section.id)}><TrashIcon/></Button>
                }
              </div>
              {formErrors[`sectionProducts_${sectionIndex}`] && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{formErrors[`sectionProducts_${sectionIndex}`]}</p>}

              {section.products.map((product, productIndex) => {
                  const unitPriceLabel = currentOrderCurrency === Currency.TRY ? 'Birim Fiyat (TRY)*' : `Birim Fiyat (${currentOrderCurrency})*`;
                  const unitPriceValue = currentOrderCurrency === Currency.TRY ? product.unitPriceTRY : product.rawUnitPrice;
                  const unitPriceField = currentOrderCurrency === Currency.TRY ? 'unitPriceTRY' : 'rawUnitPrice';

                  return (
                    <div key={product.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-start py-3 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
                      <Input label="Ürün Adı*" value={product.name} list="productNameSuggestions" 
                             onChange={(e) => updateProductInSection(section.id, product.id, 'name', e.target.value)}
                             onBlur={(e) => handleProductInputBlur(section.id, product.id, 'name', e.target.value)}
                             containerClassName="col-span-12 md:col-span-4 !mb-1" error={formErrors[`productName_${sectionIndex}_${productIndex}`]}/>
                      <Textarea label="Açıklama" value={product.description || ''} 
                                onChange={(e) => updateProductInSection(section.id, product.id, 'description', e.target.value)}
                                onBlur={(e) => handleProductInputBlur(section.id, product.id, 'description', e.target.value)}
                                containerClassName="col-span-12 md:col-span-4 !mb-1" rows={1}/>
                      <Select label="Birim*" options={productUnitOptions} value={product.unit} onChange={(e) => updateProductInSection(section.id, product.id, 'unit', e.target.value)} containerClassName="col-span-6 md:col-span-2 !mb-1" error={formErrors[`productUnit_${sectionIndex}_${productIndex}`]}/>
                      <Input label="Miktar*" type="number" min="0.01" step="0.01" value={product.quantity} onChange={(e) => updateProductInSection(section.id, product.id, 'quantity', e.target.value)} containerClassName="col-span-6 md:col-span-2 !mb-1" error={formErrors[`productQty_${sectionIndex}_${productIndex}`]}/>
                      
                      <Input label={unitPriceLabel} type="number" min="0" step="0.01" value={unitPriceValue === undefined ? '' : unitPriceValue} onChange={(e) => updateProductInSection(section.id, product.id, unitPriceField as keyof ProductFormItem, e.target.value)} containerClassName="col-span-6 md:col-span-3 !mb-1" error={formErrors[`productPrice_${sectionIndex}_${productIndex}`]}/>
                      
                      <div className="col-span-6 md:col-span-3 flex items-end h-full pb-1">
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap pt-6">
                            {formatCurrency(convertTRYToCurrency(product.quantity * product.unitPriceTRY, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
                        </p>
                      </div>
                      <div className="col-span-12 md:col-span-2 flex justify-end items-end h-full pb-1">
                        <Button variant="danger" size="sm" onClick={() => removeProductFromSection(section.id, product.id)}><TrashIcon/></Button>
                      </div>
                    </div>
                  );
              })}
              <Button variant="outline" size="sm" onClick={() => addProductToSection(section.id)} className="mt-3" leftIcon={<PlusIcon/>}>Ürün Ekle</Button>
              <div className="text-right mt-2 font-semibold text-gray-800 dark:text-gray-100">
                Bölüm Toplamı ({currentOrderCurrency}): {formatCurrency(convertTRYToCurrency(orderData.sections.find(s=>s.id===section.id)?.products.reduce((sum,p)=> sum + (p.quantity * p.unitPriceTRY),0) || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
              </div>
            </div>
          ))}
          {formErrors.sections && <p className="text-xs text-red-600 dark:text-red-400">{formErrors.sections}</p>}
          <Button variant="secondary" onClick={addSection} leftIcon={<PlusIcon/>}>Bölüm Ekle</Button>
        </div>

        <div className="p-4 border rounded-md bg-white dark:bg-gray-700 space-y-3 border-gray-200 dark:border-gray-600">
            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">İskontolar</h2>
            {orderData.discounts.map((discount, index) => (
                <div key={discount.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-end p-2 border rounded bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500">
                    <Input label={`İskonto ${index + 1} Açıklama`} value={discount.description || ''} onChange={e => updateDiscount(discount.id, 'description', e.target.value)} containerClassName="col-span-12 md:col-span-4 !mb-1" />
                    <Select label="Tür" options={discountTypeOptions} value={discount.type} onChange={e => updateDiscount(discount.id, 'type', e.target.value)} containerClassName="col-span-6 md:col-span-3 !mb-1" />
                    <Input label="Değer" type="number" min="0" step="0.01" value={discount.value} onChange={e => updateDiscount(discount.id, 'value', e.target.value)} containerClassName="col-span-6 md:col-span-3 !mb-1" error={formErrors[`discountValue_${index}`]} />
                    <div className="col-span-12 md:col-span-2 flex justify-end">
                        <Button variant="danger" size="sm" onClick={() => removeDiscount(discount.id)}><TrashIcon/></Button>
                    </div>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addDiscount} leftIcon={<PlusIcon/>}>İskonto Ekle</Button>
        </div>
        
        <div className="p-4 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">Vergi (KDV)</h2>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <input id="applyTax" name="applyTax" type="checkbox" checked={applyTax} onChange={handleApplyTaxChange} className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-600" />
                    <label htmlFor="applyTax" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">KDV Uygula</label>
                </div>
                {applyTax && (
                    <Input 
                        label="KDV Oranı (%)" 
                        name="taxRate" 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        value={orderData.taxRate === undefined ? '' : orderData.taxRate} 
                        onChange={handleInputChange} 
                        containerClassName="max-w-xs !mb-0"
                        error={formErrors.taxRate}
                    />
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <Select
                label="Durum*"
                name="status"
                options={statusOptions}
                value={orderData.status}
                onChange={handleInputChange}
            />
            <Textarea
                label="Notlar"
                name="notes"
                value={orderData.notes || ''}
                onChange={handleInputChange}
                rows={3}
            />
        </div>

        <div className="p-6 border rounded-lg bg-white dark:bg-gray-700 shadow space-y-2 text-right border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Özet</h3>
            <div className="text-md text-gray-700 dark:text-gray-200">
                <span className="font-medium text-gray-500 dark:text-gray-300">Ürünler Toplamı: </span>
                {formatCurrency(convertTRYToCurrency(orderData.displayItemsTotalTRY || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
            </div>
            { (orderData.discounts?.length || 0) > 0 && (orderData.displayTotalDiscountAmountTRY || 0) > 0 &&
              <div className="text-md text-red-600 dark:text-red-400">
                  <span className="font-medium">Toplam İskonto: -</span>
                  {formatCurrency(convertTRYToCurrency(orderData.displayTotalDiscountAmountTRY || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
              </div>
            }
            { (orderData.displayTotalDiscountAmountTRY || 0) > 0 &&
              <div className="text-md font-semibold border-t pt-2 mt-1 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  <span className="text-gray-500 dark:text-gray-300">Ara Toplam: </span>
                  {formatCurrency(convertTRYToCurrency(orderData.displaySubTotalAfterDiscountsTRY || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
              </div>
            }
            { applyTax && orderData.taxRate && orderData.taxRate > 0 &&
              <div className="text-md text-gray-700 dark:text-gray-200">
                  <span className="font-medium text-gray-500 dark:text-gray-300">KDV (%{orderData.taxRate}): +</span>
                  {formatCurrency(convertTRYToCurrency(orderData.displayTaxAmountTRY || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
              </div>
            }
            <div className={`text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2 pt-2 ${(orderData.displayTotalDiscountAmountTRY || 0) > 0 ? '' : 'border-t border-gray-200 dark:border-gray-600'}`}>
              Genel Toplam: {formatCurrency(convertTRYToCurrency(orderData.displayGrandTotalTRY || 0, currentOrderCurrency, currentOrderRates), currentOrderCurrency)}
            </div>
            {currentOrderCurrency !== Currency.TRY && (
              <span className="block text-sm text-gray-500 dark:text-gray-400 font-normal">
                (TRY Karşılığı: {formatCurrency(orderData.displayGrandTotalTRY || 0, Currency.TRY)})
              </span>
            )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={() => navigate('/orders')}>İptal</Button>
          <Button onClick={handleSubmit} type="submit" size="lg">
            {isEditing ? 'Siparişi Güncelle' : 'Sipariş Oluştur'}
          </Button>
        </div>
      </form>
      <datalist id="productNameSuggestions">
        {productNameSuggestions.map(name => <option key={name} value={name} />)}
      </datalist>
      {/* Datalist for textarea is not standard HTML, keeping it commented or for future custom implementation if needed */}
      {/* <datalist id="productDescriptionSuggestions">
        {productDescriptionSuggestions.map(desc => <option key={desc} value={desc} />)}
      </datalist> */}
    </div>
  );
};
