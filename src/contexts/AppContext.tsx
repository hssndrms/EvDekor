
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Customer, Order, Currency, ExchangeRates, OrderStatus, CompanyInfo, AppContextType } from '../types'; // ProductSuggestion removed as it was handled by productName/Desc suggestions
import { DEFAULT_CURRENCY, INITIAL_EXCHANGE_RATES, generateId, DEFAULT_PRODUCT_UNITS, ORDER_STATUS_TRANSLATIONS, DEFAULT_COMPANY_INFO } from '../constants';
import { calculateOrderFinancials } from '../utils/currencyUtils';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(INITIAL_EXCHANGE_RATES);
  const [orderCounter, setOrderCounter] = useState<number>(1);
  const [productUnits, setProductUnits] = useState<string[]>(DEFAULT_PRODUCT_UNITS);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [productNameSuggestions, setProductNameSuggestions] = useState<string[]>([]);
  const [productDescriptionSuggestions, setProductDescriptionSuggestions] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [
          loadedCustomers,
          loadedOrders,
          loadedCompanyInfo,
          loadedExchangeRates,
          loadedCurrentCurrency,
          loadedProductUnits,
          loadedProductNameSuggestions,
          loadedProductDescriptionSuggestions,
          loadedTheme,
          loadedOrderCounter,
        ] = await Promise.all([
          window.electronAPI.getAllData('customers') as Promise<Customer[]>,
          window.electronAPI.getAllData('orders') as Promise<Order[]>,
          window.electronAPI.getSetting<CompanyInfo>('companyInfo'),
          window.electronAPI.getSetting<ExchangeRates>('exchangeRates'),
          window.electronAPI.getSetting<Currency>('currentCurrency'),
          window.electronAPI.getSetting<string[]>('productUnits'),
          window.electronAPI.getSetting<string[]>('productNameSuggestions'),
          window.electronAPI.getSetting<string[]>('productDescriptionSuggestions'),
          window.electronAPI.getSetting<'light' | 'dark'>('theme'),
          window.electronAPI.getSetting<number>('orderCounter'),
        ]);

        setCustomers(loadedCustomers || []);
        setOrders(loadedOrders || []);
        setCompanyInfo(loadedCompanyInfo || DEFAULT_COMPANY_INFO);
        setExchangeRates(loadedExchangeRates || INITIAL_EXCHANGE_RATES);
        setCurrentCurrency(loadedCurrentCurrency || DEFAULT_CURRENCY);
        setProductUnits(loadedProductUnits || DEFAULT_PRODUCT_UNITS);
        setProductNameSuggestions(loadedProductNameSuggestions || []);
        setProductDescriptionSuggestions(loadedProductDescriptionSuggestions || []);
        
        const initialTheme = loadedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        
        setOrderCounter(loadedOrderCounter || 1);

      } catch (error) {
        console.error("Failed to load initial data:", error);
        // Set defaults if loading fails
        setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');

      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);


  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    const newCustomerData: Customer = { ...customerData, id: generateId(), createdAt: new Date().toISOString() };
    const savedCustomer = await window.electronAPI.addData('customers', newCustomerData);
    setCustomers(prev => [...prev, savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    return savedCustomer;
  }, []);

  const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
    const savedCustomer = await window.electronAPI.updateData('customers', updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c).sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteCustomer = useCallback(async (customerId: string) => {
    await window.electronAPI.deleteData('customers', customerId);
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, []);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId);
  }, [customers]);

  const addProductNameSuggestion = useCallback(async (name: string) => {
    if (name.trim() && !productNameSuggestions.includes(name.trim())) {
      const newSuggestions = [...new Set([...productNameSuggestions, name.trim()])].sort();
      setProductNameSuggestions(newSuggestions);
      await window.electronAPI.setSetting('productNameSuggestions', newSuggestions);
    }
  }, [productNameSuggestions]);

  const addProductDescriptionSuggestion = useCallback(async (description: string) => {
    if (description.trim() && !productDescriptionSuggestions.includes(description.trim())) {
      const newSuggestions = [...new Set([...productDescriptionSuggestions, description.trim()])].sort();
      setProductDescriptionSuggestions(newSuggestions);
      await window.electronAPI.setSetting('productDescriptionSuggestions', newSuggestions);
    }
  }, [productDescriptionSuggestions]);

  const addOrder = useCallback(async (orderInput: Omit<Order, 'id' | 'orderNumber' | 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'>): Promise<Order> => {
    const customer = getCustomerById(orderInput.customerId);
    const financials = calculateOrderFinancials(orderInput.sections, orderInput.discounts, orderInput.taxRate);
    
    const newOrderData: Order = {
      ...orderInput,
      id: generateId(),
      orderNumber: `SİP-${new Date().getFullYear()}-${String(orderCounter).padStart(4, '0')}`,
      customerNameSnapshot: customer?.name || 'Bilinmeyen Müşteri',
      ...financials,
    };
    const savedOrder = await window.electronAPI.addData('orders', newOrderData);
    setOrders(prev => [...prev, savedOrder].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const newOrderCounter = orderCounter + 1;
    setOrderCounter(newOrderCounter);
    await window.electronAPI.setSetting('orderCounter', newOrderCounter);

    savedOrder.sections.forEach(section => {
        section.products.forEach(product => {
            if (product.name.trim()) addProductNameSuggestion(product.name);
            if (product.description?.trim()) addProductDescriptionSuggestion(product.description);
        });
    });
    return savedOrder;
  }, [getCustomerById, orderCounter, addProductNameSuggestion, addProductDescriptionSuggestion]);
  
  const updateOrder = useCallback(async (orderInput: Omit<Order, 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'> & { id: string, orderNumber: string }) => {
    const customer = getCustomerById(orderInput.customerId);
    const financials = calculateOrderFinancials(orderInput.sections, orderInput.discounts, orderInput.taxRate);
    
    const updatedOrderFull: Order = {
        ...orderInput,
        customerNameSnapshot: customer?.name || orders.find(o => o.id === orderInput.id)?.customerNameSnapshot || 'Bilinmeyen Müşteri',
        ...financials,
    };
    const savedOrder = await window.electronAPI.updateData('orders', updatedOrderFull);
    setOrders(prev => prev.map(o => o.id === savedOrder.id ? savedOrder : o).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    savedOrder.sections.forEach(section => {
        section.products.forEach(product => {
           if (product.name.trim()) addProductNameSuggestion(product.name);
           if (product.description?.trim()) addProductDescriptionSuggestion(product.description);
        });
    });
  }, [getCustomerById, orders, addProductNameSuggestion, addProductDescriptionSuggestion]);

  const deleteOrder = useCallback(async (orderId: string) => {
    await window.electronAPI.deleteData('orders', orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, status: newStatus };
      await window.electronAPI.updateData('orders', updatedOrder);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }
  }, [orders]);

  const bulkUpdateOrderStatuses = useCallback(async (orderIds: string[], newStatus: OrderStatus) => {
    const updatedOrders: Order[] = [];
    const newOrdersState = orders.map(o => {
        if (orderIds.includes(o.id)) {
            const updatedOrder = { ...o, status: newStatus };
            updatedOrders.push(updatedOrder);
            return updatedOrder;
        }
        return o;
    });
    // TODO: This should be a single bulk update IPC call if possible, or loop (less efficient but simpler for now)
    for (const order of updatedOrders) {
        await window.electronAPI.updateData('orders', order);
    }
    setOrders(newOrdersState);
  }, [orders]);

  const persistCurrentCurrency = async (newCurrency: Currency) => {
    setCurrentCurrency(newCurrency);
    await window.electronAPI.setSetting('currentCurrency', newCurrency);
  }
  const persistExchangeRates = async (newRates: ExchangeRates) => {
    setExchangeRates(newRates);
    await window.electronAPI.setSetting('exchangeRates', newRates);
  }

  const addProductUnit = useCallback(async (unit: string) => {
    if (unit.trim() && !productUnits.includes(unit.trim())) {
      const newUnits = [...productUnits, unit.trim()];
      setProductUnits(newUnits);
      await window.electronAPI.setSetting('productUnits', newUnits);
    }
  }, [productUnits]);

  const deleteProductUnit = useCallback(async (unitToDelete: string) => {
    const newUnits = productUnits.filter(unit => unit !== unitToDelete);
    setProductUnits(newUnits);
    await window.electronAPI.setSetting('productUnits', newUnits);
  }, [productUnits]);
  
  const persistProductUnits = async (newUnits: string[]) => {
    setProductUnits(newUnits);
    await window.electronAPI.setSetting('productUnits', newUnits);
  }

  const getOrderStatusTranslation = useCallback((status: OrderStatus): string => {
    return ORDER_STATUS_TRANSLATIONS[status] || status;
  }, []);

  const persistCompanyInfo = async (newInfo: CompanyInfo) => {
    setCompanyInfo(newInfo);
    await window.electronAPI.setSetting('companyInfo', newInfo);
  }

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    await window.electronAPI.setSetting('theme', newTheme);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">EvDekor Pro Yükleniyor...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById,
      orders, addOrder, updateOrder, deleteOrder, getOrderById, updateOrderStatus, bulkUpdateOrderStatuses,
      currentCurrency, setCurrentCurrency: persistCurrentCurrency,
      exchangeRates, setExchangeRates: persistExchangeRates,
      productUnits, addProductUnit, deleteProductUnit, setProductUnits: persistProductUnits,
      getOrderStatusTranslation,
      companyInfo, setCompanyInfo: persistCompanyInfo,
      productNameSuggestions, productDescriptionSuggestions, addProductNameSuggestion, addProductDescriptionSuggestion,
      theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
