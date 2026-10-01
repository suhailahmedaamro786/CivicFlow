import React, { useState } from 'react';
import { ArrowRight, Building2, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { UserRequest } from '../types';
import { SupportedLanguage } from '../types/agentEngine';
import { storageService } from '../services/storageService';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

export const NewRequestPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [title, setTitle] = useState('');
  const [rawQuery, setRawQuery] = useState(() => {
    try {
      const draft = localStorage.getItem('civicflow_request_draft');
      if (!draft) return '';
      const parsed = JSON.parse(draft);
      return typeof parsed?.rawQuery === 'string' ? parsed.rawQuery : '';
    } catch {
      return '';
    }
  });
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [applicantType, setApplicantType] = useState<UserRequest['citizenProfile']['applicantType']>('individual');
  const [entityName, setEntityName] = useState('');
  const [urgency, setUrgency] = useState<UserRequest['citizenProfile']['urgency']>('medium');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const field = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawQuery.trim() || !city.trim() || !state.trim() || !country.trim()) return;

    const id = `req-${Date.now().toString(36)}`;
    const request: UserRequest = {
      id,
      title: title.trim() || rawQuery.trim().slice(0, 72),
      rawQuery: rawQuery.trim(),
      category: 'business_licensing',
      jurisdiction: { city: city.trim(), county: county.trim(), state: state.trim(), country: country.trim() },
      citizenProfile: { applicantType, entityName: entityName.trim() || undefined, urgency },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processing',
      executions: [],
      ragSourcesUsed: []
    };

    storageService.saveRequest(request);
    try {
      localStorage.removeItem('civicflow_request_draft');
    } catch {
      // Ignore storage cleanup failures.
    }
    setIsSubmitting(false);
    // Navigate immediately. The request detail screen owns the live workflow,
    // so progress and failures remain visible instead of leaving this form mounted.
    onNavigate(`/dashboard/requests/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-7">
      <section>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">New request</span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Tell CivicFlow what you need</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Start with your real problem and jurisdiction. CivicFlow selects the workers it needs and only uses evidence available to the configured knowledge base.</p>
      </section>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7 space-y-7">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-800">What do you need help with?</label>
          <textarea required rows={6} value={rawQuery} onChange={e => setRawQuery(e.target.value)}
            placeholder="Describe the actual civic process, problem, documents, deadline, or requirement you need help understanding."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none" />
          <div className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Retrieved documents are treated as evidence, not instructions.</div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-3">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /><h2 className="text-sm font-bold">Where does this apply?</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={city} onChange={e => setCity(e.target.value)} placeholder="City / municipality" className={field} />
            <input value={county} onChange={e => setCounty(e.target.value)} placeholder="County / district (optional)" className={field} />
            <input required value={state} onChange={e => setState(e.target.value)} placeholder="State / province / region" className={field} />
            <input required value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className={field} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-3">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /><h2 className="text-sm font-bold">Optional context</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short title (optional)" className={field} />
            <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Person / organization / business name (optional)" className={field} />
            <select value={applicantType} onChange={e => setApplicantType(e.target.value as UserRequest['citizenProfile']['applicantType'])} className={field}>
              <option value="individual">Individual</option><option value="small_business_owner">Small business owner</option><option value="non_profit">Non-profit</option><option value="contractor">Contractor</option>
            </select>
            <select value={urgency} onChange={e => setUrgency(e.target.value as UserRequest['citizenProfile']['urgency'])} className={field}>
              <option value="low">Normal</option><option value="medium">Time-sensitive</option><option value="high">High priority</option><option value="urgent">Urgent</option>
            </select>
            <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value as SupportedLanguage)} className={field}>
              <option value="en">English</option><option value="ur">Urdu</option><option value="roman_urdu">Roman Urdu</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 text-xs text-slate-500"><Clock className="w-4 h-4 shrink-0" /> Live processing uses the configured knowledge base and Gemini service.</div>
          <button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            <Sparkles className="w-4 h-4" /> {isSubmitting ? 'Processing request…' : 'Create & process request'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
      <LegalDisclaimer />
    </div>
  );
};
