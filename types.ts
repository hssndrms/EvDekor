
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
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  
  orders: Order[];
  addOrder: (orderInput: Omit<Order, 'id' | 'orderNumber' | 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'>) => Order;
  updateOrder: (orderInput: Omit<Order, 'itemsTotalTRY' | 'totalDiscountAmountTRY' | 'subTotalAfterDiscountsTRY' | 'taxAmountTRY' | 'grandTotalTRY' | 'customerNameSnapshot'> & { id: string, orderNumber: string }) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  bulkUpdateOrderStatuses: (orderIds: string[], newStatus: OrderStatus) => void;
  
  currentCurrency: Currency;
  setCurrentCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  exchangeRates: ExchangeRates;
  setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRates>>;

  productUnits: string[];
  addProductUnit: (unit: string) => void;
  deleteProductUnit: (unit: string) => void;
  setProductUnits: React.Dispatch<React.SetStateAction<string[]>>;

  getOrderStatusTranslation: (status: OrderStatus) => string;

  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;

  productNameSuggestions: string[];
  productDescriptionSuggestions: string[];
  addProductNameSuggestion: (name: string) => void;
  addProductDescriptionSuggestion: (description: string) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;
}