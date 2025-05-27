
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/common/Button';
import { OrderStatusColors } from '../constants';
import { Currency, OrderStatus } from '../types'; 
import { formatCurrency, convertTRYToCurrency } from '../utils/currencyUtils';

const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;


export const OrderViewPage: React.FC = () => {
  const { getOrderById, getCustomerById, getOrderStatusTranslation, companyInfo } = useAppContext();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const order = orderId ? getOrderById(orderId) : undefined;
  const customer = order ? getCustomerById(order.customerId) : undefined;

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Sipariş Bulunamadı</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Aradığınız sipariş mevcut değil veya silinmiş olabilir.</p>
        <Button onClick={() => navigate('/orders')} className="mt-4">Sipariş Listesine Dön</Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };
  
  const displayCurrency = order.currency;
  const displayRates = order.exchangeRatesSnapshot;

  const itemsTotalDisplay = convertTRYToCurrency(order.itemsTotalTRY, displayCurrency, displayRates);
  const totalDiscountAmountDisplay = convertTRYToCurrency(order.totalDiscountAmountTRY, displayCurrency, displayRates);
  const subTotalAfterDiscountsDisplay = convertTRYToCurrency(order.subTotalAfterDiscountsTRY, displayCurrency, displayRates);
  const taxAmountDisplay = order.taxAmountTRY ? convertTRYToCurrency(order.taxAmountTRY, displayCurrency, displayRates) : 0;
  const grandTotalDisplay = convertTRYToCurrency(order.grandTotalTRY, displayCurrency, displayRates);


  return (
    <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-lg printable-area">
            <div className="p-6 md:p-10 border-b-2 border-blue-700 dark:border-blue-500">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    {/* Left Block: Title and Order Number */}
                    <div className="flex-1 mb-4 sm:mb-0">
                        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">{order.status === OrderStatus.QUOTATION ? 'TEKLİF FORMU' : 'SİPARİŞ FORMU'}</h1>
                        <p className="text-gray-600 dark:text-gray-300">Sipariş No: {order.orderNumber}</p>
                    </div>

                    {/* Right Block: Logo and Company Info */}
                    <div className="text-left sm:text-right flex-shrink-0">
                        {companyInfo.logoBase64 && (
                            <div className="flex justify-start sm:justify-end mb-2">
                                 <img src={companyInfo.logoBase64} alt={`${companyInfo.name} Logo`} className="max-h-20 object-contain dark:bg-white dark:p-1 dark:rounded"/>
                            </div>
                        )}
                        <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{companyInfo.name}</p>
                        {companyInfo.address && <p className="text-sm text-gray-500 dark:text-gray-400">{companyInfo.address}</p>}
                        {companyInfo.phone && <p className="text-sm text-gray-500 dark:text-gray-400">Tel: {companyInfo.phone}</p>}
                        {companyInfo.email && <p className="text-sm text-gray-500 dark:text-gray-400">Email: {companyInfo.email}</p>}
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Müşteri Bilgileri:</h2>
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{order.customerNameSnapshot || customer?.name}</p>
                        {customer?.phone && <p className="text-gray-600 dark:text-gray-300">Telefon: {customer.phone}</p>}
                        {customer?.email && <p className="text-gray-600 dark:text-gray-300">E-posta: {customer.email}</p>}
                        {customer?.address && <p className="text-gray-600 dark:text-gray-300">Adres: {customer.address}</p>}
                    </div>
                    <div className="text-left md:text-right">
                        <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Sipariş Detayları:</h2>
                        <p className="text-gray-700 dark:text-gray-200"><strong>Tarih:</strong> {new Date(order.date).toLocaleDateString('tr-TR')}</p>
                        <p className="text-gray-700 dark:text-gray-200"><strong>Durum:</strong> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${OrderStatusColors[order.status]}`}>{getOrderStatusTranslation(order.status)}</span></p>
                        <p className="text-gray-700 dark:text-gray-200"><strong>Para Birimi:</strong> {order.currency}</p>
                        {order.currency !== Currency.TRY && (
                            <>
                                {order.exchangeRatesSnapshot[Currency.USD] && <p className="text-xs text-gray-500 dark:text-gray-400">1 USD = {order.exchangeRatesSnapshot[Currency.USD].toFixed(4)} TRY</p>}
                                {order.exchangeRatesSnapshot[Currency.EUR] && <p className="text-xs text-gray-500 dark:text-gray-400">1 EUR = {order.exchangeRatesSnapshot[Currency.EUR].toFixed(4)} TRY</p>}
                            </>
                        )}
                    </div>
                </div>

                {order.sections.map((section) => (
                    <div key={section.id} className="mb-8 last:mb-0">
                        <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{section.name}</h3>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 mb-2">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ürün Adı</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Açıklama</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Miktar</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Birim</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Birim Fiyat ({displayCurrency})</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Toplam ({displayCurrency})</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                {section.products.map((product) => {
                                    const unitPriceDisplay = convertTRYToCurrency(product.unitPriceTRY, displayCurrency, displayRates);
                                    const itemTotalDisplay = convertTRYToCurrency(product.quantity * product.unitPriceTRY, displayCurrency, displayRates);
                                    return (
                                        <tr key={product.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100">{product.name}</td>
                                            <td className="px-4 py-2 whitespace-normal text-sm text-gray-600 dark:text-gray-300 break-words max-w-xs">{product.description || '-'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">{product.quantity}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-left">{product.unit}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">{formatCurrency(unitPriceDisplay, displayCurrency)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100 font-medium text-right">{formatCurrency(itemTotalDisplay, displayCurrency)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="text-right font-semibold text-md text-gray-700 dark:text-gray-200 pr-4">
                            Bölüm Toplamı: {formatCurrency(convertTRYToCurrency(section.products.reduce((sum,p)=> sum + (p.quantity * p.unitPriceTRY),0), displayCurrency, displayRates), displayCurrency)}
                        </div>
                    </div>
                ))}

                <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="flex justify-end">
                        <div className="w-full md:w-2/3 lg:w-1/2 space-y-1">
                            <div className="flex justify-between text-md">
                                <span className="font-semibold text-gray-600 dark:text-gray-300">Ürünler Toplamı:</span>
                                <span className="text-gray-800 dark:text-gray-100">{formatCurrency(itemsTotalDisplay, displayCurrency)}</span>
                            </div>
                            
                            {order.discounts && order.discounts.length > 0 && order.totalDiscountAmountTRY > 0 && (
                                <>
                                    {order.discounts.map(discount => {
                                        return (
                                            <div key={discount.id} className="flex justify-between text-sm text-red-500 dark:text-red-400">
                                                <span>İskonto ({discount.description || (discount.type === 'percentage' ? `${discount.value}%` : `${formatCurrency(convertTRYToCurrency(discount.value, displayCurrency, displayRates), displayCurrency)}`) }):</span>
                                            </div>
                                        );
                                    })}
                                     <div className="flex justify-between text-md text-red-500 dark:text-red-400 font-semibold">
                                        <span>Toplam İskonto:</span>
                                        <span>-{formatCurrency(totalDiscountAmountDisplay, displayCurrency)}</span>
                                    </div>
                                </>
                            )}

                            {order.totalDiscountAmountTRY > 0 && (
                                <div className="flex justify-between text-md font-semibold pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-600 dark:text-gray-300">Ara Toplam (İskonto Sonrası):</span>
                                    <span className="text-gray-800 dark:text-gray-100">{formatCurrency(subTotalAfterDiscountsDisplay, displayCurrency)}</span>
                                </div>
                            )}

                            {order.taxRate && order.taxRate > 0 && order.taxAmountTRY !== undefined && (
                                <div className="flex justify-between text-md">
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">KDV (%{order.taxRate.toFixed(2)}):</span>
                                    <span className="text-gray-800 dark:text-gray-100">+{formatCurrency(taxAmountDisplay, displayCurrency)}</span>
                                </div>
                            )}
                            
                            <div className={`flex justify-between text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2 pt-2 ${order.totalDiscountAmountTRY > 0 ? '' : 'border-t border-gray-200 dark:border-gray-600'}`}>
                                <span>Genel Toplam:</span>
                                <span>{formatCurrency(grandTotalDisplay, displayCurrency)}</span>
                            </div>
                            {displayCurrency !== Currency.TRY && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                                    (TRY Karşılığı: {formatCurrency(order.grandTotalTRY, Currency.TRY)})
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {order.notes && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Notlar:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                )}

                <div className="mt-12 text-xs text-gray-500 dark:text-gray-400 text-center">
                    <p>Bu {order.status === OrderStatus.QUOTATION ? 'teklif' : 'sipariş'} formu {companyInfo.name} tarafından düzenlenmiştir.</p>
                    {companyInfo.email && companyInfo.phone && <p>İletişim: {companyInfo.email} | Tel: {companyInfo.phone}</p>}
                    {!companyInfo.email && companyInfo.phone && <p>İletişim Tel: {companyInfo.phone}</p>}
                    {companyInfo.email && !companyInfo.phone && <p>İletişim Email: {companyInfo.email}</p>}
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4 no-print">
            <Button variant="outline" onClick={() => navigate('/orders')}>Geri Dön</Button>
            <Link to={`/orders/edit/${order.id}`}>
                <Button variant="secondary" leftIcon={<EditIcon />}>Düzenle</Button>
            </Link>
            <Button onClick={handlePrint} leftIcon={<PrintIcon />}>Yazdır / PDF</Button>
        </div>
    </div>
  );
};
