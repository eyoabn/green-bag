"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Eye, 
  X, 
  ShieldCheck, 
  ArrowLeft,
  FileText
} from "lucide-react";

interface AuditLogRow {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [actionsList, setActionsList] = useState<string[]>([]);
  const [entitiesList, setEntitiesList] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inspect Modal
  const [inspectItem, setInspectItem] = useState<AuditLogRow | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedAction) params.set("action", selectedAction);
      if (selectedEntity) params.set("entity", selectedEntity);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.pagination?.totalCount || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.filters) {
          if (data.filters.actions) setActionsList(data.filters.actions);
          if (data.filters.entities) setEntitiesList(data.filters.entities);
        }
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedAction, selectedEntity, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedAction("");
    setSelectedEntity("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes("APPROV") || a.includes("START") || a.includes("ACCEPT")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (a.includes("REJECT") || a.includes("CANCEL") || a.includes("DELETE")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (a.includes("QUOTE") || a.includes("REVIEW")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (a.includes("SUBMIT") || a.includes("ORDER") || a.includes("CREATE")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-stone-100 text-stone-800 border-stone-200";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Compliance & Security
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            System Audit Log & Traceability
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Cryptographic ledger of all payment verifications, status advancements, and administrative overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              data-testid="audit-search-input"
              type="text"
              placeholder="Search by actor name, email, action, entity, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 text-xs bg-stone-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1E3B2E]/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
          >
            Search Logs
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Filter by Action</label>
            <select
              data-testid="audit-action-filter"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden"
            >
              <option value="">All Actions ({actionsList.length})</option>
              {actionsList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Filter by Entity</label>
            <select
              data-testid="audit-entity-filter"
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden"
            >
              <option value="">All Entities ({entitiesList.length})</option>
              {entitiesList.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">Start Date</label>
            <input
              data-testid="audit-date-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">End Date</label>
            <div className="flex items-center gap-2">
              <input
                data-testid="audit-date-end"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-hidden"
              />
              {(search || selectedAction || selectedEntity || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-stone-900">Audit Ledger Entries</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold font-mono">
              {totalCount} total
            </span>
          </div>

          <span className="text-xs text-stone-400 font-mono">
            Page {page} of {totalPages}
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Querying immutable audit log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <History size={36} className="text-stone-300 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No Audit Records Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No system operations match your current search and filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/50 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    data-testid="audit-table-row"
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1E3B2E] text-[#E0B382] flex items-center justify-center font-bold text-[10px] shrink-0">
                          {log.actor_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-900 truncate max-w-[140px]">
                            {log.actor_name || "System"}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono truncate max-w-[140px]">
                            {log.actor_email || log.actor_id.slice(0, 8)}
                          </span>
                        </div>
                        {log.actor_role && (
                          <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[9px] font-bold uppercase">
                            {log.actor_role}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-800 capitalize whitespace-nowrap">
                      {log.entity}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap truncate max-w-[120px]" title={log.entity_id}>
                      {log.entity_id || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectItem(log)}
                        className="px-3 py-1 rounded-xl bg-stone-100 hover:bg-[#1E3B2E] hover:text-white text-stone-700 text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div data-testid="audit-pagination" className="p-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/60">
            <span className="text-xs text-stone-500 font-mono">
              Showing entries {(page - 1) * 15 + 1} to {Math.min(page * 15, totalCount)} of {totalCount}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold font-mono px-3 text-stone-800">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Metadata Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#1E3B2E]" />
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Audit Snapshot Details
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Record ID:</span>
                <span className="font-mono text-stone-800 font-bold">{inspectItem.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Action:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadgeColor(inspectItem.action)}`}>
                  {inspectItem.action}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Target Entity:</span>
                <span className="font-semibold text-stone-900">{inspectItem.entity} ({inspectItem.entity_id})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Actor:</span>
                <span className="font-bold text-stone-900">{inspectItem.actor_name || inspectItem.actor_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Timestamp:</span>
                <span className="font-mono text-stone-800">{new Date(inspectItem.created_at).toISOString()}</span>
              </div>

              <div className="pt-2">
                <span className="block font-bold text-stone-700 mb-1">Payload Metadata:</span>
                <pre data-testid="audit-metadata-pre" className="p-3 rounded-2xl bg-stone-900 text-[#E0B382] font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(inspectItem.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectItem(null)}
                className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
