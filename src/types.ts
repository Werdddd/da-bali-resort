export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'guest' | 'admin' | 'staff';
  contact_no?: string;
  address?: string;
  schedule?: string;
  position?: string;
  created_at?: string;
}

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
