
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../contexts/AppContext';
import { Order, Customer, OrderStatus, Currency } from '../types';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils/currencyUtils';
import { ORDER_STATUSES, OrderStatusColors } from '../constants';

const COLORS = ['#0D47A1', '#1976D2', '#2196F3', '#64B5F6', '#90CAF9', '#FFC107', '#FF9800', '#FF5722'];
const DARK_COLORS = ['#64B5F6', '#2196F3', '#1976D2', '#0D47A1', '#0B3C7A', '#FFD54F', '#FFB74D', '#FF8A65'];


const ReportsPage: React.FC = () => {
  const { orders, customers, getCustomerById, getOrderStatusTranslation, theme } = useAppContext();

  const [reportType, setReportType] = useState<'salesByCustomer' | 'salesByStatus' | 'salesByProduct' | 'monthlySales'>('monthlySales');
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6); 
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const chartColors = theme === 'dark' ? DARK_COLORS : COLORS;
  const axisStrokeColor = theme === 'dark' ? '#9ca3af' : '#6b7280'; // gray-400 dark, gray-500 light
  const gridStrokeColor = theme === 'dark' ? '#4b5563' : '#d1d5db'; // gray-600 dark, gray-300 light
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' } 
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#1f2937' };
  const legendTextStyle = theme === 'dark' ? { color: '#d1d5db' } : { color: '#374151' };


  const filteredOrdersForCompletedSales = useMemo(() => {
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(new Date(dateTo).setHours(23,59,59,999)) : null; 
        
        if (from && orderDate < from) return false;
        if (to && orderDate > to) return false;
        return order.status === OrderStatus.COMPLETED; 
    });
  }, [orders, dateFrom, dateTo]);

  const allOrdersInDateRange = useMemo(() => {
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(new Date(dateTo).setHours(23,59,59,999)) : null;
        if (from && orderDate < from) return false;
        if (to && orderDate > to) return false;
        return true;
    });
  }, [orders, dateFrom, dateTo]);


  const salesByCustomerData = useMemo(() => {
    if (reportType !== 'salesByCustomer') return [];
    const data: { name: string; totalSales: number }[] = [];
    const customerSales: Record<string, number> = {};

    filteredOrdersForCompletedSales.forEach(order => {
      const customerName = order.customerNameSnapshot || 'Bilinmeyen Müşteri';
      customerSales[customerName] = (customerSales[customerName] || 0) + order.grandTotalTRY;
    });
    
    for (const name in customerSales) {
        data.push({ name, totalSales: parseFloat(customerSales[name].toFixed(2)) });
    }
    return data.sort((a,b) => b.totalSales - a.totalSales).slice(0,10); // Top 10
  }, [reportType, filteredOrdersForCompletedSales]);

  const salesByStatusData = useMemo(() => {
    if (reportType !== 'salesByStatus') return [];
    const data: { name: string; count: number; totalValue: number; translatedName: string; }[] = [];
    const statusData: Record<OrderStatus, { count: number; totalValue: number }> = {} as any;

    ORDER_STATUSES.forEach(status => statusData[status] = { count: 0, totalValue: 0 });

    allOrdersInDateRange.forEach(order => {
        statusData[order.status].count++;
        statusData[order.status].totalValue += order.grandTotalTRY;
    });
    
    for (const status in statusData) {
        if(statusData[status as OrderStatus].count > 0) {
            data.push({ 
                name: status, 
                translatedName: getOrderStatusTranslation(status as OrderStatus),
                count: statusData[status as OrderStatus].count,
                totalValue: parseFloat(statusData[status as OrderStatus].totalValue.toFixed(2))
            });
        }
    }
    return data;
  }, [reportType, allOrdersInDateRange, getOrderStatusTranslation]);
  
  const salesByProductData = useMemo(() => {
    if (reportType !== 'salesByProduct') return [];
    const productSales: Record<string, { quantity: number; totalSales: number }> = {};

    filteredOrdersForCompletedSales.forEach(order => {
        order.sections.forEach(section => {
            section.products.forEach(product => {
                if (!productSales[product.name]) {
                    productSales[product.name] = { quantity: 0, totalSales: 0 };
                }
                productSales[product.name].quantity += product.quantity;
                productSales[product.name].totalSales += product.quantity * product.unitPriceTRY; 
            });
        });
    });
    
    return Object.entries(productSales)
        .map(([name, data]) => ({ name, quantity: data.quantity, totalSales: parseFloat(data.totalSales.toFixed(2))}))
        .sort((a,b) => b.totalSales - a.totalSales)
        .slice(0,10); // Top 10
  }, [reportType, filteredOrdersForCompletedSales]);

  const monthlySalesData = useMemo(() => {
    if (reportType !== 'monthlySales') return [];
    const salesByMonth: Record<string, number> = {}; // YYYY-MM format

    filteredOrdersForCompletedSales.forEach(order => {
      const monthYear = new Date(order.date).toISOString().substring(0, 7); // YYYY-MM
      salesByMonth[monthYear] = (salesByMonth[monthYear] || 0) + order.grandTotalTRY;
    });

    return Object.entries(salesByMonth)
      .map(([monthYear, totalSales]) => ({ name: monthYear, totalSales: parseFloat(totalSales.toFixed(2)) }))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [reportType, filteredOrdersForCompletedSales]);


  const renderChart = () => {
    switch (reportType) {
      case 'salesByCustomer':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesByCustomerData} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor}/>
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <YAxis tickFormatter={(value) => formatCurrency(value, Currency.TRY)} stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}/>
              <Legend wrapperStyle={legendTextStyle} />
              <Bar dataKey="totalSales" fill={chartColors[0]} name="Toplam Satış (TRY)" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'salesByStatus':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie data={salesByStatusData} dataKey="count" nameKey="translatedName" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`} >
                        {salesByStatusData.map((entry, index) => {
                            // Attempt to derive a color from OrderStatusColors for Pie chart
                            const statusColorClass = OrderStatusColors[entry.name as OrderStatus];
                            let fillColor = chartColors[index % chartColors.length]; // Fallback
                            if (statusColorClass) {
                                const bgColorMatch = statusColorClass.match(/bg-([a-z]+)-(\d+)/);
                                if (bgColorMatch) {
                                   const colorName = bgColorMatch[1];
                                   const colorStrength = theme === 'dark' ? '600' : '500'; // Adjust strength for visibility
                                   // Tailwind doesn't expose its color palette directly to JS, so this is a rough mapping
                                   // This part is tricky and might not perfectly match Tailwind's exact shades.
                                   // A predefined color map would be more robust.
                                   const colorMap: Record<string, string> = {
                                       blue: theme === 'dark' ? '#2563eb' : '#3b82f6',
                                       yellow: theme === 'dark' ? '#ca8a04' : '#f59e0b',
                                       indigo: theme === 'dark' ? '#4f46e5' : '#6366f1',
                                       green: theme === 'dark' ? '#16a34a' : '#22c55e',
                                       red: theme === 'dark' ? '#dc2626' : '#ef4444',
                                       teal: theme === 'dark' ? '#0d9488' : '#14b8a6',
                                       orange: theme === 'dark' ? '#ea580c' : '#f97316',
                                   }
                                   fillColor = colorMap[colorName] || fillColor;
                                }
                            }
                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                        })}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value:number, name:string, props:any) => [`${value} adet`, props.payload.translatedName]} />
                    <Legend wrapperStyle={legendTextStyle} />
                </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesByStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor}/>
                    <XAxis dataKey="translatedName" stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
                    <YAxis yAxisId="left" orientation="left" stroke={chartColors[0]} tickFormatter={(value) => formatCurrency(value, Currency.TRY)} tick={{ fill: axisStrokeColor }}/>
                    <YAxis yAxisId="right" orientation="right" stroke={chartColors[1]} tick={{ fill: axisStrokeColor }}/>
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} formatter={(value: number, name: string, props:any) => {
                        if (name === 'count') return [`${value} adet`, props.payload.translatedName];
                        if (name === 'totalValue') return [formatCurrency(value, Currency.TRY), props.payload.translatedName];
                        return [value, name];
                    }}/>
                    <Legend wrapperStyle={legendTextStyle} />
                    <Bar yAxisId="left" dataKey="totalValue" fill={chartColors[0]} name="Toplam Değer (TRY)" />
                    <Bar yAxisId="right" dataKey="count" fill={chartColors[1]} name="Adet" />
                </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'salesByProduct':
         return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesByProductData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value, Currency.TRY)} stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <YAxis dataKey="name" type="category" width={150} interval={0} stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} formatter={(value: number, name: string) => name === 'quantity' ? `${value} adet` : formatCurrency(value, Currency.TRY)}/>
              <Legend wrapperStyle={legendTextStyle} />
              <Bar dataKey="totalSales" fill={chartColors[2]} name="Toplam Satış (TRY)" />
              <Bar dataKey="quantity" fill={chartColors[3]} name="Satılan Miktar" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'monthlySales':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor}/>
              <XAxis dataKey="name" stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <YAxis tickFormatter={(value) => formatCurrency(value, Currency.TRY)} stroke={axisStrokeColor} tick={{ fill: axisStrokeColor }}/>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} formatter={(value: number) => formatCurrency(value, Currency.TRY)} />
              <Legend wrapperStyle={legendTextStyle}/>
              <Bar dataKey="totalSales" fill={chartColors[4]} name="Aylık Satış (TRY)" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return <p className="text-gray-700 dark:text-gray-300">Lütfen bir rapor türü seçin.</p>;
    }
  };
  
  const reportOptions = [
      { value: 'monthlySales', label: 'Aylık Satış Grafiği (Tamamlananlar)' },
      { value: 'salesByCustomer', label: 'Müşteriye Göre Satışlar (Top 10 Tamamlananlar)' },
      { value: 'salesByStatus', label: 'Duruma Göre Sipariş/Teklif Dağılımı (Tüm Durumlar)' },
      { value: 'salesByProduct', label: 'Ürüne Göre Satışlar (Top 10 Tamamlananlar)' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Raporlar</h1>
      </div>

      <div className="p-4 bg-white dark:bg-gray-700 shadow rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
            label="Rapor Türü"
            options={reportOptions}
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
        />
        <Input 
          type="date"
          label="Başlangıç Tarihi"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />
        <Input 
          type="date"
          label="Bitiş Tarihi"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-700 shadow rounded-lg printable-area">
        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 text-center">
            {reportOptions.find(opt => opt.value === reportType)?.label} ({dateFrom ? new Date(dateFrom).toLocaleDateString('tr-TR') : ''} - {dateTo ? new Date(dateTo).toLocaleDateString('tr-TR') : ''})
        </h2>
        { (reportType === 'monthlySales' && monthlySalesData.length === 0) ||
          (reportType === 'salesByCustomer' && salesByCustomerData.length === 0) ||
          (reportType === 'salesByProduct' && salesByProductData.length === 0) ||
          (reportType === 'salesByStatus' && salesByStatusData.length === 0) ? (
            <p className="text-center text-gray-500 dark:text-gray-300 py-8">Seçili kriterlere uygun veri bulunamadı.</p>
          ) : renderChart()
        }
      </div>
      <div className="text-center mt-4 no-print">
          <Button onClick={() => window.print()}>Raporu Yazdır / PDF</Button>
      </div>
    </div>
  );
};

export default ReportsPage;