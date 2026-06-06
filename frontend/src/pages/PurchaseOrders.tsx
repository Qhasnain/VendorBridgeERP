import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Printer, Mail, Check, AlertCircle, ArrowRight, Building, FileText, Calendar } from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { apiFetch, user, isVendor, isOfficer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [pos, setPos] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'LIST' | 'DETAIL'>('LIST');

  const fetchPos = async () => {
    try {
      const data = await apiFetch('/api/pos');
      setPos(data);

      // Check URL query parameters for target PO ID
      const query = new URLSearchParams(location.search);
      const queryId = query.get('id');
      if (queryId) {
        handleViewPo(parseInt(queryId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPos();
  }, [location.search]);

  const handleViewPo = async (id: number) => {
    setLoading(true);
    try {
      const po = await apiFetch(`/api/pos/${id}`);
      setSelectedPo(po);
      setMode('DETAIL');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPo = async () => {
    setSubmitting(true);
    try {
      const updated = await apiFetch(`/api/pos/${selectedPo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      setSelectedPo(prev => ({ ...prev, status: updated.status }));
      alert('Purchase Order successfully accepted.');
      fetchPos();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailPo = () => {
    alert(`[EMAIL AUTOMATION] Purchase Order ${selectedPo.poNumber} PDF has been sent to ${selectedPo.vendor.email}`);
  };

  const triggerGenerateInvoice = async () => {
    setSubmitting(true);
    try {
      const invoice = await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ purchaseOrderId: selectedPo.id }),
      });
      alert(`Invoice ${invoice.invoiceNumber} has been generated successfully.`);
      navigate(`/invoices?id=${invoice.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && mode === 'LIST') {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Checking purchase orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* ========================================================
          PO LIST VIEW
          ======================================================== */}
      {mode === 'LIST' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Track active vendor orders, review supply values, and manage billing states.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/10">
                    <th className="px-6 py-4">PO Number</th>
                    <th className="px-6 py-4">Associated RFQ</th>
                    <th className="px-6 py-4">Vendor Partner</th>
                    <th className="px-6 py-4">Order Value</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {pos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        No purchase orders found.
                      </td>
                    </tr>
                  ) : (
                    pos.map(po => (
                      <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-primary">{po.poNumber}</td>
                        <td className="px-6 py-4 font-bold text-accent dark:text-white">{po.rfq?.rfqNumber}</td>
                        <td className="px-6 py-4 font-semibold">{po.vendor?.companyName}</td>
                        <td className="px-6 py-4 font-bold">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(po.totalAmount)}
                        </td>
                        <td className="px-6 py-4 font-medium">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            po.status === 'ACCEPTED' || po.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                            po.status === 'SENT' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewPo(po.id)}
                            className="text-primary hover:text-primary-dark font-extrabold flex items-center gap-1 justify-end ml-auto"
                          >
                            Open Document
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
          PO DETAIL (DOCK FORMAT) VIEW
          ======================================================== */}
      {mode === 'DETAIL' && selectedPo && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
            <button onClick={() => { setMode('LIST'); navigate('/pos', { replace: true }); }} className="text-xs text-primary font-semibold hover:underline">
              &larr; Back to List
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleEmailPo}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Mail size={14} />
                Send Email
              </button>
              
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer size={14} />
                Print Layout
              </button>

              {/* Vendor Accept Order */}
              {isVendor && selectedPo.status === 'SENT' && (
                <button
                  onClick={handleAcceptPo}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-dark text-accent px-4 py-2 rounded-xl text-xs font-bold shadow-premium flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Accept Order Contract
                </button>
              )}

              {/* Officer Generate Invoice */}
              {isOfficer && selectedPo.status === 'ACCEPTED' && (
                <button
                  onClick={triggerGenerateInvoice}
                  disabled={submitting}
                  className="bg-success text-white hover:bg-success/90 px-4 py-2 rounded-xl text-xs font-bold shadow-premium flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  Generate Invoice
                </button>
              )}
            </div>
          </div>

          {/* FORMAL DOCUMENT PRINT SHEET */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 max-w-4xl mx-auto shadow- premium print-card">
            
            {/* Header branding */}
            <div className="flex justify-between items-start pb-8 border-b border-gray-150 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-extrabold text-accent text-lg">V</div>
                  <span className="font-extrabold text-base tracking-wider dark:text-white">VENDORBRIDGE CORP</span>
                </div>
                <p className="text-[10px] text-gray-400">100 Enterprise Boulevard, Tech Space, Bangalore</p>
                <p className="text-[10px] text-gray-400">GSTIN: 29VENDORBR1234Z</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] font-extrabold tracking-widest text-primary uppercase block">Purchase Order</span>
                <h1 className="text-lg font-black text-accent dark:text-white">{selectedPo.poNumber}</h1>
                <p className="text-[10px] text-gray-400">Date: {new Date(selectedPo.createdAt).toLocaleDateString()}</p>
                <p className="text-[10px] text-gray-400">Status: <strong className="text-primary uppercase">{selectedPo.status}</strong></p>
              </div>
            </div>

            {/* Vendor & Client details */}
            <div className="grid grid-cols-2 gap-8 py-8 border-b border-gray-150 dark:border-slate-800 text-xs">
              <div className="space-y-1.5">
                <h4 className="font-extrabold uppercase tracking-wider text-gray-400 text-[10px]">Vendor Partner</h4>
                <p className="font-bold text-accent dark:text-white">{selectedPo.vendor.companyName}</p>
                <p className="text-gray-500 dark:text-gray-400">{selectedPo.vendor.contactPerson}</p>
                <p className="text-gray-500 dark:text-gray-400">{selectedPo.vendor.address}</p>
                <p className="text-gray-500 dark:text-gray-400">Phone: {selectedPo.vendor.phone} | Email: {selectedPo.vendor.email}</p>
                <p className="text-gray-500 dark:text-gray-400">GSTIN: {selectedPo.vendor.gstNumber}</p>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold uppercase tracking-wider text-gray-400 text-[10px]">Ship / Bill To</h4>
                <p className="font-bold text-accent dark:text-white">VendorBridge Headquarters</p>
                <p className="text-gray-500 dark:text-gray-400">Procurement Logistics Division</p>
                <p className="text-gray-500 dark:text-gray-400">Phase 2, IT Hub, Bangalore, Karnataka, 560001</p>
                <p className="text-gray-500 dark:text-gray-400">Authorized Officer: {selectedPo.createdBy?.name}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="py-8">
              <h4 className="font-extrabold uppercase tracking-wider text-gray-400 text-[10px] mb-4">Required Products Specifications</h4>
              <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold bg-gray-50/50 dark:bg-slate-800/20">
                      <th className="px-4 py-2.5">Scope Description</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-gray-700 dark:text-gray-300">
                    {JSON.parse(selectedPo.rfq.productDetails || '[]').map((item: any, idx: number) => (
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

            {/* Totals panel */}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-slate-800">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-gray-500">
                  <span>Net Price Offer:</span>
                  <span>{(selectedPo.totalAmount - selectedPo.tax).toLocaleString()} INR</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-500">
                  <span>Taxes (GST):</span>
                  <span>{selectedPo.tax.toLocaleString()} INR</span>
                </div>
                <div className="flex justify-between font-extrabold border-t border-gray-150 dark:border-slate-850 pt-2 text-primary text-sm">
                  <span>Grand Total:</span>
                  <span>{selectedPo.totalAmount.toLocaleString()} INR</span>
                </div>
              </div>
            </div>

            {/* Delivery Terms Footer */}
            <div className="mt-12 pt-6 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 space-y-1">
              <p className="font-bold uppercase tracking-wider text-accent dark:text-white">Standard Delivery Instructions:</p>
              <p>1. Supply goods must align perfectly with the technical parameters defined above.</p>
              <p>2. Invoices must be uploaded immediately within the VendorBridge portal upon dispatch.</p>
              <p>3. Payments are subject to inspection approval post receipt of shipments.</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
