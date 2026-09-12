import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  RefreshCw, 
  FileText, 
  User as UserIcon, 
  Clock, 
  X, 
  Edit, 
  Grid3X3,
  Search,
  Trash2,
  Eye,
  History,
  Download,
  CalendarDays,
  Plus,
  CheckCircle2,
  UserX,
  LogIn,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker from 'react-datepicker';
import { format, startOfToday, addDays, isWithinInterval, parseISO } from 'date-fns';
import { StaffRecord, User } from '../types';

interface DTRDashboardProps {
  staffRecord: StaffRecord[];
  staffMembers: User[];
  currentUser: User;
  onCheckIn: (userId: number) => Promise<boolean>;
  onCheckOut: (userId: number) => Promise<boolean>;
  onAddStaff: (firstName: string, lastName: string, workSchedule: string, position: string, role: 'staff' | 'housekeeping') => Promise<void>;
  onEditStaff: (staff: User) => void;
  onDeleteStaff: (staffId: number) => Promise<void>;
  fetchAdminData: () => Promise<void>;
  setToastMessage: (msg: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  setConfirmDialog: (dialog: { title: string; message: string; onConfirm: () => void; onCancel: () => void } | null) => void;
  onExport?: () => void;
  onExportAttendance?: (startDate: string, endDate: string) => void;
  view?: 'dashboard' | 'management' | 'history';
}

import { TimePickerModal } from './TimePickerModal';

export const DTRDashboard = ({ 
  staffRecord, 
  staffMembers, 
  currentUser, 
  onCheckIn,
  onCheckOut,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  fetchAdminData,
  setToastMessage,
  setConfirmDialog,
  onExport,
  onExportAttendance,
  view = 'dashboard'
}: DTRDashboardProps) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Use a local confirm state to keep confirmation modals within the dashboard context
  const [localConfirm, setLocalConfirm] = useState<{ title: string; message: string; onConfirm: () => void; onCancel: () => void } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [staffHistory, setStaffHistory] = useState<StaffRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newStaffFirstName, setNewStaffFirstName] = useState('');
  const [newStaffLastName, setNewStaffLastName] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'housekeeping'>('staff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffStartTime, setNewStaffStartTime] = useState('08:00');
  const [newStaffEndTime, setNewStaffEndTime] = useState('17:00');

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const format12h = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  const [historyStartDate, setHistoryStartDate] = useState<string>(format(addDays(new Date(), -7), 'yyyy-MM-dd'));
  const [historyEndDate, setHistoryEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchStaffHistory = async (userId: number) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/attendance/history/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      setStaffHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const safeStaffRecords = Array.isArray(staffRecord) ? staffRecord : [];
  const safeStaffMembers = Array.isArray(staffMembers) ? staffMembers : [];

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = safeStaffRecords.filter(r => r.date === todayStr);

  const kpiCards = [
    { title: 'Total Staff', icon: Users, count: safeStaffMembers.length.toString(), color: 'bg-blue-50 text-blue-600' },
    { title: 'Present Today', icon: CheckCircle2, count: todayRecords.filter(r => r.status === 'present').length.toString(), color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Late Today', icon: Clock, count: todayRecords.filter(r => r.status === 'late').length.toString(), color: 'bg-amber-50 text-amber-600' },
    { title: 'Absent Today', icon: UserX, count: (safeStaffMembers.length - todayRecords.length).toString(), color: 'bg-red-50 text-red-600' },
  ];

  const filteredHistory = safeStaffRecords.filter(r => {
    const recordDate = r.date;
    return recordDate >= historyStartDate && recordDate <= historyEndDate;
  });

  const handleStaffCheckIn = async (userId: number) => {
    setLocalConfirm({
      title: 'Confirm Check-In',
      message: 'Are you sure you want to record a check-in for this staff member?',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const success = await onCheckIn(userId);
          if (success) {
            setToastMessage({ title: 'Success', message: 'Checked in successfully!', type: 'success' });
            fetchAdminData().catch(err => console.error("Failed to refresh admin data after check-in:", err));
          }
        } catch (error) {
          console.error("Check-in error:", error);
          setToastMessage({ title: 'Error', message: 'Failed to check in. Please try again.', type: 'error' });
        } finally {
          setIsProcessing(false);
          setLocalConfirm(null);
        }
      },
      onCancel: () => setLocalConfirm(null)
    });
  };

  const handleStaffCheckOut = async (userId: number) => {
    setLocalConfirm({
      title: 'Confirm Check-Out',
      message: 'Are you sure you want to record a check-out for this staff member?',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const success = await onCheckOut(userId);
          if (success) {
            setToastMessage({ title: 'Success', message: 'Checked out successfully!', type: 'success' });
            fetchAdminData().catch(err => console.error("Failed to refresh admin data after check-out:", err));
          }
        } catch (error) {
          console.error("Check-out error:", error);
          setToastMessage({ title: 'Error', message: 'Failed to check out. Please try again.', type: 'error' });
        } finally {
          setIsProcessing(false);
          setLocalConfirm(null);
        }
      },
      onCancel: () => setLocalConfirm(null)
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto py-2 px-4 lg:px-0">
        {view === 'dashboard' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          <div className="bg-white rounded-3xl border border-[#A3402A] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-coffee-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-coffee-900">Staff Attendance Directory</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" />
                <input 
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-coffee-50/50 border border-[#A3402A] text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time Logs</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50">
                  {(() => {
                    const filteredStaff = safeStaffMembers
                      .filter(s => 
                        (s.first_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                        (s.last_name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
                      )
                      .sort((a, b) => {
                        if (a.role === 'admin') return -1;
                        if (b.role === 'admin') return 1;
                        return 0;
                      });

                    if (filteredStaff.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-coffee-400 text-sm italic">No records for staff</td>
                        </tr>
                      );
                    }

                    return filteredStaff.map((staff) => {
                      const todayRec = todayRecords.find(r => r.user_id === staff.id);
                      return (
                        <tr key={staff.id} className="hover:bg-coffee-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700 font-bold text-xs border border-[#A3402A]/10 shadow-sm">
                                {staff.first_name[0]}{staff.last_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-coffee-900 text-sm">{staff.first_name} {staff.last_name}</p>
                                <p className="text-[10px] text-coffee-400 uppercase tracking-wider">{staff.position || (staff.role === 'admin' ? 'Administrator' : 'Staff')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {todayRec ? (
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                todayRec.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                todayRec.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                todayRec.status === 'on-leave' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {todayRec.status}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-coffee-600 font-mono">
                            {todayRec ? (
                              <div className="flex flex-col gap-0.5">
                                <span>IN: {todayRec.check_in || '--:--'}</span>
                                <span>OUT: {todayRec.check_out || '--:--'}</span>
                              </div>
                            ) : '--:--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {currentUser.role === 'admin' && (
                                <>
                                  {!todayRec ? (
                                    <button 
                                      onClick={() => handleStaffCheckIn(staff.id)}
                                      disabled={isProcessing}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                      title="Check In"
                                    >
                                      <LogIn className="h-4 w-4" />
                                    </button>
                                  ) : !todayRec.check_out && (
                                    <button 
                                      onClick={() => handleStaffCheckOut(staff.id)}
                                      disabled={isProcessing}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      title="Check Out"
                                    >
                                      <LogOut className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedStaff(staff);
                                  fetchStaffHistory(staff.id);
                                  setShowHistoryModal(true);
                                }}
                                className="p-2 text-coffee-400 hover:text-coffee-900 hover:bg-coffee-50 rounded-lg transition-all"
                                title="View History"
                              >
                                <History className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : view === 'management' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-2xl font-serif font-bold text-coffee-900">Employee Database</h3>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" />
                <input 
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                />
              </div>
              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                  className="bg-[#A3402A] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#8B3624] transition-all shadow-md flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add Staff
                </button>
              )}
              {onExport && (
                <button 
                  onClick={onExport}
                  className="bg-[#5C3321] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#4A291A] transition-all shadow-md flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showAddStaffForm && currentUser.role === 'admin' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-coffee-50 p-6 rounded-3xl border border-[#A3402A] mb-6">
                  <h4 className="text-sm font-bold text-coffee-900 mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Register New Employee
                  </h4>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const schedule = `${newStaffStartTime} - ${newStaffEndTime}`;
                      try {
                        await onAddStaff(newStaffFirstName, newStaffLastName, schedule, newStaffPosition, newStaffRole);
                        setNewStaffFirstName('');
                        setNewStaffLastName('');
                        setNewStaffPosition('');
                        setNewStaffRole('staff');
                        setNewStaffStartTime('08:00');
                        setNewStaffEndTime('17:00');
                        setShowAddStaffForm(false);
                      } catch (error) {
                        console.error("Failed to add staff:", error);
                        setToastMessage({ title: 'Error', message: 'Failed to add staff member.', type: 'error' });
                      }
                    }}
                    className="flex flex-col lg:flex-row items-end gap-3"
                  >
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest px-1">First Name</label>
                      <input 
                        type="text" 
                        placeholder="John" 
                        value={newStaffFirstName} 
                        onChange={(e) => setNewStaffFirstName(e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-white text-sm outline-none focus:ring-2 focus:ring-coffee-500/20 shadow-sm" 
                        required 
                      />
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest px-1">Last Name</label>
                      <input 
                        type="text" 
                        placeholder="Doe" 
                        value={newStaffLastName} 
                        onChange={(e) => setNewStaffLastName(e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-white text-sm outline-none focus:ring-2 focus:ring-coffee-500/20 shadow-sm" 
                        required 
                      />
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest px-1">Position</label>
                      <input
                        type="text"
                        placeholder="Concierge"
                        value={newStaffPosition}
                        onChange={(e) => setNewStaffPosition(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-white text-sm outline-none focus:ring-2 focus:ring-coffee-500/20 shadow-sm"
                        required
                      />
                    </div>

                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest px-1">Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as 'staff' | 'housekeeping')}
                        className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 bg-white text-sm outline-none focus:ring-2 focus:ring-coffee-500/20 shadow-sm"
                      >
                        <option value="staff">Staff</option>
                        <option value="housekeeping">Housekeeping</option>
                      </select>
                    </div>

                    <div className="flex-[1.5] w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest px-1">Schedule</label>
                      <div className="flex items-center bg-white rounded-xl border border-coffee-200 overflow-hidden focus-within:ring-2 focus-within:ring-coffee-500/20 transition-all shadow-sm">
                        <button 
                          type="button"
                          onClick={() => setIsStartOpen(true)}
                          className="flex-1 py-2.5 text-[11px] font-medium text-coffee-900 hover:bg-coffee-50 transition-colors"
                        >
                          {format12h(newStaffStartTime)}
                        </button>
                        <div className="px-1 text-[9px] font-bold text-coffee-300">TO</div>
                        <button 
                          type="button"
                          onClick={() => setIsEndOpen(true)}
                          className="flex-1 py-2.5 text-[11px] font-medium text-coffee-900 hover:bg-coffee-50 transition-colors"
                        >
                          {format12h(newStaffEndTime)}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="bg-coffee-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-coffee-800 transition-all flex items-center gap-2 whitespace-nowrap shadow-md active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register Staff</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staff Table */}
          <div className="bg-white rounded-3xl border border-[#A3402A] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50">
                                    {(() => {
                    const filteredStaff = safeStaffMembers
                      .filter(s => 
                        (s.first_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                        (s.last_name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
                      )
                      .sort((a, b) => {
                        if (a.role === 'admin') return -1;
                        if (b.role === 'admin') return 1;
                        return 0;
                      });
                    
                    if (filteredStaff.length === 0) {
                      return (
                        <tr className="hover:bg-transparent">
                          <td colSpan={3} className="px-6 py-20 text-center text-coffee-400 text-sm italic">No records for staff</td>
                        </tr>
                      );
                    }
                    
                    return filteredStaff.map((staff) => {
                      return (
                        <tr key={staff.id} className="hover:bg-coffee-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700 font-bold text-xs border border-[#A3402A]/10 shadow-sm">
                                {staff.first_name[0]}{staff.last_name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-coffee-900 text-sm">{staff.first_name} {staff.last_name}</p>
                                  {staff.role === 'admin' && (
                                    <span className="px-2 py-0.5 bg-coffee-900 text-white text-[8px] font-bold uppercase tracking-widest rounded-full">Admin</span>
                                  )}
                                  {staff.role === 'housekeeping' && (
                                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-full">Housekeeping</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-coffee-400 uppercase tracking-wider">{staff.position || (staff.role === 'admin' ? 'Administrator' : staff.role === 'housekeeping' ? 'Housekeeping' : 'Staff')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-coffee-600">{staff.schedule || 'Not Set'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {currentUser.role === 'admin' && (
                                <>
                                  <button 
                                    onClick={() => onEditStaff(staff)}
                                    className="p-2 text-coffee-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                    title="Edit Staff"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => onDeleteStaff(staff.id)}
                                    className="p-2 text-coffee-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                                    title="Remove Employee"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-2xl font-serif font-bold text-coffee-900">Attendance History</h3>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-coffee-200">
                <div className="flex items-center px-2 gap-2">
                  <span className="text-[10px] font-bold text-coffee-400 uppercase">From</span>
                  <input 
                    type="date" 
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="py-1.5 text-sm outline-none bg-transparent"
                  />
                </div>
                <div className="w-px h-4 bg-coffee-100" />
                <div className="flex items-center px-2 gap-2">
                  <span className="text-[10px] font-bold text-coffee-400 uppercase">To</span>
                  <input 
                    type="date" 
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="py-1.5 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" />
                <input 
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                />
              </div>
              {onExportAttendance && (
                <button 
                  onClick={() => onExportAttendance(historyStartDate, historyEndDate)}
                  className="bg-coffee-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-coffee-800 transition-all shadow-md flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#A3402A] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Check-In</th>
                    <th className="px-6 py-4">Check-Out</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-50">
                  {filteredHistory
                    .filter(r => {
                      const staff = safeStaffMembers.find(s => s.id === r.user_id);
                      if (!staff) return false;
                      return (staff.first_name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                             (staff.last_name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
                    })
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((record) => {
                      const staff = safeStaffMembers.find(s => s.id === record.user_id);
                      return (
                        <tr key={record.id} className="hover:bg-coffee-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-coffee-900 text-sm">
                            {format(parseISO(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700 font-bold text-[10px] border border-coffee-200">
                                {staff?.first_name[0]}{staff?.last_name[0]}
                              </div>
                              <p className="font-medium text-coffee-900 text-sm">{staff?.first_name} {staff?.last_name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-coffee-600 font-mono">{record.check_in || '--:--'}</td>
                          <td className="px-6 py-4 text-xs text-coffee-600 font-mono">{record.check_out || '--:--'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                              record.status === 'on-leave' ? 'bg-blue-100 text-blue-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-coffee-400 text-sm italic">No attendance records found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Time Picker Modals (Scoped to content area) */}
      <TimePickerModal 
        isOpen={isStartOpen} 
        onClose={() => setIsStartOpen(false)} 
        onSelect={(val) => setNewStaffStartTime(val)} 
        initialTime={newStaffStartTime}
        label="Working Starts" 
      />
      <TimePickerModal 
        isOpen={isEndOpen} 
        onClose={() => setIsEndOpen(false)} 
        onSelect={(val) => setNewStaffEndTime(val)} 
        initialTime={newStaffEndTime}
        label="Working Ends" 
      />

      <AnimatePresence>
        {showHistoryModal && selectedStaff && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/30">
                <div>
                  <h2 className="text-xl font-serif font-bold text-coffee-900">Attendance History</h2>
                  <p className="text-xs text-coffee-500 mt-1">{selectedStaff.first_name} {selectedStaff.last_name}</p>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-coffee-100 rounded-full transition-all"
                >
                  <X className="h-5 w-5 text-coffee-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="h-8 w-8 text-coffee-400 animate-spin" />
                    <p className="text-coffee-500 font-medium">Loading history...</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-coffee-50/50 text-coffee-500 text-[10px] font-bold uppercase tracking-widest border-b border-coffee-100">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Check-In</th>
                        <th className="px-6 py-4">Check-Out</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coffee-50">
                      {staffHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-coffee-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-coffee-900 text-sm">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 text-xs text-coffee-600 font-mono">{record.check_in || '--:--'}</td>
                          <td className="px-6 py-4 text-xs text-coffee-600 font-mono">{record.check_out || '--:--'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {staffHistory.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center text-coffee-400 text-sm italic">No attendance records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Confirmation Modal (Scoped to content area) */}
      <AnimatePresence>
        {localConfirm && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocalConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <h3 className="text-xl font-serif font-bold text-coffee-900 mb-2">{localConfirm.title}</h3>
              <p className="text-sm text-coffee-600 mb-6">{localConfirm.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    localConfirm.onCancel();
                    setLocalConfirm(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await localConfirm.onConfirm();
                    } catch (e) {
                      console.error("Local confirm action failed:", e);
                    }
                    setLocalConfirm(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md text-sm"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
