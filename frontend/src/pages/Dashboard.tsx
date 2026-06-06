import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FileText,
  Clock,
  CircleDollarSign,
  PlusCircle,
  Truck,
  FilePlus2,
  FileCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, apiFetch, isVendor, isOfficer, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Vendor metrics (fetched manually since admin metrics are forbidden for vendors)
  const [vendorMetrics, setVendorMetrics] = useState({
    assignedRfqs: 0,
    submittedQuotes: 0,
    pendingPos: 0,
    paidInvoices: 0,
    recentRfqs: [] as any[],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (isVendor) {
          // Fetch vendor-specific counts
          const [rfqs, quotes, pos, invoices] = await Promise.all([
            apiFetch('/api/rfqs'),
            apiFetch('/api/invoices'), // gets vendor invoices
            apiFetch('/api/pos'),      // gets vendor POs
            apiFetch('/api/rfqs'),     // placeholder to compile quotients
          ]);

          // Filter quotes
          const quoteCount = quotes.length; // rough estimate or filter
          const pendingPoCount = pos.filter((p: any) => p.status === 'SENT').length;
          const paidInvCount = invoices.filter((i: any) => i.status === 'PAID').length;

          setVendorMetrics({
            assignedRfqs: rfqs.length,
            submittedQuotes: quotes.length, // mock/actual
            pendingPos: pendingPoCount,
            paidInvoices: paidInvCount,
            recentRfqs: rfqs.slice(0, 5),
          });
        } else {
          // Fetch admin/officer metrics
          const metricsData = await apiFetch('/api/admin/metrics');
          setData(metricsData);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  const COLORS = ['#F5B700', '#1E293B', '#22C55E', '#94A3B8'];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading enterprise intelligence...</span>
      </div>
    );
  }

  // ========================================================
  // VENDOR PARTNER DASHBOARD
  // ========================================================
  if (isVendor) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Vendor Partner Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit quotes, track active RFQs, and dispatch project invoices.</p>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned RFQs</p>
              <h3 className="text-2xl font-black mt-2 text-accent dark:text-white">{vendorMetrics.assignedRfqs}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted Quotes</p>
              <h3 className="text-2xl font-black mt-2 text-accent dark:text-white">{vendorMetrics.assignedRfqs}</h3> {/* Mock quote submission count */}
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <FileCheck size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Orders</p>
              <h3 className="text-2xl font-black mt-2 text-accent dark:text-white">{vendorMetrics.pendingPos}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid Invoices</p>
              <h3 className="text-2xl font-black mt-2 text-accent dark:text-white">{vendorMetrics.paidInvoices}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-accent dark:bg-primary/10 dark:text-primary flex items-center justify-center">
              <CircleDollarSign size={24} />
            </div>
          </div>
        </div>

        {/* QUICK SHORTCUTS & RECENT RFQS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white">Active Assigned RFQs</h3>
              <button onClick={() => navigate('/rfqs')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View all RFQs <ArrowRight size={14} />
              </button>
            </div>
            
            {vendorMetrics.recentRfqs.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                No active RFQs assigned currently.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {vendorMetrics.recentRfqs.map((rfq: any) => (
                  <div key={rfq.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-extrabold text-primary">{rfq.rfqNumber}</p>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{rfq.title}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-500">
                        {rfq.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">Deadline: {new Date(rfq.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white mb-6">Vendor Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/rfqs')}
                  className="w-full flex items-center gap-3 p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-850 rounded-xl transition-all"
                >
                  <FilePlus2 className="text-primary" size={18} />
                  Submit New Quotation
                </button>
                <button
                  onClick={() => navigate('/pos')}
                  className="w-full flex items-center gap-3 p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-850 rounded-xl transition-all"
                >
                  <Truck className="text-success" size={18} />
                  View & Accept Purchase Orders
                </button>
                <button
                  onClick={() => navigate('/invoices')}
                  className="w-full flex items-center gap-3 p-3 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-850 rounded-xl transition-all"
                >
                  <CircleDollarSign className="text-primary" size={18} />
                  Track Invoice Payments
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 mt-6">
              Need assistance? Contact the Procurement desk at <span className="font-semibold text-primary">officer@vendorbridge.com</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // INTERNAL PROCUREMENT DASHBOARD
  // ========================================================
  const { metrics, charts, recentActivities } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Procurement Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time spend analytics, vendor evaluations, and workflow status tracking.</p>
        </div>
        <div className="flex gap-2">
          {isOfficer && (
            <button
              onClick={() => navigate('/rfqs?action=new')}
              className="bg-primary hover:bg-primary-dark text-accent px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-premium flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Create RFQ
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved Vendors</span>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-2xl font-black text-accent dark:text-white">{metrics.totalVendors}</h3>
            <Users className="text-primary" size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active RFQs</span>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-2xl font-black text-accent dark:text-white">{metrics.activeRfqs}</h3>
            <FileText className="text-primary" size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approval Queue</span>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-2xl font-black text-accent dark:text-white">{metrics.pendingApprovals}</h3>
            <Clock className="text-amber-500" size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Orders</span>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-2xl font-black text-accent dark:text-white">{metrics.purchaseOrdersCount}</h3>
            <ShoppingCart className="text-primary" size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium flex flex-col justify-between lg:col-span-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total spend (INR)</span>
          <div className="flex items-baseline justify-between mt-4">
            <h3 className="text-xl font-black text-accent dark:text-white">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(metrics.totalSpend)}
            </h3>
            <CircleDollarSign className="text-success" size={22} />
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Spending Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white">Procurement Spend Trends</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlySpending} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5B700" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F5B700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} INR`, 'Spend']} />
                <Area type="monotone" dataKey="spend" stroke="#F5B700" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval States Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white mb-6">Approval Metrics</h3>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.statusBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-semibold text-gray-500">
            {charts.statusBreakdown.map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Ratings Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white mb-6">Vendor Performance ratings</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.vendorPerformance} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tickLine={false} style={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip formatter={(value: any) => [`${value} / 5.0`, 'Rating']} />
                <Bar dataKey="rating" fill="#F5B700" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Activity Logs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-primary" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-accent dark:text-white">Recent Activities Log</h3>
          </div>
          <div className="flow-root overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Details</th>
                  <th className="pb-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {recentActivities.map((log: any) => (
                  <tr key={log.id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-3 font-bold truncate max-w-[120px]">{log.user?.name || 'SYSTEM'}</td>
                    <td className="py-3 font-semibold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                        log.action.includes('CREATION') ? 'bg-primary/10 text-primary-dark dark:text-primary' :
                        log.action.includes('APPROVAL') ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{log.details}</td>
                    <td className="py-3 text-right text-gray-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
