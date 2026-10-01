import React, { useState } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Clock, 
  Layers,
  ArrowRight,
  UploadCloud,
  Check,
  Languages
} from 'lucide-react';
import { UserRequest } from '../types';
import { SupportedLanguage } from '../types/agentEngine';
import { storageService } from '../services/storageService';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface NewRequestPageProps {
  onNavigate: (path: string) => void;
}

interface ScenarioTemplate {
  name: string;
  category: UserRequest['category'];
  title: string;
  query: string;
  city: string;
  county: string;
  state: string;
  applicantType: UserRequest['citizenProfile']['applicantType'];
  entityName: string;
  urgency: UserRequest['citizenProfile']['urgency'];
}

const TEMPLATES: ScenarioTemplate[] = [
  {
    name: 'Small Business Registration (Core Demo)',
    category: 'business_licensing',
    title: 'Small Business Registration & Licensing Workflow',
    query: 'How can I register a small business and what documents and steps do I need?',
    city: 'Los Angeles',
    county: 'Los Angeles County',
    state: 'California',
    applicantType: 'small_business_owner',
    entityName: 'Apex Artisan Design Studio LLC',
    urgency: 'medium'
  },
  {
    name: 'Tenant Habitability & Urgent Repairs',
    category: 'housing_permits',
    title: 'Urgent Plumbing & Heating Habitability Citation',
    query: 'My landlord has failed to fix severe water leakage and lack of heat for over two weeks. What are my statutory rights, required notice forms, and municipal inspection procedures?',
    city: 'San Francisco',
    county: 'San Francisco County',
    state: 'California',
    applicantType: 'individual',
    entityName: 'Residential Tenant',
    urgency: 'urgent'
  },
  {
    name: 'Residential Rooftop Solar Permitting',
    category: 'zoning_planning',
    title: 'Expedited Rooftop Solar PV & Battery Installation',
    query: 'I want to install a 7.2 kW rooftop solar array and battery storage. How do I qualify for expedited 3-day SolarAPP+ review and what is the maximum permit fee cap?',
    city: 'San Diego',
    county: 'San Diego County',
    state: 'California',
    applicantType: 'individual',
    entityName: 'Homeowner',
    urgency: 'low'
  }
];

export const NewRequestPage: React.FC<NewRequestPageProps> = ({ onNavigate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [rawQuery, setRawQuery] = useState(TEMPLATES[0].query);
  const [category, setCategory] = useState<UserRequest['category']>(TEMPLATES[0].category);
  const [city, setCity] = useState(TEMPLATES[0].city);
  const [county, setCounty] = useState(TEMPLATES[0].county);
  const [state, setState] = useState(TEMPLATES[0].state);
  const [applicantType, setApplicantType] = useState<UserRequest['citizenProfile']['applicantType']>(TEMPLATES[0].applicantType);
  const [entityName, setEntityName] = useState(TEMPLATES[0].entityName);
  const [urgency, setUrgency] = useState<UserRequest['citizenProfile']['urgency']>(TEMPLATES[0].urgency);
  const [email, setEmail] = useState('citizen.founder@example.org');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('en');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyTemplate = (idx: number) => {
    const t = TEMPLATES[idx];
    setSelectedTemplate(idx);
    setTitle(t.title);
    setRawQuery(t.query);
    setCategory(t.category);
    setCity(t.city);
    setCounty(t.county);
    setState(t.state);
    setApplicantType(t.applicantType);
    setEntityName(t.entityName);
    setUrgency(t.urgency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawQuery.trim()) return;

    setIsSubmitting(true);

    const newId = `req-civic-${Date.now().toString().slice(-4)}`;
    const newRequest: UserRequest = {
      id: newId,
      title: title.trim(),
      rawQuery: rawQuery.trim(),
      category,
      jurisdiction: {
        city: city.trim() || 'Municipal Center',
        county: county.trim() || 'County Jurisdiction',
        state: state.trim() || 'State Territory',
        country: 'United States'
      },
      citizenProfile: {
        applicantType,
        entityName: entityName.trim() || undefined,
        urgency,
        email: email.trim() || undefined
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'processing',
      executions: [],
      ragSourcesUsed: []
    };

    // Save and launch workflow
    storageService.saveRequest(newRequest);

    // Trigger async execution
    agentOrchestrator.runWorkflow(newRequest, targetLanguage).catch(err => {
      console.error('Error running workflow:', err);
    });

    // Navigate user immediately to detailed live view
    setTimeout(() => {
      onNavigate(`/dashboard/requests/${newId}`);
    }, 200);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Intake Protocol
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Initiate New Citizen Service Request
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter an unstructured problem statement. Our 9 specialized AI agents will parse, ground, and verify the required legal action plan.
        </p>
      </div>

      {/* Scenario Template Quick Fill */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          One-Click Demo Scenario Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyTemplate(idx)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedTemplate === idx
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span>{tmpl.name}</span>
                {selectedTemplate === idx && (
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                "{tmpl.query}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        
        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Request Title / Case Descriptor
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Small Business Registration & Licensing Workflow"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Domain
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="business_licensing">Commercial & Business Licensing</option>
              <option value="housing_permits">Housing, Tenancy & Code Compliance</option>
              <option value="zoning_planning">Zoning, Planning & Expedited Solar</option>
              <option value="social_services">Social Benefits & Municipal Support</option>
            </select>
          </div>
        </div>

        {/* Natural Language Citizen Query */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Citizen Problem Statement (Natural Language)
            </label>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Prompt Injection Shield Active
            </span>
          </div>

          <textarea
            required
            rows={4}
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Describe the exact problem or procedural question in plain language..."
            className="w-full p-3.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-slate-800"
          />
        </div>

        {/* Jurisdiction Details */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Jurisdiction & Regulatory Venue
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">City / Municipality</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Los Angeles"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">County</label>
              <input
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="e.g. Los Angeles County"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">State / Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. California"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Citizen Profile Details */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Applicant Profile & Urgency
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Applicant Type</label>
              <select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="small_business_owner">Small Business Owner</option>
                <option value="individual">Individual Resident</option>
                <option value="contractor">Licensed Contractor</option>
                <option value="non_profit">Non-Profit Organization</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Entity / Trade Name</label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g. Apex Studio LLC"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Statutory Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="low">Standard (Low)</option>
                <option value="medium">Standard (Medium)</option>
                <option value="high">High (Time-Sensitive)</option>
                <option value="urgent">Urgent (Emergency Action)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                <span>Action Plan Language</span>
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="roman_urdu">Roman Urdu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Triggers Intake, Router, RAG Grounding, and Verifier Agents sequentially.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Initializing Agent Pipeline...' : 'Launch Multi-Agent Orchestration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* Safety Banner */}
      <LegalDisclaimer />

    </div>
  );
};
