
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { Currency, ExchangeRates } from '../../types';
import { CURRENCIES_SUPPORTED } from '../../constants';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Gösterge Paneli';
  if (pathname.startsWith('/customers/:customerId')) return 'Müşteri Detayları';
  if (pathname.startsWith('/customers')) return 'Müşteri Yönetimi';
  if (pathname.startsWith('/orders/new')) return 'Yeni Sipariş/Teklif Oluştur';
  if (pathname.startsWith('/orders/edit')) return 'Sipariş/Teklif Düzenle';
  if (pathname.startsWith('/orders/view')) return 'Sipariş/Teklif Görüntüle';
  if (pathname.startsWith('/orders')) return 'Sipariş ve Teklifler';
  if (pathname.startsWith('/reports')) return 'Raporlar';
  if (pathname.startsWith('/settings')) return 'Ayarlar';
  return 'EvDekor Pro';
};

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;


export const Header: React.FC = () => {
  const location = useLocation();
  const { currentCurrency, setCurrentCurrency, exchangeRates, setExchangeRates, theme, toggleTheme } = useAppContext();

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentCurrency(e.target.value as Currency);
  };

  const handleRateChange = (currency: Currency.USD | Currency.EUR, value: string) => {
    const newRate = parseFloat(value);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRates(prev => ({ ...prev, [currency]: newRate }));
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-40 no-print">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{getPageTitle(location.pathname)}</h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="currencySelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">Para Birimi:</label>
          <select
            id="currencySelect"
            value={currentCurrency}
            onChange={handleCurrencyChange}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
          >
            {CURRENCIES_SUPPORTED.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        {currentCurrency !== Currency.TRY && (
          <>
            {CURRENCIES_SUPPORTED.filter(c => c !== Currency.TRY).map(foreignCurrency => (
               (foreignCurrency === Currency.USD || foreignCurrency === Currency.EUR) && // Type guard
              <div key={foreignCurrency} className="flex items-center space-x-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">1 {foreignCurrency} =</span>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRates[foreignCurrency as keyof ExchangeRates]}
                  onChange={(e) => handleRateChange(foreignCurrency as (Currency.USD | Currency.EUR) , e.target.value)}
                  className="w-20 px-2 py-1 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">TRY</span>
              </div>
            ))}
          </>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
};