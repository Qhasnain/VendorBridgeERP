import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, X, ShieldAlert, FileText, User, IndianRupee, MessageSquare, AlertCircle } from 'lucide-react';

export const Approvals: React.FC = () => {
  const { apiFetch } = useAuth();
  
  const [pendingRfqs, setPendingRfqs] = useState<any[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/rfqs?status=UNDER_REVIEW');
      setPendingRfqs(data);
      if (data.length > 0) {
        handleSelectRfq(data[0].id);
      } else {
        setSelectedRfq(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRfq = async (id: number) => {
    try {
      const data = await apiFetch(`/api/rfqs/${id}`);
      setSelectedRfq(data);
      
      // Default to select first quote if available
      if (data.quotations && data.quotations.length > 0) {
        setSelectedQuoteId(String(data.quotations[0].id));
      } else {
        setSelectedQuoteId('');
      }
      setRemarks('');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleProcessApproval = async (status: 'APPROVED' | 'REJECTED') => {
    if (!remarks.trim()) {
      alert('Mandatory Remarks are required to process approvals.');
      return;
    }
    if (status === 'APPROVED' && !selectedQuoteId) {
      alert('Please accept a specific vendor quotation to approve this RFQ.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/approvals/process', {
        method: 'POST',
        body: JSON.stringify({
          rfqId: selectedRfq.id,
          status,
          remarks,
          acceptedQuoteId: status === 'APPROVED' ? selectedQuoteId : undefined,
        }),
      });

      alert(`RFQ ${selectedRfq.rfqNumber} has been ${status === 'APPROVED' ? 'Approved' : 'Rejected'}.`);
      fetchPending();
    } catch (err: any) {
      alert(err.message || 'Workflow process failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Checking pending approvals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Manager Approval Center</h1>
        <p className="text-sm text-gray-500 mt-1">Review pending RFQs, approve budgets, and authorize purchase orders.</p>
      </div>

      {pendingRfqs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-12 text-center text-gray-400">
          <ShieldAlert className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-xs font-semibold">Approval queue is empty. Excellent work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* RFQ QUEUE LIST */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium h-fit space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white px-2">Pending Queue ({pendingRfqs.length})</h3>
            <div className="space-y-2">
              {pendingRfqs.map(rfq => {
                const isSelected = selectedRfq && selectedRfq.id === rfq.id;
                return (
                  <button
                    key={rfq.id}
                    onClick={() => handleSelectRfq(rfq.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/5 shadow-premium'
                        : 'border-gray-100 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <p className="font-extrabold text-primary">{rfq.rfqNumber}</p>
                    <p className="font-bold text-gray-700 dark:text-gray-350 mt-1">{rfq.title}</p>
                    <div className="flex justify-between items-center mt-2.5 text-[10px] text-gray-400 font-semibold">
                      <span>Budget: {rfq.budget.toLocaleString()} INR</span>
                      <span>{new Date(rfq.deadline).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE RFQ EVALUATION */}
          {selectedRfq && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-premium space-y-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Evaluating Request</span>
                <h2 className="text-base font-black mt-1 text-accent dark:text-white">
                  {selectedRfq.rfqNumber}: {selectedRfq.title}
                </h2>
                <p className="text-xs text-gray-500 mt-2">{selectedRfq.description}</p>
              </div>

              {/* Items Summary */}
              <div className="p-4 bg-gray-50 dark:bg-slate-850 rounded-2xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Tender Requirements</span>
                <ul className="text-xs space-y-2 divide-y divide-gray-150 dark:divide-slate-800">
                  {JSON.parse(selectedRfq.productDetails || '[]').map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-center pt-2 first:pt-0 font-semibold text-gray-700 dark:text-gray-300">
                      <span>{item.name}</span>
                      <span>{item.quantity} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* QUOTATIONS RADIO SELECTOR */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white block">Select Winning Supplier Bids</span>
                
                {selectedRfq.quotations && selectedRfq.quotations.length === 0 ? (
                  <div className="p-4 bg-amber-500/5 text-amber-500 border border-amber-500/10 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} />
                    No quotations submitted yet. Approval cannot proceed without quotes.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRfq.quotations?.map((quote: any) => {
                      const isChecked = selectedQuoteId === String(quote.id);
                      const totalVal = quote.price + quote.taxes;
                      return (
                        <label
                          key={quote.id}
                          className={`flex items-start gap-3.5 p-4 border rounded-2xl cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-primary bg-primary/5 dark:bg-primary/5'
                              : 'border-gray-100 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="quote-select"
                            value={quote.id}
                            checked={isChecked}
                            onChange={() => setSelectedQuoteId(String(quote.id))}
                            className="mt-1 rounded-full text-primary focus:ring-primary w-4 h-4"
                          />
                          <div className="flex-1 text-xs">
                            <div className="flex justify-between font-bold text-accent dark:text-white">
                              <span>{quote.vendor?.companyName}</span>
                              <span className="text-primary">{totalVal.toLocaleString()} INR</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Delivery: {quote.deliveryTimeline} days | Rating: {quote.vendor?.rating} ★</p>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">"{quote.notes || 'No notes provided.'}"</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* REMARKS INPUT */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-accent dark:text-white">Manager Remarks (Mandatory)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide brief justifications for approving/rejecting this tender package..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-850 px-4 py-3 rounded-xl text-xs outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-primary text-gray-700 dark:text-white"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-6 border-t border-gray-150 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => handleProcessApproval('REJECTED')}
                  disabled={submitting || selectedRfq.quotations?.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl text-xs font-bold transition-colors"
                >
                  <X size={16} />
                  Reject Tender
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessApproval('APPROVED')}
                  disabled={submitting || selectedRfq.quotations?.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-accent rounded-xl text-xs font-bold transition-all shadow-premium"
                >
                  <Check size={16} />
                  Approve & Accept Bid
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
