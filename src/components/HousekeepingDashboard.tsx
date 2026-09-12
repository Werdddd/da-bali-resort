import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Wrench,
  LogOut,
  History,
  X,
  AlertTriangle,
  ClipboardList,
  Play,
  Undo2,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { Room, User, HousekeepingLog } from '../types';
import { getRoomStatusLabel, getRoomStatusBadgeClass } from '../utils/roomStatus';

interface HousekeepingDashboardProps {
  currentUser: User;
  onRoomsRefresh: () => Promise<void>;
  setToastMessage: (msg: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

// The real housekeeping lifecycle: a room goes Dirty (checkout) -> In Progress (attendant
// working on it) -> Available (ready for the next guest). Maintenance can be reported from
// any non-occupied state and always routes back through Dirty once resolved, since a room
// that just had a repair still needs to be cleaned before it's guest-ready.
type CleaningStatus = 'available' | 'dirty' | 'in_progress' | 'maintenance';

const safeDate = (value?: string | null) => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

export const HousekeepingDashboard = ({ currentUser, onRoomsRefresh, setToastMessage }: HousekeepingDashboardProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [logs, setLogs] = useState<HousekeepingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRoomId, setProcessingRoomId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  const authHeaders = {
    'x-user-id': currentUser?.id?.toString() || '',
    'x-user-role': currentUser?.role || ''
  };

  const fetchHousekeepingRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/housekeeping/rooms', { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetchHousekeepingRooms failed:', e);
    }
  }, [currentUser?.id, currentUser?.role]);

  const fetchHousekeepingLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/housekeeping/logs', { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('fetchHousekeepingLogs failed:', e);
    }
  }, [currentUser?.id, currentUser?.role]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchHousekeepingRooms(), fetchHousekeepingLogs()]);
    setIsLoading(false);
  }, [fetchHousekeepingRooms, fetchHousekeepingLogs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const updateRoomStatus = async (room: Room, status: CleaningStatus, notes?: string) => {
    setProcessingRoomId(room.id);
    try {
      const res = await fetch(`/api/rooms/${room.id}/housekeeping-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status, notes })
      });
      if (res.ok) {
        setToastMessage({
          title: 'Success',
          message: `${room.name} is now ${getRoomStatusLabel(status)}.`,
          type: 'success'
        });
        await Promise.all([fetchHousekeepingRooms(), fetchHousekeepingLogs(), onRoomsRefresh()]);
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMessage({ title: 'Error', message: data.error || 'Failed to update room status.', type: 'error' });
      }
    } catch (e) {
      console.error('updateRoomStatus failed:', e);
      setToastMessage({ title: 'Error', message: 'An error occurred while updating the room.', type: 'error' });
    } finally {
      setProcessingRoomId(null);
    }
  };

  const openMaintenanceModal = (room: Room) => {
    setMaintenanceRoom(room);
    setMaintenanceNotes(room.housekeeping_notes || '');
  };

  const submitMaintenance = async () => {
    if (!maintenanceRoom) return;
    await updateRoomStatus(maintenanceRoom, 'maintenance', maintenanceNotes.trim() || undefined);
    setMaintenanceRoom(null);
    setMaintenanceNotes('');
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const filteredRooms = rooms.filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const dirtyRooms = filteredRooms.filter(r => r.status === 'dirty');
  const inProgressRooms = filteredRooms.filter(r => r.status === 'in_progress');
  const availableRooms = filteredRooms.filter(r => r.status === 'available');
  const occupiedRooms = filteredRooms.filter(r => r.status === 'occupied');
  const maintenanceRooms = filteredRooms.filter(r => r.status === 'maintenance');

  const isRushRoom = (room: Room) => !!room.next_booking && room.next_booking.check_in <= todayStr;

  // The one actionable list: every room that needs a housekeeping decision right now.
  // Rush rooms (a new guest is arriving today) always float to the top.
  const priorityQueue = [...dirtyRooms, ...inProgressRooms, ...maintenanceRooms].sort((a, b) => {
    const aRush = isRushRoom(a) ? 1 : 0;
    const bRush = isRushRoom(b) ? 1 : 0;
    if (aRush !== bRush) return bRush - aRush;
    const order: Record<string, number> = { dirty: 0, in_progress: 1, maintenance: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (a.name || '').localeCompare(b.name || '');
  });

  // Occupied rooms checking out today: nothing to do yet, but housekeeping can see it coming.
  const expectedCheckouts = filteredRooms.filter(r => r.status === 'occupied' && !!r.checkout_today);

  const kpiCards = [
    { title: 'Needs Cleaning', icon: Sparkles, count: dirtyRooms.length, color: 'bg-amber-50 text-amber-600' },
    { title: 'Cleaning In Progress', icon: Play, count: inProgressRooms.length, color: 'bg-purple-50 text-purple-600' },
    { title: 'Ready for Guests', icon: CheckCircle2, count: availableRooms.length, color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Under Maintenance', icon: Wrench, count: maintenanceRooms.length, color: 'bg-red-50 text-red-600' },
  ];

  const statusOverviewRooms = [...dirtyRooms, ...inProgressRooms, ...maintenanceRooms, ...occupiedRooms, ...availableRooms];

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto py-2 px-4 lg:px-0 space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActivity(true)}
              className="bg-white border border-coffee-200 text-coffee-700 px-4 py-2.5 rounded-xl font-bold hover:bg-coffee-50 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <History className="h-4 w-4" /> Recent Activity
            </button>
            <button
              onClick={() => refreshAll()}
              disabled={isLoading}
              className="bg-[#5C3321] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#4A291A] transition-all flex items-center gap-2 text-sm whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-[#A3402A] shadow-sm hover:shadow-md transition-all"
            >
              <div className={`p-2.5 rounded-xl ${card.color} w-fit mb-3`}>
                <card.icon className="h-4 w-4" />
              </div>
              <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest mb-1">{card.title}</p>
              <h4 className="text-xl font-serif font-bold text-coffee-900">{card.count}</h4>
            </motion.div>
          ))}
        </div>

        {/* Expected Checkouts Today: informational only — nothing to clean until the guest leaves */}
        {expectedCheckouts.length > 0 && (
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-coffee-900">Expected Checkouts Today</h3>
              <span className="text-[10px] text-coffee-400">— these will need cleaning once the guest departs</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {expectedCheckouts.map(room => (
                <span key={room.id} className="px-3 py-1.5 bg-white border border-blue-100 rounded-xl text-xs text-coffee-700">
                  <span className="font-bold">{room.name}</span>
                  {room.checkout_today && <span className="text-coffee-400"> · {room.checkout_today.first_name} {room.checkout_today.last_name}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Priority Cleaning Queue: the single place to act on a room */}
        <div className="bg-white rounded-3xl border border-[#A3402A] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-coffee-50 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-coffee-500" />
            <h3 className="text-lg font-bold text-coffee-900">Priority Cleaning Queue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                <tr>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Next Guest</th>
                  <th className="px-6 py-4">Last Cleaned</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {priorityQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-coffee-400 text-sm italic">
                      All caught up! No rooms need cleaning right now.
                    </td>
                  </tr>
                ) : (
                  priorityQueue.map(room => {
                    const rush = isRushRoom(room);
                    const lastCleaned = safeDate(room.last_cleaned_at);
                    return (
                      <tr key={room.id} className="hover:bg-coffee-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-coffee-900 text-sm">{room.name}</p>
                            {rush && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[8px] font-bold uppercase tracking-widest rounded-full">Rush</span>
                            )}
                          </div>
                          <p className="text-[10px] text-coffee-400 uppercase tracking-wider">{room.type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getRoomStatusBadgeClass(room.status)}`}>
                            {getRoomStatusLabel(room.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-coffee-600">
                          {room.next_booking ? (
                            <span>{room.next_booking.first_name} {room.next_booking.last_name} · {format(parseISO(room.next_booking.check_in), 'MMM dd')}</span>
                          ) : (
                            <span className="text-coffee-300">None scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-coffee-600 font-mono">
                          {lastCleaned ? format(lastCleaned, 'MMM dd, hh:mm a') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {room.status === 'dirty' && (
                              <button
                                onClick={() => updateRoomStatus(room, 'in_progress')}
                                disabled={processingRoomId === room.id}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-purple-700 transition-all disabled:opacity-60 flex items-center gap-1.5"
                              >
                                <Play className="h-3 w-3" /> Start Cleaning
                              </button>
                            )}
                            {room.status === 'in_progress' && (
                              <>
                                <button
                                  onClick={() => updateRoomStatus(room, 'dirty')}
                                  disabled={processingRoomId === room.id}
                                  className="p-2 text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 rounded-lg transition-all"
                                  title="Cancel — put back to Dirty"
                                >
                                  <Undo2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateRoomStatus(room, 'available')}
                                  disabled={processingRoomId === room.id}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-60 flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Mark Clean
                                </button>
                              </>
                            )}
                            {room.status === 'maintenance' && (
                              <button
                                onClick={() => updateRoomStatus(room, 'dirty')}
                                disabled={processingRoomId === room.id}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-all disabled:opacity-60"
                              >
                                Mark Fixed
                              </button>
                            )}
                            {room.status !== 'maintenance' && (
                              <button
                                onClick={() => openMaintenanceModal(room)}
                                disabled={processingRoomId === room.id}
                                className="p-2 text-coffee-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Report Maintenance Issue"
                              >
                                <Wrench className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Room Status Overview: at-a-glance board for the whole property, read-mostly */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="h-4 w-4 text-coffee-500" />
            <h3 className="text-lg font-bold text-coffee-900">Room Status Overview</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {statusOverviewRooms.map(room => (
              <div key={room.id} className="bg-white rounded-2xl border border-coffee-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-coffee-900">{room.name}</p>
                  {room.status !== 'occupied' && room.status !== 'maintenance' && (
                    <button
                      onClick={() => openMaintenanceModal(room)}
                      disabled={processingRoomId === room.id}
                      className="p-1 text-coffee-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                      title="Report Maintenance Issue"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoomStatusBadgeClass(room.status)}`}>
                  {getRoomStatusLabel(room.status)}
                </span>
                {room.status === 'occupied' && (
                  <p className="text-[10px] text-coffee-400 mt-2">
                    {room.current_occupancy ? `Checkout: ${format(parseISO(room.current_occupancy.check_out), 'MMM dd')}` : 'Currently occupied'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Maintenance Modal */}
      <AnimatePresence>
        {maintenanceRoom && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMaintenanceRoom(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-serif font-bold text-coffee-900">Report Maintenance Issue</h3>
              </div>
              <p className="text-sm text-coffee-600 mb-4">{maintenanceRoom.name} will be marked Under Maintenance and removed from bookable rooms until it's marked fixed.</p>
              <textarea
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="Describe the issue (e.g. broken AC, plumbing leak)..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-white text-sm outline-none focus:ring-2 focus:ring-coffee-500/20 shadow-sm mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setMaintenanceRoom(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitMaintenance}
                  disabled={processingRoomId === maintenanceRoom.id}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md text-sm disabled:opacity-60"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Activity Modal */}
      <AnimatePresence>
        {showActivity && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivity(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/30">
                <h2 className="text-xl font-serif font-bold text-coffee-900">Recent Housekeeping Activity</h2>
                <button onClick={() => setShowActivity(false)} className="p-2 hover:bg-coffee-100 rounded-full transition-all">
                  <X className="h-5 w-5 text-coffee-400" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                    <tr>
                      <th className="px-6 py-4">Room</th>
                      <th className="px-6 py-4">Change</th>
                      <th className="px-6 py-4">By</th>
                      <th className="px-6 py-4">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coffee-50">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-coffee-400 text-sm italic">No activity recorded yet.</td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="hover:bg-coffee-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-coffee-900 text-sm">{log.room_name || `Room #${log.room_id}`}</td>
                          <td className="px-6 py-4 text-xs text-coffee-600">
                            {getRoomStatusLabel(log.previous_status)} → {getRoomStatusLabel(log.new_status)}
                            {log.notes && <p className="text-coffee-400 italic mt-0.5">"{log.notes}"</p>}
                          </td>
                          <td className="px-6 py-4 text-xs text-coffee-600">
                            {log.staff_first_name ? `${log.staff_first_name} ${log.staff_last_name}` : 'Automated'}
                          </td>
                          <td className="px-6 py-4 text-xs text-coffee-500 font-mono">
                            {format(new Date(log.created_at), 'MMM dd, hh:mm a')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
