
export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR'
}

export interface ExchangeRates {
  [Currency.USD]: number;
  [Currency.EUR]: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceTRY: number; // Unit price is always stored in TRY
  unit: string; // e.g., 'Adet', 'M2', 'Mtül'
  description?: string;
}

export interface OrderSection {
  id: string;
  name: string;
  products: ProductItem[];
}

export enum OrderStatus {
  QUOTATION = 'Quotation', // Teklif
  PENDING = 'Pending',     // Beklemede
  PREPARING = 'Preparing', // Hazırlanıyor
  DELIVERED = 'Delivered', // Teslim Edildi
  DELIVERED_PENDING_PAYMENT = 'DeliveredPendingPayment', // Teslim Edildi ve Ödeme Bekliyor
  COMPLETED = 'Completed', // Tamamlandı
  CANCELLED = 'Cancelled', // İptal Edildi
}

export interface Discount {
  id: string;
  description?: string;
  type: 'percentage' | 'amount'; // Oran | Tutar
  value: number; // Percentage value (e.g., 10 for 10%) or fixed amount in TRY
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerNameSnapshot: string; // Snapshot of customer name at the time of order
  date: string; // ISO string
  sections: OrderSection[];
  currency: Currency;
  exchangeRatesSnapshot: ExchangeRates; // Exchange rates at the time of order
  status: OrderStatus;
  notes?: string;

  // Financials - all in TRY, conversion to display currency happens at view time
  itemsTotalTRY: number;          // Sum of (product.quantity * product.unitPriceTRY) for all products
  discounts: Discount[];
  totalDiscountAmountTRY: number; // Calculated total discount amount in TRY
  subTotalAfterDiscountsTRY: number; // itemsTotalTRY - totalDiscountAmountTRY
  taxRate?: number;                // e.g., 18 for 18%
  taxAmountTRY?: number;           // Calculated based on subTotalAfterDiscountsTRY and taxRate
  grandTotalTRY: number;          // subTotalAfterDiscountsTRY + taxAmountTRY
}

export interface CompanyInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logoBase64?: string; // Base64 encoded image string
}

export interface ProductSuggestion {
  name: string;
  description?: string;
}

export interface AppContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getCustomerById: (customerId: string) => Customer | undefined;
  
  orders: Order[];
  addOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'>) => Promise<Order>;
  updateOrder: (orderInput: Omit<Order, 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'> & { id: string, orderNumber: string }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  bulkUpdateOrderStatuses: (orderIds: string[], newStatus: OrderStatus) => Promise<void>;
  
  currentCurrency: Currency;
  setCurrentCurrency: (currency: Currency) => Promise<void>; // Made async
  exchangeRates: ExchangeRates;
  setExchangeRates: (rates: ExchangeRates) => Promise<void>; // Made async

  productUnits: string[];
  addProductUnit: (unit: string) => Promise<void>; // Made async
  deleteProductUnit: (unit: string) => Promise<void>; // Made async
  setProductUnits: (units: string[]) => Promise<void>; // Made async

  getOrderStatusTranslation: (status: OrderStatus) => string;

  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => Promise<void>; // Made async

  productNameSuggestions: string[];
  productDescriptionSuggestions: string[];
  addProductNameSuggestion: (name: string) => Promise<void>; // Made async
  addProductDescriptionSuggestion: (description: string) => Promise<void>; // Made async

  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>; // Made async
}

// This global declaration might be better placed in a dedicated d.ts file (e.g., electron.d.ts)
// if preload.ts isn't included in the main src tsconfig's `files` or `include`.
// However, vite-plugin-electron handles this typically. For safety/clarity:
// declare global {
//   interface Window {
//     electronAPI: import('../../electron/preload').ElectronAPI; // Path to your preload.ts ElectronAPI export
//   }
// }
