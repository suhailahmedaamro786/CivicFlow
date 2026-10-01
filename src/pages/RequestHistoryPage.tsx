import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  History, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ArrowRight, 
  Trash2, 
  PlusCircle, 
  Building2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { UserRequest, RequestStatus } from '../types';
import { storageService } from '../services/storageService';

interface RequestHistoryPageProps {
  onNavigate: (path: string) => void;
}

export const RequestHistoryPage: React.FC<RequestHistoryPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [requests, setRequests] = useState<UserRequest[]>(storageService.getRequests());

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this workflow record?')) {
      storageService.deleteRequest(id);
      setRequests(storageService.getRequests());
    }
  };

  const filtered = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.rawQuery.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.jurisdiction.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.citizenProfile.entityName && req.citizenProfile.entityName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' 
        ? true 
        : statusFilter === 'awaiting_human_approval'
        ? req.status === 'awaiting_human_approval'
        : statusFilter === 'completed'
        ? req.status === 'completed' || req.status === 'approved'
        : req.status === statusFilter;

    const matchesCategory = 
      categoryFilter === 'all' ? true : req.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Citizen Request History & Archives
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all citizen workflow pipelines and caseworker authorizations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard/new-request')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Search Box */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, title, city, or entity name..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('awaiting_human_approval')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'awaiting_human_approval' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'hover:text-amber-700 text-amber-800'
              }`}
            >
              Awaiting Caseworker ({requests.filter(r => r.status === 'awaiting_human_approval').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Completed ({requests.filter(r => r.status === 'completed' || r.status === 'approved').length})
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Domains</option>
              <option value="business_licensing">Business Licensing</option>
              <option value="housing_permits">Housing & Tenancy</option>
              <option value="zoning_planning">Zoning & Planning</option>
              <option value="social_services">Social Services</option>
            </select>
          </div>

        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Citizen Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No service requests match your search criteria. Try clearing filters or create a new request.
            </p>
            <button
              onClick={() => onNavigate('/dashboard/new-request')}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
            >
              Create New Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((req) => (
              <div
                key={req.id}
                onClick={() => onNavigate(`/dashboard/requests/${req.id}`)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {req.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {req.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {req.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 italic">
                    "{req.rawQuery}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span>
                      Applicant: <strong className="text-slate-700">{req.citizenProfile.entityName || 'Individual'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Jurisdiction: <strong className="text-slate-700">{req.jurisdiction.city}, {req.jurisdiction.state}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Created: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="text-blue-600 font-mono">
                      {req.executions.length} Agent Steps
                    </span>
                  </div>
                </div>

                {/* Status Badges & Delete */}
                <div className="flex items-center gap-4">
                  {req.status === 'awaiting_human_approval' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Awaiting Caseworker</span>
                    </span>
                  ) : req.status === 'approved' || req.status === 'completed' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Action Plan</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>Processing ({req.executions.length}/9)</span>
                    </span>
                  )}

                  <button
                    onClick={(e) => handleDelete(req.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
