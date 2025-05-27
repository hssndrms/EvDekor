
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Customer } from '../types';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { generateId } from '../constants';

const CustomerForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  initialData?: Customer | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrors({ name: 'Müşteri adı zorunludur.' });
      return;
    }
    const customerData = {
      id: initialData?.id || generateId(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    };
    onSave(customerData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}>
      <div className="space-y-4">
        <Input label="Müşteri Adı Soyadı*" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
        <Input label="Telefon Numarası" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="E-posta Adresi" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Textarea label="Adres" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit}>{initialData ? "Kaydet" : "Ekle"}</Button>
      </div>
    </Modal>
  );
};

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAppContext();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveCustomer = (customer: Customer) => {
    if (editingCustomer) {
      updateCustomer(customer);
    } else {
      addCustomer(customer);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };
  
  const openNewModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
        deleteCustomer(customerId);
    }
  }

  const filteredCustomers = customers
    .filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Müşteri Yönetimi</h1>
        <Button onClick={openNewModal}>Yeni Müşteri Ekle</Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Müşteri ara (isim, telefon, e-posta)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          containerClassName="max-w-md"
        />
      </div>
      
      {filteredCustomers.length === 0 ? (
         <div className="text-center py-10 bg-white dark:bg-gray-700 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Müşteri bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                {searchTerm ? "Arama kriterlerinize uygun müşteri bulunamadı." : "Henüz kayıtlı müşteri yok."}
            </p>
            {!searchTerm && 
                <div className="mt-6">
                    <Button onClick={openNewModal}>
                        İlk Müşteriyi Ekle
                    </Button>
                </div>
            }
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adı Soyadı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-posta</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adres</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kayıt Tarihi</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/customers/${customer.id}`)}
                  >
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(customer.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(customer)}>Düzenle</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCustomer(customer.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />
    </div>
  );
};