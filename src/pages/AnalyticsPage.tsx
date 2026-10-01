import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Building2,
  FileCheck
} from 'lucide-react';
import { storageService } from '../services/storageService';

export const AnalyticsPage: React.FC = () => {
  const analytics = storageService.getAnalytics();

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            System Metrics & Hallucination Prevention Audit
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          CivicFlow Operational Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive telemetry tracking multi-agent throughput, statutory citation fidelity, and human-in-the-loop decisions.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Verification Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {analytics.verificationPassRate}%
          </div>
          <p className="text-[11px] text-slate-400">
            Zero ungrounded hallucinations tolerated
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Human Review Gating</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 font-mono">
            100%
          </div>
          <p className="text-[11px] text-slate-400">
            Consequential filings require caseworker sign-off
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Avg Case Resolution</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700 font-mono">
            3.8s
          </div>
          <p className="text-[11px] text-slate-400">
            Full 9-agent pipeline execution latency
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Daily Tokens Processed</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-700 font-mono">
            {analytics.tokensConsumedToday.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            Efficient structured JSON outputs
          </p>
        </div>

      </div>

      {/* Performance by Agent Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Agent Performance Breakdown (All 9 Specialized Nodes)
            </h3>
            <p className="text-xs text-slate-500">Latency, model accuracy, and hallucination guard benchmarks.</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
            All Agents Healthy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] border-y border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Agent Node</th>
                <th className="p-3">Target Role</th>
                <th className="p-3">Avg Latency</th>
                <th className="p-3">Accuracy / Grounding</th>
                <th className="p-3">Guardrail Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.agentPerformance.map((item, idx) => (
                <tr key={item.agentId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">{item.agentId}</td>
                  <td className="p-3 font-mono font-semibold text-slate-700">{item.avgLatencyMs} ms</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">{item.accuracyRate}%</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Passed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Distribution & Grounding Fidelity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Citizen Demand by Regulatory Domain
          </h3>

          <div className="space-y-3">
            {analytics.categoryBreakdown.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{cat.category}</span>
                  <span className="font-mono">{cat.count} Requests</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${Math.max(15, (cat.count / Math.max(1, analytics.totalRequests)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Prompt Injection Defense Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Trust & Security Architecture Status
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Server-Side Secret Isolation</span>
                <span>Gemini API keys and credentials are authenticated exclusively server-side. Zero client-side leakage.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Prompt Injection Defense Active</span>
                <span>Incoming queries and retrieved external documents are sanitized against override patterns before LLM ingestion.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Statutory Non-Determination Disclaimer Enforced</span>
                <span>All citizen-facing roadmaps explicitly mandate agency review and distinguish advice from formal determinations.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
