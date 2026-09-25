import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, AuditLog } from '../types';

interface AuditLogsDashboardProps {
  currentUser: User;
}

const PAGE_SIZE = 25;

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-100 text-emerald-700',
  updated: 'bg-blue-100 text-blue-700',
  verified: 'bg-emerald-100 text-emerald-700',
  deactivated: 'bg-amber-100 text-amber-700',
  deleted: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  archived: 'bg-coffee-100 text-coffee-700',
  changed: 'bg-blue-100 text-blue-700',
};

const colorForAction = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k));
  return key ? ACTION_COLORS[key] : 'bg-coffee-100 text-coffee-700';
};

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatDetails = (details: string | null) => {
  if (!details) return '—';
  try {
    const parsed = JSON.parse(details);
    if ('from' in parsed || 'to' in parsed) {
      const from = parsed.from ?? '—';
      const to = parsed.to ?? '—';
      return `${humanize(String(from))} → ${humanize(String(to))}`;
    }
    return Object.entries(parsed)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${humanize(k)}: ${v}`)
      .join(', ') || '—';
  } catch {
    return details;
  }
};

const ACTION_OPTIONS = [
  'booking_status_changed', 'payment_verified', 'booking_confirmed', 'booking_archived', 'booking_cancelled', 'booking_notes_updated',
  'amenity_booking_status_changed', 'amenity_booking_archived', 'amenity_booking_cancelled', 'amenity_booking_notes_updated',
  'room_created', 'room_updated', 'room_deactivated',
  'amenity_created', 'amenity_updated', 'amenity_deactivated',
  'housekeeping_status_changed',
  'staff_created', 'staff_updated', 'user_deleted',
  'faq_created', 'faq_updated', 'faq_deleted',
  'feedback_hidden', 'feedback_unhidden', 'feedback_deleted',
  'pos_sale_recorded', 'pos_rentals_returned', 'pos_sale_voided',
];

const ENTITY_TYPE_OPTIONS = ['booking', 'amenity_booking', 'room', 'amenity', 'user', 'faq', 'feedback', 'pos_transaction'];

export const AuditLogsDashboard = ({ currentUser }: AuditLogsDashboardProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const authHeaders = {
    'x-user-id': currentUser?.id?.toString() || '',
    'x-user-role': currentUser?.role || '',
  };

  const fetchLogs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('fetchLogs failed:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, actionFilter, entityTypeFilter, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    setIsLoading(true);
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, entityTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => { setPage(0); setActionFilter(e.target.value); }}
            className="px-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 bg-[#FDF8F3] text-coffee-800 font-medium"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map(a => <option key={a} value={a}>{humanize(a)}</option>)}
          </select>
          <select
            value={entityTypeFilter}
            onChange={(e) => { setPage(0); setEntityTypeFilter(e.target.value); }}
            className="px-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 bg-[#FDF8F3] text-coffee-800 font-medium"
          >
            <option value="">All Entities</option>
            {ENTITY_TYPE_OPTIONS.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#A3402A] text-[#5C3321] text-sm font-bold hover:bg-coffee-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#A3402A] overflow-hidden flex-grow flex flex-col">
        <div className="flex-grow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[#A3402A] text-[10px] uppercase tracking-widest bg-[#FDF8F3] border-b border-coffee-100">
              <tr>
                <th className="px-8 py-6 font-bold">DATE / TIME</th>
                <th className="px-8 py-6 font-bold">ACTOR</th>
                <th className="px-8 py-6 font-bold">ACTION</th>
                <th className="px-8 py-6 font-bold">ENTITY</th>
                <th className="px-8 py-6 font-bold">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-[#5C3321]/40 text-sm font-medium">
                    <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" /> Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-[#5C3321]/40 text-sm font-medium">
                    <ScrollText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    No audit log entries found.
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-coffee-50/50 transition-colors align-top">
                  <td className="px-8 py-6 text-xs text-coffee-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-coffee-900">{log.actor_name || 'Unknown'}</div>
                    <div className="text-[10px] text-coffee-400 uppercase tracking-wider">{log.actor_role || 'unknown'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest ${colorForAction(log.action)}`}>
                      {humanize(log.action).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-coffee-700">
                    <div className="font-medium">{log.entity_label || `#${log.entity_id ?? '—'}`}</div>
                    <div className="text-[10px] text-coffee-400 uppercase tracking-wider">{humanize(log.entity_type)}</div>
                  </td>
                  <td className="px-8 py-6 text-xs text-coffee-600 max-w-xs">{formatDetails(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-coffee-100 text-xs text-coffee-500 font-medium">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-coffee-200 disabled:opacity-40 hover:bg-coffee-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-coffee-200 disabled:opacity-40 hover:bg-coffee-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
