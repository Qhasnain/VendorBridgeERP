import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, Users, CheckSquare, Trash2, Edit2, Plus, ShieldCheck, Activity, BarChart4 } from 'lucide-react';

export const SuperAdmin: React.FC = () => {
  const { apiFetch, isSuperAdmin } = useAuth();
  
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PROCUREMENT_OFFICER');
  const [password, setPassword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, metricsRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/metrics')
      ]);
      setUsers(usersRes);
      setMetrics(metricsRes.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name, email, role };
      if (password) payload.password = password;

      if (editingUserId) {
        await apiFetch(`/api/super-admin/users/${editingUserId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert('User updated successfully');
      } else {
        await apiFetch('/api/super-admin/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number, userEmail: string) => {
    if (userEmail === 'admin@vendorbridge.com') {
      alert("Cannot delete the root SUPER_ADMIN account.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user ${userEmail}?`)) {
      try {
        await apiFetch(`/api/super-admin/users/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const resetForm = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setRole('PROCUREMENT_OFFICER');
    setPassword('');
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldCheck className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold dark:text-white">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only SUPER_ADMIN has clearance for this module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="text-primary" />
            Super Admin Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Total control over VendorBridge infrastructure.</p>
        </div>
      </div>

      {/* QUICK METRICS */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium">
            <div className="text-primary bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
              <Users size={16} />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Vendors</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{metrics.totalVendors}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium">
            <div className="text-amber-500 bg-amber-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
              <Activity size={16} />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active RFQs</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{metrics.activeRfqs}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium">
            <div className="text-emerald-500 bg-emerald-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
              <CheckSquare size={16} />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Purchase Orders</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{metrics.purchaseOrdersCount}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium">
            <div className="text-purple-500 bg-purple-500/10 w-8 h-8 rounded-full flex items-center justify-center mb-3">
              <BarChart4 size={16} />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Core Spend</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1 truncate">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(metrics.totalSpend)}
            </h3>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-accent dark:text-white">System Identities</h2>
            <p className="text-[10px] text-gray-500">Manage internal roles and access credentials.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold shadow-premium flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            Create Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/20">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Role Privileges</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">Loading identities...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-500">{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-accent dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        u.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary border border-primary/20' :
                        u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setName(u.name);
                            setEmail(u.email);
                            setRole(u.role);
                            setPassword('');
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-base font-extrabold text-accent dark:text-white mb-4">
              {editingUserId ? 'Edit System Identity' : 'Provision New Identity'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled={editingUserId !== null && role === 'SUPER_ADMIN'}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  disabled={editingUserId !== null && role === 'SUPER_ADMIN'}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent dark:text-white disabled:opacity-50"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                  <option value="MANAGER">Manager</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin (Root)</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  {editingUserId ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent dark:text-white"
                  placeholder={editingUserId ? 'Leave blank to keep unchanged' : 'Strong password'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors shadow-premium"
                >
                  {editingUserId ? 'Update Identity' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
