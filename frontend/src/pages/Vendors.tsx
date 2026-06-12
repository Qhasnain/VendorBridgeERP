import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, Search, Plus, UserPlus, Phone, MapPin, Check, X, ShieldCheck } from 'lucide-react';

export const Vendors: React.FC = () => {
  const { apiFetch, isAdmin } = useAuth();
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchVendors = async () => {
    try {
      let url = `/api/vendors?search=${encodeURIComponent(search)}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const data = await apiFetch(url);
      setVendors(data);
    } catch (e) {
      console.error('Failed to load vendors', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, statusFilter]);

  const handleCreateVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const newVendor = await apiFetch('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          category,
          gstNumber,
          panNumber,
          contactPerson,
          email,
          phone,
          address,
        }),
      });

      setVendors(prev => [newVendor, ...prev]);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await apiFetch(`/api/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setVendors(prev => prev.map(v => (v.id === id ? updated : v)));
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setCategory('');
    setGstNumber('');
    setPanNumber('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} fill={i < Math.floor(rating) ? 'currentColor' : 'none'} className={i < Math.floor(rating) ? 'text-amber-400' : 'text-gray-300 dark:text-slate-700'} />
        ))}
        <span className="text-[10px] text-gray-500 font-bold ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Vendor Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global vendors, review GST profiles, and track performance scores.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-dark text-accent px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-premium flex items-center gap-2 self-start sm:self-center"
        >
          <Plus size={16} />
          Register Vendor
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by company name, contact, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-850 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:bg-white dark:focus:bg-slate-900 text-gray-700 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-slate-850 px-4 py-2 rounded-xl text-xs outline-none border border-transparent text-gray-700 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved Partner</option>
          <option value="REJECTED">Decommissioned</option>
        </select>
      </div>

      {/* VENDORS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/10">
                <th className="px-6 py-4">Vendor ID</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">GST/PAN Number</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 font-medium">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading vendor registry...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No vendors matching search parameters.
                  </td>
                </tr>
              ) : (
                vendors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-primary">{v.vendorId}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-accent dark:text-white">{v.companyName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{v.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-600 dark:text-gray-400">{v.gstNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">PAN: {v.panNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{v.category}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{v.contactPerson}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{v.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderStars(v.rating)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        v.status === 'APPROVED' ? 'bg-success/10 text-success' :
                        v.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right space-x-1.5">
                        {v.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(v.id, 'APPROVED')}
                              className="p-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                              title="Approve Partner"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(v.id, 'REJECTED')}
                              className="p-1 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                              title="Reject Registration"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD VENDOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h2 className="text-base font-extrabold text-accent dark:text-white mb-1.5">Register Vendor Profile</h2>
            <p className="text-xs text-gray-500 mb-6">Manually register a verified supplier. Profile is set to APPROVED immediately.</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-xs rounded-lg font-semibold border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateVendorSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Zenith Tech Systems"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="IT Hardware, cloud"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">GST Number</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g. 29AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">PAN Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. AAAAA1111A"
                    value={panNumber}
                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Elena Rostova"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="elena@zenith.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 87654 32109"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Office Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Hinjewadi Tech Park, Pune"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-accent rounded-xl text-xs font-bold transition-all shadow-premium"
                >
                  {submitting ? 'Registering...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
