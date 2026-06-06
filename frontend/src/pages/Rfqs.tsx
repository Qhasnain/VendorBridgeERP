import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  IndianRupee,
  Briefcase,
  Layers,
  ArrowRight,
  ClipboardList,
  User,
  Clock,
  Check,
  Send,
  PlusCircle,
  Trash2
} from 'lucide-react';

export const Rfqs: React.FC = () => {
  const { apiFetch, user, isOfficer, isVendor, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Page mode: 'LIST' | 'CREATE' | 'DETAIL'
  const [mode, setMode] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedRfq, setSelectedRfq] = useState<any>(null);

  // RFQ Creation Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [items, setItems] = useState<Array<{ name: string; quantity: number; unit: string }>>([
    { name: '', quantity: 1, unit: 'Units' },
  ]);
  const [assignedVendorIds, setAssignedVendorIds] = useState<number[]>([]);

  // Vendor Bid Form States
  const [price, setPrice] = useState('');
  const [taxes, setTaxes] = useState('');
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);

  // Status transitions loadings
  const [transitioning, setTransitioning] = useState(false);

  // Check URL queries
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const searchVal = query.get('search');
    const actionVal = query.get('action');
    if (searchVal) setSearch(searchVal);
    if (actionVal === 'new' && isOfficer) {
      setMode('CREATE');
    }
  }, [location.search]);

  const fetchRfqs = async () => {
    try {
      const data = await apiFetch(`/api/rfqs?search=${encodeURIComponent(search)}`);
      setRfqs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await apiFetch('/api/vendors?status=APPROVED');
      setVendors(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRfqs();
    if (isOfficer) {
      fetchVendors();
    }
  }, [search]);

  const handleCreateRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filteredItems = items.filter(item => item.name.trim() !== '');
      if (filteredItems.length === 0) {
        alert('Please add at least one line-item.');
        setLoading(false);
        return;
      }

      await apiFetch('/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          budget,
          deadline,
          productDetails: filteredItems,
          assignedVendorIds,
        }),
      });

      setMode('LIST');
      fetchRfqs();
      resetCreateForm();
    } catch (err: any) {
      alert(err.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setBudget('');
    setDeadline('');
    setItems([{ name: '', quantity: 1, unit: 'Units' }]);
    setAssignedVendorIds([]);
  };

  const handleViewDetail = async (id: number) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/rfqs/${id}`);
      setSelectedRfq(data);
      setMode('DETAIL');
      // Reset quote success alerts
      setQuoteSuccess(null);
      // If vendor, reset quote bid forms
      setPrice('');
      setTaxes('');
      setDeliveryTimeline('');
      setNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Submit quotation (Vendor view)
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitting(true);
    setQuoteSuccess(null);

    try {
      await apiFetch('/api/quotations', {
        method: 'POST',
        body: JSON.stringify({
          rfqId: selectedRfq.id,
          price,
          taxes,
          deliveryTimeline,
          notes,
        }),
      });

      setQuoteSuccess('Your bid quotation has been successfully uploaded.');
      // Refresh details
      const refreshed = await apiFetch(`/api/rfqs/${selectedRfq.id}`);
      setSelectedRfq(refreshed);
    } catch (err: any) {
      alert(err.message || 'Quotation upload failed');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Status transitions
  const triggerReview = async () => {
    setTransitioning(true);
    try {
      await apiFetch('/api/approvals/review', {
        method: 'POST',
        body: JSON.stringify({ rfqId: selectedRfq.id }),
      });
      // Refresh detail
      const refreshed = await apiFetch(`/api/rfqs/${selectedRfq.id}`);
      setSelectedRfq(refreshed);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  const generatePoDirectly = async () => {
    setTransitioning(true);
    try {
      const newPo = await apiFetch('/api/pos', {
        method: 'POST',
        body: JSON.stringify({ rfqId: selectedRfq.id }),
      });
      alert(`Purchase Order ${newPo.poNumber} has been successfully generated.`);
      navigate(`/pos?id=${newPo.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  // Dynamic items form functions
  const addItemRow = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'Units' }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (idx: number, field: string, val: any) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setItems(updated);
  };

  const toggleVendorAssignment = (id: number) => {
    if (assignedVendorIds.includes(id)) {
      setAssignedVendorIds(assignedVendorIds.filter(vId => vId !== id));
    } else {
      setAssignedVendorIds([...assignedVendorIds, id]);
    }
  };

  // Visual workflow stages matching Odoo
  const WORKFLOW_STATES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PO_GENERATED', 'INVOICE_GENERATED'];

  const getWorkflowStepIndex = (status: string) => {
    return WORKFLOW_STATES.indexOf(status);
  };

  const renderWorkflowTracker = (status: string) => {
    const currentIndex = getWorkflowStepIndex(status);
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 px-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl max-w-full">
        {WORKFLOW_STATES.map((state, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          return (
            <React.Fragment key={state}>
              {idx > 0 && <span className={`w-6 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-800'}`} />}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive ? 'bg-primary text-accent border border-primary' :
                  isCompleted ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-gray-100 text-gray-400 dark:bg-slate-850 dark:text-slate-600'
                }`}>
                  {isCompleted ? <Check size={10} /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold tracking-wider uppercase ${
                  isActive ? 'text-primary' :
                  isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-slate-600'
                }`}>
                  {state.replace('_', ' ')}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ========================================================
          RFQ LIST VIEW
          ======================================================== */}
      {mode === 'LIST' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">RFQs & Tenders</h1>
              <p className="text-sm text-gray-500 mt-1">Submit tender packages, negotiate quotations, and track contract status.</p>
            </div>
            {isOfficer && (
              <button
                onClick={() => setMode('CREATE')}
                className="bg-primary hover:bg-primary-dark text-accent px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-premium flex items-center gap-2 self-start sm:self-center"
              >
                <Plus size={16} />
                New Tender Call
              </button>
            )}
          </div>

          {/* SEARCH BAR */}
          <div className="flex items-center gap-2 relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-premium">
            <Search className="absolute left-7 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search RFQs by RFQ number, title, keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-850 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:bg-white dark:focus:bg-slate-900 text-gray-700 dark:text-white"
            />
          </div>

          {/* RFQ TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/10">
                    <th className="px-6 py-4">RFQ Number</th>
                    <th className="px-6 py-4">Tender Title</th>
                    <th className="px-6 py-4">Est. Budget</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Assigned Vendors</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-500 font-medium">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Syncing tender schedules...
                      </td>
                    </tr>
                  ) : rfqs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No active procurement tenders found.
                      </td>
                    </tr>
                  ) : (
                    rfqs.map(rfq => (
                      <tr key={rfq.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-primary">{rfq.rfqNumber}</td>
                        <td className="px-6 py-4 font-bold text-accent dark:text-white">{rfq.title}</td>
                        <td className="px-6 py-4 font-semibold">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rfq.budget)}
                        </td>
                        <td className="px-6 py-4 font-medium">{new Date(rfq.deadline).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/55">
                            {rfq.assignedVendors?.length || 0} suppliers
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            rfq.status === 'APPROVED' || rfq.status === 'PO_GENERATED' || rfq.status === 'INVOICE_GENERATED' ? 'bg-success/10 text-success' :
                            rfq.status === 'DRAFT' ? 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {rfq.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewDetail(rfq.id)}
                            className="text-primary hover:text-primary-dark font-extrabold flex items-center gap-1 justify-end ml-auto"
                          >
                            Explore details
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RFQ CREATE FORM VIEW
          ======================================================== */}
      {mode === 'CREATE' && (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-premium space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-accent dark:text-white">Draft Tender / RFQ Call</h2>
            <p className="text-xs text-gray-500 mt-0.5">Specify budget requirements, item descriptions, and vendor invite targets.</p>
          </div>

          <form onSubmit={handleCreateRfqSubmit} className="space-y-6">
            {/* Title & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">RFQ Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Developer Workstation Upgrades"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 pl-11 pr-4 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Estimated Budget (INR)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 pl-11 pr-4 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Description & Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tender Specifications & Scope</label>
                <textarea
                  placeholder="Provide detailed instructions or delivery terms here..."
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-4 py-3 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Submission Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-850 pl-11 pr-4 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* LINE-ITEMS MANAGER */}
            <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800 rounded-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">Required Products & Services</h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <PlusCircle size={14} />
                  Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="e.g. Developer Laptops (i7, 16GB RAM)"
                        value={item.name}
                        onChange={e => handleItemFieldChange(idx, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-slate-750 outline-none text-gray-700 dark:text-white focus:border-primary"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        placeholder="Quantity"
                        value={item.quantity}
                        onChange={e => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs border border-gray-200 dark:border-slate-750 outline-none text-gray-700 dark:text-white focus:border-primary"
                      />
                    </div>
                    <div>
                      <select
                        value={item.unit}
                        onChange={e => handleItemFieldChange(idx, 'unit', e.target.value)}
                        className="w-full bg-white dark:bg-slate-850 px-3 py-2 rounded-xl text-xs border border-gray-200 dark:border-slate-750 outline-none text-gray-700 dark:text-white focus:border-primary"
                      >
                        <option value="Units">Units</option>
                        <option value="Hours">Hours</option>
                        <option value="Kg">Kg</option>
                        <option value="Lot">Lot</option>
                        <option value="Packets">Packets</option>
                      </select>
                    </div>
                    <div className="text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VENDOR ASSIGNMENTS */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Assign Vendor Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {vendors.map(v => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer select-none transition-all ${
                      assignedVendorIds.includes(v.id)
                        ? 'border-primary bg-primary/5 dark:bg-primary/5'
                        : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={assignedVendorIds.includes(v.id)}
                      onChange={() => toggleVendorAssignment(v.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{v.companyName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{v.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setMode('LIST')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-250 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-accent rounded-xl text-xs font-bold transition-all shadow-premium"
              >
                {loading ? 'Submitting...' : 'Save Draft RFQ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          RFQ DETAIL VIEW
          ======================================================== */}
      {mode === 'DETAIL' && selectedRfq && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button onClick={() => setMode('LIST')} className="text-xs text-primary font-semibold hover:underline">
                &larr; Back to Tenders
              </button>
              <h2 className="text-lg font-black mt-1.5 text-accent dark:text-white">
                RFQ Code: {selectedRfq.rfqNumber}
              </h2>
            </div>
            
            <div className="flex gap-2">
              {/* Draft -> Submit for Manager Review */}
              {isOfficer && selectedRfq.status === 'DRAFT' && (
                <button
                  onClick={triggerReview}
                  disabled={transitioning}
                  className="bg-primary hover:bg-primary-dark text-accent px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-premium flex items-center gap-1.5"
                >
                  <Send size={14} />
                  Submit for Approval
                </button>
              )}

              {/* Compare Button */}
              {!isVendor && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(selectedRfq.status) && (
                <button
                  onClick={() => navigate(`/comparison?rfqId=${selectedRfq.id}`)}
                  className="bg-accent dark:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-premium"
                >
                  Compare Quotations
                </button>
              )}

              {/* Generate PO */}
              {isOfficer && selectedRfq.status === 'APPROVED' && (
                <button
                  onClick={generatePoDirectly}
                  disabled={transitioning}
                  className="bg-success text-white hover:bg-success/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-premium"
                >
                  Generate Purchase Order
                </button>
              )}
            </div>
          </div>

          {/* WORKFLOW TRACKER */}
          {renderWorkflowTracker(selectedRfq.status)}

          {/* CONTENT COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Specs Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-premium space-y-6">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-accent dark:text-white">{selectedRfq.title}</h3>
                <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{selectedRfq.description || 'No descriptive context.'}</p>
              </div>

              {/* LINE ITEMS DETAIL TABLE */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">Technical Specifications</h4>
                <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold bg-gray-50/50 dark:bg-slate-800/20">
                        <th className="px-4 py-2.5">Required Product / Service</th>
                        <th className="px-4 py-2.5 text-right">Quantity</th>
                        <th className="px-4 py-2.5">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                      {JSON.parse(selectedRfq.productDetails || '[]').map((item: any, i: number) => (
                        <tr key={i} className="text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3.5 font-semibold">{item.name}</td>
                          <td className="px-4 py-3.5 text-right font-bold">{item.quantity}</td>
                          <td className="px-4 py-3.5">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TIMELINE AUDIT HISTORY */}
              {selectedRfq.approvals && selectedRfq.approvals.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Approval History Timeline</h4>
                  <div className="space-y-3">
                    {selectedRfq.approvals.map((app: any) => (
                      <div key={app.id} className="p-3 bg-gray-50 dark:bg-slate-850 rounded-xl border border-gray-100 dark:border-slate-800/40 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className={app.status === 'APPROVED' ? 'text-success' : 'text-danger'}>
                            {app.status}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(app.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1.5"><strong className="text-accent dark:text-white">Reviewer:</strong> {app.approver?.name}</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-1"><strong className="text-accent dark:text-white">Remarks:</strong> "{app.remarks}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Side Column: Budget, Deadlines, Vendor actions */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-premium space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Tender Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium">Budget Cap</span>
                    <p className="font-bold text-accent dark:text-white mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(selectedRfq.budget)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Author</span>
                    <p className="font-bold text-accent dark:text-white mt-0.5 truncate">{selectedRfq.createdBy?.name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-medium">Deadline Clock</span>
                    <p className="font-bold text-accent dark:text-white mt-0.5">
                      {new Date(selectedRfq.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* VENDOR BIDDING MODULE */}
              {isVendor && selectedRfq.status === 'SUBMITTED' && (
                <div className="bg-white dark:bg-slate-900 border border-primary/20 dark:border-primary/10 rounded-2xl p-6 shadow-premium space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">Submit Quotation Bids</h3>
                  
                  {quoteSuccess && (
                    <div className="p-3 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-xl">
                      {quoteSuccess}
                    </div>
                  )}

                  <form onSubmit={handleQuoteSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Price Offer (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="Base pricing excluding tax"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Taxes (INR)</label>
                      <input
                        type="number"
                        required
                        placeholder="GST, Octroi, Customs"
                        value={taxes}
                        onChange={e => setTaxes(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Delivery Timeline (Days)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 5"
                        value={deliveryTimeline}
                        onChange={e => setDeliveryTimeline(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Special Delivery Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="Warranty, implementation bundles..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent focus:bg-white focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="w-full bg-primary hover:bg-primary-dark text-accent font-bold py-2.5 rounded-xl text-xs transition-all shadow-premium"
                    >
                      {quoteSubmitting ? 'Uploading Bids...' : 'Upload Quotation'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
