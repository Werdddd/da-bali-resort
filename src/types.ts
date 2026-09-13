export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'guest' | 'admin' | 'staff' | 'housekeeping';
  contact_no?: string;
  address?: string;
  schedule?: string;
  position?: string;
  created_at?: string;
}

// 'available' and 'occupied' are driven by the booking lifecycle (see server.ts booking status
// transitions); 'dirty', 'in_progress', and 'maintenance' are driven by the housekeeping module.
// Only 'available' rooms can be booked (enforced server-side in POST /api/bookings and
// POST /api/bookings/walk-in).
export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'in_progress' | 'maintenance' | 'inactive';

export interface Room {
  id: number;
  name: string;
  type: string;
  description: string;
  price: number;
  capacity: number;
  beds: string;
  image_url: string;
  images?: string[];
  status: string;
  last_cleaned_at?: string | null;
  housekeeping_notes?: string | null;
  // Populated only by GET /api/housekeeping/rooms
  checkout_today?: Booking | null;
  current_occupancy?: Booking | null;
  next_booking?: Booking | null;
}

export interface HousekeepingLog {
  id: number;
  room_id: number;
  room_name?: string;
  staff_id: number | null;
  staff_first_name?: string;
  staff_last_name?: string;
  previous_status: string;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  check_in: string;
  check_out: string;
  total_price: number;
  status: 'pending' | 'pending_verification' | 'confirmed' | 'cancelled' | 'checked-in' | 'Completed' | 'no-show' | 'rejected';
  payment_method: string;
  payment_status?: 'Pending' | 'Partially Paid' | 'Fully Paid';
  qr_code: string;
  proof_of_payment?: string;
  transaction_reference?: string;
  amount_paid?: number;
  balance_proof_of_payment?: string;
  balance_transaction_reference?: string;
  balance_amount_paid?: number;
  created_at: string;
  room_name?: string;
  image_url?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  guests_count: number;
  extra_bed: number;
  admin_notes?: string;
  is_archived?: number;
}

export interface AmenityBooking {
  id: number;
  user_id: number;
  amenity_id: number;
  reservation_date: string;
  reservation_time: string;
  pax_count: number;
  details: string;
  status: 'pending' | 'pending_verification' | 'confirmed' | 'cancelled' | 'checked-in' | 'completed' | 'Completed' | 'rejected' | 'no-show';
  total_price: number;
  deposit_amount?: number;
  balance_amount?: number;
  payment_method?: string;
  created_at: string;
  amenity_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  proof_of_payment?: string;
  payment_status?: 'Pending' | 'Partially Paid' | 'Fully Paid';
  transaction_reference?: string;
  amount_paid?: number;
  qr_code?: string;
  balance_proof_of_payment?: string;
  balance_transaction_reference?: string;
  balance_amount_paid?: number;
  admin_notes?: string;
  is_archived?: number;
}

export interface Feedback {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface StaffRecord {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  check_in: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late' | 'on-leave';
  date: string;
  schedule?: string;
}

export interface Analytics {
  revenue: number;
  monthly_revenue: number;
  bookings: number;
  amenity_bookings: number;
  users: number;
  rooms: number;
  // Booked room-nights / available room-nights for the current calendar month.
  occupancy_rate: number;
  booked_room_nights: number;
  available_room_nights: number;
}

export interface AnalyticsMonthPoint {
  month: string;
  revenue: number;
}

export interface OccupancyMonthPoint {
  month: string;
  occupancy_rate: number;
  booked_room_nights: number;
  available_room_nights: number;
}

export interface RoomTypeBreakdown {
  type: string;
  bookings: number;
  revenue: number;
}

export interface AmenityBreakdown {
  name: string;
  bookings: number;
  revenue: number;
  stock: number | null;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  total: number;
}

export interface BookingStatusBreakdown {
  status: string;
  count: number;
}

export interface AnalyticsDetailed {
  revenueTrend: AnalyticsMonthPoint[];
  occupancyTrend: OccupancyMonthPoint[];
  roomTypeBreakdown: RoomTypeBreakdown[];
  amenityBreakdown: AmenityBreakdown[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  bookingStatusBreakdown: BookingStatusBreakdown[];
}

export interface Amenity {
  id: number;
  name: string;
  description: string;
  icon: string;
  image_url?: string;
  images?: string[];
  location?: string;
  price: number;
  stock?: number | null;
  status: 'active' | 'inactive';
}

export interface HeroBanner {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link_url?: string;
  type: 'Announcement' | 'Advertisement' | 'Promotion' | '';
  is_active: number;
  order_index: number;
  created_at: string;
}
