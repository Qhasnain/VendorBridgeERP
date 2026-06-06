import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, FileSpreadsheet, Download, TrendingUp, Users, Star, Clock, AlertCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  const { apiFetch } = useAuth();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Category Spends data compiling (seed fallbacks + aggregates)
  const [categorySpends, setCategorySpends] = useState([
    { category: 'IT Hardware & Enterprise Servers', total: 3776000, poCount: 1 },
    { category: 'Cloud Services & Software Licensing', total: 1250000, poCount: 1 },
    { category: 'Office Equipment & Furniture', total: 850000, poCount: 2 },
    { category: 'Professional Services & Consulting', total: 320000, poCount: 1 },
  ]);

  const [vendorStandings, setVendorStandings] = useState<any[]>([]);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const dashboard = await apiFetch('/api/admin/metrics');
        setMetrics(dashboard.metrics);

        const vendors = await apiFetch('/api/vendors?status=APPROVED');
        setVendorStandings(vendors);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  // Client side CSV Generator
  const downloadCSV = (title: string, headers: string[], rows: any[][]) => {
    const csvContent = 
      "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSpendReport = () => {
    const headers = ['Category', 'POs Issued', 'Total Spend (INR)'];
    const rows = categorySpends.map(item => [item.category, item.poCount, item.total]);
    downloadCSV('Category_Spend', headers, rows);
  };

  const exportVendorReport = () => {
    const headers = ['Vendor ID', 'Company Name', 'Contact Person', 'Email', 'Rating', 'Status'];
    const rows = vendorStandings.map(v => [v.vendorId, v.companyName, v.contactPerson, v.email, v.rating, v.status]);
    downloadCSV('Vendor_Performance', headers, rows);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Compiling financial indexes...</span>
      </div>
    );
  }

  const overallSpend = metrics ? metrics.totalSpend : 6196000;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Reports & Financial KPI</h1>
          <p className="text-sm text-gray-500 mt-1">Export transaction audit sheets and verify category spend metrics.</p>
        </div>
      </div>

      {/* KPI WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Spend Under Mgmt</span>
            <h3 className="text-xl font-black text-accent dark:text-white mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(overallSpend)}
            </h3>
          </div>
          <TrendingUp className="text-success" size={24} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Lead Time</span>
            <h3 className="text-xl font-black text-accent dark:text-white mt-1">5.2 Days</h3>
          </div>
          <Clock className="text-primary" size={24} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tender Conversion</span>
            <h3 className="text-xl font-black text-accent dark:text-white mt-1">84%</h3>
          </div>
          <ClipboardList className="text-primary" size={24} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Partner rating</span>
            <h3 className="text-xl font-black text-accent dark:text-white mt-1">4.3 ★</h3>
          </div>
          <Star className="text-amber-500" size={24} />
        </div>
      </div>

      {/* REPORTS TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CATEGORY SPEND */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Spend by Category</h3>
            <button
              onClick={exportSpendReport}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Orders</th>
                  <th className="pb-3 text-right">Accumulated Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-700 dark:text-gray-300">
                {categorySpends.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 font-semibold">{item.category}</td>
                    <td className="py-3.5 text-right font-bold text-gray-500">{item.poCount}</td>
                    <td className="py-3.5 text-right font-extrabold text-accent dark:text-white">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VENDOR RATINGS */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Supplier Performance index</h3>
            <button
              onClick={exportVendorReport}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Classification</th>
                  <th className="pb-3 text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-700 dark:text-gray-300">
                {vendorStandings.map((v, idx) => (
                  <tr key={v.id}>
                    <td className="py-3.5 font-bold text-accent dark:text-white">{v.companyName}</td>
                    <td className="py-3.5 font-semibold text-gray-500">{v.category}</td>
                    <td className="py-3.5 text-right">
                      <span className="font-extrabold text-amber-500">{v.rating.toFixed(1)} ★</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
