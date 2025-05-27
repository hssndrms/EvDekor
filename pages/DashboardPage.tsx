
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { OrderStatus, Currency, ExchangeRates } from '../types'; 
import { formatCurrency, convertTRYToCurrency } from '../utils/currencyUtils'; 

interface StatCardSubValue {
  currencyTotals: Partial<Record<Currency, number>>;
  grandTotalTRY: number;
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    color: string; 
    icon?: React.ReactNode;
    onClick?: () => void;
    subValue?: string | StatCardSubValue; 
}> = ({ title, value, color, icon, onClick, subValue }) => {
    const { exchangeRates } = useAppContext(); // Removed globalDisplayCurrency as it's not directly used here

    const renderSubValue = () => {
        if (!subValue) return null;
        if (typeof subValue === 'string') {
            return <p className="text-xs text-gray-600 dark:text-gray-400">{subValue}</p>;
        }
        
        const { currencyTotals, grandTotalTRY } = subValue;
        const currencyEntries = Object.entries(currencyTotals);
        
        return (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {currencyEntries.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {currencyEntries.map(([cur, amount]) => (
                            <span key={cur}>{formatCurrency(amount, cur as Currency)}</span>
                        ))}
                    </div>
                )}
                {grandTotalTRY > 0 && (
                     <div className="font-semibold border-t border-gray-300 dark:border-gray-600 pt-0.5 mt-1">
                        Toplam: {formatCurrency(grandTotalTRY, Currency.TRY)}
                     </div>
                )}
            </div>
        );
    };
    
    return (
      <div 
        className={`bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg border-l-4 ${color} ${onClick ? 'cursor-pointer hover:shadow-xl dark:hover:shadow-gray-600 transition-shadow' : ''}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
        aria-label={`${title}: ${value}`}
        >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{title}</p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{value}</p>
            {renderSubValue()}
          </div>
          {icon && <div className="text-3xl text-gray-400 dark:text-gray-500">{icon}</div>}
        </div>
      </div>
    );
};

// Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-4.073M15.75 10.5h-7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v-.75A2.25 2.25 0 0114.25 0h3.75A2.25 2.25 0 0120.25 2.25V12M12 3v-.75A2.25 2.25 0 009.75 0H6A2.25 2.25 0 003.75 2.25V12M12 3v7.5m0 0L9.375 12M12 10.5l2.625 1.5M3.75 12h16.5" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.988-1.13A6.004 6.004 0 0012 4.5v0c-.527 0-1.04.096-1.512.285-.566.082-.988.562-.988 1.13v.958m0 0A2.25 2.25 0 0012 10.5h3A2.25 2.25 0 0017.25 7.5M12 10.5H8.375M3.375 14.25V8.25A2.25 2.25 0 015.625 6h6.75c.621 0 1.125.504 1.125 1.125v1.5U" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-5.25H21m-11.25.005H18M9 14.25h9.75M18 15.75l-2.25-2.25m0 0l-2.25 2.25m2.25-2.25V4.5A2.25 2.25 0 0013.5 2.25H5.25A2.25 2.25 0 003 4.5v10.5A2.25 2.25 0 005.25 17.25h8.25A2.25 2.25 0 0018 15V9.75M2.25 11.25h19.5" /></svg>;

export const DashboardPage: React.FC = () => {
  const { orders, customers, getOrderStatusTranslation } = useAppContext();
  const navigate = useNavigate();

  const calculateStatCardSubValue = (filteredOrders: typeof orders): StatCardSubValue => {
    const totalsInOrderCurrency: Partial<Record<Currency, number>> = {};
    let sumOfGrandTotalsInTRY = 0;

    filteredOrders.forEach(order => {
        const displayAmountInOrderCurrency = convertTRYToCurrency(order.grandTotalTRY, order.currency, order.exchangeRatesSnapshot);
        totalsInOrderCurrency[order.currency] = (totalsInOrderCurrency[order.currency] || 0) + displayAmountInOrderCurrency;
        sumOfGrandTotalsInTRY += order.grandTotalTRY;
    });

    return { currencyTotals: totalsInOrderCurrency, grandTotalTRY: parseFloat(sumOfGrandTotalsInTRY.toFixed(2)) };
  };


  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);
  const totalQuotations = orders.filter(o => o.status === OrderStatus.QUOTATION);
  const totalCustomers = customers.length;
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  const deliveredPendingPaymentOrders = orders.filter(o => o.status === OrderStatus.DELIVERED_PENDING_PAYMENT);

  const handleCardClick = (status: OrderStatus | OrderStatus[]) => {
    const statusesToFilter = Array.isArray(status) ? status : [status];
    navigate('/orders', { state: { initialFilters: { status: statusesToFilter } } });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard 
            title="Aktif Müşteri" 
            value={totalCustomers} 
            color="border-blue-500 dark:border-blue-400" 
            icon={<UsersIcon />}
            onClick={() => navigate('/customers')}
        />
        <StatCard 
            title="Teklif Aşamasında" 
            value={totalQuotations.length} 
            color="border-indigo-500 dark:border-indigo-400" 
            icon={<DocumentIcon />}
            subValue={calculateStatCardSubValue(totalQuotations)}
            onClick={() => handleCardClick(OrderStatus.QUOTATION)}
        />
        <StatCard 
            title="Bekleyen/Hazırlanan" 
            value={pendingOrders.length} 
            color="border-yellow-500 dark:border-yellow-400" 
            icon={<BriefcaseIcon />}
            subValue={calculateStatCardSubValue(pendingOrders)}
            onClick={() => handleCardClick([OrderStatus.PENDING, OrderStatus.PREPARING])}
        />
        <StatCard 
            title="Teslim Edilenler" 
            value={deliveredOrders.length} 
            subValue={calculateStatCardSubValue(deliveredOrders)}
            color="border-teal-500 dark:border-teal-400" 
            icon={<TruckIcon />}
            onClick={() => handleCardClick(OrderStatus.DELIVERED)}
        />
        <StatCard 
            title="Teslim Edildi (Ödeme Bekliyor)" 
            value={deliveredPendingPaymentOrders.length}
            subValue={calculateStatCardSubValue(deliveredPendingPaymentOrders)} 
            color="border-orange-500 dark:border-orange-400" 
            icon={<CreditCardIcon />}
            onClick={() => handleCardClick(OrderStatus.DELIVERED_PENDING_PAYMENT)}
        />
        <StatCard 
            title="Tamamlanan Siparişler" 
            value={completedOrders.length}
            subValue={calculateStatCardSubValue(completedOrders)}
            color="border-green-500 dark:border-green-400" 
            icon={<CashIcon />}
            onClick={() => handleCardClick(OrderStatus.COMPLETED)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <Link to="/orders/new" className="block w-full text-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition-colors">
              Yeni Sipariş / Teklif Oluştur
            </Link>
            <Link to="/customers" className="block w-full text-center bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-md transition-colors">
              Müşterileri Görüntüle
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Son Siparişler</h2>
          {orders.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">Henüz sipariş bulunmamaktadır.</p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {orders.slice(0, 5).map(order => (
                <li key={order.id} className="p-3 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                  <Link to={`/orders/view/${order.id}`} className="block">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-100">{order.orderNumber} - {order.customerNameSnapshot}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-300">{new Date(order.date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-200">
                      Durum: {getOrderStatusTranslation(order.status)} - Tutar: {formatCurrency(convertTRYToCurrency(order.grandTotalTRY, order.currency, order.exchangeRatesSnapshot), order.currency)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
