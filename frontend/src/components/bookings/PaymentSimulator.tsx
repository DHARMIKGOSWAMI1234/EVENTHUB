// frontend/src/components/bookings/PaymentSimulator.tsx
import React, { useState } from 'react'
import { 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Banknote, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle
} from 'lucide-react'
import type { PaymentMethod, PaymentStatus } from '../../types'
import { formatCurrency } from '../../utils/formatters'
import { Button } from '../common/Button'

interface PaymentSimulatorProps {
  amount: number
  bookingReference: string
  onComplete: (method: PaymentMethod, status: PaymentStatus) => Promise<void>
  isLoading?: boolean
}

export const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({
  amount,
  bookingReference,
  onComplete,
  isLoading = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI')
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('COMPLETED')
  const [demoUpiId, setDemoUpiId] = useState('demo.customer@eventhub')
  const [demoCardName, setDemoCardName] = useState('Demo Account Holder')
  const [demoBank, setDemoBank] = useState('State Bank of India (Simulated)')

  const methods: { id: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'UPI', label: 'UPI / VPA', icon: Smartphone, desc: 'Instant virtual payment address simulation' },
    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Simulated sandbox card transaction' },
    { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark, desc: 'Simulated core banking gateway' },
    { id: 'CASH', label: 'Cash on Counter', icon: Banknote, desc: 'Box office counter payment simulation' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete(selectedMethod, targetStatus)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Prominent Demo Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
            Demo Payment Simulation — No Real Money Processed
          </p>
          <p className="text-amber-300/80 leading-relaxed">
            This is an academic DBMS simulation portal. Do not enter real credit cards, PINs, or bank passwords. All operations execute strictly within the isolated PostgreSQL sandbox.
          </p>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest block">
            Booking Ref: {bookingReference}
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">Select Payment Simulation Method</h3>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 block">Amount Payable</span>
          <span className="text-2xl font-black text-white font-mono">{formatCurrency(amount)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Selection Radio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((m) => {
            const Icon = m.icon
            const isSelected = selectedMethod === m.id
            return (
              <label
                key={m.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={isSelected}
                  onChange={() => setSelectedMethod(m.id)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
                </div>
              </label>
            )
          })}
        </div>

        {/* Fictional simulation fields based on method */}
        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Fictional Sandbox Fields
          </span>

          {selectedMethod === 'UPI' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Virtual Payment Address (VPA)
              </label>
              <input
                type="text"
                value={demoUpiId}
                onChange={(e) => setDemoUpiId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder="username@bank"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Simulated UPI ID for test verification.
              </span>
            </div>
          )}

          {selectedMethod === 'CARD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={demoCardName}
                  onChange={(e) => setDemoCardName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Simulated Card Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value="4242 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-400 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expiry</label>
                  <input
                    type="text"
                    disabled
                    value="12/28"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 text-slate-400 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'NET_BANKING' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Simulated Bank
              </label>
              <select
                value={demoBank}
                onChange={(e) => setDemoBank(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="State Bank of India (Simulated)">State Bank of India (Simulated)</option>
                <option value="HDFC Bank (Simulated)">HDFC Bank (Simulated)</option>
                <option value="ICICI Bank (Simulated)">ICICI Bank (Simulated)</option>
                <option value="Axis Bank (Simulated)">Axis Bank (Simulated)</option>
              </select>
            </div>
          )}

          {selectedMethod === 'CASH' && (
            <p className="text-xs text-slate-400">
              Counter settlement simulation. Payment receipt will be marked directly in database transaction log.
            </p>
          )}
        </div>

        {/* Simulation Outcome Selector (Success vs Failure) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Simulate Gateway Result (DBMS Testing Option)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetStatus('COMPLETED')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                targetStatus === 'COMPLETED'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Simulate Successful Payment
            </button>

            <button
              type="button"
              onClick={() => setTargetStatus('FAILED')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                targetStatus === 'FAILED'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Simulate Failed Payment
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          isLoading={isLoading}
          variant={targetStatus === 'COMPLETED' ? 'primary' : 'danger'}
          size="lg"
          className="w-full justify-center"
        >
          {targetStatus === 'COMPLETED'
            ? `Confirm & Complete Payment (${formatCurrency(amount)})`
            : 'Simulate Gateway Payment Failure'}
        </Button>
      </form>
    </div>
  )
}
