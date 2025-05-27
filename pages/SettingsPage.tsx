
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Currency, ExchangeRates, CompanyInfo } from '../types';
import { Input, Textarea } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CURRENCIES_SUPPORTED, INITIAL_EXCHANGE_RATES, DEFAULT_PRODUCT_UNITS, DEFAULT_COMPANY_INFO } from '../constants';

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

export const SettingsPage: React.FC = () => {
  const { 
    exchangeRates, setExchangeRates, 
    currentCurrency, setCurrentCurrency,
    productUnits, addProductUnit, deleteProductUnit, setProductUnits,
    companyInfo, setCompanyInfo
  } = useAppContext();
  
  const [localRates, setLocalRates] = useState<ExchangeRates>(exchangeRates);
  const [localDefaultCurrency, setLocalDefaultCurrency] = useState<Currency>(currentCurrency);
  const [localCompanyInfo, setLocalCompanyInfo] = useState<CompanyInfo>(companyInfo);
  const [newUnit, setNewUnit] = useState('');
  const [savedMessage, setSavedMessage] = useState<string>('');

  const handleRateChange = (currency: Currency.USD | Currency.EUR, value: string) => {
    const newRate = parseFloat(value);
    if (!isNaN(newRate) && newRate > 0) {
      setLocalRates(prev => ({ ...prev, [currency]: newRate }));
    }
  };

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCompanyInfo(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    setExchangeRates(localRates);
    setCurrentCurrency(localDefaultCurrency);
    setCompanyInfo(localCompanyInfo);
    setSavedMessage('Ayarlar başarıyla kaydedildi!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleResetGeneralSettings = () => {
    setLocalRates(INITIAL_EXCHANGE_RATES);
    setLocalDefaultCurrency(CURRENCIES_SUPPORTED[0]); 
  };
  
  const handleResetCompanyInfo = () => {
    setLocalCompanyInfo(DEFAULT_COMPANY_INFO);
  };


  const handleAddUnit = () => {
    if (newUnit.trim()) {
      addProductUnit(newUnit.trim());
      setNewUnit('');
    }
  };

  const handleDeleteUnit = (unitToDelete: string) => {
    if (window.confirm(`"${unitToDelete}" birimini silmek istediğinizden emin misiniz?`)) {
      deleteProductUnit(unitToDelete);
    }
  };
  
  const handleResetUnits = () => {
    if (window.confirm("Ürün birimlerini varsayılanlara sıfırlamak istediğinizden emin misiniz?")) {
        setProductUnits(DEFAULT_PRODUCT_UNITS);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Uygulama Ayarları</h1>

      {/* Company Information */}
      <div className="bg-white dark:bg-gray-700 shadow-xl rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 border-b pb-2 border-gray-300 dark:border-gray-600">Firma Bilgileri</h2>
        <Input label="Firma Adı" name="name" value={localCompanyInfo.name} onChange={handleCompanyInfoChange} />
        <Input label="E-posta" name="email" type="email" value={localCompanyInfo.email || ''} onChange={handleCompanyInfoChange} />
        <Input label="Telefon" name="phone" type="tel" value={localCompanyInfo.phone || ''} onChange={handleCompanyInfoChange} />
        <Textarea label="Adres" name="address" value={localCompanyInfo.address || ''} onChange={handleCompanyInfoChange} />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Yükle</label>
            <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} 
                   className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-700 file:text-blue-700 dark:file:text-blue-100 hover:file:bg-blue-100 dark:hover:file:bg-blue-600"/>
            {localCompanyInfo.logoBase64 && <img src={localCompanyInfo.logoBase64} alt="Mevcut Logo" className="mt-2 max-h-24 border p-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-white"/>}
        </div>
        <div className="flex space-x-3">
            <Button onClick={handleResetCompanyInfo} variant="outline">Firma Bilgilerini Sıfırla</Button>
        </div>
      </div>


      {/* Currency and General Settings */}
      <div className="bg-white dark:bg-gray-700 shadow-xl rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 border-b pb-2 border-gray-300 dark:border-gray-600">Genel ve Döviz Ayarları</h2>
          <div className="space-y-4 mt-4">
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Döviz Kurları (1 Birim = TRY)</h3>
            {Object.keys(localRates).map(key => {
                const currKey = key as Currency.USD | Currency.EUR;
                return (
                    <Input
                        key={currKey}
                        label={`1 ${currKey} = TRY`}
                        type="number"
                        step="0.0001"
                        value={localRates[currKey]}
                        onChange={(e) => handleRateChange(currKey, e.target.value)}
                        containerClassName="max-w-xs"
                    />
                );
            })}
          </div>
           <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1 mt-4">Varsayılan Para Birimi</h3>
          <select
            value={localDefaultCurrency}
            onChange={(e) => setLocalDefaultCurrency(e.target.value as Currency)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md max-w-xs"
          >
            {CURRENCIES_SUPPORTED.map(curr => (
              <option key={curr} value={curr} className="dark:bg-gray-800 dark:text-gray-100">{curr}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yeni sipariş/tekliflerdeki ve genel arayüzdeki varsayılan para birimini belirler.</p>
          <Button variant="outline" size="sm" onClick={handleResetGeneralSettings} className="mt-3">
            Genel ve Döviz Ayarlarını Sıfırla
          </Button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-700 shadow-xl rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-3 border-b pb-2 border-gray-300 dark:border-gray-600">Ürün Birimleri Yönetimi</h2>
        <div className="flex items-end space-x-2">
            <Input
                label="Yeni Birim Ekle"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                containerClassName="flex-grow !mb-0"
                placeholder="Örn: Paket, Kutu"
            />
            <Button onClick={handleAddUnit} disabled={!newUnit.trim()}>Ekle</Button>
        </div>
        {productUnits.length > 0 ? (
            <ul className="mt-4 space-y-2">
                {productUnits.map(unit => (
                    <li key={unit} className="flex justify-between items-center p-3 border rounded-md bg-gray-50 dark:bg-gray-600 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-500">
                        <span>{unit}</span>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUnit(unit)} title="Sil">
                            <TrashIcon />
                        </Button>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Henüz ürün birimi eklenmemiş.</p>
        )}
         <Button variant="outline" size="sm" onClick={handleResetUnits} className="mt-3">
            Varsayılan Birimlere Dön
          </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
          <Button onClick={handleSaveSettings} size="lg" className="w-full sm:w-auto">Tüm Ayarları Kaydet</Button>
          {savedMessage && <p className="text-green-600 dark:text-green-400 mt-3 text-center sm:text-left">{savedMessage}</p>}
      </div>

      <div className="mt-8 bg-white dark:bg-gray-700 shadow-xl rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-3 border-b pb-2 border-gray-300 dark:border-gray-600">Veri Yönetimi</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Uygulama tüm verileri tarayıcınızın yerel depolama alanında saklar. Tarayıcı verilerini temizlerseniz tüm uygulama verileriniz kaybolacaktır. 
          Önemli verilerinizi düzenli olarak yedeklemeniz önerilir.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
            Gelişmiş Kullanıcılar İçin Not: Veriler localStorage içerisinde `evdekor_` önekiyle saklanmaktadır.
        </p>
      </div>
    </div>
  );
};