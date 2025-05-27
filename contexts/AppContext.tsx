
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Customer, Order, Currency, ExchangeRates, OrderStatus, Discount, ProductItem, CompanyInfo, ProductSuggestion, AppContextType } from '../types';
import { DEFAULT_CURRENCY, INITIAL_EXCHANGE_RATES, generateId, DEFAULT_PRODUCT_UNITS, ORDER_STATUS_TRANSLATIONS, DEFAULT_COMPANY_INFO } from '../constants';
import { calculateOrderFinancials } from '../utils/currencyUtils';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('evdekor_customers', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('evdekor_orders', []);
  const [currentCurrency, setCurrentCurrency] = useLocalStorage<Currency>('evdekor_currentCurrency', DEFAULT_CURRENCY);
  const [exchangeRates, setExchangeRates] = useLocalStorage<ExchangeRates>('evdekor_exchangeRates', INITIAL_EXCHANGE_RATES);
  const [orderCounter, setOrderCounter] = useLocalStorage<number>('evdekor_orderCounter', 1);
  const [productUnits, setProductUnits] = useLocalStorage<string[]>('evdekor_productUnits', DEFAULT_PRODUCT_UNITS);
  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('evdekor_companyInfo', DEFAULT_COMPANY_INFO);
  const [productNameSuggestions, setProductNameSuggestions] = useLocalStorage<string[]>('evdekor_productNameSuggestions', []);
  const [productDescriptionSuggestions, setProductDescriptionSuggestions] = useLocalStorage<string[]>('evdekor_productDescriptionSuggestions', []);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('evdekor_theme', 
    // Initialize with system preference if no stored theme
    () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );


  const addCustomer = useCallback((customerData: Omit<Customer, 'id'|'createdAt'>): Customer => {
    const newCustomer: Customer = { ...customerData, id: generateId(), createdAt: new Date().toISOString() };
    setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
    return newCustomer;
  }, [setCustomers]);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a,b) => a.name.localeCompare(b.name)));
  }, [setCustomers]);

  const deleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  }, [setCustomers]);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(c => c.id === customerId);
  }, [customers]);

  const addProductNameSuggestion = useCallback((name: string) => {
    if (name.trim() && !productNameSuggestions.includes(name.trim())) {
      setProductNameSuggestions(prev => [...new Set([...prev, name.trim()])].sort());
    }
  }, [productNameSuggestions, setProductNameSuggestions]);

  const addProductDescriptionSuggestion = useCallback((description: string) => {
    if (description.trim() && !productDescriptionSuggestions.includes(description.trim())) {
      setProductDescriptionSuggestions(prev => [...new Set([...prev, description.trim()])].sort());
    }
  }, [productDescriptionSuggestions, setProductDescriptionSuggestions]);

  const addOrder = useCallback((orderInput: Omit<Order, 'id' | 'orderNumber' | 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'>): Order => {
    const customer = getCustomerById(orderInput.customerId);
    const financials = calculateOrderFinancials(orderInput.sections, orderInput.discounts, orderInput.taxRate);
    
    const newOrder: Order = {
      ...orderInput,
      id: generateId(),
      orderNumber: `SİP-${new Date().getFullYear()}-${String(orderCounter).padStart(4, '0')}`,
      customerNameSnapshot: customer?.name || 'Bilinmeyen Müşteri',
      ...financials,
    };
    setOrders(prev => [...prev, newOrder].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setOrderCounter(prev => prev + 1);

    // Add product names and descriptions to suggestions (if onBlur is not fully reliable, this is a fallback)
    newOrder.sections.forEach(section => {
        section.products.forEach(product => {
            if (product.name.trim()) addProductNameSuggestion(product.name);
            if (product.description?.trim()) addProductDescriptionSuggestion(product.description);
        });
    });
    return newOrder;
  }, [setOrders, getCustomerById, orderCounter, setOrderCounter, addProductNameSuggestion, addProductDescriptionSuggestion]);
  
  const updateOrder = useCallback((orderInput: Omit<Order, 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'> & { id: string, orderNumber: string }) => {
    const customer = getCustomerById(orderInput.customerId);
    const financials = calculateOrderFinancials(orderInput.sections, orderInput.discounts, orderInput.taxRate);
    
    const updatedOrderFull: Order = {
        ...orderInput,
        customerNameSnapshot: customer?.name || orders.find(o => o.id === orderInput.id)?.customerNameSnapshot || 'Bilinmeyen Müşteri',
        ...financials,
    };
    setOrders(prev => prev.map(o => o.id === updatedOrderFull.id ? updatedOrderFull : o).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    updatedOrderFull.sections.forEach(section => {
        section.products.forEach(product => {
           if (product.name.trim()) addProductNameSuggestion(product.name);
           if (product.description?.trim()) addProductDescriptionSuggestion(product.description);
        });
    });
  }, [setOrders, getCustomerById, orders, addProductNameSuggestion, addProductDescriptionSuggestion]);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, [setOrders]);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }, [setOrders]);

  const bulkUpdateOrderStatuses = useCallback((orderIds: string[], newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status: newStatus } : o));
  }, [setOrders]);

  const addProductUnit = useCallback((unit: string) => {
    if (unit.trim() && !productUnits.includes(unit.trim())) {
      setProductUnits(prev => [...prev, unit.trim()]);
    }
  }, [productUnits, setProductUnits]);

  const deleteProductUnit = useCallback((unitToDelete: string) => {
    setProductUnits(prev => prev.filter(unit => unit !== unitToDelete));
  }, [setProductUnits]);

  const getOrderStatusTranslation = useCallback((status: OrderStatus): string => {
    return ORDER_STATUS_TRANSLATIONS[status] || status;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  return (
    <AppContext.Provider value={{
      customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById,
      orders, addOrder, updateOrder, deleteOrder, getOrderById, updateOrderStatus, bulkUpdateOrderStatuses,
      currentCurrency, setCurrentCurrency,
      exchangeRates, setExchangeRates,
      productUnits, addProductUnit, deleteProductUnit, setProductUnits,
      getOrderStatusTranslation,
      companyInfo, setCompanyInfo,
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