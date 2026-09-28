import React, { useState, useEffect, useCallback } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { User, StaffRecord } from '../types';

interface TimeClockCardProps {
  user: User;
  onChange?: () => void;
  setToastMessage: (msg: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

const statusBadgeClass = (status?: string) =>
  status === 'late' ? 'bg-amber-100 text-amber-700' :
  status === 'present' ? 'bg-emerald-100 text-emerald-700' :
  'bg-gray-100 text-gray-500';

// Self-service time clock for staff and housekeeping accounts. The server records the
// time from its own clock against the logged-in account.
export const TimeClockCard = ({ user, onChange, setToastMessage }: TimeClockCardProps) => {
  const [now, setNow] = useState(new Date());
  const [record, setRecord] = useState<StaffRecord | null>(null);
  const [recent, setRecent] = useState<StaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-dtr/me');
      if (!res.ok) return;
      const data = await res.json();
      setRecord(data.record);
      setRecent(Array.isArray(data.recent) ? data.recent : []);
    } catch (e) {
      console.error('Failed to load time clock:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const punch = async (kind: 'in' | 'out') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/staff-dtr/check-${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToastMessage({
          title: kind === 'in' ? 'Timed In' : 'Timed Out',
          message: kind === 'in'
            ? `Recorded at ${data.check_in}${data.status === 'late' ? ' (late)' : ''}.`
            : `Recorded at ${data.check_out}. Have a good rest!`,
          type: 'success'
        });
        await load();
        onChange?.();
      } else {
        setToastMessage({ title: 'Error', message: data.error || `Failed to time ${kind}.`, type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToastMessage({ title: 'Error', message: 'A network error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDone = !!record?.check_out;
  const isIn = !!record && !isDone;

  return (
    <div className="max-w-5xl mx-auto w-full mb-6">
      <div className="bg-white rounded-3xl border border-[#A3402A] shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-2xl bg-coffee-50 text-[#A3402A] shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest">
                My Attendance · {format(now, 'EEEE, MMM d')}
              </p>
              <p className="text-2xl font-serif font-bold text-coffee-900 tabular-nums">{format(now, 'h:mm:ss a')}</p>
              <p className="text-xs text-coffee-500 mt-0.5">
                {isLoading ? 'Loading…' :
                  !record ? `Not timed in yet${user.schedule ? ` · Schedule ${user.schedule}` : ''}` :
                  isIn ? <>Timed in at <span className="font-bold">{record.check_in}</span></> :
                  <>In <span className="font-bold">{record.check_in}</span> · Out <span className="font-bold">{record.check_out}</span></>}
                {record && (
                  <span className={`ml-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(record.status)}`}>
                    {record.status}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRecent(v => !v)}
              className="p-2.5 rounded-xl text-coffee-500 hover:bg-coffee-50 transition-colors"
              title="My recent attendance"
            >
              <History className="h-5 w-5" />
            </button>
            {isDone ? (
              <span className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Done for today
              </span>
            ) : (
              <button
                onClick={() => punch(isIn ? 'out' : 'in')}
                disabled={isLoading || isSubmitting}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all disabled:opacity-60 ${
                  isIn ? 'bg-[#5C3321] hover:bg-[#4A291A]' : 'bg-[#A3402A] hover:bg-[#8B3624]'
                }`}
              >
                {isIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {isSubmitting ? 'Saving…' : isIn ? 'Time Out' : 'Time In'}
              </button>
            )}
          </div>
        </div>

        {showRecent && (
          <div className="mt-5 pt-4 border-t border-coffee-50">
            {recent.length === 0 ? (
              <p className="text-xs text-coffee-400 italic">No attendance records yet.</p>
            ) : (
              <div className="divide-y divide-coffee-50">
                {recent.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                    <span className="font-bold text-coffee-900 w-28">{format(parseISO(r.date), 'EEE, MMM d')}</span>
                    <span className="font-mono text-coffee-600 flex-1">IN {r.check_in || '--:--'} · OUT {r.check_out || '--:--'}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(r.status)}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
