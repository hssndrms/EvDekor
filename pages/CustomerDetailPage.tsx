
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/common/Button';
import { OrderStatusColors } from '../constants'; 
import { formatCurrency, convertTRYToCurrency } from '../utils/currencyUtils';
import { OrderStatus, Currency } from '../types'; 


const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { getCustomerById, orders, getOrderStatusTranslation } = useAppContext();

  const customer = customerId ? getCustomerById(customerId) : undefined;
  const customerOrders = customer ? orders.filter(order => order.customerId === customer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">Müşteri Bulunamadı</h1>
        <Button onClick={() => navigate('/customers')} className="mt-4">Müşteri Listesine Dön</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/customers')} leftIcon={<ArrowLeftIcon />}>
          Müşteri Listesine Dön
        </Button>
        <Button onClick={() => navigate('/orders/new', { state: { initialCustomerId: customer.id } })} leftIcon={<PlusCircleIcon />}>
            Bu Müşteri İçin Yeni Sipariş Oluştur
        </Button>
      </div>


      <div className="bg-white dark:bg-gray-700 shadow-xl rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">{customer.name}</h1>
        {customer.email && <p className="text-gray-600 dark:text-gray-300">E-posta: {customer.email}</p>}
        {customer.phone && <p className="text-gray-600 dark:text-gray-300">Telefon: {customer.phone}</p>}
        {customer.address && <p className="text-gray-600 dark:text-gray-300">Adres: {customer.address}</p>}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Kayıt Tarihi: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}</p>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Müşteri Sipariş Geçmişi ({customerOrders.length})</h2>
      {customerOrders.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-700 rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Sipariş bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Bu müşteriye ait kayıtlı sipariş veya teklif yok.</p>
          {/* Button is now at the top */}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sipariş No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tutar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              {customerOrders.map((order) => {
                const displayTotal = convertTRYToCurrency(order.grandTotalTRY, order.currency, order.exchangeRatesSnapshot);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/orders/view/${order.id}`)}>{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 font-medium">
                      {formatCurrency(displayTotal, order.currency)}
                      {order.currency !== Currency.TRY && <span className="text-xs text-gray-500 dark:text-gray-400 block">({formatCurrency(order.grandTotalTRY, Currency.TRY)})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${OrderStatusColors[order.status as OrderStatus]}`}>
                            {getOrderStatusTranslation(order.status as OrderStatus)}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Link to={`/orders/view/${order.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Görüntüle">Gör</Link>
                      <Link to={`/orders/edit/${order.id}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 ml-2" title="Düzenle">Düz</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};