
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Order, OrderStatus, Currency } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select as SingleSelect } from '../components/common/Select'; // Renamed for clarity
import { ORDER_STATUSES, OrderStatusColors } from '../constants';
import { formatCurrency, convertTRYToCurrency } from '../utils/currencyUtils';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FilterResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;


export const OrdersPage: React.FC = () => {
  const { orders, deleteOrder, getCustomerById, customers, getOrderStatusTranslation, updateOrderStatus, bulkUpdateOrderStatuses } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]); 
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState(''); 
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkActionStatus, setBulkActionStatus] = useState<OrderStatus | ''>('');
  
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (location.state?.initialFilters) {
      const { status } = location.state.initialFilters;
      if (status) {
        setStatusFilter(Array.isArray(status) ? status : [status]);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const filteredCustomerOptions = useMemo(() => {
    return [{value: '', label: 'Tüm Müşteriler'}, ...customers
      .filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()))
      .map(c => ({ value: c.id, label: c.name }))]
  }, [customers, customerSearchTerm]);
  
  const statusOptionsForSelect = ORDER_STATUSES.map(s => ({ value: s, label: getOrderStatusTranslation(s)}));


  const handleStatusFilterChange = (status: OrderStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setCustomerFilter('');
    setCustomerSearchTerm('');
    setDateFromFilter('');
    setDateToFilter('');
  };
  
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const orderDate = new Date(order.date);

        const matchesSearch = searchTerm === '' ||
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerNameSnapshot && order.customerNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(order.status);
        const matchesCustomer = customerFilter === '' || order.customerId === customerFilter;
        
        const matchesDateFrom = dateFromFilter === '' || orderDate >= new Date(dateFromFilter);
        const matchesDateTo = dateToFilter === '' || orderDate <= new Date(new Date(dateToFilter).setHours(23,59,59,999));

        return matchesSearch && matchesStatus && matchesCustomer && matchesDateFrom && matchesDateTo;
      })
  }, [orders, searchTerm, statusFilter, customerFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedOrders.length;
      const numFiltered = filteredOrders.length;
      selectAllCheckboxRef.current.checked = numFiltered > 0 && numSelected === numFiltered;
      selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numFiltered;
    }
  }, [selectedOrders, filteredOrders]);


  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("Bu siparişi/teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteOrder(orderId);
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleApplyBulkAction = () => {
    if (selectedOrders.length === 0 || !bulkActionStatus) {
        alert("Lütfen en az bir sipariş seçin ve bir durum belirleyin.");
        return;
    }
    if (window.confirm(`${selectedOrders.length} adet siparişin durumu "${getOrderStatusTranslation(bulkActionStatus)}" olarak güncellenecektir. Emin misiniz?`)) {
        bulkUpdateOrderStatuses(selectedOrders, bulkActionStatus);
        setSelectedOrders([]);
        setBulkActionStatus('');
    }
  };

  const handleInlineStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Siparişler ve Teklifler</h1>
        <Button onClick={() => navigate('/orders/new')}>Yeni Sipariş/Teklif</Button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-700 shadow rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input 
              placeholder="Sipariş No / Müşteri Adı Ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              label="Genel Arama"
            />
            <div>
                <Input 
                    label="Müşteri Filtresi İçin Ara"
                    value={customerSearchTerm}
                    onChange={e => setCustomerSearchTerm(e.target.value)}
                    placeholder="Müşteri adıyla filtrele..."
                    containerClassName="!mb-1"
                />
                <SingleSelect
                    label="Müşteriye Göre Filtrele"
                    options={filteredCustomerOptions}
                    value={customerFilter}
                    onChange={e => setCustomerFilter(e.target.value)}
                    containerClassName="!mb-0"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input 
                  type="date"
                  label="Başlangıç Tarihi"
                  value={dateFromFilter}
                  onChange={e => setDateFromFilter(e.target.value)}
                />
                <Input 
                  type="date"
                  label="Bitiş Tarihi"
                  value={dateToFilter}
                  onChange={e => setDateToFilter(e.target.value)}
                />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duruma Göre Filtrele (Çoklu Seçim)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 border rounded-md border-gray-300 dark:border-gray-600">
                {ORDER_STATUSES.map(status => (
                    <div key={status} className="flex items-center">
                        <input
                            id={`status-${status}`}
                            type="checkbox"
                            checked={statusFilter.includes(status)}
                            onChange={() => handleStatusFilterChange(status)}
                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-600"
                        />
                        <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700 dark:text-gray-200">{getOrderStatusTranslation(status)}</label>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters} leftIcon={<FilterResetIcon/>}>Filtreleri Temizle</Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center space-x-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedOrders.length} sipariş seçildi.</p>
            <SingleSelect
                options={[{value: '', label: 'Durum Seçin'}, ...statusOptionsForSelect]}
                value={bulkActionStatus}
                onChange={e => setBulkActionStatus(e.target.value as OrderStatus | '')}
                containerClassName="!mb-0 min-w-[150px]"
            />
            <Button onClick={handleApplyBulkAction} disabled={!bulkActionStatus} size="sm">Toplu Güncelle</Button>
        </div>
      )}

      {filteredOrders.length === 0 ? (
         <div className="text-center py-10 bg-white dark:bg-gray-700 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Sipariş/Teklif bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                {searchTerm || statusFilter.length > 0 || customerFilter || dateFromFilter || dateToFilter ? "Arama kriterlerinize uygun kayıt bulunamadı." : "Henüz kayıtlı sipariş veya teklif yok."}
            </p>
            {!(searchTerm || statusFilter.length > 0 || customerFilter || dateFromFilter || dateToFilter) && 
                <div className="mt-6">
                    <Button onClick={() => navigate('/orders/new')}>
                        İlk Sipariş/Teklifi Oluştur
                    </Button>
                </div>
            }
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  <input 
                    ref={selectAllCheckboxRef}
                    type="checkbox" 
                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-600"
                    onChange={handleSelectAllOrders}
                    aria-label="Tümünü seç"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sipariş No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Müşteri</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tutar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">Durum</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              {filteredOrders.map((order) => {
                const displayTotal = convertTRYToCurrency(order.grandTotalTRY, order.currency, order.exchangeRatesSnapshot);
                return (
                  <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${selectedOrders.includes(order.id) ? 'bg-blue-50 dark:bg-blue-900' : ''}`}>
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-600"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        aria-label={`Sipariş ${order.orderNumber} seç`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate(`/orders/view/${order.id}`)}>{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">{order.customerNameSnapshot || 'Bilinmeyen'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(order.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200 font-medium">
                      {formatCurrency(displayTotal, order.currency)}
                      {order.currency !== Currency.TRY && <span className="text-xs text-gray-500 dark:text-gray-400 block">({formatCurrency(order.grandTotalTRY, Currency.TRY)})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <SingleSelect
                            options={statusOptionsForSelect}
                            value={order.status}
                            onChange={(e) => handleInlineStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`!mt-0 !mb-0 text-xs leading-5 font-semibold rounded-full border-none focus:ring-0 appearance-none p-1 ${OrderStatusColors[order.status]} ${OrderStatusColors[order.status].includes('text-white') ? 'text-white' : ''} dark:bg-transparent`}
                            containerClassName="!mb-0"
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/view/${order.id}`)} title="Görüntüle"><EyeIcon/></Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/edit/${order.id}`)} title="Düzenle"><EditIcon/></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteOrder(order.id)} title="Sil"><TrashIcon/></Button>
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