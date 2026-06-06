import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Search, ShieldCheck } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { apiFetch } = useAuth();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      let url = `/api/admin/logs?search=${encodeURIComponent(search)}`;
      if (actionFilter) {
        url += `&action=${actionFilter}`;
      }
      const data = await apiFetch(url);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Security & Audit Trails</h1>
        <p className="text-sm text-gray-500 mt-1">Review system interactions, authentication activities, and document logs.</p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by username, log details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-850 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:bg-white dark:focus:bg-slate-900 text-gray-700 dark:text-white"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="bg-gray-50 dark:bg-slate-850 px-4 py-2 rounded-xl text-xs outline-none border border-transparent text-gray-700 dark:text-white font-medium"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Sign In Activities</option>
          <option value="RFQ_CREATION">RFQ Creations</option>
          <option value="VENDOR_CREATION">Vendor Registrations</option>
          <option value="QUOTATION_SUBMITTING">Quote Submissions</option>
          <option value="APPROVAL_ACTION">Approval Workflows</option>
          <option value="INVOICE_GENERATION">Invoice Billing</option>
        </select>
      </div>

      {/* LOGS DATAGRID */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/10">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Trigger User</th>
                <th className="px-6 py-4">Enterprise Role</th>
                <th className="px-6 py-4">Action Token</th>
                <th className="px-6 py-4">Audit Details</th>
                <th className="px-6 py-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-gray-750 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 font-medium">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail security catalog...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No matching security activity logged.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-accent dark:text-white">
                      {log.user?.name || 'SYSTEM SERVICES'}
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40">
                          {log.user.role.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                        log.action === 'LOGIN' ? 'bg-primary/10 text-primary-dark dark:text-primary' :
                        log.action.includes('CREATION') ? 'bg-indigo-500/10 text-indigo-500' :
                        log.action.includes('APPROVAL') ? 'bg-success/10 text-success' : 'bg-gray-150 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-550 dark:text-gray-400">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
