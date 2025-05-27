
import { Currency, ExchangeRates, OrderStatus, CompanyInfo } from './types';

export const APP_NAME = "EvDekor Pro";

export const CURRENCIES_SUPPORTED: Currency[] = [Currency.TRY, Currency.USD, Currency.EUR];
export const DEFAULT_CURRENCY: Currency = Currency.TRY;
export const INITIAL_EXCHANGE_RATES: ExchangeRates = {
  [Currency.USD]: 32.50,
  [Currency.EUR]: 35.20,
};

export const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.QUOTATION,
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.DELIVERED, // Moved up
  OrderStatus.DELIVERED_PENDING_PAYMENT, // Moved up
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export const ORDER_STATUS_TRANSLATIONS: Record<OrderStatus, string> = {
  [OrderStatus.QUOTATION]: 'Teklif',
  [OrderStatus.PENDING]: 'Beklemede',
  [OrderStatus.PREPARING]: 'Hazırlanıyor',
  [OrderStatus.COMPLETED]: 'Tamamlandı',
  [OrderStatus.CANCELLED]: 'İptal Edildi',
  [OrderStatus.DELIVERED]: 'Teslim Edildi',
  [OrderStatus.DELIVERED_PENDING_PAYMENT]: 'Teslim Edildi (Ödeme Bekliyor)',
};

export const OrderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.QUOTATION]: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
  [OrderStatus.PREPARING]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
  [OrderStatus.DELIVERED]: 'bg-teal-100 text-teal-800 dark:bg-teal-600 dark:text-teal-100',
  [OrderStatus.DELIVERED_PENDING_PAYMENT]: 'bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-100',
};

export const DEFAULT_PRODUCT_UNITS: string[] = ['Adet', 'M2', 'Mtül'];
export const DEFAULT_TAX_RATE: number = 10; // Default KDV rate %10 olarak güncellendi

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: "Firma Adınız",
    email: "firma@mail.com",
    phone: "(000) 000 0000",
    address: "Firma Adresiniz",
    logoBase64: "", // Default no logo
};

export const generateId = (): string => `id_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;