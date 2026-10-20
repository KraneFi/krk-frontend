import { Filter, Plus, Clock, Mail, MessageSquare, MoreHorizontal, ArrowRight } from 'lucide-react';
import { Card, Avatar, TierBadge, cn } from '../components/ui.jsx';
import { STAGES } from '../data/core.js';
import { useData } from '../data/DataContext.jsx';
import { useApp } from '../router.jsx';

export default function LoanQueue() {
  const { OFFERS } = useData();
  const { notify } = useApp();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {STAGES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-slate-600">
              <span className={cn('h-2 w-2 rounded-full', s.dot)} />{s.key}<span className="text-slate-400">({OFFERS.filter((o) => o.stage === s.key).length})</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => notify('Filters: product, tier, amount, age')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"><Filter className="h-4 w-4" />Filter</button>
          <button onClick={() => notify('New offer — pick a completed check to start')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-indigo-700"><Plus className="h-4 w-4" />New Offer</button>
        </div>
      </div>

      <div className="thin-scroll -mx-1 overflow-x-auto px-1 pb-3">
        <div className="flex gap-4">
          {STAGES.map((s) => {
            const items = OFFERS.filter((o) => o.stage === s.key);
            return (
              <div key={s.key} className="w-[280px] shrink-0">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
                  <span className="text-[14px] font-semibold text-slate-900">{s.key}</span>
                  <span className="text-[12px] text-slate-400">{items.length}</span>
                </div>
                <div className="min-h-[280px] space-y-2.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-2">
                  {items.map((o) => (
                    <div key={o.id} className="group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:shadow-md">
                      <div className="flex items-start gap-2.5">
                        <Avatar name={o.name} className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-semibold leading-snug text-slate-900">{o.name}</div>
                          <div className="text-[12px] text-slate-500">{o.product}</div>
                        </div>
                        <TierBadge tier={o.tier} className="max-w-[96px] shrink-0" />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[16px] font-semibold text-slate-900 num">₦{o.amount.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-500"><Clock className="h-3 w-3" />{o.ago}</span>
                      </div>
                      <div className="mt-3 hidden gap-1.5 group-hover:flex group-focus-within:flex [@media(hover:none)]:flex">
                        <button onClick={() => notify(`Offer re-sent to ${o.name}`)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-50 text-[12px] text-slate-600 hover:bg-slate-100"><Mail className="h-3.5 w-3.5" />Resend</button>
                        <button onClick={() => notify(`SMS sent to ${o.name}`)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-50 text-[12px] text-slate-600 hover:bg-slate-100"><MessageSquare className="h-3.5 w-3.5" />SMS</button>
                        <button className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[12.5px] text-slate-600">
        <span className="inline-flex items-center gap-2"><ArrowRight className="h-4 w-4 text-indigo-500" />Valid transitions enforced: Offer Sent → Viewed → Accepted / Declined / Expired → Pending Disbursement → Disbursed</span>
        <span className="text-slate-500">Maker-checker required on disbursements &gt; ₦1M</span>
      </Card>
    </div>
  );
}
