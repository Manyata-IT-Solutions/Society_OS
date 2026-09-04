'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Award, CheckCircle, AlertTriangle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

function QuotationComparisonContent() {
  const searchParams = useSearchParams();
  const rfqId = searchParams.get('rfqId');
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationReason, setRecommendationReason] = useState(
    'Lowest qualified and compliant vendor',
  );

  async function loadMatrix() {
    if (!rfqId) return;
    try {
      const res = await api.procurement.quotations.getComparisonMatrix(rfqId);
      setMatrix(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatrix();
  }, [rfqId]);

  async function handleAward(vendorId: string, quotationId: string) {
    if (!matrix) return;
    try {
      const selectedQuote = matrix.summary.find((s: any) => s.quotationId === quotationId);
      const lines = matrix.lines.map((l: any) => {
        const ql = l.vendorQuotes.find((vq: any) => vq.quotationId === quotationId);
        return {
          rfqLineId: l.rfqLineId,
          quotationId,
          quotationLineId: ql.quotationLineId,
          vendorId,
          awardedQuantity: l.requestedQuantity,
          unitPrice: ql.unitPrice,
        };
      });

      const award = await api.procurement.awards.recommend({
        rfqId,
        selectedVendorId: vendorId,
        isLowestPriceSelected: selectedQuote?.isLowestCommercial ?? false,
        recommendationReason,
        lines,
      });

      // Auto approve and generate PO in UI flow
      await api.procurement.awards.approve(award.id);
      await api.procurement.orders.createFromAward(award.id);

      alert('Award approved and Purchase Order created successfully!');
      window.location.href = '/app/procurement/orders';
    } catch (err: any) {
      alert(err.message || 'Error processing award');
    }
  }

  if (!rfqId) {
    return (
      <div className="p-8 text-center text-muted">
        Please select an RFQ from the RFQs list to view the comparison matrix.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quotation Comparison Matrix</h1>
        <p className="text-sm text-muted">
          Normalized landed cost, technical compliance score, and sourcing recommendation for{' '}
          {matrix?.rfqNumber}.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Loading quotation comparison matrix...</div>
      ) : !matrix ? (
        <div className="p-8 text-center text-muted">No quotations recorded for this RFQ yet.</div>
      ) : (
        <>
          {/* Vendor Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matrix.summary.map((vendor: any) => (
              <div
                key={vendor.vendorId}
                className={`bg-surface border rounded-xl p-5 relative shadow-sm ${
                  vendor.isRecommended ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                {vendor.isRecommended && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Award className="h-3 w-3" /> Recommended
                  </div>
                )}
                <h3 className="font-bold text-base">{vendor.vendorName}</h3>
                <div className="text-xs text-muted mb-4 font-mono">{vendor.vendorCode}</div>

                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted">Landed Grand Total:</span>
                    <span className="font-bold text-base">
                      ₹{vendor.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Technical Compliance:</span>
                    <span
                      className={
                        vendor.complianceStatus === 'COMPLIANT'
                          ? 'text-emerald-500 font-medium'
                          : 'text-amber-500'
                      }
                    >
                      {vendor.complianceStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => handleAward(vendor.vendorId, vendor.quotationId)}
                    className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-semibold hover:opacity-90"
                  >
                    Select & Award Order
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Line by Line Breakdown */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border font-bold text-sm">
              Line Item Quotation Comparison
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-muted font-medium text-xs uppercase tracking-wider">
                  <th className="p-4">Item & Req. Qty</th>
                  {matrix.summary.map((s: any) => (
                    <th key={s.vendorId} className="p-4 text-right">
                      {s.vendorName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.lines.map((line: any) => (
                  <tr key={line.rfqLineId} className="hover:bg-surface-muted/30">
                    <td className="p-4">
                      <div className="font-medium">{line.description}</div>
                      <div className="text-xs text-muted">
                        Qty: {line.requestedQuantity} {line.uomName ?? ''}
                      </div>
                    </td>
                    {matrix.summary.map((s: any) => {
                      const quoteLine = line.vendorQuotes.find(
                        (vq: any) => vq.quotationId === s.quotationId,
                      );
                      return (
                        <td key={s.vendorId} className="p-4 text-right font-mono">
                          {quoteLine ? (
                            <div>
                              <div
                                className={
                                  quoteLine.isLowestPrice ? 'text-emerald-600 font-bold' : ''
                                }
                              >
                                ₹{quoteLine.unitPrice.toLocaleString()} / unit
                              </div>
                              <div className="text-xs text-muted">
                                Total: ₹{quoteLine.lineTotal.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted text-xs">No Bid</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function QuotationComparisonPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-muted">Loading quotation comparison...</div>}
    >
      <QuotationComparisonContent />
    </Suspense>
  );
}
