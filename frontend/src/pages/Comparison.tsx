import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Brain, Star, ArrowRight, CheckCircle, IndianRupee, ShieldCheck, Clock } from 'lucide-react';

export const Comparison: React.FC = () => {
  const { apiFetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');
  
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRfqs, setLoadingRfqs] = useState(true);

  // Load RFQs on start
  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        const data = await apiFetch('/api/rfqs');
        // Filter RFQs that are not in DRAFT
        const activeTenders = data.filter((r: any) => r.status !== 'DRAFT');
        setRfqs(activeTenders);

        // Check query params
        const params = new URLSearchParams(location.search);
        const qRfqId = params.get('rfqId');
        if (qRfqId) {
          setSelectedRfqId(qRfqId);
        } else if (activeTenders.length > 0) {
          setSelectedRfqId(String(activeTenders[0].id));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRfqs(false);
      }
    };
    fetchRfqs();
  }, [location.search]);

  // Load comparison matrix when RFQ changes
  useEffect(() => {
    if (!selectedRfqId) return;

    const fetchMatrix = async () => {
      setLoading(true);
      try {
        const matrix = await apiFetch(`/api/quotations/compare/${selectedRfqId}`);
        setComparisonData(matrix);
      } catch (e) {
        console.error(e);
        setComparisonData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();
  }, [selectedRfqId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">AI Quotation Comparison</h1>
          <p className="text-sm text-gray-500 mt-1">Multi-criteria weighted optimization engine suggestions for vendor selection.</p>
        </div>
      </div>

      {/* SELECT RFQ PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-premium flex items-center gap-4">
        <label className="text-xs font-bold uppercase text-gray-400">Select Active RFQ:</label>
        {loadingRfqs ? (
          <span className="text-xs text-gray-400">Loading tenders...</span>
        ) : (
          <select
            value={selectedRfqId}
            onChange={e => {
              setSelectedRfqId(e.target.value);
              // Clean URL query
              navigate('/comparison', { replace: true });
            }}
            className="flex-1 max-w-md bg-gray-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl text-xs outline-none border border-transparent text-gray-700 dark:text-white font-semibold"
          >
            {rfqs.length === 0 ? (
              <option value="">No active RFQs available</option>
            ) : (
              rfqs.map(rfq => (
                <option key={rfq.id} value={rfq.id}>
                  [{rfq.rfqNumber}] {rfq.title}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* COMPARISON RESULTS */}
      {loading ? (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Re-evaluating bidding criteria...</span>
        </div>
      ) : !comparisonData || comparisonData.comparisons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-12 text-center text-gray-400">
          <FileSpreadsheet className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-xs font-semibold">No quotation bids submitted yet for this RFQ.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* AI SCORING OVERVIEW / RECOMMENDATION HERO CARD */}
          {comparisonData.comparisons.find((c: any) => c.isRecommended) && (
            <div className="bg-gradient-to-r from-accent to-slate-900 dark:from-slate-900 dark:to-slate-950 border border-slate-800/80 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Glowing Background Rings */}
              <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black tracking-widest uppercase">
                  <Brain size={12} className="animate-pulse" />
                  AI Smart Recommendation
                </div>
                <h2 className="text-lg font-black tracking-tight mt-2">
                  {comparisonData.comparisons.find((c: any) => c.isRecommended).companyName}
                </h2>
                <p className="text-xs text-gray-300">
                  Best balanced offer score:{' '}
                  <span className="font-extrabold text-primary">
                    {comparisonData.comparisons.find((c: any) => c.isRecommended).scores.total}%
                  </span>{' '}
                  out of 100 based on weighted metrics.
                </p>
              </div>

              <button
                onClick={() => navigate(`/rfqs/${selectedRfqId}`)}
                className="bg-primary hover:bg-primary-dark text-accent text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-all shadow-premium shrink-0 relative z-10"
              >
                Accept Recommendation & Approvals
              </button>
            </div>
          )}

          {/* CRITERIA CRUCIBLE FORMULAS HELP */}
          <div className="bg-amber-500/5 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 rounded-2xl p-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-extrabold text-primary uppercase tracking-widest block mb-1.5 text-[10px]">Criteria Scoring Rules:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong className="text-accent dark:text-white">Price (40%):</strong> Lower price = higher score
              </div>
              <div>
                <strong className="text-accent dark:text-white">Vendor Star (30%):</strong> Out of 5 stars rating
              </div>
              <div>
                <strong className="text-accent dark:text-white">Timeline (20%):</strong> Faster delivery timeline = higher score
              </div>
              <div>
                <strong className="text-accent dark:text-white">History (10%):</strong> Star rating proxy
              </div>
            </div>
          </div>

          {/* ADVANCED COMPARISON DATAGRID */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/10">
                    <th className="px-6 py-4">Recommendation Rank</th>
                    <th className="px-6 py-4">Vendor Partner</th>
                    <th className="px-6 py-4">Base Quote</th>
                    <th className="px-6 py-4">Taxes</th>
                    <th className="px-6 py-4">Delivery</th>
                    <th className="px-6 py-4">Criteria Breakdown</th>
                    <th className="px-6 py-4 text-center">Composite Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {comparisonData.comparisons.map((c: any, index: number) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-gray-700 dark:text-gray-300 transition-colors ${
                        c.isRecommended
                          ? 'bg-primary/5 dark:bg-primary/5 border-l-4 border-l-primary'
                          : ''
                      }`}
                    >
                      {/* Rank / Badge */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                            index === 0 ? 'bg-primary text-accent' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                          {c.isRecommended && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 animate-pulse">
                              Best Bidding Choice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vendor name */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-extrabold text-accent dark:text-white">{c.companyName}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[10px] font-bold text-gray-500">{c.vendorRating.toFixed(1)} / 5.0</span>
                          </div>
                        </div>
                      </td>

                      {/* Prices */}
                      <td className="px-6 py-4 font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.price)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.taxes)}
                      </td>

                      {/* Delivery */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-semibold text-accent dark:text-white">
                          <Clock size={12} className="text-gray-400" />
                          <span>{c.deliveryTimeline} days</span>
                        </div>
                      </td>

                      {/* Progress Sliders score */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="space-y-1 text-[10px]">
                          {/* Price progress */}
                          <div>
                            <div className="flex justify-between font-medium text-gray-400 mb-0.5">
                              <span>Price ({c.scores.price}%)</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${c.scores.price}%` }} />
                            </div>
                          </div>
                          {/* Rating progress */}
                          <div>
                            <div className="flex justify-between font-medium text-gray-400 mb-0.5">
                              <span>Vendor ({c.scores.rating}%)</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${c.scores.rating}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total score */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-primary">
                          {c.scores.total}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
