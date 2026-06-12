import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Printer,
  Mail,
  CircleDollarSign,
  ArrowRight,
  Bot,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  History,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ProcurementAssistant } from '../components/ProcurementAssistant';

export const Invoices: React.FC = () => {
  const { apiFetch, user, isOfficer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'LIST' | 'DETAIL'>('LIST');

  // AI insights states
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Email sending state
  const [sendingEmail, setSendingEmail] = useState(false);

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);

  const fetchInvoices = async () => {
    try {
      const data = await apiFetch('/api/invoices');
      setInvoices(data);

      const query = new URLSearchParams(location.search);
      const queryId = query.get('id');
      if (queryId) {
        handleViewInvoice(parseInt(queryId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [location.search]);

  const fetchInvoiceInsights = async (id: number) => {
    setInsightsLoading(true);
    try {
      const data = await apiFetch(`/api/ai/invoice-insights/${id}`);
      setInsights(data);
    } catch (e) {
      console.error('Failed to fetch invoice insights:', e);
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleViewInvoice = async (id: number) => {
    setLoading(true);
    try {
      const invoice = await apiFetch(`/api/invoices/${id}`);
      setSelectedInvoice(invoice);
      setMode('DETAIL');
      fetchInvoiceInsights(id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    setSubmitting(true);
    try {
      const updated = await apiFetch(`/api/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
      });
      setSelectedInvoice(prev => ({ ...prev, status: updated.status }));
      alert('Invoice payment cleared successfully. Vendor account credited.');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (sendingEmail) return;
    
    const defaultEmail = selectedInvoice.purchaseOrder?.createdBy?.email || 'officer@vendorbridge.com';
    const recipient = prompt("Enter target email address to send this invoice PDF:", defaultEmail);
    
    if (recipient === null) return; // User cancelled the prompt
    if (!recipient.trim()) {
      alert("Email address cannot be empty.");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await apiFetch(`/api/invoices/${selectedInvoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: recipient.trim() })
      });
      alert(res.message || 'Invoice dispatched successfully via SMTP!');
      
      // Refresh current invoice state to capture the new EmailLog
      const refreshed = await apiFetch(`/api/invoices/${selectedInvoice.id}`);
      setSelectedInvoice(refreshed);
    } catch (err: any) {
      alert(err.message || 'SMTP dispatch failed');
    } finally {
      setSendingEmail(false);
    }
  };

  const parseGstBreakdown = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return { cgst: 0, sgst: 0, igst: 0 };
    }
  };

  if (loading && mode === 'LIST') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">Checking invoices ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 relative">
      
      {/* ========================================================
          INVOICE LIST VIEW
          ======================================================== */}
      {mode === 'LIST' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review vendor bill invoices, compute tax deductions, and authorize payouts.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/20">
                    <th className="px-6 py-4">Invoice Number</th>
                    <th className="px-6 py-4">Purchase Order</th>
                    <th className="px-6 py-4">Vendor Partner</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Tax Value</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-slate-500">
                        No billing invoices recorded.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-primary">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 font-bold text-accent dark:text-white">{inv.purchaseOrder?.poNumber}</td>
                        <td className="px-6 py-4 font-semibold">{inv.purchaseOrder?.vendor?.companyName}</td>
                        <td className="px-6 py-4 font-bold">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inv.totalAmount)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inv.taxAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            inv.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewInvoice(inv.id)}
                            className="text-primary hover:text-primary-dark font-extrabold flex items-center gap-1 justify-end ml-auto"
                          >
                            Open Invoice
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
          INVOICE DETAIL VIEW
          ======================================================== */}
      {mode === 'DETAIL' && selectedInvoice && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <button
              onClick={() => {
                setMode('LIST');
                setInsights(null);
                navigate('/invoices', { replace: true });
              }}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              &larr; Back to Invoices Ledger
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleEmailInvoice}
                disabled={sendingEmail}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Mail size={14} />
                {sendingEmail ? 'Sending...' : 'Send PDF Email'}
              </button>
              
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer size={14} />
                Print Invoice
              </button>

              {/* Pay Invoice Action (Procurement Officer only) */}
              {isOfficer && selectedInvoice.status === 'PENDING' && (
                <button
                  onClick={handlePayInvoice}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-dark text-white dark:text-white px-4 py-2 rounded-xl text-xs font-bold shadow-premium flex items-center gap-1.5 transition-colors"
                >
                  <CircleDollarSign size={14} />
                  Authorize Payout
                </button>
              )}
            </div>
          </div>

          {/* Desktop Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* COLUMN 1 & 2: FORMAL INVOICE PRINT SHEET */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 shadow-premium print-card">
                
                {/* Header branding */}
                <div className="flex justify-between items-start pb-8 border-b border-gray-150 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Supplier Tax Invoice</p>
                    <h1 className="text-lg font-black text-accent dark:text-white">{selectedInvoice.invoiceNumber}</h1>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">PO Ref: {selectedInvoice.purchaseOrder.poNumber}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-extrabold text-white text-lg">V</div>
                      <span className="font-extrabold text-base tracking-wider dark:text-white">VENDORBRIDGE</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Invoice Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Status: <strong className="text-success uppercase">{selectedInvoice.status}</strong></p>
                  </div>
                </div>

                {/* Vendor & Client details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-gray-150 dark:border-slate-800 text-xs">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-[10px]">Supplier Details</h4>
                    <p className="font-bold text-accent dark:text-white">{selectedInvoice.purchaseOrder.vendor.companyName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{selectedInvoice.purchaseOrder.vendor.contactPerson}</p>
                    <p className="text-gray-500 dark:text-gray-400">{selectedInvoice.purchaseOrder.vendor.address}</p>
                    <p className="text-gray-500 dark:text-gray-400">Phone: {selectedInvoice.purchaseOrder.vendor.phone} | Email: {selectedInvoice.purchaseOrder.vendor.email}</p>
                    <p className="text-gray-500 dark:text-gray-400">GSTIN: {selectedInvoice.purchaseOrder.vendor.gstNumber}</p>
                    <p className="text-gray-500 dark:text-gray-400">PAN: {selectedInvoice.purchaseOrder.vendor.panNumber}</p>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <h4 className="font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-[10px] text-right">Billed To</h4>
                    <p className="font-bold text-accent dark:text-white">VendorBridge Corp</p>
                    <p className="text-gray-500 dark:text-gray-400">Financial Disbursements Division</p>
                    <p className="text-gray-500 dark:text-gray-400">100 Enterprise Boulevard, Bangalore</p>
                    <p className="text-gray-500 dark:text-gray-400">GSTIN: 29VENDORBR1234Z</p>
                  </div>
                </div>

                {/* Line items table */}
                <div className="py-8">
                  <h4 className="font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-[10px] mb-4">Billing Scope Items</h4>
                  <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 font-bold bg-gray-50/50 dark:bg-slate-800/20">
                          <th className="px-4 py-2.5">Scope Description</th>
                          <th className="px-4 py-2.5 text-right">Qty</th>
                          <th className="px-4 py-2.5">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-gray-700 dark:text-gray-300">
                        {JSON.parse(selectedInvoice.purchaseOrder.rfq.productDetails || '[]').map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3.5 font-semibold">{item.name}</td>
                            <td className="px-4 py-3.5 text-right font-bold">{item.quantity}</td>
                            <td className="px-4 py-3.5">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* GST Taxes Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 border-t border-gray-150 dark:border-slate-800">
                  <div className="space-y-3">
                    <h4 className="font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 text-[10px]">GST Breakdown (18% Standard)</h4>
                    {(() => {
                      const gst = parseGstBreakdown(selectedInvoice.gstBreakdown);
                      return (
                        <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-100 dark:border-slate-850 text-gray-400 dark:text-slate-500 font-bold bg-gray-50/50 dark:bg-slate-800/20 text-[9px] uppercase tracking-wider">
                                <th className="px-3 py-2">Component</th>
                                <th className="px-3 py-2 text-right">Rate</th>
                                <th className="px-3 py-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-gray-600 dark:text-gray-400">
                              <tr>
                                <td className="px-3 py-2.5 font-semibold">CGST</td>
                                <td className="px-3 py-2.5 text-right font-bold">9%</td>
                                <td className="px-3 py-2.5 text-right">{gst.cgst.toLocaleString()} INR</td>
                              </tr>
                              <tr>
                                <td className="px-3 py-2.5 font-semibold">SGST</td>
                                <td className="px-3 py-2.5 text-right font-bold">9%</td>
                                <td className="px-3 py-2.5 text-right">{gst.sgst.toLocaleString()} INR</td>
                              </tr>
                              <tr>
                                <td className="px-3 py-2.5 font-semibold">IGST</td>
                                <td className="px-3 py-2.5 text-right font-bold">0%</td>
                                <td className="px-3 py-2.5 text-right">{gst.igst.toLocaleString()} INR</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Invoice Grand Totals */}
                  <div className="flex flex-col justify-end items-end">
                    <div className="w-64 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold text-gray-500 dark:text-slate-400">
                        <span>Taxable Base Value:</span>
                        <span>{(selectedInvoice.totalAmount - selectedInvoice.taxAmount).toLocaleString()} INR</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-500 dark:text-slate-400">
                        <span>Total GST Amount:</span>
                        <span>{selectedInvoice.taxAmount.toLocaleString()} INR</span>
                      </div>
                      <div className="flex justify-between font-extrabold border-t border-gray-150 dark:border-slate-800 pt-2 text-primary text-sm">
                        <span>Grand Total Billed:</span>
                        <span>{selectedInvoice.totalAmount.toLocaleString()} INR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Footer */}
                <div className="mt-12 pt-6 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 dark:text-slate-500 text-center">
                  Thank you for partnering with VendorBridge Corp.
                </div>
              </div>
            </div>

            {/* COLUMN 3: AI INSIGHTS & EMAIL HISTORY LOGS */}
            <div className="space-y-6 no-print">
              
              {/* AI INSIGHTS CARD */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">AI Summary & Audit</h3>
                    <p className="text-[10px] text-gray-450 dark:text-slate-400">Procurement Reasoning Engine</p>
                  </div>
                </div>

                {insightsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Auditing invoice details...</span>
                  </div>
                ) : insights ? (
                  <div className="space-y-4 text-xs">
                    
                    {/* Cost Analysis Status */}
                    <div className={`p-3 rounded-2xl border ${
                      insights.costAnalysis.status === 'FLAGGED'
                        ? 'bg-red-500/5 dark:bg-red-500/10 border-red-200/50 dark:border-red-900/50 text-red-700 dark:text-red-400'
                        : insights.costAnalysis.status === 'WARNING'
                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      <div className="flex items-start gap-2">
                        {insights.costAnalysis.status === 'FLAGGED' ? (
                          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        ) : insights.costAnalysis.status === 'WARNING' ? (
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-[11px] uppercase tracking-wide">
                            Cost Status: {insights.costAnalysis.status}
                          </p>
                          <p className="text-[10px] mt-1 leading-relaxed opacity-90">
                            {insights.costAnalysis.details}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Duplicate alerts */}
                    {insights.duplicates && insights.duplicates.length > 0 && (
                      <div className="p-3 rounded-2xl bg-red-500/5 dark:bg-red-900/10 border border-red-250/50 dark:border-red-900/50 text-red-800 dark:text-red-450">
                        <div className="flex gap-2">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                          <div>
                            <p className="font-extrabold text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">Duplicate Billing Warning</p>
                            {insights.duplicates.map((dup: any, i: number) => (
                              <p key={i} className="text-[10px] mt-1 opacity-90">
                                Overlaps with <strong className="font-semibold">{dup.invoiceNumber}</strong>: {dup.reason}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Spend Insights List */}
                    {insights.insights && insights.insights.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-[10px] text-gray-400 dark:text-slate-550 uppercase tracking-widest">Spending Trend</h4>
                        <ul className="space-y-1 list-disc pl-4 text-slate-700 dark:text-slate-300 text-[10px]">
                          {insights.insights.map((insight: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Supplier Intelligence suggestions */}
                    {insights.vendorIntelligence && insights.vendorIntelligence.length > 0 && (
                      <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                        <h4 className="font-bold text-[10px] text-gray-400 dark:text-slate-550 uppercase tracking-widest">AI Vendor Intelligence</h4>
                        <div className="space-y-2">
                          {insights.vendorIntelligence.map((vendor: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-900 dark:text-white text-[10px]">{vendor.companyName}</span>
                                <span className="text-secondary font-extrabold text-[10px]">★ {vendor.rating.toFixed(1)}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-gray-450 leading-normal">{vendor.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center py-4">No insights could be computed for this invoice.</p>
                )}
              </div>

              {/* EMAIL DISPATCH AUDIT LOG CARD */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Email Dispatch Logs</h3>
                    <p className="text-[10px] text-gray-450 dark:text-slate-400">SMTP Server Audit Trail</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {!selectedInvoice.emails || selectedInvoice.emails.length === 0 ? (
                    <div className="py-6 text-center text-[10px] text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center gap-1">
                      <Clock size={16} className="text-slate-350 dark:text-slate-600" />
                      <span>No email dispatches logged.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedInvoice.emails.map((log: any) => (
                        <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-850 dark:text-slate-300 truncate w-32" title={log.to}>
                              To: {log.to}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${
                              log.status === 'SENT' ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                          
                          <div className="text-[9px] text-gray-400 dark:text-slate-500 flex justify-between">
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                            <span>Attempts: {log.attempts}</span>
                          </div>

                          {log.body && (
                            <div className="text-[9px] text-gray-500 dark:text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 break-words">
                              {(() => {
                                const urlRegex = /(https?:\/\/[^\s]+)/g;
                                const match = log.body.match(urlRegex);
                                if (match) {
                                  const url = match[0];
                                  return (
                                    <span>
                                      Live Preview:{' '}
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-semibold"
                                      >
                                        Click to View Online &rarr;
                                      </a>
                                    </span>
                                  );
                                }
                                return <span>{log.body}</span>;
                              })()}
                            </div>
                          )}

                          {log.error && (
                            <p className="text-[9px] text-red-500 dark:text-red-400 font-medium pt-1 border-t border-slate-100 dark:border-slate-800 break-words">
                              Err: {log.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 text-[9px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <ExternalLink size={11} className="shrink-0" />
                    <span>Fallbacks write mock emails directly to <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-750">backend/mail_logs/</code></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Trigger */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-45 bg-primary hover:bg-primary-dark text-white px-5 py-3.5 rounded-full shadow-premium hover:shadow-2xl flex items-center gap-2 font-bold text-xs transition-all hover:-translate-y-0.5 no-print"
      >
        <Bot size={18} className="animate-pulse" />
        <span>Ask AI Assistant</span>
      </button>

      {/* Slide-out Panel */}
      <ProcurementAssistant isOpen={chatOpen} onClose={() => setChatOpen(false)} />

    </div>
  );
};
