// Shared display metadata for Room.status, used by both the Room Management tab
// and the Housekeeping module so badges/labels stay consistent everywhere.

export const ROOM_STATUS_LABEL: Record<string, string> = {
  available: 'Clean',
  occupied: 'Occupied',
  dirty: 'Dirty',
  in_progress: 'Cleaning In Progress',
  maintenance: 'Under Maintenance',
  inactive: 'Inactive',
};

export const ROOM_STATUS_BADGE_CLASS: Record<string, string> = {
  available: 'bg-emerald-500 text-white',
  occupied: 'bg-blue-500 text-white',
  dirty: 'bg-amber-500 text-white',
  in_progress: 'bg-purple-500 text-white',
  maintenance: 'bg-red-600 text-white',
  inactive: 'bg-gray-500 text-white',
};

export function getRoomStatusLabel(status?: string | null): string {
  const key = (status || '').toLowerCase();
  return ROOM_STATUS_LABEL[key] || (status || 'Unknown');
}

export function getRoomStatusBadgeClass(status?: string | null): string {
  const key = (status || '').toLowerCase();
  return ROOM_STATUS_BADGE_CLASS[key] || 'bg-gray-400 text-white';
}
