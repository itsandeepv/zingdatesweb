'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Invoice } from '@/lib/api'

/**
 * Printable invoices for one or more payments.
 *
 * Rendered as HTML and printed by the browser rather than generated as a PDF
 * server-side: it needs no PDF dependency on the API, and "Save as PDF" in the
 * print dialog produces the same file people would have downloaded.
 *
 * Fields the server left out are left out here too — an invoice carrying a
 * blank GSTIN row or a placeholder address is worse than one without it.
 */

const fmtMoney = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0)

const fmtDate = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Quote a CSV field: wrap in quotes and double any quote inside. */
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

function downloadCsv(invoices: Invoice[]) {
  const head = [
    'Invoice No', 'Date', 'Name', 'Email', 'Phone', 'City', 'State', 'Pincode',
    'Description', 'HSN/SAC', 'Status', 'Gateway', 'Transaction ID',
    'Taxable Value', 'Tax %', 'CGST', 'SGST', 'IGST', 'Total', 'Currency',
  ]
  const rows = invoices.map(inv => [
    inv.invoice_no, fmtDate(inv.issued_at),
    inv.buyer?.name, inv.buyer?.email, inv.buyer?.phone,
    inv.buyer?.city, inv.buyer?.state, inv.buyer?.pincode,
    inv.item.description, inv.item.hsn ?? '',
    inv.payment.status, inv.payment.gateway, inv.payment.transaction_id,
    inv.tax.base, inv.tax.rate, inv.tax.cgst, inv.tax.sgst, inv.tax.igst,
    inv.total, inv.currency,
  ])

  // BOM so Excel opens rupee signs and Indian names as UTF-8 rather than mojibake.
  const csv = '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function OneInvoice({ inv }: { inv: Invoice }) {
  const { seller, buyer } = inv
  return (
    <article className="invoice-page bg-white text-gray-900 p-10">
      <header className="flex justify-between items-start gap-8 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="text-2xl font-bold">{seller.company ?? 'Invoice'}</h1>
          {seller.address && <p className="text-sm text-gray-600 mt-1">{seller.address}</p>}
          {seller.email && <p className="text-sm text-gray-600">{seller.email}</p>}
          {seller.phone && <p className="text-sm text-gray-600">{seller.phone}</p>}
          {seller.website && <p className="text-sm text-gray-600">{seller.website}</p>}
          {seller.gstin && <p className="text-sm text-gray-700 mt-1">GSTIN: {seller.gstin}</p>}
          {seller.state && <p className="text-sm text-gray-600">State: {seller.state}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tax Invoice</p>
          <p className="text-lg font-bold mt-1">{inv.invoice_no}</p>
          <p className="text-sm text-gray-600 mt-1">{fmtDate(inv.issued_at)}</p>
          {inv.place_of_supply && <p className="text-sm text-gray-600">Place of Supply: {inv.place_of_supply}</p>}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill to / Ship to</p>
          {buyer ? (
            <>
              <p className="font-semibold">{buyer.name ?? `User #${buyer.id}`}</p>
              {buyer.email && <p className="text-sm text-gray-600">{buyer.email}</p>}
              {buyer.phone && <p className="text-sm text-gray-600">{buyer.phone}</p>}
              {buyer.address && <p className="text-sm text-gray-600 mt-1">{buyer.address}</p>}
              <p className="text-sm text-gray-600">
                {[buyer.city, buyer.state, buyer.pincode].filter(Boolean).join(', ')}
              </p>
              {buyer.country && <p className="text-sm text-gray-600">{buyer.country}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-400">Account no longer exists</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Payment</p>
          <dl className="text-sm space-y-0.5">
            {inv.payment.status && (
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Status</dt><dd className="font-medium capitalize">{inv.payment.status}</dd></div>
            )}
            {inv.payment.gateway && (
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Gateway</dt><dd className="font-medium capitalize">{inv.payment.gateway}</dd></div>
            )}
            {inv.payment.transaction_id && (
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Transaction</dt><dd className="font-mono text-xs">{inv.payment.transaction_id}</dd></div>
            )}
            {inv.payment.paid_at && (
              <div className="flex justify-between gap-4"><dt className="text-gray-500">Paid on</dt><dd className="font-medium">{fmtDate(inv.payment.paid_at)}</dd></div>
            )}
          </dl>
        </div>
      </section>

      <table className="w-full text-sm border-t border-gray-200">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="py-2 font-bold">Description</th>
            <th className="py-2 font-bold text-center w-24">HSN/SAC</th>
            <th className="py-2 font-bold text-center w-16">Qty</th>
            <th className="py-2 font-bold text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-100">
            <td className="py-3">{inv.item.description}</td>
            <td className="py-3 text-center text-gray-600">{inv.item.hsn ?? '—'}</td>
            <td className="py-3 text-center">{inv.item.quantity}</td>
            <td className="py-3 text-right">{fmtMoney(inv.tax.base, inv.currency)}</td>
          </tr>
        </tbody>
        <tfoot className="border-t-2 border-gray-900">
          <tr><td colSpan={3} className="py-1.5 text-gray-500">Taxable value</td>
              <td className="py-1.5 text-right">{fmtMoney(inv.tax.base, inv.currency)}</td></tr>
          {inv.tax.igst > 0 ? (
            <tr><td colSpan={3} className="py-1.5 text-gray-500">IGST ({inv.tax.rate}%)</td>
                <td className="py-1.5 text-right">{fmtMoney(inv.tax.igst, inv.currency)}</td></tr>
          ) : (
            <>
              <tr><td colSpan={3} className="py-1.5 text-gray-500">CGST ({(inv.tax.rate / 2).toFixed(1)}%)</td>
                  <td className="py-1.5 text-right">{fmtMoney(inv.tax.cgst, inv.currency)}</td></tr>
              <tr><td colSpan={3} className="py-1.5 text-gray-500">SGST ({(inv.tax.rate / 2).toFixed(1)}%)</td>
                  <td className="py-1.5 text-right">{fmtMoney(inv.tax.sgst, inv.currency)}</td></tr>
            </>
          )}
          <tr><td colSpan={3} className="py-1.5 text-gray-500">Sub Total</td>
              <td className="py-1.5 text-right">{fmtMoney(inv.total, inv.currency)}</td></tr>
          <tr className="font-bold text-base">
            <td colSpan={3} className="py-2.5">Total {inv.payment.status === 'completed' ? 'paid' : ''}</td>
            <td className="py-2.5 text-right">{fmtMoney(inv.total, inv.currency)}</td>
          </tr>
          {inv.payment.refund_amount != null && inv.payment.refund_amount > 0 && (
            <tr className="text-red-600">
              <td colSpan={3} className="py-1.5">Refunded {inv.payment.refunded_at ? `on ${fmtDate(inv.payment.refunded_at)}` : ''}</td>
              <td className="py-1.5 text-right">−{fmtMoney(inv.payment.refund_amount, inv.currency)}</td>
            </tr>
          )}
        </tfoot>
      </table>

      <p className="pt-4 text-sm text-gray-700">
        <span className="font-semibold">Total in words: </span>{inv.total_in_words}
      </p>

      <footer className="pt-6 mt-6 border-t border-gray-100 text-xs text-gray-400">
        {inv.tax.inclusive && <p>GST shown is reverse-calculated from the amount charged (inclusive), as this order predates itemised GST.</p>}
        <p>Computer generated invoice — no signature required.</p>
      </footer>
    </article>
  )
}

export default function InvoiceSheet({
  invoices, onClose,
}: {
  invoices: Invoice[]
  onClose: () => void
}) {
  // Portalled to <body> on purpose. The print rule below hides body's direct
  // children, and inside the app tree this overlay is not one — it sits under
  // Next's root wrapper, which WAS being hidden, taking the invoice with it.
  // That is what produced a blank PDF.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Esc closes, as everywhere else in the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (invoices.length === 0 || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto invoice-overlay">
      {/* Print only the sheet: everything else on the page is chrome. */}
      <style>{`
        @media print {
          @page { margin: 12mm; }
          /* Safe now that the overlay is portalled to <body>: everything else
             at that level is the app, and the invoice is not inside it. */
          body > *:not(.invoice-overlay) { display: none !important; }
          html, body {
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
          }
          .invoice-overlay {
            position: static !important;
            background: #fff !important;
            overflow: visible !important;
            inset: auto !important;
          }
          .invoice-toolbar { display: none !important; }
          .invoice-sheet { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .invoice-card { box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
          .invoice-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .invoice-page:last-child { break-after: auto; page-break-after: auto; }
          /* Keep the backgrounds and rules the invoice relies on. */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="invoice-toolbar sticky top-0 z-10 bg-gray-900 text-white px-5 py-3 flex items-center gap-3">
        <p className="text-sm font-semibold">
          {invoices.length === 1 ? invoices[0].invoice_no : `${invoices.length} invoices`}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => downloadCsv(invoices)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-white/25 hover:bg-white/10 transition-colors">
            Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors">
            Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-white/25 hover:bg-white/10 transition-colors">
            Close
          </button>
        </div>
      </div>

      <div className="invoice-sheet max-w-3xl mx-auto py-6 space-y-6">
        {invoices.map(inv => (
          <div key={inv.invoice_no} className="invoice-card rounded-xl overflow-hidden shadow-2xl">
            <OneInvoice inv={inv} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
