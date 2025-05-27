
import { Currency, ExchangeRates, ProductItem, OrderSection, Order, Discount } from '../types';

export const calculateProductItemTotalTRY = (item: ProductItem): number => {
  return item.quantity * item.unitPriceTRY;
};

export const calculateSectionTotalTRY = (section: OrderSection): number => {
  return section.products.reduce((sum, product) => sum + calculateProductItemTotalTRY(product), 0);
};

export const calculateOrderItemsTotalTRY = (sections: OrderSection[]): number => {
  return sections.reduce((sum, section) => sum + calculateSectionTotalTRY(section), 0);
};

interface OrderFinancials {
  itemsTotalTRY: number;
  totalDiscountAmountTRY: number;
  subTotalAfterDiscountsTRY: number;
  taxAmountTRY: number;
  grandTotalTRY: number;
}

export const calculateOrderFinancials = (
  sections: OrderSection[],
  discounts: Discount[],
  taxRate?: number
): OrderFinancials => {
  const itemsTotalTRY = calculateOrderItemsTotalTRY(sections);
  let currentTotalAfterDiscounts = itemsTotalTRY;
  let totalDiscountAmountTRY = 0;

  // Apply discounts sequentially
  discounts.forEach(discount => {
    let discountValueTRY = 0;
    if (discount.type === 'percentage') {
      discountValueTRY = currentTotalAfterDiscounts * (discount.value / 100);
    } else { // amount
      discountValueTRY = discount.value; // Assuming discount value is always in TRY
    }
    // Ensure discount doesn't make total negative, though UI should prevent this
    discountValueTRY = Math.min(discountValueTRY, currentTotalAfterDiscounts); 
    currentTotalAfterDiscounts -= discountValueTRY;
    totalDiscountAmountTRY += discountValueTRY;
  });

  const subTotalAfterDiscountsTRY = currentTotalAfterDiscounts;
  let taxAmountTRY = 0;

  if (taxRate && taxRate > 0) {
    taxAmountTRY = subTotalAfterDiscountsTRY * (taxRate / 100);
  }

  const grandTotalTRY = subTotalAfterDiscountsTRY + taxAmountTRY;

  return {
    itemsTotalTRY: parseFloat(itemsTotalTRY.toFixed(2)),
    totalDiscountAmountTRY: parseFloat(totalDiscountAmountTRY.toFixed(2)),
    subTotalAfterDiscountsTRY: parseFloat(subTotalAfterDiscountsTRY.toFixed(2)),
    taxAmountTRY: parseFloat(taxAmountTRY.toFixed(2)),
    grandTotalTRY: parseFloat(grandTotalTRY.toFixed(2)),
  };
};


export const convertTRYToCurrency = (amountTRY: number, targetCurrency: Currency, rates: ExchangeRates): number => {
  if (targetCurrency === Currency.TRY) {
    return amountTRY;
  }
  if (targetCurrency === Currency.USD && rates[Currency.USD] && rates[Currency.USD] > 0) {
    return amountTRY / rates[Currency.USD];
  }
  if (targetCurrency === Currency.EUR && rates[Currency.EUR] && rates[Currency.EUR] > 0) {
    return amountTRY / rates[Currency.EUR];
  }
  // Fallback or if rate is missing/zero
  if (targetCurrency === Currency.USD && (!rates[Currency.USD] || rates[Currency.USD] <= 0)) return amountTRY / 32.0; // Fallback
  if (targetCurrency === Currency.EUR && (!rates[Currency.EUR] || rates[Currency.EUR] <= 0)) return amountTRY / 35.0; // Fallback
  
  return amountTRY; 
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};
