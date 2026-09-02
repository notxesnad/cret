'use client'

import { billingLabel, hasShareAccess, isPaid, trialPeriodDays, type BillingState } from '@/app/lib/billing'
import { ToolTile } from '@/app/components/ToolTile'

export function AccountView({
  signedIn,
  billing,
  billingBusy,
  onNeedAuth,
  onSubscribe,
  onManageBilling,
  onSignOut,
  onContact,
}: {
  signedIn: boolean
  billing: BillingState
  billingBusy?: boolean
  onNeedAuth: () => void
  onSubscribe: () => void
  onManageBilling: () => void
  onSignOut: () => void
  onContact: () => void
}) {
  const paid = isPaid(billing.status)
  const onTrial = !paid && hasShareAccess(billing)
  const status = billingLabel(billing)
  const trialDays = trialPeriodDays()

  if (!signedIn) {
    return (
      <div id="view-account" className="app-view active space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Account</span>
          <h1 className="text-2xl font-black mt-1">Your stuff</h1>
          <p className="text-base text-slate-400 mt-2">Sign in to manage billing and the rest of your account.</p>
        </div>
        <button
          type="button"
          onClick={onNeedAuth}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div id="view-account" className="app-view active space-y-4">
      <div className="text-center mb-2">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Account</span>
        <h1 className="text-2xl font-black mt-1">Your stuff</h1>
        <p className="text-base text-slate-400 mt-1">
          {status === 'Subscribed'
            ? 'You are subscribed. Billing lives here now.'
            : onTrial
              ? `You are on a ${trialDays}-day free trial.`
              : status === 'Payment issue'
                ? 'Your payment needs a look.'
                : status === 'Canceled'
                  ? 'This subscription is canceled.'
                  : 'Billing and account odds and ends.'}
        </p>
      </div>

      <ToolTile
        onClick={() => (paid ? onManageBilling() : onSubscribe())}
        className={`group relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-6 rounded-3xl shadow-xl min-h-[120px] flex flex-col justify-end ${billingBusy ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <span className="text-xs font-bold tracking-wider uppercase opacity-70">
          {paid ? 'Stripe customer portal' : billing.status === 'past_due' ? 'Update card' : 'Start or manage'}
        </span>
        <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">
          {billingBusy
            ? 'One sec...'
            : paid
              ? 'Manage billing'
              : billing.status === 'past_due'
                ? 'Update payment'
                : 'Subscribe — $29/mo'}
        </h2>
      </ToolTile>

      <ToolTile
        onClick={onContact}
        className="group relative bg-slate-800 hover:bg-slate-700 text-white p-6 rounded-3xl shadow-xl min-h-[120px] flex flex-col justify-end border-2 border-slate-700"
      >
        <span className="text-xs font-bold tracking-wider uppercase text-fuchsia-400 opacity-90">Support</span>
        <h2 className="text-2xl md:text-3xl tracking-wide font-black mt-1">Need help?</h2>
      </ToolTile>

      <ToolTile
        onClick={onSignOut}
        className="group relative bg-slate-900 hover:bg-slate-800 text-rose-400 p-6 rounded-3xl shadow-xl min-h-[100px] flex flex-col justify-end border-2 border-slate-800"
      >
        <h2 className="text-2xl tracking-wide font-black">Sign out</h2>
      </ToolTile>
    </div>
  )
}
