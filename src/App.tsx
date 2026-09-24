import React, { useState, useEffect, useRef, useMemo } from 'react';
import Markdown from 'react-markdown';
import DatePicker from 'react-datepicker';
import { 
  Hotel, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  Users,
  LayoutDashboard, 
  Bed, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  Menu, 
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  QrCode,
  CheckCircle2,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
  Utensils,
  Star,
  HelpCircle,
  Waves,
  Flower,
  Coffee,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  XCircle,
  Settings,
  Upload,
  UserX,
  AlertTriangle,
  FileText,
  Save,
  UserPlus,
  ArrowLeft,
  Heart,
  Archive,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  Loader2,
  TrendingUp,
  Printer,
  Sparkles,
  Wrench,
  ClipboardList,
  PieChart,
  Percent,
  ScrollText,
  Bot,
  ImageOff,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { format, addDays, differenceInDays, isBefore, startOfToday, getDaysInMonth, startOfMonth } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { User, Room, Booking, Analytics, Amenity, Feedback, StaffRecord, AmenityBooking, HeroBanner } from './types';
import { AMENITY_OPTIONS } from './amenityOptions';
import { DTRDashboard } from './components/DTRDashboard';
import { TimePickerModal } from './components/TimePickerModal';
import { HousekeepingDashboard } from './components/HousekeepingDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuditLogsDashboard } from './components/AuditLogsDashboard';
import { FeedbackManagementDashboard } from './components/FeedbackManagementDashboard';
import { FaqManagementDashboard } from './components/FaqManagementDashboard';
import { ResortChatWidget, ChatTab } from './components/ResortChatWidget';
import { SupportChatMessage } from './components/StaffChatPanel';
import { getRoomStatusLabel, getRoomStatusBadgeClass } from './utils/roomStatus';
import bgImage from './476799607_640944451796572_5504544646714415496_n.jpg';

// --- Amenity Images ---
import infinityPoolImg1 from './Infinity Pool-1.jpg';
import infinityPoolImg2 from './480406880_644040298153654_2463853349071358905_n.jpg';
import infinityPoolImg3 from './Gemini_Generated_Image_kjvmjykjvmjykjvm-5e2ae1f2-825a-4783-8463-521651433e35.png';
import infinityPoolImg4 from './Gemini_Generated_Image_oe3usqoe3usqoe3u-2b1871a5-59ee-4f41-9b56-1cc75fc0b54f.png';
import infinityPoolImg5 from './480445259_644030531487964_9076444296381717985_n.jpg';

import fineDiningImg1 from './Fine Dining.jpg';
import fineDiningImg2 from './481790925_653967750494242_6026827539068098534_n.jpg';
import fineDiningImg3 from './Gemini_Generated_Image_iyqatyiyqatyiyqa-d19134c9-b152-46be-85ae-e74e55cfde87.png';
import fineDiningImg4 from './Gemini_Generated_Image_n684p0n684p0n684-92668cd0-1ee0-4912-8a99-2f3286fdc34b.png';

import pavilionImg1 from './Pavilion.jpg';
import pavilionImg2 from './643787299_1216608037352086_6279788972109671811_n.jpg';
import pavilionImg3 from './646469465_1325380779615286_8192261069276533553_n.jpg';
import pavilionImg4 from './475775117_632931419264542_2841795206770194977_n.jpg';
import pavilionImg5 from './479978587_641307308426953_3407257930518345529_n.jpg';
import welcomeBannerImg from './476799607_640944451796572_5504544646714415496_n-1.jpg';

import coloredTentImg1 from './Colored Tent.jpg';
import coloredTentImg2 from './480084227_641106218447062_3256291434929677055_n.jpg';
import coloredTentImg3 from './474584676_625466180011066_5754091576396187073_n.jpg';
import coloredTentImg4 from './475317840_630208526203498_7342393900897973481_n.jpg';

// --- Sub-components ---

const RoomAvailabilityCalendar = ({ bookings, rooms }: { bookings: Booking[], rooms: Room[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = startOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(startDay, i));

  const getBookingForDay = (roomId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');
    return bookings.find(b => {
      if (b.room_id !== roomId) return false;
      if (b.status === 'cancelled' || b.status === 'no-show') return false;
      
      // Free up the room from today onwards if they are checked-out early (Completed)
      if (b.status === 'Completed' && dateStr >= todayStr) return false;

      return dateStr >= b.check_in && dateStr < b.check_out;
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-coffee-100 overflow-hidden relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-coffee-900">Room Availability Calendar</h3>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(addDays(startDay, -1))} className="p-2 hover:bg-coffee-50 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-coffee-600" />
          </button>
          <span className="font-bold text-coffee-900">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addDays(startDay, 32))} className="p-2 hover:bg-coffee-50 rounded-full transition-colors">
            <ChevronRight className="h-5 w-5 text-coffee-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div 
            className="grid border-b border-coffee-100"
            style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, 1fr)` }}
          >
            <div className="p-2 font-bold text-xs text-coffee-600 uppercase">Room</div>
            {days.map(day => (
              <div key={day.toString()} className="p-2 text-center text-[10px] font-bold text-coffee-600 border-l border-coffee-50">
                {format(day, 'd')}
                <div className="text-[8px] font-normal">{format(day, 'EEE')}</div>
              </div>
            ))}
          </div>
          {rooms.map(room => (
            <div 
              key={room.id} 
              className="grid border-b border-coffee-50 hover:bg-coffee-50/30 transition-colors"
              style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, 1fr)` }}
            >
              <div className="p-2 text-xs font-bold text-coffee-900 truncate">{room.name}</div>
              {days.map(day => {
                const booking = getBookingForDay(room.id, day);
                const status = booking ? 'occupied' : 'available';
                return (
                  <div 
                    key={day.toString()} 
                    className={`p-2 border-l border-coffee-50 h-10 flex items-center justify-center ${status === 'occupied' ? 'cursor-pointer group' : ''}`}
                    onClick={() => status === 'occupied' && setSelectedBooking(booking!)}
                    title={status === 'occupied' ? `Occupied by: ${booking?.first_name} ${booking?.last_name}` : 'Available'}
                  >
                    <div className={`w-full h-full rounded-sm transition-all ${
                      status === 'occupied' ? 'bg-red-600 border border-red-700 group-hover:bg-red-500 group-hover:scale-110' : 'bg-emerald-600 border border-emerald-700'
                    }`} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex gap-6 text-xs font-bold">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 border border-emerald-700 rounded-sm" />
          <span className="text-coffee-600 uppercase tracking-wider">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 border border-red-700 rounded-sm" />
          <span className="text-coffee-600 uppercase tracking-wider">Occupied (Click to view details)</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-coffee-100 max-h-[85vh] flex flex-col my-auto"
            >
              <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-serif font-bold text-coffee-900">Reservation Details</h3>
                  <p className="text-xs text-coffee-500">Booking ID: #{selectedBooking.id}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
                  <X size={20} className="text-coffee-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-2xl border border-coffee-100">
                  <div className="w-14 h-14 bg-coffee-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-coffee-900/20">
                    <UserIcon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] text-coffee-400 uppercase tracking-widest font-bold mb-1">Guest Name</p>
                    <p className="text-xl font-bold text-coffee-900 leading-tight">
                      {selectedBooking.first_name} {selectedBooking.last_name}
                    </p>
                    {selectedBooking.email && (
                      <div className="flex items-center gap-1.5 text-xs text-coffee-500 mt-1">
                        <Mail size={12} />
                        <span>{selectedBooking.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-coffee-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-coffee-400" />
                      <p className="text-[10px] text-coffee-400 uppercase tracking-widest font-bold">Check-in</p>
                    </div>
                    <p className="font-bold text-coffee-900">{format(new Date(selectedBooking.check_in), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="p-4 bg-white border border-coffee-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-coffee-400" />
                      <p className="text-[10px] text-coffee-400 uppercase tracking-widest font-bold">Check-out</p>
                    </div>
                    <p className="font-bold text-coffee-900">{format(new Date(selectedBooking.check_out), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-coffee-100 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Hotel size={16} className="text-coffee-400" />
                      <span className="text-sm text-coffee-600">Room</span>
                    </div>
                    <span className="font-bold text-coffee-900">{selectedBooking.room_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-coffee-400" />
                      <span className="text-sm text-coffee-600">Status</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      selectedBooking.status === 'checked-in' ? 'bg-blue-100 text-blue-700' :
                      selectedBooking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-coffee-100 text-coffee-700'
                    }`}>
                      {selectedBooking.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-coffee-50 flex justify-between items-center">
                    <span className="text-sm font-bold text-coffee-900">Total Amount</span>
                    <span className="text-lg font-bold text-emerald-600">₱{selectedBooking.total_price.toLocaleString()}</span>
                  </div>
                </div>

                {selectedBooking.contact_no && (
                  <div className="flex items-center gap-3 p-4 bg-coffee-50/50 rounded-xl border border-dashed border-coffee-200">
                    <Phone size={16} className="text-coffee-400" />
                    <span className="text-sm font-medium text-coffee-700">{selectedBooking.contact_no}</span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-coffee-50 border-t border-coffee-100">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-4 bg-coffee-900 text-white font-bold rounded-2xl hover:bg-coffee-800 transition-all shadow-xl shadow-coffee-900/20 active:scale-[0.98]"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AmenityIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: Record<string, any> = {
    Waves,
    Flower,
    Coffee,
    Star,
    Hotel,
    Calendar,
    User: UserIcon,
    LogOut,
    LayoutDashboard,
    Bed,
    CreditCard,
    MessageSquare,
    BarChart3,
    Menu,
    X,
    ChevronRight,
    QrCode,
    CheckCircle2,
    Clock,
    MapPin,
    Phone,
    Mail,
    Receipt,
    Download,
    Search
  };

  const IconComponent = icons[name] || Star;
  return <IconComponent className={className} />;
};

// --- Components ---

// Shared photo carousel for rooms and amenities (the homepage hero uses its own Hero component).
const SLIDER_SWIPE_OFFSET = 50;
const SLIDER_SWIPE_VELOCITY = 500;
const SLIDER_MAX_DOTS = 7;
const SLIDER_AUTOPLAY_INTERVAL = 5000;

const ImageSlider = ({ images, className = '', alt = '', compact = false, autoPlay = true, interval = SLIDER_AUTOPLAY_INTERVAL }: {
  images: string[],
  className?: string,
  alt?: string,
  compact?: boolean,
  autoPlay?: boolean,
  interval?: number
}) => {
  const slides = useMemo(
    () => (Array.isArray(images) ? images.filter((src) => typeof src === 'string' && src.trim() !== '') : []),
    [images]
  );
  const total = slides.length;
  const [[rawIndex, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const reduceMotion = useReducedMotion();

  // Keep the index valid if the image list shrinks (e.g. after an admin edit)
  const currentIndex = total > 0 ? Math.min(rawIndex, total - 1) : 0;

  // Preload neighbouring photos so navigating doesn't flash an empty frame
  useEffect(() => {
    if (total < 2) return;
    [slides[(currentIndex + 1) % total], slides[(currentIndex - 1 + total) % total]].forEach((src) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = src;
    });
  }, [currentIndex, slides, total]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // Per-instance offset so cards on the same page don't all flip in unison
  const [autoPlayOffset] = useState(() => Math.floor(Math.random() * 1500));

  // Only auto-advance while the carousel is actually on screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setIsVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [total > 0]);

  // Auto-advance; restarts whenever the photo changes so manual navigation gets a full interval
  useEffect(() => {
    if (!autoPlay || reduceMotion || total < 2 || !isVisible || isHovered || isFocused || isDragging) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setSlide(([i]) => [(Math.min(i, total - 1) + 1) % total, 1]);
    }, interval + autoPlayOffset);
    return () => window.clearInterval(timer);
  }, [autoPlay, reduceMotion, total, isVisible, isHovered, isFocused, isDragging, interval, autoPlayOffset, currentIndex]);

  if (total === 0) return null;

  const paginate = (step: number) => {
    setSlide(([i]) => [(((Math.min(i, total - 1) + step) % total) + total) % total, step]);
  };

  const goTo = (i: number) => {
    if (i === currentIndex) return;
    setSlide([i, i > currentIndex ? 1 : -1]);
  };

  const handleArrow = (e: React.MouseEvent, step: number) => {
    e.stopPropagation();
    paginate(step);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (total < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); paginate(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); paginate(-1); }
  };

  const src = slides[currentIndex];
  const label = alt ? `${alt} photo ${currentIndex + 1} of ${total}` : `Photo ${currentIndex + 1} of ${total}`;
  const variants = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { x: dir >= 0 ? '100%' : '-100%' }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { x: dir >= 0 ? '-100%' : '100%' }),
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setIsHovered(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setIsHovered(false); }}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsFocused(false); }}
      className={`relative group overflow-hidden bg-coffee-100 select-none ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={alt ? `${alt} photos` : 'Photos'}
      tabIndex={total > 1 ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={`${currentIndex}-${src}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 touch-pan-y"
          drag={total > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            if (info.offset.x < -SLIDER_SWIPE_OFFSET || info.velocity.x < -SLIDER_SWIPE_VELOCITY) paginate(1);
            else if (info.offset.x > SLIDER_SWIPE_OFFSET || info.velocity.x > SLIDER_SWIPE_VELOCITY) paginate(-1);
          }}
        >
          {failed[src] ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-coffee-100 text-coffee-400">
              <ImageOff className={compact ? 'h-5 w-5' : 'h-8 w-8'} />
              {!compact && <span className="text-xs font-medium">Photo unavailable</span>}
            </div>
          ) : (
            <>
              {!loaded[src] && <div className="absolute inset-0 bg-coffee-100 animate-pulse" />}
              <img
                src={src}
                alt={label}
                draggable={false}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoaded((prev) => (prev[src] ? prev : { ...prev, [src]: true }))}
                onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
                className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${loaded[src] ? 'opacity-100' : 'opacity-0'}`}
                referrerPolicy="no-referrer"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <>
          {/* Soft bottom shade so indicators stay readable on bright photos */}
          <div className={`absolute inset-x-0 bottom-0 ${compact ? 'h-8' : 'h-16'} bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-10`} />

          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => handleArrow(e, -1)}
            className={`absolute ${compact ? 'left-1 p-1' : 'left-2 p-2'} top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 backdrop-blur-sm rounded-full text-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all z-20`}
          >
            <ChevronLeft className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => handleArrow(e, 1)}
            className={`absolute ${compact ? 'right-1 p-1' : 'right-2 p-2'} top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/50 backdrop-blur-sm rounded-full text-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all z-20`}
          >
            <ChevronRight className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
          </button>

          {total > SLIDER_MAX_DOTS || compact ? (
            <div className={`absolute ${compact ? 'bottom-1.5' : 'bottom-4'} left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-bold tracking-wider z-20`} aria-live="polite">
              {currentIndex + 1} / {total}
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === currentIndex}
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
                >
                  <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Navbar = ({ user, onLogout, onNavigate, page }: { user: User | null, onLogout: () => void, onNavigate: (page: string) => void, page: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const mainLinks = [
    { name: 'About Us', action: () => { 
      onNavigate('home'); 
      setTimeout(() => {
        const element = document.getElementById('about');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }},
    { name: 'Rooms', action: () => onNavigate('rooms') },
    { name: 'Amenities', action: () => onNavigate('amenities') },
    { name: 'Contact Us', action: () => {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById('contact');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }}
  ];

  const menuItems = [];
  if (user) {
    menuItems.push({
      name: user.role === 'admin' ? 'Admin Dashboard' : user.role === 'staff' ? 'Staff Dashboard' : user.role === 'housekeeping' ? 'Housekeeping Dashboard' : 'User Dashboard',
      action: () => onNavigate(user.role === 'admin' || user.role === 'staff' || user.role === 'housekeeping' ? 'admin-dashboard' : 'guest-dashboard')
    });
    menuItems.push({ name: 'Logout', action: onLogout });
  } else {
    menuItems.push({ name: 'Sign In', action: () => onNavigate('login') });
  }

  return (
    <nav className={`${page === 'home' ? 'absolute w-full bg-transparent pt-8' : 'bg-[#5C3321] sticky top-0 pt-4 pb-2'} z-[400] ${page !== 'home' ? 'shadow-md' : ''}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => { onNavigate('home'); window.location.hash = ''; }}>
            <img 
              src="/Gemini_Generated_Image_d9gttfd9gttfd9gt.png" 
              alt="Da Bali Resort Logo" 
              className="h-10 w-10 object-cover rounded-full mr-3"
              referrerPolicy="no-referrer"
            />
            <span className="text-2xl font-bold tracking-tight text-white">DA BALI RESORT</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              {mainLinks.map((link) => (
                <button 
                  key={link.name} 
                  onClick={link.action}
                  className="text-white hover:text-[#F9A826] font-medium transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="flex items-center justify-center bg-[#A3402A] hover:bg-[#8B3624] text-white p-2 rounded-xl transition-all shadow-lg shadow-black/10"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-[55]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute right-4 top-24 w-72 bg-white rounded-3xl shadow-2xl z-[60] overflow-hidden border border-coffee-100"
            >
              <div className="p-4 space-y-1">
                <div className="md:hidden mb-4 pb-4 border-b border-coffee-100 space-y-1">
                  {mainLinks.map((link) => (
                    <button 
                      key={link.name}
                      onClick={() => { link.action(); setIsOpen(false); }}
                      className="w-full text-left px-6 py-3 rounded-2xl transition-all text-coffee-900 hover:bg-coffee-50 font-bold"
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
                {menuItems.map((item) => (
                  <button 
                    key={item.name}
                    onClick={() => { item.action(); setIsOpen(false); }}
                    className={`w-full text-left px-6 py-4 rounded-2xl transition-all flex items-center justify-between group ${
                      item.name === 'Logout' ? 'text-red-600 hover:bg-red-50' : 
                      item.name === 'Sign In' ? 'bg-coffee-900 text-white hover:bg-coffee-800' : 
                      'text-coffee-900 hover:bg-coffee-50'
                    }`}
                  >
                    <span className="font-bold">{item.name}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${item.name === 'Sign In' ? 'text-white/50' : 'text-coffee-300'}`} />
                  </button>
                ))}
              </div>
              {user && (
                <div className="bg-coffee-50 p-6 border-t border-coffee-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-coffee-900 flex items-center justify-center text-white font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-coffee-900">{user.first_name} {user.last_name}</p>
                      <p className="text-[10px] text-coffee-500 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
  <footer id="contact" className="bg-[#5C3321] text-coffee-100 pt-20 pb-16 w-full border-t border-coffee-950/20 shadow-[-1px_-5px_15px_rgba(0,0,0,0.1)]">
    <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      <div className="flex flex-col items-start lg:col-span-4">
        <h3 className="text-2xl font-serif font-bold mb-4 text-white">Da Bali Resort</h3>
        <p className="text-coffee-300 leading-relaxed text-left max-w-sm text-sm mb-6">
          Experience luxury in the heart of nature. Your perfect gateway awaits at our serene resort, designed for relaxation and unforgettable memories.
        </p>
        <div className="border-t border-coffee-700/40 pt-4 w-full max-w-sm">
          <h4 className="text-lg font-bold mb-2.5 text-white">Developed by</h4>
          <p className="text-sm font-medium text-[#FDF8F3] leading-relaxed">
            Praise Gae Tanqui-on | Emie R. Gandiongco | Jiggy O. Macarayo
          </p>
        </div>
      </div>
      <div className="flex flex-col items-start lg:col-span-2">
        <h4 className="text-lg font-bold mb-4 text-white">Quick Links</h4>
        <ul className="space-y-3 text-coffee-300 w-full flex flex-col items-start text-sm">
          <li className="flex items-center"><button onClick={() => { onNavigate('home'); window.location.hash = ''; }} className="hover:text-white transition-colors">Home</button></li>
          <li className="flex items-center"><button onClick={() => onNavigate('rooms')} className="hover:text-white transition-colors">Accommodations</button></li>
          <li className="flex items-center"><button onClick={() => onNavigate('amenities')} className="hover:text-white transition-colors">Amenities</button></li>
        </ul>
      </div>
      <div className="flex flex-col items-start lg:col-span-3">
        <h4 className="text-lg font-bold mb-4 text-white">Contact Us</h4>
        <ul className="space-y-4 text-coffee-300 w-full flex flex-col items-start text-sm">
          <li className="flex items-start group">
            <div className="flex items-center w-24 shrink-0 font-bold text-white/90 text-xs uppercase tracking-wider"><Phone className="h-4 w-4 mr-2" /> <span>Phone</span></div>
            <span className="font-mono text-sm">09629724075</span>
          </li>
          <li className="flex items-start group">
            <div className="flex items-center w-24 shrink-0 font-bold text-white/90 text-xs uppercase tracking-wider"><Mail className="h-4 w-4 mr-2" /> <span>Email</span></div>
            <span className="font-mono text-sm break-all">dermagrace56@yahoo.com.ph</span>
          </li>
          <li className="flex items-start group">
            <div className="flex items-center w-24 shrink-0 font-bold text-white/90 text-xs uppercase tracking-wider"><MapPin className="h-4 w-4 mr-2" /> <span>Location</span></div>
            <span className="font-mono text-sm leading-tight">Rosario, Balingasag, Misamis Oriental</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-col w-full lg:col-span-3">
        <h4 className="text-lg font-bold mb-4 text-white">Find Us</h4>
        <div className="w-full h-[180px] rounded-2xl overflow-hidden border border-coffee-700 shadow-inner bg-coffee-800">
          <iframe 
            src="https://maps.google.com/maps?q=Da+Bali+Farm+Resort,+Rosario,+Balingasag,+Misamis+Oriental&t=&z=16&ie=UTF8&iwloc=&output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Da Bali Farm Resort Location"
          ></iframe>
        </div>
      </div>
    </div>
    <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-4">
      <div className="pt-8 border-t border-coffee-800 text-center text-coffee-400 text-sm tracking-wide">
        <p>&copy; {new Date().getFullYear()} Da Bali Resort. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const FEEDBACK_RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const FeedbackSection = ({ feedbacks }: { feedbacks: Feedback[] }) => {
  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  return (
  <section className="py-20 bg-white">
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-coffee-900 mb-4">Guest Reviews</h2>
        <p className="text-coffee-600">See what our guests have to say about their stay at Da Bali Resort.</p>
        {feedbacks.length > 0 && (
          <div className="mt-6 inline-flex items-center gap-3 bg-coffee-50 border border-coffee-100 rounded-full px-5 py-2">
            <span className="text-2xl font-serif font-bold text-coffee-900">{averageRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-coffee-500">{feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {feedbacks.length > 0 ? feedbacks.slice(0, 6).map((feedback) => (
          <motion.div 
            key={feedback.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100 shadow-sm"
          >
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={`${feedback.id}-${i}`} className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-coffee-700 italic mb-4 whitespace-pre-line break-words">"{feedback.comment}"</p>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-coffee-200 flex items-center justify-center text-coffee-700 font-bold">
                {feedback.first_name?.[0]}{feedback.last_name?.[0]}
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-coffee-900">{feedback.first_name} {feedback.last_name ? `${feedback.last_name[0]}.` : ''}</p>
                <p className="text-xs text-coffee-500">
                  {feedback.room_name ? `Stayed in ${feedback.room_name} · ` : ''}{new Date(feedback.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full text-center py-10 text-coffee-400">
            No reviews yet. Stay with us and be the first to share your experience!
          </div>
        )}
      </div>
    </div>
  </section>
  );
};


const TimeRangePicker = ({ startTime, endTime, onStartChange, onEndChange }: { startTime: string, endTime: string, onStartChange: (val: string) => void, onEndChange: (val: string) => void }) => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const format12h = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest px-1">Start Time</label>
          <button 
            type="button"
            onClick={() => setIsStartOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-coffee-100 bg-white hover:border-coffee-300 transition-all group overflow-hidden"
          >
            <span className="text-sm text-coffee-900 font-medium">{format12h(startTime)}</span>
            <Clock className="h-4 w-4 text-coffee-300 group-hover:text-coffee-500 transition-colors" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest px-1">End Time</label>
          <button 
            type="button" 
            onClick={() => setIsEndOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-coffee-100 bg-white hover:border-coffee-300 transition-all group overflow-hidden"
          >
            <span className="text-sm text-coffee-900 font-medium">{format12h(endTime)}</span>
            <Clock className="h-4 w-4 text-coffee-300 group-hover:text-coffee-500 transition-colors" />
          </button>
        </div>
      </div>

      <TimePickerModal 
        isOpen={isStartOpen} 
        onClose={() => setIsStartOpen(false)} 
        onSelect={onStartChange} 
        initialTime={startTime}
        label="Start Time"
      />
      <TimePickerModal 
        isOpen={isEndOpen} 
        onClose={() => setIsEndOpen(false)} 
        onSelect={onEndChange} 
        initialTime={endTime}
        label="End Time"
      />
    </div>
  );
};

const AddStaffModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: (firstName: string, lastName: string, workSchedule: string, position: string) => Promise<void> | void }) => {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || 'Staff';
    const schedule = `${startTime} - ${endTime}`;
    try {
      await onSuccess(firstName, lastName, schedule, position);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = fullName.trim().length > 0 && startTime && endTime && position.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
          <h3 className="text-xl font-serif font-bold text-coffee-900">Add New Staff</h3>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-coffee-100 rounded-full transition-colors disabled:opacity-50">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm disabled:opacity-50"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">Position</label>
              <input 
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Front Desk, Housekeeping"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm disabled:opacity-50"
                required
              />
            </div>
            <TimeRangePicker 
              startTime={startTime} 
              endTime={endTime} 
              onStartChange={setStartTime} 
              onEndChange={setEndTime} 
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-coffee-900 hover:bg-coffee-800 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : 'Add Staff'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const EditStaffModal = ({ 
  record, 
  onClose, 
  onSubmit 
}: { 
  record: any, 
  onClose: () => void, 
  onSubmit: (id: number, firstName: string, lastName: string, schedule: string, position: string) => void 
}) => {
  const [firstName, setFirstName] = useState(record.first_name || '');
  const [lastName, setLastName] = useState(record.last_name || '');
  const [position, setPosition] = useState(record.position || '');
  const [startTime, setStartTime] = useState(record.schedule?.split(' - ')[0] || '08:00');
  const [endTime, setEndTime] = useState(record.schedule?.split(' - ')[1] || '17:00');

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-coffee-900 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Staff Member</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onSubmit(record.id, firstName, lastName, `${startTime} - ${endTime}`, position); 
        }} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-2">First Name</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-2">Last Name</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-2">Position</label>
            <input 
              type="text" 
              value={position} 
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm"
              required
              placeholder="e.g. Front Desk, Housekeeping"
            />
          </div>
          <TimeRangePicker 
            startTime={startTime} 
            endTime={endTime} 
            onStartChange={setStartTime} 
            onEndChange={setEndTime} 
          />
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-coffee-600 text-white rounded-xl font-medium hover:bg-coffee-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ExportDTRModal = ({ onClose, onExport, currentYear }: { onClose: () => void, onExport: (start: string, end: string) => void, currentYear: string }) => {
  const [yearStart, setYearStart] = useState(currentYear);
  const [yearEnd, setYearEnd] = useState(currentYear);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearStart.trim() || !yearEnd.trim()) return;
    onExport(yearStart.trim(), yearEnd.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
          <h3 className="text-xl font-serif font-bold text-coffee-900">Export DTR Records</h3>
          <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">Start Year</label>
              <input 
                type="number"
                value={yearStart}
                onChange={(e) => setYearStart(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">End Year</label>
              <input 
                type="number"
                value={yearEnd}
                onChange={(e) => setYearEnd(e.target.value)}
                placeholder="e.g. 2025"
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-white bg-coffee-900 hover:bg-coffee-800 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};



const FEEDBACK_COMMENT_MAX = 1000;

// Front-desk checkout confirmation. For a guest-account room booking with no review yet, it
// reminds staff to ask for feedback before the guest leaves (walk-ins have no account to review from).
const getCheckoutConfirmMessage = (booking: Booking | AmenityBooking) => {
  const isRoomBookingAwaitingReview = !('amenity_name' in booking) && !!booking.user_id && !(booking as Booking).has_feedback;
  return isRoomBookingAwaitingReview
    ? 'This guest hasn\'t rated their stay yet. Remind them they can leave a review from their Guest Portal before they go.\n\nAre you sure you want to check out this reservation?'
    : 'Are you sure you want to check out this reservation?';
};

const FeedbackFormModal = ({ booking, onClose, onSubmit, form, setForm, isSubmitting, error }: {
  booking: Booking | null,
  onClose: () => void,
  onSubmit: (e: React.FormEvent) => void,
  form: { rating: number, comment: string },
  setForm: (form: { rating: number, comment: string }) => void,
  isSubmitting: boolean,
  error: string | null
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  if (!booking) return null;
  const isStillCheckedIn = booking.status === 'checked-in';
  const shownRating = hoverRating || form.rating;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-coffee-900">
                {isStillCheckedIn ? 'How is your stay?' : 'How was your stay?'}
              </h3>
              <p className="text-sm text-coffee-500 mt-1">
                {booking.room_name} · {format(new Date(booking.check_in), 'MMM dd')} – {format(new Date(booking.check_out), 'MMM dd, yyyy')}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-coffee-50 rounded-full transition-colors" aria-label="Close">
              <X className="h-6 w-6 text-coffee-400" />
            </button>
          </div>
          {isStillCheckedIn && (
            <p className="text-sm text-coffee-600 bg-coffee-50 border border-coffee-100 rounded-xl px-4 py-3 mb-6">
              Before you check out, take a moment to rate your stay. Your feedback helps us improve for every guest.
            </p>
          )}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-coffee-700 mb-2">Rating</label>
              <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    onMouseEnter={() => setHoverRating(star)}
                    className="p-1"
                    aria-label={`${star} star${star > 1 ? 's' : ''} - ${FEEDBACK_RATING_LABELS[star]}`}
                  >
                    <Star className={`h-8 w-8 ${star <= shownRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-coffee-700">{FEEDBACK_RATING_LABELS[shownRating]}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-coffee-700 mb-2">Your Comment</label>
              <textarea
                required
                maxLength={FEEDBACK_COMMENT_MAX}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                placeholder="What did you enjoy? What could we do better?"
              />
              <p className="text-right text-xs text-coffee-400 mt-1">{form.comment.length}/{FEEDBACK_COMMENT_MAX}</p>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !form.comment.trim()}
                className="w-full bg-coffee-900 text-white py-4 rounded-xl font-bold hover:bg-coffee-800 transition-all shadow-lg shadow-coffee-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-coffee-500 hover:bg-coffee-50 transition-all"
              >
                Maybe later
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const isVideo = (url: string) => {
  return url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');
};

const Hero = ({ onBookNow, heroBanners, currentSlide, setCurrentSlide }: { 
  onBookNow: () => void, 
  heroBanners: HeroBanner[], 
  currentSlide: number,
  setCurrentSlide: (idx: number) => void
}) => {
  const totalSlides = heroBanners.length;

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {heroBanners[currentSlide] && (
          <motion.div
            key={`banner-${heroBanners[currentSlide].id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {isVideo(heroBanners[currentSlide].image_url) ? (
              <video
                src={heroBanners[currentSlide].image_url}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={heroBanners[currentSlide].image_url === '/src/476799607_640944451796572_5504544646714415496_n-1.jpg' ? welcomeBannerImg : heroBanners[currentSlide].image_url} 
                alt={heroBanners[currentSlide].title} 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className={`absolute inset-0 bg-black/50 flex items-center ${currentSlide === 0 ? 'justify-center' : 'justify-start'}`}>
              <div className={`${currentSlide === 0 ? 'text-center' : 'text-left'} text-white px-4 md:px-16 lg:px-24 max-w-4xl`}>
                {heroBanners[currentSlide].type && (
                  <motion.span 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-4 py-1 bg-white/20 border border-white/30 rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-6 inline-block"
                  >
                    {heroBanners[currentSlide].type}
                  </motion.span>
                )}
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6"
                >
                  {heroBanners[currentSlide].title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl md:text-2xl text-white/80 font-light leading-relaxed mb-10 max-w-2xl mx-auto"
                >
                  {heroBanners[currentSlide].description}
                </motion.p>
                {heroBanners[currentSlide].link_url ? (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(heroBanners[currentSlide].link_url, '_blank')}
                    className="px-8 py-3 bg-white text-coffee-900 rounded-full font-bold hover:bg-coffee-50 transition-all shadow-xl"
                  >
                    Learn More
                  </motion.button>
                ) : currentSlide === 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBookNow}
                    className="bg-[#A3402A] hover:bg-[#8B3624] text-white px-10 py-4 rounded-full text-lg font-bold transition-all shadow-xl"
                  >
                    Book Your Stay
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={() => setCurrentSlide((currentSlide - 1 + totalSlides) % totalSlides)}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button 
        onClick={() => setCurrentSlide((currentSlide + 1) % totalSlides)}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

const RoomCard = ({ room, onBook }: { room: Room, onBook: (room: Room) => void }) => {
  const isBookable = room.status === 'available';
  return (
    <motion.div
      whileHover={isBookable ? { y: -10 } : undefined}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-coffee-100 h-full flex flex-col"
    >
      <div className="h-64 relative overflow-hidden">
        <ImageSlider
          images={room.images && room.images.length > 0 ? room.images : [room.image_url]}
          className="w-full h-full"
          alt={room.name}
        />
        <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-coffee-900 font-bold shadow-sm z-10">
          ₱{(room.price || 0).toLocaleString()} <span className="text-xs font-normal text-coffee-600">/night</span>
        </div>
        {!isBookable && (
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm z-10 ${getRoomStatusBadgeClass(room.status)}`}>
            {room.status === 'occupied' ? 'Currently Occupied' : getRoomStatusLabel(room.status)}
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-serif font-bold mb-2 text-coffee-900">{room.name}</h3>
        <p className="text-coffee-600 text-sm mb-4 line-clamp-2">{room.description}</p>
        <div className="flex items-center justify-between text-xs text-coffee-500 mb-6 mt-auto">
          <span className="flex items-center"><UserIcon className="h-3 w-3 mr-1" /> Up to {room.capacity} Guests</span>
          <span className="flex items-center"><Bed className="h-3 w-3 mr-1" /> {room.beds}</span>
        </div>
        <button
          onClick={() => isBookable && onBook(room)}
          disabled={!isBookable}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isBookable
              ? 'bg-white text-[#A3402A] border border-[#A3402A] hover:bg-[#A3402A] hover:text-white active:scale-95'
              : 'bg-coffee-100 text-coffee-400 border border-coffee-100 cursor-not-allowed'
          }`}
        >
          {isBookable ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </motion.div>
  );
};

const ProofUploadModal = ({ booking, onClose, onUpload, isUploading, setToastMessage, isBalance = false }: { 
  booking: Booking, 
  onClose: () => void, 
  onUpload: (file: string, amount: number, reference: string) => void,
  isUploading: boolean,
  setToastMessage: (msg: any) => void,
  isBalance?: boolean
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'BPI'>('GCash');
  const requiredAmount = isBalance ? booking.total_price - (booking.amount_paid || 0) : booking.total_price / 2;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage({ title: 'Error', message: 'File size too large. Max 5MB.', type: 'error' });
        return;
      }
      setFileType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
          <h3 className="text-xl font-serif font-bold text-coffee-900">Upload Proof of Payment</h3>
          <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="text-center space-y-4">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setPaymentMethod('GCash')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'GCash' ? 'bg-blue-600 text-white shadow-md' : 'bg-coffee-50 text-coffee-600 border border-coffee-100'}`}
              >
                GCash
              </button>
              <button 
                onClick={() => setPaymentMethod('BPI')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'BPI' ? 'bg-red-600 text-white shadow-md' : 'bg-coffee-50 text-coffee-600 border border-coffee-100'}`}
              >
                BPI
              </button>
            </div>

            <div className="bg-coffee-50 p-4 rounded-2xl border border-coffee-100 flex flex-col items-center">
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest mb-2">Scan to Pay via {paymentMethod}</p>
              <div className="bg-white p-2 rounded-xl shadow-sm">
                {paymentMethod === 'GCash' ? (
                  <QRCodeSVG value="https://qr.gcash.com/example-resort-payment" size={120} />
                ) : (
                  <QRCodeSVG value="https://qr.bpi.com.ph/example-resort-payment" size={120} />
                )}
              </div>
              <p className="text-xs font-bold text-coffee-900 mt-2">
                {paymentMethod === 'GCash' ? 'Da Bali Resort - 09629724075' : 'Da Bali Resort - 1234-5678-90'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-coffee-600">Please upload a screenshot of your transaction for <strong>{booking.room_name}</strong>.</p>
              <p className="text-xs text-coffee-400 italic">
                {isBalance ? 'Required Balance' : 'Required Downpayment'}: ₱{(requiredAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Amount Paid (₱)</label>
                <input 
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`e.g. ${requiredAmount}`}
                  className={`w-full p-3 rounded-xl border outline-none transition-all text-sm ${
                    amountPaid && parseFloat(amountPaid) !== requiredAmount 
                      ? 'border-amber-400 bg-amber-50 focus:ring-amber-500' 
                      : 'border-coffee-200 focus:ring-coffee-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Ref Number</label>
                <input 
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Reference No."
                  className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-coffee-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            {amountPaid && parseFloat(amountPaid) !== requiredAmount && (
              <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                Amount does not match the required {isBalance ? 'balance' : 'downpayment'}!
              </p>
            )}

            <div className="relative group">
              {preview ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-coffee-200 bg-coffee-50 flex items-center justify-center">
                  {fileType === 'application/pdf' ? (
                    <div className="flex flex-col items-center text-coffee-400">
                      <FileText size={48} />
                      <span className="text-xs font-bold mt-2">PDF Document Attached</span>
                    </div>
                  ) : (
                    <img src={preview} alt="Proof preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <button 
                    onClick={() => { setPreview(null); setFileType(null); }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-coffee-200 bg-coffee-50/30 hover:bg-coffee-50 hover:border-coffee-400 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-coffee-400" />
                    </div>
                    <span className="text-sm font-bold text-coffee-600">Click to upload proof</span>
                    <span className="text-[10px] text-coffee-400 uppercase tracking-widest">JPG, PNG, PDF up to 5MB</span>
                  </div>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <button 
            disabled={!preview || isUploading || !amountPaid || !transactionReference}
            onClick={() => preview && onUpload(preview, parseFloat(amountPaid), transactionReference)}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
              !preview || isUploading || !amountPaid || !transactionReference
                ? 'bg-coffee-200 text-coffee-400 cursor-not-allowed' 
                : 'bg-coffee-900 text-white hover:bg-coffee-800 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <Clock className="animate-spin h-5 w-5 mr-2" />
                Uploading...
              </>
            ) : (
              'Submit Proof of Payment'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AmenityProofUploadModal = ({ booking, onClose, onUpload, isUploading, isBalance = false }: { 
  booking: AmenityBooking, 
  onClose: () => void,
  onUpload: (file: string, amount: number, ref: string) => void,
  isUploading: boolean,
  isBalance?: boolean
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const requiredAmount = isBalance ? booking.total_price - (booking.amount_paid || 0) : (booking.amenity_name === 'Infinity Pool' ? booking.total_price : booking.total_price / 2);
  const [amountPaid, setAmountPaid] = useState(requiredAmount.toString());
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'BPI'>('GCash');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
          <div>
            <h3 className="text-xl font-serif font-bold text-coffee-900">Upload Payment Proof</h3>
            <p className="text-xs text-coffee-500">Amenity: {booking.amenity_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="text-center space-y-4">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setPaymentMethod('GCash')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'GCash' ? 'bg-blue-600 text-white shadow-md' : 'bg-coffee-50 text-coffee-600 border border-coffee-100'}`}
              >
                GCash
              </button>
              <button 
                onClick={() => setPaymentMethod('BPI')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'BPI' ? 'bg-red-600 text-white shadow-md' : 'bg-coffee-50 text-coffee-600 border border-coffee-100'}`}
              >
                BPI
              </button>
            </div>

            <div className="bg-coffee-50 p-4 rounded-2xl border border-coffee-100 flex flex-col items-center">
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest mb-2">Scan to Pay via {paymentMethod}</p>
              <div className="bg-white p-2 rounded-xl shadow-sm">
                {paymentMethod === 'GCash' ? (
                  <QRCodeSVG value="https://qr.gcash.com/example-resort-payment" size={120} />
                ) : (
                  <QRCodeSVG value="https://qr.bpi.com.ph/example-resort-payment" size={120} />
                )}
              </div>
              <p className="text-xs font-bold text-coffee-900 mt-2">
                {paymentMethod === 'GCash' ? 'Da Bali Resort - 09629724075' : 'Da Bali Resort - 1234-5678-90'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-coffee-600">Please upload a screenshot of your transaction for <strong>{booking.amenity_name}</strong>.</p>
              <p className="text-xs text-coffee-400 italic">
                {isBalance ? 'Required Balance' : (booking.amenity_name === 'Infinity Pool' ? 'Full Payment Required' : 'Required Downpayment')}: ₱{(requiredAmount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">Amount Paid (₱)</label>
              <input 
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Enter exact amount paid"
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all font-bold text-coffee-900 disabled:bg-coffee-50 disabled:text-coffee-400 disabled:cursor-not-allowed"
                disabled={booking.amenity_name === 'Infinity Pool'}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-2">Transaction Reference No.</label>
              <input 
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Enter GCash/BPI Ref No."
                className="w-full px-4 py-3 rounded-xl border border-coffee-100 focus:ring-2 focus:ring-coffee-500 outline-none transition-all font-mono text-sm"
              />
            </div>
          </div>

          <div 
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
              preview ? 'border-emerald-200 bg-emerald-50/30' : 'border-coffee-100 hover:border-coffee-300 bg-coffee-50/30'
            }`}
            onClick={() => document.getElementById('amenity-proof-input')?.click()}
          >
            <input 
              id="amenity-proof-input"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-bold">Change Image</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                  <Upload className="text-coffee-400" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-coffee-900">Click to upload receipt</p>
                  <p className="text-[10px] text-coffee-400">PNG, JPG up to 5MB</p>
                </div>
              </>
            )}
          </div>

          <button 
            disabled={!preview || isUploading || !amountPaid || !transactionReference}
            onClick={() => preview && onUpload(preview, parseFloat(amountPaid), transactionReference)}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
              !preview || isUploading || !amountPaid || !transactionReference
                ? 'bg-coffee-200 text-coffee-400 cursor-not-allowed' 
                : 'bg-coffee-900 text-white hover:bg-coffee-800 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <Clock className="animate-spin h-5 w-5 mr-2" />
                Uploading...
              </>
            ) : (
              'Submit Proof of Payment'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AmenityProofViewerModal = ({ booking, onClose, onVerify }: {
  booking: AmenityBooking,
  onClose: () => void,
  onVerify: (status: 'confirmed' | 'rejected', notes?: string) => void
}) => {
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectField, setShowRejectField] = useState(false);

  const hasBalanceProof = !!booking.balance_proof_of_payment;
  const isPendingVerification = (booking.status as string) === 'pending_verification';
  // A balance payment is only ever submitted after the deposit has already been
  // confirmed once, so if a balance proof exists, any pending verification must be
  // for the balance — never the (already-approved) deposit.
  const pendingLeg: 'deposit' | 'balance' | null = isPendingVerification ? (hasBalanceProof ? 'balance' : 'deposit') : null;

  const totalPrice = booking.total_price || 0;
  const totalPaid = (booking.amount_paid || 0) + (booking.balance_amount_paid || 0);

  const PaymentCard = ({ label, isPending, transactionRef, amount, proofUrl }: {
    label: string, isPending: boolean, transactionRef?: string, amount?: number, proofUrl?: string
  }) => (
    <div className={`w-full max-w-md bg-white rounded-2xl shadow-sm border overflow-hidden shrink-0 ${isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-coffee-100'}`}>
      <div className={`px-4 py-2.5 flex justify-between items-center ${isPending ? 'bg-amber-50' : 'bg-coffee-50'}`}>
        <span className="text-xs font-bold text-coffee-900 uppercase tracking-wider">{label}</span>
        {isPending && <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded uppercase tracking-wider">Pending Verification</span>}
      </div>
      <div className="p-4 flex justify-between items-center gap-2">
        <div>
          <p className="text-[10px] text-coffee-400 uppercase tracking-widest">Transaction Ref</p>
          <p className="font-mono font-bold text-coffee-900 text-sm">{transactionRef || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-coffee-400 uppercase tracking-widest">Amount</p>
          <p className="font-bold text-emerald-600">₱{amount?.toLocaleString() || '0'}</p>
        </div>
      </div>
      {proofUrl ? (
        <img
          src={proofUrl}
          alt={`${label} Proof`}
          className="w-full h-auto border-t border-coffee-100"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="text-center text-coffee-400 py-8 border-t border-coffee-100">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs">No proof of payment uploaded.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50 shrink-0">
          <div>
            <h3 className="text-xl font-serif font-bold text-coffee-900">Verify Amenity Payment</h3>
            <p className="text-xs text-coffee-500">Guest: {booking.first_name} {booking.last_name} | Amenity: {booking.amenity_name}</p>
            <p className="text-xs text-coffee-500 mt-0.5">Total Paid: <span className="font-bold text-coffee-800">₱{totalPaid.toLocaleString()}</span> of ₱{totalPrice.toLocaleString()} <span className="font-bold uppercase text-[10px] tracking-wider ml-1">({booking.payment_status || 'Pending'})</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <div className="p-4 bg-coffee-100/50 flex flex-col items-center justify-start overflow-auto gap-4 flex-1">
          <PaymentCard
            label="Deposit / Initial Payment"
            isPending={pendingLeg === 'deposit'}
            transactionRef={booking.transaction_reference}
            amount={booking.amount_paid}
            proofUrl={booking.proof_of_payment}
          />
          {hasBalanceProof && (
            <PaymentCard
              label="Balance Payment"
              isPending={pendingLeg === 'balance'}
              transactionRef={booking.balance_transaction_reference}
              amount={booking.balance_amount_paid}
              proofUrl={booking.balance_proof_of_payment}
            />
          )}
        </div>
        {isPendingVerification && (
          <div className="p-6 bg-white border-t border-coffee-100 shrink-0 space-y-4">
            <p className="text-[10px] text-coffee-400 uppercase tracking-widest text-center -mt-1">
              Reviewing the {pendingLeg === 'balance' ? 'balance' : 'deposit'} payment above
            </p>
            {showRejectField && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-1.5 block">Rejection Reason</label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Explain why the proof is being rejected..."
                  className="w-full p-4 rounded-xl border border-coffee-100 bg-coffee-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3402A]/20 transition-all min-h-[80px]"
                />
              </div>
            )}
            <div className="flex gap-4">
              {!showRejectField ? (
                <button
                  onClick={() => setShowRejectField(true)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Reject {pendingLeg === 'balance' ? 'Balance' : 'Deposit'}
                </button>
              ) : (
                <button
                  onClick={() => onVerify('rejected', rejectionNotes)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  Confirm Rejection
                </button>
              )}
              {!showRejectField && (
                <button
                  onClick={() => onVerify('confirmed')}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Confirm {pendingLeg === 'balance' ? 'Balance' : 'Deposit'}
                </button>
              )}
              {showRejectField && (
                <button
                  onClick={() => setShowRejectField(false)}
                  className="py-3 px-6 rounded-xl font-bold text-coffee-400 border border-coffee-100 hover:bg-coffee-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const RejectionReasonModal = ({ reason, onClose }: { reason: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
    >
      <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
        <h3 className="text-xl font-serif font-bold text-coffee-900">Rejection Reason</h3>
        <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
          <X size={20} className="text-coffee-400" />
        </button>
      </div>
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <p className="text-coffee-600 leading-relaxed italic">
          "{reason || 'No specific reason provided by the administrator.'}"
        </p>
      </div>
      <div className="p-6 bg-coffee-50/50 border-t border-coffee-100">
        <button 
          onClick={onClose}
          className="w-full py-3 px-6 rounded-xl font-bold text-white bg-[#A3402A] hover:bg-[#8B3524] transition-all shadow-lg shadow-coffee-200"
        >
          I Understand
        </button>
      </div>
    </motion.div>
  </div>
);

const ProofViewerModal = ({ booking, onClose, onVerify }: { 
  booking: Booking, 
  onClose: () => void,
  onVerify: (status: 'confirmed' | 'rejected', notes?: string) => void
}) => {
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectField, setShowRejectField] = useState(false);

  const isBalanceProof = ((booking.status as string) === 'confirmed' || (booking.status as string) === 'checked-in') && booking.balance_proof_of_payment;
  const proofUrl = isBalanceProof ? booking.balance_proof_of_payment : booking.proof_of_payment;
  const transactionRef = isBalanceProof ? booking.balance_transaction_reference : booking.transaction_reference;
  const amountToVerify = isBalanceProof ? booking.balance_amount_paid : booking.amount_paid;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full"
      >
        <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50 shrink-0">
          <div>
            <h3 className="text-xl font-serif font-bold text-coffee-900">Verify Payment Proof</h3>
            <p className="text-xs text-coffee-500">Guest: {booking.first_name} {booking.last_name} | Room: {booking.room_name}</p>
            {isBalanceProof && <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">BALANCE PAYMENT</span>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
            <X size={20} className="text-coffee-400" />
          </button>
        </div>
        <div className="p-4 bg-coffee-100/50 flex flex-col items-center justify-start overflow-auto gap-4 flex-1">
          <div className="w-full max-w-md bg-white p-4 rounded-2xl shadow-sm border border-coffee-100 flex justify-between items-center shrink-0">
            <div>
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest">Transaction Ref</p>
              <p className="font-mono font-bold text-coffee-900">{transactionRef || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest">Submitted On</p>
              <p className="font-bold text-coffee-900 text-[10px]">{booking.created_at ? format(new Date(booking.created_at), 'MMM dd, HH:mm') : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest">Amount Reported</p>
              <p className="font-bold text-emerald-600">₱{amountToVerify?.toLocaleString() || '0'}</p>
            </div>
          </div>
          {proofUrl ? (
            <img 
              src={proofUrl} 
              alt="Payment Proof" 
              className="max-w-full h-auto rounded-xl shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center text-coffee-400 py-10">
              <AlertTriangle size={48} className="mx-auto mb-2 opacity-20" />
              <p>No proof of payment uploaded.</p>
            </div>
          )}
        </div>
        {(booking.status as string) === 'pending_verification' && (
          <div className="p-6 bg-white border-t border-coffee-100 shrink-0 space-y-4">
            {showRejectField && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-1.5 block">Rejection Reason</label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Explain why the proof is being rejected..."
                  className="w-full p-4 rounded-xl border border-coffee-100 bg-coffee-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#A3402A]/20 transition-all min-h-[80px]"
                />
              </div>
            )}
            <div className="flex gap-4">
              {!showRejectField ? (
                <button 
                  onClick={() => setShowRejectField(true)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-red-600 border-2 border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Reject Payment
                </button>
              ) : (
                <button 
                  onClick={() => onVerify('rejected', rejectionNotes)}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                >
                  Confirm Rejection
                </button>
              )}
              {!showRejectField && (
                <button 
                  onClick={() => onVerify('confirmed')}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Confirm Proof
                </button>
              )}
              {showRejectField && (
                <button 
                  onClick={() => setShowRejectField(false)}
                  className="py-3 px-6 rounded-xl font-bold text-coffee-400 border border-coffee-100 hover:bg-coffee-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ReceiptModal = ({ 
  booking, 
  onClose, 
  onVerify,
  isAdminView = false,
  onUpdateStatus,
  onSettlePayment,
  onArchive,
  onPay,
  onRefresh,
  setConfirmDialog,
  currentUserId,
  currentUserRole
}: {
  booking: Booking | AmenityBooking,
  onClose: () => void,
  onVerify?: (status: 'confirmed' | 'rejected', notes?: string) => Promise<void>,
  isAdminView?: boolean,
  onUpdateStatus?: (id: number, isAmenity: boolean, status: string) => Promise<void>,
  onSettlePayment?: (id: number, isAmenity: boolean, paid: number, total: number, amount: number) => Promise<void>,
  onArchive?: (id: number, isAmenity: boolean) => Promise<void>,
  onPay?: () => void,
  onRefresh?: () => Promise<void>,
  setConfirmDialog?: (dialog: any) => void,
  currentUserId?: number,
  currentUserRole?: string
}) => {
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(onRefresh, 60000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const remainingBalance = (booking.total_price || 0) - ((booking.amount_paid || 0) + (booking.balance_amount_paid || 0));
  const [settleInputVal, setSettleInputVal] = useState<string>(remainingBalance.toString());

  useEffect(() => {
    setSettleInputVal(remainingBalance.toString());
  }, [booking.id, remainingBalance]);

  const handlePrint = () => {
    console.log("Print clicked");
    window.print();
  };

  const isAmenity = 'amenity_name' in booking;

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const endpoint = isAmenity ? `/api/amenity-bookings/${booking.id}/invoice` : `/api/bookings/${booking.id}/invoice`;
      const res = await fetch(endpoint, {
        headers: {
          'x-user-id': currentUserId?.toString() || '',
          'x-user-role': currentUserRole || ''
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${booking.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Invoice download error:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isBalanceProof = ((booking.status as string) === 'confirmed' || (booking.status as string) === 'checked-in' || (booking.status as string) === 'Completed' || (booking.status as string) === 'completed') && booking.balance_proof_of_payment;
  const proofUrl = isBalanceProof ? booking.balance_proof_of_payment : booking.proof_of_payment;
  const transactionRef = isBalanceProof ? booking.balance_transaction_reference : booking.transaction_reference;
  const amountToVerify = isBalanceProof ? booking.balance_amount_paid : booking.amount_paid;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 print:p-0">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none max-h-[90vh] flex flex-col my-[5%]"
      >
        <div className="relative bg-coffee-900 p-6 text-white text-center print:bg-white print:text-black print:border-b-2 print:border-coffee-900 shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 text-coffee-300 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors print:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <Hotel className="h-10 w-10 mx-auto mb-2 text-coffee-300 print:text-coffee-900" />
          <h2 className="text-2xl font-serif font-bold">Official Receipt</h2>
          <p className="text-coffee-300 text-sm print:text-coffee-600">Da Bali Resort</p>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between text-sm border-b border-coffee-100 pb-3">
            <div className="text-coffee-500">
              <p>Receipt No: <span className="text-coffee-900 font-mono font-bold">#{(booking?.id || 0).toString().padStart(6, '0')}</span></p>
              <p>Date: {booking?.created_at ? format(new Date(booking.created_at), 'MMM dd, yyyy') : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${(booking.status as string) === 'confirmed' || (booking.status as string) === 'completed' || (booking.status as string) === 'Completed' ? 'text-green-600' : 'text-coffee-900'}`}>{booking.status.toUpperCase().replace('_', ' ')}</p>
              <p className="text-coffee-500">{booking.payment_method}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between border-b border-coffee-100/30 pb-2 mb-2">
              <span className="text-coffee-600 font-medium">Reservation Code</span>
              <span className="text-coffee-900 font-mono font-bold tracking-wide">{booking.qr_code || `DB-${booking.id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-coffee-600">{isAmenity ? 'Amenity' : 'Room'}</span>
              <span className="text-coffee-900 font-medium">{isAmenity ? (booking as AmenityBooking).amenity_name : (booking as Booking).room_name}</span>
            </div>
            {isAmenity ? (
              <>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Reservation Date</span>
                  <span className="text-coffee-900">{format(new Date((booking as AmenityBooking).reservation_date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Reservation Time</span>
                  <span className="text-coffee-900">{(booking as AmenityBooking).reservation_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Pax Count</span>
                  <span className="text-coffee-900">{(booking as AmenityBooking).pax_count} Person(s)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Check-in</span>
                  <span className="text-coffee-900">{format(new Date((booking as Booking).check_in), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Check-out</span>
                  <span className="text-coffee-900">{format(new Date((booking as Booking).check_out), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Duration</span>
                  <span className="text-coffee-900">{differenceInDays(new Date((booking as Booking).check_out), new Date((booking as Booking).check_in))} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-coffee-600">Guests</span>
                  <span className="text-coffee-900">{(booking as Booking).guests_count} Person(s)</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-coffee-50 p-3 rounded-xl flex flex-col gap-1 border border-coffee-100">
            <div className="flex justify-between items-center">
              <span className="text-coffee-600 text-sm">Total Quotation</span>
              <span className="text-[#A3402A] font-bold">₱{(booking.total_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-coffee-600 text-sm">Total Amount Paid</span>
              <span className="text-lg font-bold text-coffee-600">₱{((booking.amount_paid || 0) + (booking.balance_amount_paid || 0)).toLocaleString()}</span>
            </div>
            {((booking.total_price || 0) - ((booking.amount_paid || 0) + (booking.balance_amount_paid || 0))) > 0 && (
              <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                <span className="text-red-700 font-bold text-sm">Amount Due</span>
                <span className="text-lg font-serif font-bold text-red-700">₱{((booking.total_price || 0) - ((booking.amount_paid || 0) + (booking.balance_amount_paid || 0))).toLocaleString()}</span>
              </div>
            )}
          </div>

          {!isAmenity && ((booking.status as string) === 'confirmed' || (booking.status as string) === 'checked-in') && (booking as Booking).qr_code && (
            <div className="flex flex-col items-center space-y-3 pt-6 pb-2 border-t border-coffee-100 mt-6">
              <p className="text-[10px] text-coffee-400 uppercase tracking-widest font-bold">Unique Check-in ID</p>
              <div className="bg-coffee-50 px-6 py-3 rounded-xl border border-coffee-200">
                <span className="text-2xl tracking-widest font-mono font-bold text-coffee-900">{(booking as Booking).qr_code}</span>
              </div>
              <p className="text-xs text-coffee-500 text-center max-w-[250px] mt-2">
                Please have this ID ready upon arrival. Staff will use this to verify your reservation.
              </p>
            </div>
          )}


          {/* Inline Payment Proof & Verification Controls for Admins/Staff */}
          {isAdminView && proofUrl && (
            <div className="border-t border-coffee-100 pt-6 mt-6 space-y-4 print:hidden">
              <h3 className="text-xs font-bold text-coffee-900 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-[#A3402A]" /> Payment Verification
              </h3>
              
              {/* Payment Proof Metadata */}
              <div className="bg-coffee-50 p-4 rounded-xl border border-coffee-100 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] text-coffee-400 uppercase tracking-widest font-bold">Transaction Ref</p>
                  <p className="font-mono font-bold text-coffee-800">{transactionRef || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-coffee-400 uppercase tracking-widest font-bold">Amount Reported</p>
                  <p className="font-bold text-[#518C63]">₱{amountToVerify?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {/* Collapsible/Expandable Image View */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest block">Submitted GCash Receipt</label>
                <div className="relative border border-coffee-200 rounded-xl overflow-hidden bg-coffee-50 aspect-video flex justify-center items-center group">
                  <img 
                    src={proofUrl} 
                    alt="Payment Proof" 
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-bold bg-coffee-900/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Eye size={12} /> Payment Proof
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Buttons (If pending verification) */}
              {(booking.status as string) === 'pending_verification' && onVerify && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 space-y-4">
                  {showRejectReasonInput ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-widest block">Rejection Reason</label>
                      <textarea
                        value={rejectionReasonText}
                        onChange={(e) => setRejectionReasonText(e.target.value)}
                        placeholder="Please explain why the payment proof is being rejected..."
                        className="w-full p-3 rounded-lg border border-coffee-200 bg-white text-xs focus:ring-1 focus:ring-[#A3402A] outline-none resize-none h-16 text-coffee-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!rejectionReasonText.trim()) {
                              alert("Please enter a rejection reason.");
                              return;
                            }
                            setIsVerifying(true);
                            try {
                              await onVerify('rejected', rejectionReasonText);
                            } finally {
                              setIsVerifying(false);
                            }
                          }}
                          disabled={isVerifying}
                          className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectReasonInput(false);
                            setRejectionReasonText('');
                          }}
                          disabled={isVerifying}
                          className="py-2 px-4 rounded-lg border border-coffee-200 text-coffee-600 font-bold text-xs hover:bg-coffee-100 transition-colors bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowRejectReasonInput(true)}
                        disabled={isVerifying}
                        className="flex-1 py-2 px-4 rounded-xl font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <X size={14} /> Reject Payment
                      </button>
                      <button
                        onClick={async () => {
                          setIsVerifying(true);
                          try {
                            await onVerify('confirmed');
                          } finally {
                            setIsVerifying(false);
                          }
                        }}
                        disabled={isVerifying}
                        className="flex-1 py-2 px-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check size={14} /> Approve Payment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {(booking.status as string) === 'rejected' && !isAdminView && (
            <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100 space-y-3">
              <p className="text-red-700 text-xs font-bold">Payment was rejected. Please re-upload proof.</p>
              <button 
                onClick={() => {
                  if (onPay) onPay();
                }}
                className="w-full bg-red-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-red-700 transition-colors">
                Pay/Re-upload
              </button>
            </div>
          )}
          
          {(booking.status as string) === 'pending_verification' && !isAdminView && (
            <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100 space-y-3">
              <p className="text-blue-700 text-xs font-bold">Payment verification in progress...</p>
            </div>
          )}

          {( (booking.status as string) === 'confirmed' || (booking.status as string) === 'partially_paid' || (booking.status as string) === 'Partially Paid' ) && !isAdminView && ( ( (booking.amount_paid || 0) + (booking.balance_amount_paid || 0) ) < booking.total_price ) && (
            <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100 space-y-3">
              <p className="text-emerald-700 text-xs font-bold">Remaining balance can be settled online through this portal or manually processed onsite during check-in.</p>
              <button 
                onClick={() => {
                  if (onPay) onPay();
                }}
                className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Pay Balance
              </button>
            </div>
          )}

          {/* Admin Action Panel */}
          {isAdminView && (
            <div className={`border-t border-coffee-100 pt-6 mt-6 space-y-4 print:hidden ${isPrintPreview ? 'hidden' : ''} bg-coffee-50/50 p-4 rounded-xl border border-coffee-200`}>
              <h3 className="text-xs font-bold text-coffee-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#A3402A]" /> Admin Action Panel
              </h3>

              <div className="flex flex-wrap gap-2">
                {isAmenity ? (
                  // Amenity actions
                  <>
                    {booking.status === 'pending' && onUpdateStatus && (
                      <button 
                        onClick={async () => {
                          if (setConfirmDialog) {
                            setConfirmDialog({
                              title: 'Confirm Booking',
                              message: 'Are you sure you want to confirm this amenity reservation?',
                              onConfirm: async () => {
                                await onUpdateStatus(booking.id, true, 'confirmed');
                              },
                              onCancel: () => {}
                            });
                          } else if (window.confirm('Are you sure you want to confirm this amenity reservation?')) {
                            await onUpdateStatus(booking.id, true, 'confirmed');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-[#518C63] text-white font-bold text-xs rounded-lg hover:bg-[#41704F] transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        Confirm Booking
                      </button>
                    )}
                    {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance < 0.1 && (
                      <button 
                        onClick={async () => {
                          const message = remainingBalance > 0.1 
                            ? `This booking has a remaining balance of ₱${remainingBalance.toLocaleString()}. Are you sure you want to check in?`
                            : 'Are you sure you want to check in this reservation?';
                          
                          if (setConfirmDialog) {
                            setConfirmDialog({
                              title: 'Confirm Check In',
                              message,
                              onConfirm: async () => {
                                await onUpdateStatus(booking.id, true, 'checked-in');
                              },
                              onCancel: () => {}
                            });
                          } else if (window.confirm(message)) {
                            await onUpdateStatus(booking.id, true, 'checked-in');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        Check In
                      </button>
                    )}
                    {(booking.status as string) === 'checked-in' && onUpdateStatus && (
                      <button 
                        onClick={async () => {
                          if (setConfirmDialog) {
                            setConfirmDialog({
                              title: 'Confirm Check Out',
                              message: getCheckoutConfirmMessage(booking),
                              onConfirm: async () => {
                                await onUpdateStatus(booking.id, true, 'completed');
                              },
                              onCancel: () => {}
                            });
                          } else if (window.confirm(getCheckoutConfirmMessage(booking))) {
                            await onUpdateStatus(booking.id, true, 'completed');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-purple-600 text-white font-bold text-xs rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        Check Out
                      </button>
                    )}
                    {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance > 0.1 && (
                      <button 
                        onClick={async () => {
                          if (setConfirmDialog) {
                            setConfirmDialog({
                              title: 'Confirm No-Show',
                              message: 'Are you sure you want to mark this reservation as No-Show?',
                              onConfirm: async () => {
                                await onUpdateStatus(booking.id, true, 'no-show');
                              },
                              onCancel: () => {}
                            });
                          } else if (window.confirm('Are you sure you want to mark this reservation as No-Show?')) {
                            await onUpdateStatus(booking.id, true, 'no-show');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-gray-500 text-white font-bold text-xs rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        Mark No-Show
                      </button>
                    )}
                  </>
                ) : (
                  // Accommodation actions
                  <>
                    {booking.payment_method === 'Walk-in' ? (
                      <>
                        {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance < 0.1 && (
                          <button 
                            onClick={async () => {
                              const message = remainingBalance > 0.1 
                                ? `This booking has a remaining balance of ₱${remainingBalance.toLocaleString()}. Are you sure you want to check in?`
                                : 'Are you sure you want to check in this reservation?';
                                
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm Check In',
                                  message,
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'checked-in');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm(message)) {
                                await onUpdateStatus(booking.id, isAmenity, 'checked-in');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            Check In
                          </button>
                        )}
                        {(booking.status as string) === 'checked-in' && onUpdateStatus && (
                          <button 
                            onClick={async () => {
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm Check Out',
                                  message: getCheckoutConfirmMessage(booking),
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'Completed');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm(getCheckoutConfirmMessage(booking))) {
                                await onUpdateStatus(booking.id, isAmenity, 'Completed');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-purple-600 text-white font-bold text-xs rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            Check Out
                          </button>
                        )}
                        {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance > 0.1 && (
                          <button 
                            onClick={async () => {
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm No-Show',
                                  message: 'Are you sure you want to mark this reservation as No-Show?',
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'no-show');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm('Are you sure you want to mark this reservation as No-Show?')) {
                                await onUpdateStatus(booking.id, isAmenity, 'no-show');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-gray-500 text-white font-bold text-xs rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            No-Show
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {booking.status === 'pending' && onUpdateStatus && (
                          <button 
                            onClick={async () => {
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm Booking',
                                  message: 'Are you sure you want to confirm this reservation?',
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'confirmed');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm('Are you sure you want to confirm this reservation?')) {
                                await onUpdateStatus(booking.id, isAmenity, 'confirmed');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-[#518C63] text-white font-bold text-xs rounded-lg hover:bg-[#41704F] transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            Confirm Booking
                          </button>
                        )}
                        {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance < 0.1 && (
                          <button 
                            onClick={async () => {
                              const message = remainingBalance > 0.1 
                                ? `This booking has a remaining balance of ₱${remainingBalance.toLocaleString()}. Are you sure you want to check in?`
                                : 'Are you sure you want to check in this reservation?';

                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm Check In',
                                  message,
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'checked-in');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm(message)) {
                                await onUpdateStatus(booking.id, isAmenity, 'checked-in');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            Check In
                          </button>
                        )}
                        {(booking.status as string) === 'checked-in' && onUpdateStatus && (
                          <button 
                            onClick={async () => {
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm Check Out',
                                  message: getCheckoutConfirmMessage(booking),
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'Completed');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm(getCheckoutConfirmMessage(booking))) {
                                await onUpdateStatus(booking.id, isAmenity, 'Completed');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-purple-600 text-white font-bold text-xs rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            Check Out
                          </button>
                        )}
                        {(booking.status as string) === 'confirmed' && onUpdateStatus && remainingBalance > 0.1 && (
                          <button 
                            onClick={async () => {
                              if (setConfirmDialog) {
                                setConfirmDialog({
                                  title: 'Confirm No-Show',
                                  message: 'Are you sure you want to mark this reservation as No-Show?',
                                  onConfirm: async () => {
                                    await onUpdateStatus(booking.id, isAmenity, 'no-show');
                                  },
                                  onCancel: () => {}
                                });
                              } else if (window.confirm('Are you sure you want to mark this reservation as No-Show?')) {
                                await onUpdateStatus(booking.id, isAmenity, 'no-show');
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-gray-500 text-white font-bold text-xs rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-1 shadow-sm"
                          >
                            No-Show
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Archive Button */}
                {((booking.status as string) === 'Completed' || (booking.status as string) === 'completed' || (booking.status as string) === 'cancelled' || booking.status === 'no-show' || booking.is_archived === 1) && onArchive && (
                  <button 
                    onClick={async () => {
                      if (booking.is_archived === 1) return;
                      if (confirm("Are you sure you want to archive this booking?")) {
                        await onArchive(booking.id, isAmenity);
                      }
                    }}
                    disabled={booking.is_archived === 1}
                    className={`flex-1 py-2 px-3 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 border shadow-sm ${
                      booking.is_archived === 1 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 flex items-center gap-1'
                    }`}
                  >
                    <Archive size={14} /> Archive
                  </button>
                )}
              </div>

              {/* Settlement Section */}
              {remainingBalance > 0 && booking.status !== 'no-show' && booking.status !== 'rejected' && booking.status !== 'pending' && booking.status !== 'pending_verification' && booking.status.toLowerCase() !== 'completed' && booking.is_archived !== 1 && onSettlePayment && (
                <div className="flex flex-col gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-800 font-bold">Unpaid Balance</span>
                    <span className="font-mono text-emerald-800 font-bold">₱{remainingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Enter exact balance to settle..."
                        id="modalSettleInput"
                        className="flex-1 px-3 py-2 text-xs border border-emerald-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={settleInputVal}
                        onChange={(e) => setSettleInputVal(e.target.value)}
                      />
                      <button
                        onClick={async () => {
                          const amount = parseFloat(settleInputVal || '0');
                          const paid = Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0);
                          const total = Number(booking.total_price || 0);
                          const remaining = total - paid;
                          if (isNaN(amount) || amount <= 0) return;
                          if (Math.abs(amount - remaining) > 0.01) { 
                            return; 
                          }
                          await onSettlePayment(booking.id, isAmenity, paid, total, amount);
                          onClose();
                        }}
                        disabled={Math.abs(parseFloat(settleInputVal || '0') - remainingBalance) >= 0.01}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm transition-all duration-200 ${
                          Math.abs(parseFloat(settleInputVal || '0') - remainingBalance) < 0.01
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        Settle Balance
                      </button>
                    </div>
                    {Math.abs(parseFloat(settleInputVal || '0') - remainingBalance) >= 0.01 && (
                      <p className="text-red-600 text-[11px] font-medium leading-relaxed" id="settle-validation-warning">
                        ⚠️ The full, exact outstanding balance of ₱{remainingBalance.toLocaleString()} must be entered to proceed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 print:hidden shrink-0 p-4 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-coffee-100 text-coffee-900 py-3 rounded-xl font-bold hover:bg-coffee-200 transition-colors flex items-center justify-center text-sm"
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </button>
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="flex-1 bg-[#A3402A] text-white py-3 rounded-xl font-bold hover:bg-[#8a3522] transition-colors flex items-center justify-center text-sm disabled:opacity-60"
            >
              <Download className="h-4 w-4 mr-2" /> {isDownloading ? 'Preparing...' : 'Download PDF'}
            </button>
          </div>
          <p className="hidden print:block text-center text-[10px] text-coffee-400 mt-8">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const sanitizeName = (name: string) => name.replace(/[^a-zA-Z\s]/g, '').trim();
const sanitizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
};
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.endsWith('.com');

const WalkInModal = ({ rooms, bookings, onClose, onSubmit, setToastMessage }: { rooms: Room[], bookings: Booking[], onClose: () => void, onSubmit: (data: any) => void, setToastMessage: (msg: any) => void }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    roomId: '',
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    guestsCount: 1,
    extraBed: false,
    paymentMethod: 'GCash'
  });
  const [isPaymentSummaryStep, setIsPaymentSummaryStep] = useState(false);
  const [proofOfPayment, setProofOfPayment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const room = rooms.find(r => r.id === parseInt(formData.roomId));
  
  // Calculate occupied dates for the selected room
  const occupiedDates = useMemo(() => {
    if (!formData.roomId) return [];
    const today = startOfToday();
    return bookings
      .filter(b => b.room_id === parseInt(formData.roomId) && b.status !== 'cancelled' && b.status !== 'no-show')
      .flatMap(b => {
        // Use parseISO or ensure yyyy-MM-dd is treated as local date for consistency with DatePicker
        const [y1, m1, d1] = b.check_in.split('-').map(Number);
        const [y2, m2, d2] = b.check_out.split('-').map(Number);
        const start = new Date(y1, m1 - 1, d1);
        const end = new Date(y2, m2 - 1, d2);
        
        const dates = [];
        let curr = new Date(start);
        while (curr < end) {
          if (!(b.status === 'Completed' && curr >= today)) {
            dates.push(new Date(curr));
          }
          curr = addDays(curr, 1);
        }
        return dates;
      });
  }, [formData.roomId, bookings]);

  const nights = differenceInDays(new Date(formData.checkOut), new Date(formData.checkIn));
  const basePrice = room ? room.price * (nights || 1) : 0;
  const extraBedPrice = formData.extraBed ? 500 * (nights || 1) : 0;
  const totalPrice = basePrice + extraBedPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Required Fields Validation for Walk-in
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setToastMessage({ title: 'Error', message: 'Guest name is required.', type: 'error' });
      return;
    }
    if (!formData.roomId) {
      setToastMessage({ title: 'Error', message: 'Please select a room.', type: 'error' });
      return;
    }
    
    // Date Validation
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      setToastMessage({ title: 'Error', message: 'Check-out date must be after check-in date.', type: 'error' });
      return;
    }

    // Double Booking Validation
    const isOverlapping = bookings.some(b => {
      if (b.room_id !== parseInt(formData.roomId)) return false;
      if (b.status === 'cancelled' || b.status === 'no-show') return false;
      
      const start = new Date(formData.checkIn);
      const end = new Date(formData.checkOut);
      const bStart = new Date(b.check_in);
      const bEnd = new Date(b.check_out);
      
      return (start < bEnd && end > bStart);
    });

    if (isOverlapping) {
      setToastMessage({ title: 'Error', message: 'This room is already booked for the selected dates.', type: 'error' });
      return;
    }

    setIsPaymentSummaryStep(true);
  };

  const handleFinalize = () => {
    // Ensure we reset state after walk-in submit too (handled in fetchAdminData but good to clear local)
    onSubmit({ ...formData, totalPrice, proofOfPayment });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage({ title: 'Error', message: 'File size must be less than 5MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfPayment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-[500] flex items-center justify-center p-4 py-12 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full"
      >
        <div className="bg-coffee-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="h-5 w-5 text-coffee-300" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold">Admin Overwrite (Walk-in)</h2>
              <p className="text-[10px] text-coffee-300 uppercase tracking-widest">{isPaymentSummaryStep ? 'Payment Summary' : 'Direct Reservation'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          {isPaymentSummaryStep ? (
            <div className="p-8 space-y-6">
              <div className="bg-coffee-50 rounded-2xl p-6 border border-coffee-100 space-y-4">
                <div className="flex justify-between items-center border-b border-coffee-100 pb-3">
                  <h4 className="text-sm font-bold text-coffee-900 uppercase tracking-widest flex items-center gap-2">
                    <Receipt size={16} className="text-[#A3402A]" /> Booking Summary
                  </h4>
                  <span className="text-[10px] font-bold text-[#518C63] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">Walk-in Reservation</span>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest">Guest Detail</p>
                    <p className="text-sm font-bold text-coffee-900 truncate">{formData.firstName} {formData.lastName}</p>
                    <p className="text-[10px] text-coffee-600 truncate">{formData.email || 'No email provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest">Accommodation</p>
                    <p className="text-sm font-bold text-coffee-900">{rooms.find(r => r.id === parseInt(formData.roomId))?.name || 'N/A'}</p>
                    <p className="text-[10px] text-coffee-600">{formData.guestsCount} Guests {formData.extraBed ? '+ Extra Bed' : ''}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest">Stay Duration</p>
                    <p className="text-sm font-bold text-coffee-900 flex items-center gap-1.5">
                      {format(new Date(formData.checkIn), 'MMM dd')} - {format(new Date(formData.checkOut), 'MMM dd')}
                    </p>
                    <p className="text-[10px] text-coffee-600">{differenceInDays(new Date(formData.checkOut), new Date(formData.checkIn))} Night(s)</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest">Total Transaction</p>
                    <p className="text-xl font-serif font-bold text-coffee-900">₱{(totalPrice || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-[#A3402A] font-bold uppercase tracking-wider">{formData.paymentMethod} Payment</p>
                  </div>
                </div>
              </div>
            
            {formData.paymentMethod === 'Cash' ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <p className="text-sm text-emerald-800">Please confirm the collection of <span className="font-bold">₱{(totalPrice || 0).toLocaleString()}</span> in cash from the guest.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-3">{formData.paymentMethod} QR Code</p>
                  <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-gray-100">
                    <QRCodeSVG 
                      value={formData.paymentMethod === 'GCash' ? '09629724075' : '1234-5678-90'} 
                      size={140}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500 font-medium font-mono">Verify receipt before finalizing</p>
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {proofOfPayment ? (
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-emerald-100 aspect-video bg-gray-50">
                    <img src={proofOfPayment} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white rounded-full text-coffee-900 hover:bg-coffee-50 transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={() => setProofOfPayment(null)}
                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Proof Uploaded Successfully</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 rounded-2xl font-bold text-coffee-900 bg-coffee-50 border-2 border-dashed border-coffee-200 hover:bg-coffee-100 hover:border-coffee-300 transition-all flex flex-col items-center gap-1"
                  >
                    <Upload className="h-5 w-5 text-coffee-400" />
                    <span className="text-xs">Upload Physical/Digital Receipt Screenshot</span>
                    <span className="text-[9px] text-coffee-400 font-normal">Standardize proof for records</span>
                  </button>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-6 border-t border-coffee-50">
              <button type="button" onClick={() => setIsPaymentSummaryStep(false)} className="px-6 py-2.5 rounded-xl font-bold text-coffee-500 hover:bg-coffee-50 transition-all">Go Back</button>
              <button 
                disabled={formData.paymentMethod !== 'Cash' && !proofOfPayment}
                onClick={handleFinalize} 
                className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                  formData.paymentMethod !== 'Cash' && !proofOfPayment 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#518C63] text-white hover:bg-[#41704F]'
                }`}
              >
                <Check className="h-4 w-4" />
                Confirm & Finalize
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* ... form fields ... */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">First Name</label>
                <input 
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: sanitizeName(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Last Name</label>
                <input 
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: sanitizeName(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Email (Optional)</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Contact No</label>
                <input 
                  value={formData.contactNo}
                  onChange={e => setFormData({...formData, contactNo: sanitizePhone(e.target.value)})}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Guests</label>
                <input 
                  type="number"
                  min="1"
                  value={formData.guestsCount ?? ''}
                  onChange={e => setFormData({...formData, guestsCount: e.target.value === '' ? 1 : parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Room Selection</label>
                <select 
                  required
                  value={formData.roomId ?? ''}
                  onChange={e => setFormData({...formData, roomId: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all bg-white"
                >
                  <option value="">Select a room</option>
                  {rooms.filter(r => r.status === 'available').map(room => (
                    <option key={room.id} value={room.id}>{room.name} - ₱{room.price}/night</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Check-in</label>
                <DatePicker
                  selected={new Date(formData.checkIn)}
                  onChange={(date) => {
                    if (date) {
                      const newCheckIn = format(date, 'yyyy-MM-dd');
                      let newCheckOut = formData.checkOut;
                      if (new Date(newCheckOut) <= date) {
                        newCheckOut = format(addDays(date, 1), 'yyyy-MM-dd');
                      }
                      setFormData({...formData, checkIn: newCheckIn, checkOut: newCheckOut});
                    }
                  }}
                  selectsStart
                  startDate={new Date(formData.checkIn)}
                  endDate={new Date(formData.checkOut)}
                  minDate={new Date()}
                  excludeDates={occupiedDates}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                  placeholderText="Select check-in"
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Check-out</label>
                <DatePicker
                  selected={new Date(formData.checkOut)}
                  onChange={(date) => {
                    if (date) {
                      setFormData({...formData, checkOut: format(date, 'yyyy-MM-dd')});
                    }
                  }}
                  selectsEnd
                  startDate={new Date(formData.checkIn)}
                  endDate={new Date(formData.checkOut)}
                  minDate={addDays(new Date(formData.checkIn), 1)}
                  excludeDates={occupiedDates}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none transition-all"
                  placeholderText="Select check-out"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['GCash', 'BPI', 'Cash'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, paymentMethod: method})}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.paymentMethod === method ? 'bg-coffee-900 text-white' : 'bg-coffee-50 text-coffee-600 hover:bg-coffee-100'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-coffee-50 rounded-2xl border border-coffee-100">
              <input 
                type="checkbox"
                id="walkin-extra-bed"
                checked={formData.extraBed}
                onChange={e => setFormData({...formData, extraBed: e.target.checked})}
                className="w-5 h-5 rounded border-coffee-300 text-coffee-900 focus:ring-coffee-500"
              />
              <label htmlFor="walkin-extra-bed" className="text-sm font-bold text-coffee-900 flex-1">
                Add Extra Bed (+₱500/night)
              </label>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 uppercase">Total Quotation (100%)</span>
              <span className="text-xl font-serif font-bold text-emerald-900">₱{(totalPrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-coffee-50">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-coffee-500 hover:bg-coffee-50 transition-all">Cancel</button>
              <button type="submit" className="px-8 py-2.5 rounded-xl font-bold bg-coffee-900 text-white hover:bg-coffee-800 transition-all shadow-lg shadow-coffee-900/20 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Proceed to Payment
              </button>
            </div>
          </form>
        )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [toastMessage, setToastMessage] = useState<{title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{title: string, message: string, onConfirm: () => void, onCancel: () => void} | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Persist the logged-in user so a page refresh doesn't log them out
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch {}
  }, [user]);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('lastPage');
    return saved || 'home';
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [showArchivedRooms, setShowArchivedRooms] = useState(false);
  const [roomFilter, setRoomFilter] = useState('All');
  const [newBookingTab, setNewBookingTab] = useState<'rooms' | 'amenities'>('rooms');
  useEffect(() => {
    if (page !== 'rooms') setNewBookingTab('rooms');
  }, [page]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitySearch, setAmenitySearch] = useState('');
  const [showArchivedAmenities, setShowArchivedAmenities] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showReceipt, setShowReceipt] = useState<Booking | AmenityBooking | null>(null);
  const [showProofViewer, setShowProofViewer] = useState<Booking | null>(null);
  const [showProofModal, setShowProofModal] = useState<Booking | null>(null);
  const [showAmenityProofModal, setShowAmenityProofModal] = useState<AmenityBooking | null>(null);
  const [showAmenityDetailsModal, setShowAmenityDetailsModal] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [staffRecord, setStaffRecord] = useState<StaffRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  // The stay the guest is currently reviewing (null = feedback modal closed).
  const [feedbackBooking, setFeedbackBooking] = useState<Booking | null>(null);
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  // Guards the automatic review prompt so it never opens for an already-reviewed stay
  // before the guest's own reviews have loaded.
  const [hasLoadedMyFeedbacks, setHasLoadedMyFeedbacks] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'analytics' | 'reservations' | 'rooms' | 'amenities' | 'dtr' | 'payments' | 'slideshow' | 'staff-records' | 'messages' | 'housekeeping' | 'audit-logs' | 'faq-chatbot' | 'feedback'>('overview');
  const [staffRecordsTab, setStaffRecordsTab] = useState<'directory' | 'management' | 'history'>('directory');
  const [reservationsTab, setReservationsTab] = useState<'all' | 'accommodation' | 'amenity'>('all');
  const [reservationFilter, setReservationFilter] = useState<'Upcoming' | 'Completed' | 'Archived'>('Upcoming');
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [guestActiveTab, setGuestActiveTab] = useState<'overview' | 'bookings' | 'profile'>('overview');
  const [guestBookingsCategory, setGuestBookingsCategory] = useState<'accommodations' | 'amenities'>('accommodations');
  const [exportClicked, setExportClicked] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [editingAmenity, setEditingAmenity] = useState<Partial<Amenity> | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);

  useEffect(() => {
    if (selectedAmenity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedAmenity]);
  const [isReservingAmenity, setIsReservingAmenity] = useState(false);
  const [amenitySelections, setAmenitySelections] = useState<Record<string, number>>({});
  const [amenityBookings, setAmenityBookings] = useState<AmenityBooking[]>([]);
  const [showAmenityProofViewer, setShowAmenityProofViewer] = useState<AmenityBooking | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [lastAmenityBooking, setLastAmenityBooking] = useState<AmenityBooking | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportType, setExportReportType] = useState<'overall' | 'monthly'>('overall');
  const [selectedMonthForReport, setSelectedMonthForReport] = useState(format(new Date(), 'yyyy-MM'));
  const [showExtensionModal, setShowExtensionModal] = useState<Booking | null>(null);
  const [reservationsExpanded, setReservationsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingScheduleRecord, setEditingScheduleRecord] = useState<any>(null);
  const [rejectionReasonToShow, setRejectionReasonToShow] = useState<string | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [viewingAdminNoteContent, setViewingAdminNoteContent] = useState<string | null>(null);

  const handleExtensionCheck = async (booking: Booking) => {
    try {
      const res = await fetch(`/api/rooms/${booking.room_id}/next-booking?currentCheckOut=${booking.check_out}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const nextBooking = await res.json();
      
      // Calculate buffer
      const checkOutDate = new Date(booking.check_out);
      // Assume check-out is at 12:00 PM on the check-out date
      checkOutDate.setHours(12, 0, 0, 0);
      
      let nextCheckInDate: Date | null = null;
      if (nextBooking) {
        nextCheckInDate = new Date(nextBooking.check_in);
        // Assume check-in is at 2:00 PM on the check-in date
        nextCheckInDate.setHours(14, 0, 0, 0);
      }

      const bufferHours = nextCheckInDate 
        ? (nextCheckInDate.getTime() - checkOutDate.getTime()) / (1000 * 60 * 60)
        : 24; // No next booking, assume plenty of time

      if (bufferHours >= 3) {
        setConfirmDialog({
          title: 'Extension Possible',
          message: `Extension is possible (Buffer: ${bufferHours.toFixed(1)} hours). Next guest arrives on ${nextBooking ? format(new Date(nextBooking.check_in), 'MMM dd') : 'N/A'}. Grant 30-60 min extension for a fee?`,
          onConfirm: () => {
            setToastMessage({ title: 'Success', message: 'Extension granted. Please manually adjust the check-out time or add a fee to the guest account.', type: 'success' });
          },
          onCancel: () => {}
        });
      } else if (bufferHours <= 0.5) {
        setToastMessage({ title: 'Error', message: `Extension declined. Next guest arrives in ${bufferHours * 60} minutes. Turnover time is insufficient.`, type: 'error' });
      } else {
        setToastMessage({ title: 'Warning', message: `Extension is tight (Buffer: ${bufferHours.toFixed(1)} hours). Turnover time might be compromised. Proceed with caution.`, type: 'info' });
      }
    } catch (e) {
      console.error(e);
      setToastMessage({ title: 'Error', message: 'Failed to check extension possibility.', type: 'error' });
    }
  };
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFromDashboard, setIsFromDashboard] = useState(false);

  // Moved hook to top level to comply with Rules of Hooks
  const roomOccupiedDates = useMemo(() => {
    if (!selectedRoom) return [];
    const today = startOfToday();
    return bookings
      .filter(b => b.room_id === selectedRoom.id && b.status !== 'cancelled' && b.status !== 'no-show')
      .flatMap(b => {
        const [y1, m1, d1] = b.check_in.split('-').map(Number);
        const [y2, m2, d2] = b.check_out.split('-').map(Number);
        const start = new Date(y1, m1 - 1, d1);
        const end = new Date(y2, m2 - 1, d2);
        
        const dates = [];
        let curr = new Date(start);
        while (curr < end) {
          if (!(b.status === 'Completed' && curr >= today)) {
            dates.push(new Date(curr));
          }
          curr = addDays(curr, 1);
        }
        return dates;
      });
  }, [selectedRoom, bookings]);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNo: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        contactNo: user.contact_no || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleWalkInSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/bookings/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowWalkInModal(false);
        await fetchAdminData();
        setAdminActiveTab('payments');
        setToastMessage({ title: 'Success', message: 'Walk-in booking created successfully! Redirecting to Payment Transactions.', type: 'success' });
      } else {
        const err = await res.json();
        setToastMessage({ title: 'Error', message: err.error || 'Failed to create walk-in booking.', type: 'error' });
      }
    } catch (error) {
      console.error('Walk-in error:', error);
      setToastMessage({ title: 'Error', message: 'An error occurred while creating the walk-in booking.', type: 'error' });
    }
  };

  useEffect(() => {
    if (page === 'admin-dashboard' && adminActiveTab === 'overview') {
      fetchAnalytics();
    }
  }, [page, adminActiveTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Ensure we have a valid ID, fallback to email if necessary
    const userId = user.id;
    if (!userId && !profileForm.email) {
      setProfileError("Session error: User identity lost. Please log out and in again.");
      return;
    }

    setProfileError(null);
    if (!isValidEmail(profileForm.email)) {
      setProfileError('Please provide a valid email address ending in .com');
      return;
    }
    try {
      const sanitizedForm = {
        ...profileForm,
        firstName: sanitizeName(profileForm.firstName),
        lastName: sanitizeName(profileForm.lastName),
        contactNo: sanitizePhone(profileForm.contactNo)
      };
      const response = await fetch(`/api/users/${userId || 'me'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedForm)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setIsEditingProfile(false);
      } else {
        console.error('Failed to update profile:', data.error || 'Unknown error');
        setProfileError(data.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileError('An unexpected error occurred. Please check your connection and try again.');
    }
  };
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroBannersLoading, setIsHeroBannersLoading] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    type: '' as 'Announcement' | 'Advertisement' | 'Promotion' | '',
    order_index: 0,
    is_active: 1
  });

  const fetchHeroBanners = async () => {
    try {
      const res = await fetch('/api/slideshow-items');
      if (res.ok) {
        const data = await res.json();
        setHeroBanners(data);
      }
    } catch (error) {
      console.error('Failed to fetch hero banners:', error);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Banner submit triggered', { bannerForm, editingBanner });
    setIsHeroBannersLoading(true);
    const isEditing = !!editingBanner;
    try {
      const endpoint = isEditing ? `/api/slideshow-items/${editingBanner!.id}` : '/api/slideshow-items';
      const method = 'POST'; // Using POST for both create and update to avoid potential WAF blocks on PUT
      console.log(`Sending ${method} request to ${endpoint}`);
      
      // Base64 encode the payload to bypass WAF rules that block URLs in request bodies
      const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(bannerForm))));

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ payload: encodedPayload }),
        credentials: 'include'
      });
      
      console.log('Response status:', res.status);
      if (res.ok) {
        setShowBannerModal(false);
        setEditingBanner(null);
        setBannerForm({
          title: '',
          description: '',
          image_url: '',
          link_url: '',
          type: '',
          order_index: 0,
          is_active: 1
        });
        fetchHeroBanners().catch(console.error);
        setToastMessage({ 
          title: 'Success', 
          message: `Banner ${isEditing ? 'updated' : 'added'} successfully.`, 
          type: 'success' 
        });
      } else {
        const errorText = await res.text();
        console.error('Error response text:', errorText);
        let errorMessage = `Failed to ${isEditing ? 'update' : 'add'} banner (Status: ${res.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) errorMessage += `: ${errorData.details}`;
        } catch (e) {
          if (errorText.includes('<html>')) {
            errorMessage = `Server returned an HTML error page (Status: ${res.status}). This usually means a 404 or a redirect. Endpoint: ${method} ${endpoint}. Please check if you are logged in as admin.`;
          }
        }
        setToastMessage({ title: 'Error', message: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to save banner:', error);
      setToastMessage({ 
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Failed to save banner.', 
        type: 'error' 
      });
    } finally {
      setIsHeroBannersLoading(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    setConfirmDialog({
      title: 'Delete Banner',
      message: 'Are you sure you want to delete this banner?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/slideshow-items/${id}`, { 
            method: 'DELETE',
            headers: {
              'x-user-id': user?.id?.toString() || '',
              'x-user-role': user?.role || ''
            }
          });
          if (res.ok) {
            await fetchHeroBanners();
            setToastMessage({ title: 'Success', message: 'Banner deleted successfully.', type: 'success' });
          } else {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete banner');
          }
        } catch (error) {
          console.error('Failed to delete banner:', error);
          setToastMessage({ title: 'Error', message: error instanceof Error ? error.message : 'Failed to delete banner.', type: 'error' });
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  useEffect(() => {
    fetchHeroBanners().catch(console.error);
  }, []);

  useEffect(() => {
    if (page === 'home') {
      setCurrentSlide(0);
    }
  }, [page]);

  useEffect(() => {
    if (page !== 'home') return;
    
    if (heroBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [heroBanners, page]);

  const [isBooking, setIsBooking] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  
  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: '', password: '', firstName: '', lastName: '', email: '', contactNo: '', address: ''
  });

  // Forgot Password States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [editingAdminNote, setEditingAdminNote] = useState<{ id: number, notes: string, isAmenity?: boolean } | null>(null);
  const [settleAmount, setSettleAmount] = useState<Record<string, string>>({});
  const [isAdminNoteLoading, setIsAdminNoteLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setPage('login'); // Keep them on login page but show reset modal
    }
  }, []);

  useEffect(() => {
    // Clear form and error when switching modes or navigating to login
    setAuthForm({
      username: '', 
      password: '', firstName: '', lastName: '', email: '', contactNo: '', address: ''
    });
    setAuthError(null);
    setShowPassword(false);
  }, [authMode, page]);

  // Booking States
  const [bookingDates, setBookingDates] = useState({
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd')
  });
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'BPI'>('GCash');
  const [guestsCount, setGuestsCount] = useState(1);
  const [extraBed, setExtraBed] = useState(false);
  const [bookingProof, setBookingProof] = useState<string | null>(null);
  const [bookingAmountPaid, setBookingAmountPaid] = useState<string>('');
  const [bookingTransactionReference, setBookingTransactionReference] = useState<string>('');
  const [amenityBookingProof, setAmenityBookingProof] = useState<string | null>(null);
  const [amenityPaymentMethod, setAmenityPaymentMethod] = useState<'GCash' | 'BPI'>('GCash');
  const [amenityStep, setAmenityStep] = useState<'details' | 'payment'>('details');
  const [amenityFormData, setAmenityFormData] = useState<any>(null);
  const [amenityAmountPaid, setAmenityAmountPaid] = useState<string>('');
  const [amenityTransactionReference, setAmenityTransactionReference] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedRoom || !bookingDates.checkIn || !bookingDates.checkOut) return;
      
      setIsCheckingAvailability(true);
      setAvailabilityError(null);
      try {
        const res = await fetch(`/api/bookings/check-availability?roomId=${selectedRoom.id}&checkIn=${bookingDates.checkIn}&checkOut=${bookingDates.checkOut}`);
        const contentType = res.headers.get('content-type');
        if (!res.ok || !contentType?.includes('application/json')) throw new Error(`Availability check failed`);
        const { available } = await res.json();
        if (!available) {
          setAvailabilityError('This room is already occupied for the selected dates. Please choose another room or different dates.');
        }
      } catch (error) {
        console.error('Availability check error:', error);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    if (page === 'booking') {
      checkAvailability().catch(err => console.error("Availability check failed:", err));
    }
  }, [selectedRoom, bookingDates, page]);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Initializing session - ensure booking state is fresh
          resetBookingState();
          resetAmenityBookingState();
          if (userData.role === 'admin' || userData.role === 'staff') {
            setPage('admin-dashboard');
          } else {
            setPage('guest-dashboard');
            setGuestActiveTab('overview');
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    handleAuth().catch(err => console.error("Session check failed:", err));
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log the full event for deep debugging
      console.warn('Unhandled Promise Rejection Event:', event);
      
      // Attempt to extract a message and stack trace
      let errorMessage = 'An unexpected error occurred.';
      let stackTrace = '';
      let rawReason = event.reason;
      
      try {
        if (rawReason === null || rawReason === undefined) {
          errorMessage = `Rejection with ${rawReason === null ? 'null' : 'undefined'} reason`;
          stackTrace = new Error().stack || '';
        } else if (rawReason instanceof Error) {
          errorMessage = rawReason.message || 'Error object with no message';
          stackTrace = rawReason.stack || '';
        } else if (typeof rawReason === 'string') {
          errorMessage = rawReason || 'Empty string error';
        } else if (typeof rawReason === 'object') {
          // Try to extract properties even if not enumerable
          const props = Object.getOwnPropertyNames(rawReason);
          const objContent: any = {};
          
          if (props.length === 0) {
            // Might be a weird object or Object.create(null)
            errorMessage = `Object rejection with no own properties: ${String(rawReason)}`;
          } else {
            props.forEach(key => {
              try {
                const val = (rawReason as any)[key];
                objContent[key] = (typeof val === 'function') ? '[Function]' : val;
              } catch (e) {
                objContent[key] = '[Unreadable]';
              }
            });
            
            // Use a more robust stringification
            try {
              errorMessage = JSON.stringify(objContent, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              );
            } catch (e) {
              errorMessage = 'Object rejection (could not stringify)';
            }
            
            // Prioritize specific error fields
            if ((rawReason as any).message) errorMessage = String((rawReason as any).message);
            else if ((rawReason as any).error) errorMessage = String((rawReason as any).error);
            else if ((rawReason as any).code) errorMessage = `Error ${(rawReason as any).code}: ${errorMessage}`;
            
            if ((rawReason as any).stack) stackTrace = String((rawReason as any).stack);
          }
        } else {
          errorMessage = String(rawReason);
        }
      } catch (e) {
        errorMessage = 'Critical error in handleUnhandledRejection: ' + (e instanceof Error ? e.message : String(e));
      }

      // Final fallback for empty messages
      if (!errorMessage || !errorMessage.trim() || errorMessage === '{}' || errorMessage === '""') {
        errorMessage = `Unknown error (Type: ${typeof rawReason}, Value: ${String(rawReason)})`;
      }

      // Ignore certain benign unhandled rejections
      const lowerMessage = errorMessage.toLowerCase();
      if (
        lowerMessage.includes('cancel') ||
        lowerMessage.includes('user aborted') ||
        lowerMessage.includes('resizeobserver') ||
        lowerMessage.includes('aborted') ||
        lowerMessage.includes('unexpected token') ||
        lowerMessage.includes('not valid json') ||
        lowerMessage.includes('json.parse') ||
        lowerMessage.includes('doctype') ||
        lowerMessage.includes('502') ||
        lowerMessage.includes('503') ||
        lowerMessage.includes('bad gateway')
      ) {
        return; // Don't log or show toast for benign rejections or transient gateway/json errors during restart
      }
      
      if (errorMessage === 'Failed to fetch' || errorMessage.includes('NetworkError')) {
        setToastMessage({ 
          title: 'Connection Error', 
          message: 'The server is currently unreachable. Please check your internet connection or try again later.', 
          type: 'error' 
        });
      } else {
        setToastMessage({
          title: 'Error',
          message: `An unexpected error occurred: ${errorMessage.substring(0, 150)}${errorMessage.length > 150 ? '...' : ''}`,
          type: 'error'
        });
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('Global Error Event:', event);
      
      let errorMessage = 'An unexpected error occurred.';
      let stackTrace = '';

      try {
        if (event.error instanceof Error) {
          errorMessage = event.error.message || 'Error object with no message';
          stackTrace = event.error.stack || '';
        } else if (typeof event.error === 'string') {
          errorMessage = event.error;
        } else if (event.message) {
          errorMessage = event.message;
        } else if (event.error === null || event.error === undefined) {
          errorMessage = `Global error with ${event.error === null ? 'null' : 'undefined'} error object`;
        } else {
          errorMessage = String(event.error);
        }
      } catch (e) {
        errorMessage = 'Critical error in handleGlobalError: ' + (e instanceof Error ? e.message : String(e));
      }

      console.error('Global error (raw):', event.error);
      console.error('Extracted error message:', errorMessage);
      if (stackTrace) {
        console.error('Extracted stack trace:', stackTrace);
      }

      const lowerErrorMsg = errorMessage.toLowerCase();
      if (
        lowerErrorMsg.includes('cancel') ||
        lowerErrorMsg.includes('user aborted') ||
        lowerErrorMsg.includes('resizeobserver') ||
        lowerErrorMsg.includes('aborted') ||
        lowerErrorMsg.includes('unexpected token') ||
        lowerErrorMsg.includes('not valid json') ||
        lowerErrorMsg.includes('json.parse') ||
        lowerErrorMsg.includes('doctype') ||
        lowerErrorMsg.includes('502') ||
        lowerErrorMsg.includes('503') ||
        lowerErrorMsg.includes('bad gateway')
      ) {
        return; // Skip benign errors or transient gateway/json errors during restart
      }

      setToastMessage({
        title: 'Application Error',
        message: `An unexpected error occurred: ${errorMessage.substring(0, 150)}${errorMessage.length > 150 ? '...' : ''}`,
        type: 'error'
      });
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health', {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        const data = await res.json();
        console.log('Server health check:', data);
      } catch (e) {
        console.error('Server health check failed:', e);
      }
    };
    checkHealth().catch(err => console.error("Health check failed:", err));
    
    if (user) {
      if (page === 'admin-dashboard') {
        fetchAdminData().catch(console.error);
      } else if (page === 'guest-dashboard') {
        fetchUserBookings(user.id).catch(console.error);
        fetchMyFeedbacks(user).catch(console.error);
      }
    }

    localStorage.setItem('lastPage', page);
    
    if (page === 'home' || page === 'guest-dashboard') {
      const hash = window.location.hash;
      if (hash) {
        // Wait for components to render and layout to settle
        const scrollAttempt = (attempts = 0) => {
          const element = document.querySelector(hash);
          if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            // Clear hash so it doesn't re-trigger on next mount unless explicitly set
            setTimeout(() => {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }, 1000);
          } else if (attempts < 5) {
            setTimeout(() => scrollAttempt(attempts + 1), 150);
          }
        };
        scrollAttempt();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (page === 'rooms' || page === 'amenities' || page === 'booking') {
      window.scrollTo(0, 0);
    }

    // WebSocket setup
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      // Optional: Reconnect logic could go here
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BOOKING_CREATED' || data.type === 'BOOKING_UPDATED' || data.type === 'FEEDBACK_ADDED' || data.type === 'DTR_UPDATED' || data.type === 'HERO_BANNERS_UPDATED' || data.type === 'AMENITY_BOOKING_UPDATED' || data.type === 'AMENITY_BOOKING_CREATED' || data.type === 'AMENITIES_UPDATED' || data.type === 'HOUSEKEEPING_UPDATED' || data.type === 'ROOMS_UPDATED') {
          fetchRooms().catch(console.error);
          fetchFeedbacks().catch(console.error);
          fetchHeroBanners().catch(console.error);
          if (data.type === 'AMENITY_BOOKING_UPDATED' || data.type === 'AMENITY_BOOKING_CREATED' || data.type === 'AMENITIES_UPDATED') {
            // Stock/price live on the amenities list, which only these events can change.
            fetchAmenities().catch(console.error);
          }
          if (user?.role === 'admin') {
            fetchAdminData().catch(console.error);
          } else if (user) {
            fetchUserBookings(user.id).catch(console.error);
            fetchMyFeedbacks(user).catch(console.error);
          }
        }

        if (data.type === 'PAYMENT_REJECTED' && user?.id === data.userId) {
          setToastMessage({
            title: 'Payment Rejected',
            message: `Your payment proof for ${data.title} was rejected. Note: ${data.notes || 'No reason provided.'}`,
            type: 'error'
          });
        }
      } catch (e) {
        console.error('WebSocket message handling error:', e);
      }
    };

    return () => ws.close();
  }, [user?.id, user?.role, page]);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error('fetchRooms failed:', e);
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await fetch('/api/amenities');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAmenities(data);
    } catch (e) {
      console.error('fetchAmenities failed:', e);
    }
  };

  useEffect(() => {
    fetchRooms().catch(console.error);
    fetchAmenities().catch(console.error);
    fetchHeroBanners().catch(console.error);
    fetchFeedbacks().catch(console.error);
  }, []);

  const fetchUserBookings = async (userId: number) => {
    try {
      const res = await fetch(`/api/bookings/user/${userId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error('fetchUserBookings failed:', e);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedbacks');
      if (res.ok) setFeedbacks(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMyFeedbacks = async (currentUser: User) => {
    try {
      const res = await fetch('/api/feedbacks/mine', {
        headers: {
          'x-user-id': currentUser.id.toString(),
          'x-user-role': currentUser.role || '',
        }
      });
      if (res.ok) {
        setMyFeedbacks(await res.json());
        setHasLoadedMyFeedbacks(true);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    setIsFetchingAnalytics(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (e) {
      console.error('fetchAnalytics failed:', e);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const endpoints = [
        '/api/bookings/all',
        '/api/rooms',
        '/api/amenities',
        '/api/staff-dtr',
        '/api/amenity-bookings',
        '/api/payments',
        '/api/staff'
      ];

      // Fetch analytics separately
      fetchAnalytics();

      const results = await Promise.all(
        endpoints.map(async (url) => {
          try {
            const urlWithLimit = url.includes('?') ? `${url}&limit=1000` : `${url}?limit=1000`;
            const res = await fetch(urlWithLimit, {
              headers: {
                'x-user-id': user?.id?.toString() || '',
                'x-user-role': user?.role || ''
              }
            });
            if (!res.ok) return null;
            return await res.json();
          } catch (e) {
            console.error(`Failed to fetch ${url}:`, e);
            return null;
          }
        })
      );

      const [bookings, rooms, amenities, dtrData, amenityBookings, payments, staff] = results;

      if (bookings) setBookings(bookings);
      if (rooms) setRooms(rooms);
      if (amenities) setAmenities(amenities);
      if (dtrData) setStaffRecord(dtrData.data || []);
      if (amenityBookings) setAmenityBookings(amenityBookings);
      if (payments) setPayments(payments);
      if (staff) setStaffMembers(staff);
    } catch (error) {
      console.error('fetchAdminData failed:', error);
    }
  };

  const handleCheckIn = async (userId?: number) => {
    if (!user && !userId) return false;
    setIsCheckingIn(true);
    try {
      const now = new Date();
      const res = await fetch('/api/staff-dtr/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || user?.id,
          date: format(now, 'yyyy-MM-dd'),
          check_in: now.toLocaleTimeString(),
          status: 'present'
        })
      });
      if (res.ok) {
        fetchAdminData().catch(console.error);
        return true;
      } else {
        const err = await res.json();
        setToastMessage({ title: 'Error', message: err.error || 'Failed to check in', type: 'error' });
      }
      return false;
    } catch (e) { 
      console.error(e); 
      return false;
    }
    finally { setIsCheckingIn(false); }
  };

  const handleCheckOut = async (userId?: number) => {
    if (!user && !userId) return false;
    setIsCheckingIn(true);
    try {
      const now = new Date();
      const res = await fetch('/api/staff-dtr/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || user?.id,
          date: format(now, 'yyyy-MM-dd'),
          check_out: now.toLocaleTimeString()
        })
      });
      if (res.ok) {
        fetchAdminData().catch(console.error);
        return true;
      } else {
        const err = await res.json();
        setToastMessage({ title: 'Error', message: err.error || 'Failed to check out', type: 'error' });
      }
      return false;
    } catch (e) { 
      console.error(e); 
      return false;
    }
    finally { setIsCheckingIn(false); }
  };

  const handleCreateStaff = async (firstName: string, lastName: string, workSchedule: string, position: string, role: 'staff' | 'housekeeping' = 'staff') => {
    try {
      const res = await fetch('/api/staff/create-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ firstName, lastName, workSchedule, position, role })
      });
      if (res.ok) {
        setShowAddStaffModal(false);
        await fetchAdminData();
        setAdminActiveTab('staff-records');
        setStaffRecordsTab('management');
        setToastMessage({ title: 'Success', message: 'Staff added successfully.', type: 'success' });
      } else {
        setToastMessage({ title: 'Error', message: 'Failed to add staff', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToastMessage({ title: 'Error', message: 'An error occurred', type: 'error' });
    }
  };

  const handleUpdateStaff = async (id: number, firstName: string, lastName: string, schedule: string, position: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ firstName, lastName, schedule, position })
      });
      if (res.ok) {
        setEditingScheduleRecord(null);
        await fetchAdminData();
        setToastMessage({ title: 'Success', message: 'Staff updated successfully.', type: 'success' });
      } else {
        setToastMessage({ title: 'Error', message: 'Failed to update staff', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToastMessage({ title: 'Error', message: 'An error occurred', type: 'error' });
    }
  };

  const openFeedbackModal = (booking: Booking) => {
    setFeedbackForm({ rating: 5, comment: '' });
    setFeedbackError(null);
    setFeedbackBooking(booking);
  };

  const closeFeedbackModal = () => {
    // "Maybe later" on the automatic checkout-day prompt shouldn't re-open it for the rest of this session.
    if (feedbackBooking) {
      try { sessionStorage.setItem(`feedbackPromptDismissed:${feedbackBooking.id}`, '1'); } catch (e) {}
    }
    setFeedbackBooking(null);
    setFeedbackError(null);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !feedbackBooking) return;
    setIsSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString(),
          'x-user-role': user.role || '',
        },
        body: JSON.stringify({
          booking_id: feedbackBooking.id,
          rating: feedbackForm.rating,
          comment: feedbackForm.comment
        })
      });
      if (res.ok) {
        setFeedbackBooking(null);
        setFeedbackForm({ rating: 5, comment: '' });
        setToastMessage({ title: 'Thank you!', message: 'Your feedback has been submitted.', type: 'success' });
        fetchFeedbacks().catch(console.error);
        fetchMyFeedbacks(user).catch(console.error);
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedbackError(err.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (e) {
      console.error(e);
      setFeedbackError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Stays the guest can still review: currently checked in (prompted before front-desk
  // checkout) or already completed, and not reviewed yet.
  const reviewedBookingIds = new Set(myFeedbacks.map(f => f.booking_id));
  const bookingsAwaitingFeedback = bookings.filter(b =>
    b.user_id === user?.id &&
    ((b.status as string) === 'checked-in' || (b.status as string) === 'Completed' || (b.status as string) === 'completed') &&
    !reviewedBookingIds.has(b.id)
  );
  const checkedInAwaitingFeedback = bookingsAwaitingFeedback.find(b => (b.status as string) === 'checked-in');

  // On (or after) the checkout date, pop the review prompt automatically while the guest is
  // still checked in, so they're asked before the front desk checks them out.
  useEffect(() => {
    if (page !== 'guest-dashboard' || !user || feedbackBooking || !hasLoadedMyFeedbacks) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const dueForPrompt = bookingsAwaitingFeedback.find(b => {
      if ((b.status as string) !== 'checked-in' || b.check_out.slice(0, 10) > today) return false;
      try { return !sessionStorage.getItem(`feedbackPromptDismissed:${b.id}`); } catch (e) { return true; }
    });
    if (dueForPrompt) openFeedbackModal(dueForPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user?.id, bookings, myFeedbacks, hasLoadedMyFeedbacks]);

  const exportBookingsToCSV = () => {
    downloadServerCsv('/api/bookings/export', `resort_reservations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportMonthlyReportToCSV = () => {
    if (!selectedMonthForReport) return;
    
    const monthlyBookings = bookings.filter(b => b.created_at?.startsWith(selectedMonthForReport) || b.check_in.startsWith(selectedMonthForReport));
    const monthlyAmenities = amenityBookings.filter(b => b.created_at?.startsWith(selectedMonthForReport) || b.reservation_date.startsWith(selectedMonthForReport));
    const monthlyPayments = payments.filter(p => p.created_at?.startsWith(selectedMonthForReport));
    
    const totalSales = monthlyPayments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const csvRows = [];
    csvRows.push(`MONTHLY REPORT:,${selectedMonthForReport}`);
    csvRows.push(`Total Sales:,PHP ${totalSales.toLocaleString()}`);
    csvRows.push(`Total Room Reservations:,${monthlyBookings.length}`);
    csvRows.push(`Total Amenity Reservations:,${monthlyAmenities.length}`);
    csvRows.push('');
    csvRows.push('--- ROOM RESERVATIONS ---');
    csvRows.push('ID,Guest Name,Email,Room,Check-in,Check-out,Total Price,Status,Payment Method');
    monthlyBookings.forEach(b => {
      csvRows.push([
        b.id,
        `"${b.first_name} ${b.last_name}"`,
        b.email,
        `"${b.room_name}"`,
        b.check_in,
        b.check_out,
        b.total_price,
        b.status,
        b.payment_method
      ].join(','));
    });
    csvRows.push('');
    csvRows.push('--- AMENITY RESERVATIONS ---');
    csvRows.push('ID,Guest Name,Amenity,Date,Time,Total Price,Status');
    monthlyAmenities.forEach(b => {
      csvRows.push([
        b.id,
        `"${b.first_name} ${b.last_name}"`,
        `"${b.amenity_name}"`,
        b.reservation_date,
        b.reservation_time,
        b.total_price,
        b.status
      ].join(','));
    });
    
    downloadCSV(csvRows.join('\n'), `monthly_report_${selectedMonthForReport}.csv`);
    setShowExportModal(false);
  };

  const exportPaymentsToCSV = () => {
    const query = paymentDateFilter ? `?start_date=${paymentDateFilter}&end_date=${paymentDateFilter}` : '';
    downloadServerCsv(`/api/payments/export${query}`, `resort_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportStaffRecordsToCSV = () => {
    if (staffMembers.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Position', 'Join Date'];
    const csvRows = [
      headers.join(','),
      ...staffMembers.map(s => [
        s.id,
        `"${s.first_name} ${s.last_name}"`,
        s.email,
        s.role,
        s.position || '',
        s.created_at || ''
      ].join(','))
    ];
    
    downloadCSV(csvRows.join('\n'), `resort_staff_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const downloadServerCsv = async (url: string, fallbackFileName: string) => {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition');
        const match = disposition && disposition.match(/filename=([^;]+)/);
        const fileName = match ? match[1].trim() : fallbackFileName;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setToastMessage({ title: 'Error', message: 'Failed to export data.', type: 'error' });
      }
    } catch (error) {
      console.error('Export error:', error);
      setToastMessage({ title: 'Error', message: 'An error occurred during export.', type: 'error' });
    }
  };

  const handleExportAttendance = async (startDate: string, endDate: string) => {
    downloadServerCsv(`/api/staff-dtr/export?start_date=${startDate}&end_date=${endDate}`, `attendance_${startDate}_to_${endDate}.csv`);
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPasswordLoading) return;
    setIsForgotPasswordLoading(true);
    setForgotPasswordMessage(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });
      // Always show success for security
      setForgotPasswordMessage({ type: 'success', text: 'If this email is registered, you will receive a link shortly.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResettingPassword) return;
    if (newPassword !== confirmNewPassword) {
      setAuthError('Passwords do not match');
      return;
    }
    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(null);
        setAuthError('Password reset successful! Please sign in with your new password.');
        // Remove token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setAuthError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setAuthError('An error occurred. Please try again later.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveAdminNote = async (e: React.FormEvent, overrideNotes?: string) => {
    if (e) e.preventDefault();
    if (!editingAdminNote || isAdminNoteLoading) return;
    setIsAdminNoteLoading(true);
    
    const notesToSave = overrideNotes !== undefined ? overrideNotes : editingAdminNote.notes;
    try {
      const endpoint = editingAdminNote.isAmenity 
        ? `/api/amenity-bookings/${editingAdminNote.id}`
        : `/api/bookings/${editingAdminNote.id}/status`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ admin_notes: notesToSave || null })
      });
      if (res.ok) {
        setEditingAdminNote(null);
        fetchAdminData().catch(console.error);
        setToastMessage({ title: 'Success', message: 'Admin notes saved successfully.', type: 'success' });
      } else {
        setToastMessage({ title: 'Error', message: 'Failed to save admin notes', type: 'error' });
      }
    } catch (error) {
      console.error('Save admin note error:', error);
      setToastMessage({ title: 'Error', message: 'An error occurred while saving admin notes', type: 'error' });
    } finally {
      setIsAdminNoteLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;
    
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'register') {
        if (!isValidEmail(authForm.email)) {
          setAuthError('Please provide a valid email address ending in .com');
          setIsAuthLoading(false);
          return;
        }
        authForm.firstName = sanitizeName(authForm.firstName);
        authForm.lastName = sanitizeName(authForm.lastName);
        authForm.contactNo = sanitizePhone(authForm.contactNo);
      }

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'login' ? { username: authForm.username, password: authForm.password } : authForm)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (authMode === 'register') {
          setAuthMode('login');
          setAuthError('Account created successfully! Please sign in.');
          setAuthForm({ ...authForm, password: '' }); // Clear password for security
          setIsAuthLoading(false);
          return;
        }
        setUser(data);
        setBookings([]); // Clear previous user's bookings
        setAmenityBookings([]); // Clear previous user's amenity bookings
        resetBookingState();
        resetAmenityBookingState();
        
        if (data.role === 'admin' || data.role === 'staff') {
          setPage('admin-dashboard');
          setAdminActiveTab('overview');
          fetchAdminData().catch(console.error);
        } else {
          setPage('guest-dashboard');
          setGuestActiveTab('overview');
          fetchUserBookings(data.id).catch(console.error);
        }
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('A network error occurred. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const resetBookingState = () => {
    setSelectedRoom(null);
    setBookingDates({
      checkIn: format(new Date(), 'yyyy-MM-dd'),
      checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd')
    });
    setGuestsCount(1);
    setExtraBed(false);
    setBookingProof(null);
    setBookingAmountPaid('');
    setBookingTransactionReference('');
    setAvailabilityError(null);
    setBookingError(null);
    setProofFile(null);
    setLastBooking(null);
  };

  const resetAmenityBookingState = () => {
    setSelectedAmenity(null);
    setAmenityBookingProof(null);
    setAmenityAmountPaid('');
    setAmenityTransactionReference('');
    setAmenitySelections({});
    setAmenityFormData(null);
    setAmenityStep('details');
    setLastAmenityBooking(null);
    setIsReservingAmenity(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout request failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setToastMessage({ title: 'Logout Error', message: 'Failed to logout. Please try again.', type: 'error' });
    } finally {
      // Clear local state regardless of server success to ensure user is logged out locally
      setUser(null);
      setPage('home');
      setBookings([]);
      setMyFeedbacks([]);
      setHasLoadedMyFeedbacks(false);
      setFeedbackBooking(null);
      resetBookingState();
      resetAmenityBookingState();
      setAuthForm({
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        contactNo: '',
        address: ''
      });
    }
  };

  const handleBooking = async () => {
    if (!user) {
      setPage('login');
      return;
    }
    if (user.role !== 'guest') {
      setToastMessage({ title: 'Error', message: 'Only guests can make reservations. Please log in with a guest account.', type: 'error' });
      return;
    }
    if (!selectedRoom || isBooking) return;

    setIsBooking(true);
    setBookingError(null);
    try {
      // Check availability first
      const availRes = await fetch(`/api/bookings/check-availability?roomId=${selectedRoom.id}&checkIn=${bookingDates.checkIn}&checkOut=${bookingDates.checkOut}`);
      const contentType = availRes.headers.get('content-type');
      if (!availRes.ok || !contentType?.includes('application/json')) {
        let errMessage = `Availability check failed with status ${availRes.status}`;
        try {
           const errData = await availRes.json();
           errMessage = errData.error || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
      }
      const { available, reason } = await availRes.json();

      if (!available) {
        setBookingError(reason || 'Sorry, this room is already occupied for the selected dates.');
        setIsBooking(false);
        return;
      }

      const nights = differenceInDays(new Date(bookingDates.checkOut), new Date(bookingDates.checkIn));
      if (nights <= 0) {
        console.warn('Check-out date must be after check-in date.');
        setIsBooking(false);
        return;
      }

      const extraBedCost = extraBed ? 500 * nights : 0;
      const totalPrice = (selectedRoom.price * nights) + extraBedCost;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          roomId: selectedRoom.id,
          checkIn: bookingDates.checkIn,
          checkOut: bookingDates.checkOut,
          totalPrice,
          paymentMethod,
          guestsCount,
          extraBed: extraBed ? 1 : 0,
          proofOfPayment: bookingProof,
          transactionReference: bookingTransactionReference,
          amountPaid: parseFloat(bookingAmountPaid) || 0
        })
      });

      if (res.ok) {
        const newBooking = await res.json();
        // Add room name for receipt display
        newBooking.room_name = selectedRoom.name;
        setLastBooking(newBooking);
        setShowReceipt(newBooking);
        fetchUserBookings(user.id).catch(console.error);
        setSelectedRoom(null);
        
        // Automatically go to Dashboard
        setPage('guest-dashboard');
      } else {
        const errorData = await res.json();
        if (res.status === 401) {
          // Stale session or user no longer exists
          setUser(null);
          localStorage.removeItem('user');
          setPage('login');
        }
        setBookingError(errorData.error || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('An error occurred while processing your booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleUploadProof = async (file: string, amount: number, reference: string) => {
    if (!showProofModal) return;
    setIsUploadingProof(true);
    try {
      const isInitialPaymentRejected = showProofModal.status === 'rejected' && !showProofModal.balance_proof_of_payment;
      const isBalance = !isInitialPaymentRejected && (showProofModal.payment_status === 'Partially Paid' || ((showProofModal.amount_paid || 0) > 0 && (showProofModal.amount_paid || 0) < showProofModal.total_price));
      const endpoint = isBalance ? `/api/bookings/${showProofModal.id}/balance-payment` : `/api/bookings/${showProofModal.id}/proof-of-payment`;
      const method = 'PUT';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofOfPayment: file, transactionReference: reference, amountPaid: amount })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paymentStatus === 'Fully Paid') {
          setToastMessage({ title: 'Success', message: 'Payment proof submitted successfully! Your booking is now fully paid.', type: 'success' });
        } else if (data.remaining > 0) {
          setToastMessage({ 
            title: 'Partial Payment Submitted', 
            message: `Proof submitted. Remaining balance: ₱${data.remaining.toLocaleString()}. Please settle the rest before check-in.`, 
            type: 'info' 
          });
        } else {
          setToastMessage({ title: 'Success', message: 'Payment proof submitted successfully!', type: 'success' });
        }
        setShowProofModal(null);
        if (user) await fetchUserBookings(user.id);
      } else {
        const err = await res.json().catch(() => ({}));
        setToastMessage({ title: 'Error', message: err.error || 'Failed to submit proof.', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ title: 'Error', message: 'Failed to submit proof', type: 'error' });
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleUploadAmenityProof = async (file: string, amount: number, reference: string) => {
    if (!showAmenityProofModal) return;
    setIsUploadingProof(true);
    try {
      const isInitialPaymentRejected = showAmenityProofModal.status === 'rejected' && !showAmenityProofModal.balance_proof_of_payment;
      const isBalance = !isInitialPaymentRejected && (showAmenityProofModal.payment_status === 'Partially Paid' || ((showAmenityProofModal.amount_paid || 0) > 0 && (showAmenityProofModal.amount_paid || 0) < showAmenityProofModal.total_price));
      const endpoint = isBalance ? `/api/amenity-bookings/${showAmenityProofModal.id}/balance-payment` : `/api/amenity-bookings/${showAmenityProofModal.id}/proof-of-payment`;
      const method = 'PUT';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ proofOfPayment: file, transactionReference: reference, amountPaid: amount })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paymentStatus === 'Fully Paid') {
          setToastMessage({ title: 'Success', message: 'Payment proof submitted successfully! Fully paid.', type: 'success' });
        } else if (data.remaining > 0) {
          setToastMessage({ 
            title: 'Partial Payment Submitted', 
            message: `Proof submitted. Remaining balance: ₱${data.remaining.toLocaleString()}.`, 
            type: 'info' 
          });
        } else {
          setToastMessage({ title: 'Success', message: 'Payment proof submitted successfully!', type: 'success' });
        }
        setShowAmenityProofModal(null);
        if (user) await fetchMyAmenityBookings();
      } else {
        const err = await res.json().catch(() => ({}));
        setToastMessage({ title: 'Error', message: err.error || 'Failed to submit proof.', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ title: 'Error', message: 'Failed to submit proof', type: 'error' });
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: number, isAmenity: boolean, currentAmountPaid: number, totalPrice: number, amountToSettle: number) => {
    console.log('DEBUG: handleUpdatePaymentStatus called', { bookingId, isAmenity, currentAmountPaid, totalPrice, amountToSettle });
    try {
      const endpoint = isAmenity ? `/api/amenity-bookings/${bookingId}/balance-payment` : `/api/bookings/${bookingId}/balance-payment`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({
          amountPaid: amountToSettle,
          proofOfPayment: '',
          transactionReference: 'MANUAL_SETTLEMENT'
        })
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: 'Invalid server response' };
      }

      if (res.ok) {
        if (user?.role === 'admin' || user?.role === 'staff') await fetchAdminData();
        else if (user) {
          if (isAmenity) await fetchMyAmenityBookings();
          else await fetchUserBookings(user.id);
        }
        
        if (data.paymentStatus === 'Fully Paid') {
          setToastMessage({ title: 'Success', message: 'Balance settled and marked as fully paid.', type: 'success' });
        } else {
          setToastMessage({ 
            title: 'Partial Payment Received', 
            message: `Payment of ₱${amountToSettle.toLocaleString()} received. Remaining balance: ₱${data.remaining ? data.remaining.toLocaleString() : '0'}`, 
            type: 'info' 
          });
        }
        // Clear the settle amount input
        setSettleAmount(prev => {
          const next = {...prev};
          delete next[isAmenity ? `amenity-${bookingId}` : bookingId];
          return next;
        });
      } else {
        setToastMessage({ title: 'Error', message: data.error || 'Failed to settle balance', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ title: 'Error', message: 'Failed to settle balance', type: 'error' });
    }
  };

  const handleUpdateStatus = async (bookingId: number, status: string, admin_notes?: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes })
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: 'Invalid server response' };
      }

      if (res.ok) {
        if (user?.role === 'admin' || user?.role === 'staff') await fetchAdminData();
        else if (user) await fetchUserBookings(user.id);
        return data;
      } else {
        setToastMessage({ title: 'Error', message: data.error || 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleUpdateAmenityStatus = async (bookingId: number, status: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(bookingId);
    try {
      const res = await fetch(`/api/amenity-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (user?.role === 'admin') await fetchAdminData();
        else await fetchUserBookings(user!.id);
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMessage({ title: 'Error', message: data.error || 'Failed to update amenity status', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to update amenity status:', error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleVerifyAmenityPayment = async (bookingId: number, status: 'confirmed' | 'rejected', admin_notes?: string) => {
    setIsUpdatingStatus(bookingId);
    try {
      const res = await fetch(`/api/amenity-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ status, admin_notes })
      });
      if (res.ok) {
        setShowAmenityProofViewer(null);
        await fetchAdminData();
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMessage({ title: 'Error', message: data.error || 'Failed to update amenity status', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to verify amenity payment:', error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const archiveBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/archive`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        await fetchAdminData();
        setToastMessage({ title: 'Success', message: 'Booking archived successfully.', type: 'success' });
      }
    } catch (error) {
      console.error('Failed to archive booking:', error);
      setToastMessage({ title: 'Error', message: 'Failed to archive booking.', type: 'error' });
    }
  };

  const archiveAmenityBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/amenity-bookings/${bookingId}/archive`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        await fetchAdminData();
        setToastMessage({ title: 'Success', message: 'Amenity booking archived successfully.', type: 'success' });
      }
    } catch (error) {
      console.error('Failed to archive amenity booking:', error);
      setToastMessage({ title: 'Error', message: 'Failed to archive amenity booking.', type: 'error' });
    }
  };

  const deleteBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        if (user?.role === 'admin') await fetchAdminData();
        else await fetchUserBookings(user!.id);
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const deleteAmenityBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/amenity-bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Failed to delete amenity booking:', error);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    // Inventory Bounds Validation
    if (editingRoom.price <= 0) {
      setToastMessage({ title: 'Error', message: 'Room rate must be greater than zero.', type: 'error' });
      return;
    }
    if (editingRoom.capacity <= 0) {
      setToastMessage({ title: 'Error', message: 'Room capacity must be at least 1.', type: 'error' });
      return;
    }
    if (!editingRoom.name.trim()) {
      setToastMessage({ title: 'Error', message: 'Room name is required.', type: 'error' });
      return;
    }

    const method = editingRoom.id ? 'PUT' : 'POST';
    const url = editingRoom.id ? `/api/rooms/${editingRoom.id}` : '/api/rooms';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify(editingRoom)
      });
      if (res.ok) {
        fetchRooms().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setEditingRoom(null);
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleArchiveRoom = async (room: Room) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { 
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      
      if (res.ok) {
        fetchRooms().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setToastMessage({ title: 'Success', message: 'Room archived successfully.', type: 'success' });
      } else {
        try {
          const data = await res.json();
          setToastMessage({ title: 'Error', message: data.error || 'Failed to archive room.', type: 'error' });
        } catch {
          setToastMessage({ title: 'Error', message: 'Failed to archive room.', type: 'error' });
        }
      }
    } catch (error) {
      setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
    }
  };

  const handleRestoreRoom = async (room: Room) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ ...room, status: 'available' })
      });
      if (res.ok) {
        fetchRooms().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setToastMessage({ title: 'Success', message: 'Room restored successfully.', type: 'success' });
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to restore room');
        setToastMessage({ title: 'Error', message: 'Failed to restore room.', type: 'error' });
      }
    } catch (error) {
      console.error('Error restoring room:', error);
      setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
    }
  };

  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmenity) return;

    const method = editingAmenity.id ? 'PUT' : 'POST';
    const url = editingAmenity.id ? `/api/amenities/${editingAmenity.id}` : '/api/amenities';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify(editingAmenity)
      });
      if (res.ok) {
        fetchAmenities().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setEditingAmenity(null);
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to save amenity');
      }
    } catch (error) {
      console.error('Error saving amenity:', error);
    }
  };

  const handleArchiveAmenity = async (amenity: Amenity) => {
    try {
      const res = await fetch(`/api/amenities/${amenity.id}`, { 
        method: 'DELETE',
        headers: { 
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        fetchAmenities().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setToastMessage({ title: 'Success', message: 'Amenity archived successfully.', type: 'success' });
      } else {
        try {
          const data = await res.json();
          setToastMessage({ title: 'Error', message: data.error || 'Failed to archive amenity.', type: 'error' });
        } catch {
          setToastMessage({ title: 'Error', message: 'Failed to archive amenity.', type: 'error' });
        }
      }
    } catch (error) {
      setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
    }
  };

  const handleRestoreAmenity = async (amenity: Amenity) => {
    try {
      const res = await fetch(`/api/amenities/${amenity.id}`, { 
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        },
        body: JSON.stringify({ ...amenity, status: 'active' })
      });
      if (res.ok) {
        fetchAmenities().catch(console.error);
        if (user?.role === 'admin') fetchAdminData().catch(console.error);
        setToastMessage({ title: 'Success', message: 'Amenity restored successfully.', type: 'success' });
      } else {
        const data = await res.json();
        console.error(data.error || 'Failed to restore amenity');
        setToastMessage({ title: 'Error', message: 'Failed to restore amenity.', type: 'error' });
      }
    } catch (error) {
      console.error('Error restoring amenity:', error);
      setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
    }
  };

  const handleRoomSelection = (room: Room) => {
    if (!user) {
      setPage('login');
      return;
    }
    if (user.role !== 'guest') {
      setToastMessage({ title: 'Error', message: 'Only guests can make reservations. Please log in with a guest account.', type: 'error' });
      return;
    }
    resetBookingState();
    setSelectedRoom(room);
    setPage('booking');
  };

  const renderHome = () => (
    <div className="pb-20">
      <Hero 
        onBookNow={() => setPage('rooms')} 
        heroBanners={heroBanners} 
        currentSlide={currentSlide} 
        setCurrentSlide={setCurrentSlide}
      />

      <div className="space-y-20 mt-20">
        <section id="about" className="py-20 bg-coffee-100 border-y border-coffee-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative flex items-center justify-center p-8 lg:p-12 h-full">
            <div className="relative w-full max-w-md bg-[#FCFBF9] rounded-3xl shadow-xl flex items-center justify-center p-6 lg:p-10 border border-coffee-100">
              <img 
                src="/Gemini_Generated_Image_d9gttfd9gttfd9gt.png" 
                alt="About Da Bali Resort" 
                className="w-full h-auto object-contain mix-blend-multiply opacity-90 scale-125 hover:scale-[1.30] transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 lg:-bottom-10 lg:-right-10 bg-coffee-900 border-4 border-[#FCFBF9] text-white rounded-full shadow-2xl hidden md:flex items-center justify-center w-36 h-36 lg:w-48 lg:h-48 z-20">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-start font-serif font-bold mb-2 lg:mb-4 translate-x-2">
                  <p className="text-6xl lg:text-8xl leading-none tracking-tighter">4</p>
                  <p className="text-2xl lg:text-4xl mt-1 lg:mt-2 -ml-1 lg:-ml-2">+</p>
                </div>
                <p className="text-white text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] text-center leading-tight mt-1">
                  YEARS OF<br/>EXCELLENCE
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-[#A3402A] font-bold uppercase tracking-widest text-sm mb-2">About Us</p>
            <h2 className="text-4xl font-serif font-bold text-coffee-900">Experience the Serenity of Da Bali Resort</h2>
            <p className="text-coffee-600 leading-relaxed">
              A Balinese-inspired resort featuring a flowing spring water swimming pool and unique Salakot Villas for overnight stays in Balingasag, Misamis Oriental. Guests can immerse themselves in a tranquil atmosphere while enjoying the modern comforts of our culturally themed accommodations and amenities.
            </p>
            <p className="text-coffee-600 leading-relaxed">
              Whether you're here for a romantic getaway, a family vacation, or a corporate retreat, our world-class facilities and dedicated staff ensure that every moment of your stay is exceptional.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-coffee-100 rounded-lg text-coffee-900">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-coffee-900">Premium Quality</p>
                  <p className="text-xs text-coffee-500">Luxury in every detail</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-coffee-100 rounded-lg text-coffee-900">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-coffee-900">Heartfelt Service</p>
                  <p className="text-xs text-coffee-500">Guests are our family</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section id="rooms-section" className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">Our Accommodations</h2>
          <p className="text-coffee-600 max-w-2xl mx-auto mb-8">Choose from our selection of luxury rooms and suites, each designed for maximum comfort and relaxation.</p>
        </div>
        <div className="grid grid-cols-1 tablet:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-full">
          {rooms.slice(0, 3).map(room => (
            <div key={room.id}>
              <RoomCard room={room} onBook={handleRoomSelection} />
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button 
            onClick={() => {
              setPage('rooms');
              window.location.hash = '#rooms-section';
            }} 
            className="text-coffee-700 font-bold flex items-center mx-auto hover:text-coffee-900 transition-colors"
          >
            View All Rooms <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </section>

      <section id="amenities-section" className="bg-coffee-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">World-Class Amenities</h2>
            <p className="text-coffee-600">Discover our range of premium facilities designed to make your stay unforgettable.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-full">
            {amenities.length > 0 ? (
              amenities.slice(0, 4).map((amenity) => (
                <div key={amenity.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col tablet:flex-row h-full border border-coffee-50">
                  <div className="tablet:w-1/2 h-64 tablet:h-auto relative overflow-hidden">
                    <ImageSlider 
                      images={amenity.images && amenity.images.length > 0 ? amenity.images : [amenity.image_url || "https://picsum.photos/seed/resort/800/600"]} 
                      className="w-full h-full"
                      alt={amenity.name}
                    />
                  </div>
                  <div className="tablet:w-1/2 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-serif font-bold mb-3 text-coffee-900">{amenity.name}</h3>
                    <p className="text-coffee-600 text-sm mb-8 leading-relaxed line-clamp-3">{amenity.description}</p>
                    <button 
                      onClick={() => {
                        resetAmenityBookingState();
                        setSelectedAmenity(amenity);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-white text-[#A3402A] border border-[#A3402A] font-bold text-sm transition-all hover:bg-[#A3402A] hover:text-white shadow-sm active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              [
                { title: 'Infinity Pool', icon: 'Waves', desc: 'Dive into luxury with our stunning infinity pool overlooking the valley.', images: [infinityPoolImg1, infinityPoolImg2, infinityPoolImg3, infinityPoolImg4, infinityPoolImg5] },
                { title: 'Fine Dining', icon: 'Coffee', desc: 'Exquisite culinary experiences featuring local and international flavors.', images: [fineDiningImg1, fineDiningImg2, fineDiningImg3, fineDiningImg4] },
                { title: 'Pavilion', icon: 'Hotel', desc: 'Our iconic function room with traditional architecture.', images: [pavilionImg1, pavilionImg2, pavilionImg3, pavilionImg4, pavilionImg5] },
                { title: 'Colored Tent/Team Building', icon: 'Calendar', desc: 'The perfect space for corporate retreats and group activities.', images: [coloredTentImg1, coloredTentImg2, coloredTentImg3, coloredTentImg4] }
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col tablet:flex-row h-full border border-coffee-50">
                  <div className="tablet:w-1/2 h-64 tablet:h-auto relative overflow-hidden">
                    {item.images ? (
                      <ImageSlider images={item.images} className="w-full h-full" alt={item.title} />
                    ) : (
                      <img 
                        src={(item as any).img} 
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="tablet:w-1/2 p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-serif font-bold mb-3 text-coffee-900">{item.title}</h3>
                    <p className="text-coffee-600 text-sm mb-8 leading-relaxed line-clamp-3">{item.desc}</p>
                    <button 
                      onClick={() => setPage('amenities')}
                      className="w-full py-3.5 rounded-2xl bg-white text-[#A3402A] border border-[#A3402A] font-bold text-sm transition-all hover:bg-[#A3402A] hover:text-white shadow-sm active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-12">
            <button 
              onClick={() => {
                setPage('amenities');
                window.location.hash = '#amenities-section';
              }} 
              className="text-coffee-700 font-bold flex items-center mx-auto hover:text-coffee-900 transition-colors"
            >
              View All Amenities <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      <FeedbackSection feedbacks={feedbacks} />
      </div>
    </div>
  );

  const renderRooms = () => {
    const bookableRooms = rooms.filter(r => r.status !== 'inactive');
    const salakotRooms = bookableRooms.filter(r => r.name.includes('Salakot'));
    const bubuRooms = bookableRooms.filter(r => r.name.includes('Bubu'));
    const showAmenities = isFromDashboard && newBookingTab === 'amenities';

    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => {
              if (isFromDashboard) {
                setPage('guest-dashboard');
                setIsFromDashboard(false);
                window.location.hash = '#dashboard-rooms-section';
              } else {
                setPage('home');
                setTimeout(() => {
                  const element = document.getElementById('rooms-section');
                  if (element) {
                    const headerOffset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }, 300);
              }
            }}
            className="flex items-center space-x-2 text-coffee-600 hover:text-coffee-900 transition-colors group"
          >
            <div className="p-2 bg-white rounded-full shadow-md group-hover:bg-coffee-50 transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="font-bold">{isFromDashboard ? 'Back to Dashboard' : 'Back to Accommodations'}</span>
          </button>
          {!showAmenities && (
            <select
              value={roomFilter ?? ''}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-coffee-50 text-coffee-900 px-4 py-2 rounded-lg font-bold"
            >
              <option value="All">All Rooms</option>
              <option value="Salakot">Salakot Rooms</option>
              <option value="Bubu">Bubu Rooms</option>
            </select>
          )}
        </div>
        {isFromDashboard && (
          <div className="text-center -mt-8">
            <h2 className="text-3xl font-serif font-bold text-coffee-900 mb-2">What would you like to book?</h2>
            <p className="text-coffee-600 mb-6">Reserve a room for your stay or book one of our amenities.</p>
            <div className="inline-flex bg-coffee-50 p-1.5 rounded-2xl border border-coffee-100 shadow-sm">
              {([
                { key: 'rooms', label: 'Rooms', icon: Bed },
                { key: 'amenities', label: 'Amenities', icon: Sparkles },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setNewBookingTab(key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    newBookingTab === key ? 'bg-[#5C3321] text-white shadow-md' : 'text-coffee-700 hover:bg-coffee-100'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {showAmenities && renderAmenitySection()}
        {!showAmenities && (roomFilter === 'All' || roomFilter === 'Salakot') && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">Salakot Rooms</h2>
              <p className="text-coffee-600 max-w-2xl mx-auto">Cozy and intimate spaces designed for couples and small groups, featuring traditional architecture with modern comfort.</p>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-full">
              {salakotRooms.map(room => (
                <div key={room.id}>
                  <RoomCard room={room} onBook={handleRoomSelection} />
                </div>
              ))}
            </div>
          </section>
        )}

        {!showAmenities && (roomFilter === 'All' || roomFilter === 'Bubu') && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">Bubu Family Suites</h2>
              <p className="text-coffee-600 max-w-2xl mx-auto">Spacious accommodations perfect for large families and groups, offering premium amenities and plenty of room to relax.</p>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
              {bubuRooms.map(room => (
                <div key={room.id}>
                  <RoomCard room={room} onBook={handleRoomSelection} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderAmenities = () => {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => {
              if (isFromDashboard) {
                setPage('guest-dashboard');
                setIsFromDashboard(false);
                window.location.hash = '#dashboard-amenities-section';
              } else {
                setPage('home');
                setTimeout(() => {
                  const element = document.getElementById('amenities-section');
                  if (element) {
                    const headerOffset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }, 300);
              }
            }}
            className="flex items-center space-x-2 text-coffee-600 hover:text-coffee-900 transition-colors group"
          >
            <div className="p-2 bg-white rounded-full shadow-md group-hover:bg-coffee-50 transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="font-bold">{isFromDashboard ? 'Back to Dashboard' : 'Back to Amenities'}</span>
          </button>
        </div>
        {renderAmenitySection()}
      </div>
    );
  };

  const renderAmenitySection = () => (
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">World-Class Amenities</h2>
            <p className="text-coffee-600 max-w-2xl mx-auto">Discover our range of premium facilities designed to make your stay unforgettable. From our infinity pool to fine dining, we have everything you need.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-full">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col tablet:flex-row h-full border border-coffee-50">
                <div className="tablet:w-1/2 h-64 tablet:h-auto relative overflow-hidden">
                  <ImageSlider
                    images={amenity.images && amenity.images.length > 0 ? amenity.images : [amenity.image_url || "https://picsum.photos/seed/resort/800/600"]}
                    className="w-full h-full"
                    alt={amenity.name}
                  />
                  {amenity.stock !== null && amenity.stock !== undefined && amenity.stock <= 0 && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-coffee-900/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                      Fully Booked
                    </div>
                  )}
                </div>
                <div className="tablet:w-1/2 p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-serif font-bold mb-3 text-coffee-900">{amenity.name}</h3>
                  <p className="text-coffee-600 text-sm mb-8 leading-relaxed line-clamp-3">{amenity.description}</p>
                  <button 
                    onClick={() => {
                      resetAmenityBookingState();
                      setSelectedAmenity(amenity);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-white text-[#5C3321] border border-[#5C3321] font-bold text-sm transition-all hover:bg-[#A3402A] hover:text-white hover:border-[#A3402A] shadow-sm active:scale-95"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
  );

  const renderBooking = () => {
    if (!selectedRoom) return null;
    const nights = differenceInDays(new Date(bookingDates.checkOut), new Date(bookingDates.checkIn));
    const isSalakot = selectedRoom.name.includes('Salakot');
    const isBubu = selectedRoom.name.includes('Bubu');
    
    const maxCapacity = isSalakot ? (extraBed ? 3 : 2) : (isBubu ? 10 : selectedRoom.capacity);
    const extraBedCost = extraBed ? 500 * nights : 0;
    const totalPrice = (selectedRoom.price * nights) + extraBedCost;

    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        {isFromDashboard && (
          <button 
            onClick={() => {
              setPage('guest-dashboard');
              setIsFromDashboard(false);
              window.location.hash = '#dashboard-rooms-section';
            }}
            className="flex items-center space-x-2 text-coffee-600 hover:text-coffee-900 transition-colors mb-8 group"
          >
            <div className="p-2 bg-white rounded-full shadow-md group-hover:bg-coffee-50 transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="font-bold">Back to Dashboard</span>
          </button>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-coffee-100">
              <h3 className="text-2xl font-serif font-bold mb-6 text-coffee-900">Reservation Details</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-coffee-700 mb-1">Check-in Date</label>
                    <DatePicker
                      selected={new Date(bookingDates.checkIn)}
                      onChange={(date) => {
                        if (date) {
                          const newCheckIn = format(date, 'yyyy-MM-dd');
                          setBookingDates({ 
                            ...bookingDates, 
                            checkIn: newCheckIn,
                            checkOut: format(addDays(date, 1), 'yyyy-MM-dd')
                          });
                        }
                      }}
                      minDate={new Date()}
                      excludeDates={roomOccupiedDates}
                      className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-coffee-700 mb-1">Check-out Date</label>
                    <DatePicker
                      selected={new Date(bookingDates.checkOut)}
                      onChange={(date) => {
                        if (date) {
                          setBookingDates({ 
                            ...bookingDates, 
                            checkOut: format(date, 'yyyy-MM-dd')
                          });
                        }
                      }}
                      minDate={addDays(new Date(bookingDates.checkIn), 1)}
                      maxDate={addDays(new Date(bookingDates.checkIn), 30)}
                      excludeDates={roomOccupiedDates}
                      className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-1">Number of Guests (Max {maxCapacity})</label>
                  <select 
                    value={guestsCount ?? ''}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none"
                  >
                    {[...Array(maxCapacity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>

                {isSalakot && (
                  <div className="flex items-center justify-between p-4 bg-coffee-50 rounded-xl">
                    <div>
                      <p className="font-bold text-coffee-900">Extra Bed</p>
                      <p className="text-xs text-coffee-600">Add 1 extra bed for ₱500/night (Max 3 people total)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={extraBed}
                        onChange={(e) => {
                          setExtraBed(e.target.checked);
                          if (e.target.checked && guestsCount === 2) setGuestsCount(3);
                          else if (!e.target.checked && guestsCount > 2) setGuestsCount(2);
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coffee-600"></div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-coffee-100">
              <h3 className="text-2xl font-serif font-bold mb-6 text-coffee-900">Payment Method</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setPaymentMethod('GCash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'GCash' ? 'border-coffee-600 bg-coffee-50' : 'border-coffee-100 hover:border-coffee-300'}`}
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-2">G</div>
                  <span className="font-bold text-coffee-900">GCash</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('BPI')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'BPI' ? 'border-coffee-600 bg-coffee-50' : 'border-coffee-100 hover:border-coffee-300'}`}
                >
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mb-2">B</div>
                  <span className="font-bold text-coffee-900">BPI</span>
                </button>
              </div>

              {paymentMethod === 'GCash' && (
                <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100">
                  <h4 className="font-bold text-coffee-900 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" /> 
                    GCash Instructions
                  </h4>
                  <div className="space-y-2 text-sm text-coffee-700">
                    <p>1. Open your GCash App</p>
                    <p>2. Send Money to: <span className="font-bold text-coffee-900">0912-345-6789</span></p>
                    <p>3. Account Name: <span className="font-bold text-coffee-900">DA BALI RESORT</span></p>
                    <p>4. Take a screenshot of the receipt</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'BPI' && (
                <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100">
                  <h4 className="font-bold text-coffee-900 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" /> 
                    BPI Instructions
                  </h4>
                  <div className="space-y-2 text-sm text-coffee-700">
                    <p>1. Log in to your BPI Mobile App</p>
                    <p>2. Transfer to Account: <span className="font-bold text-coffee-900">1234-5678-90</span></p>
                    <p>3. Account Name: <span className="font-bold text-coffee-900">DA BALI RESORT CORP</span></p>
                    <p>4. Keep the confirmation receipt</p>
                  </div>
                </div>
              )}

              {/* QR Code Section */}
              <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100 mt-6">
                <h4 className="font-bold text-coffee-900 mb-4 flex items-center">
                  <QrCode className="h-4 w-4 mr-2" /> 
                  Scan to Pay
                </h4>
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-coffee-100">
                    <QRCodeSVG 
                      value={paymentMethod === 'GCash' ? "GCASH:09123456789" : "BPI:1234567890"} 
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-coffee-900">{paymentMethod} QR Code</p>
                    <p className="text-xs text-coffee-500 mt-1">Scan this code using your {paymentMethod} app</p>
                  </div>
                </div>
              </div>

              {/* Payment Details Form */}
              <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100 mt-6 space-y-4">
                <h4 className="font-bold text-coffee-900 flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> 
                  Transaction Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-1">Amount Paid (₱)</label>
                    <input 
                      type="number" 
                      value={bookingAmountPaid}
                      onChange={(e) => setBookingAmountPaid(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm font-bold text-coffee-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-500 uppercase tracking-widest mb-1">Reference Number</label>
                    <input 
                      type="text" 
                      value={bookingTransactionReference}
                      onChange={(e) => setBookingTransactionReference(e.target.value)}
                      placeholder="Enter reference no."
                      className="w-full px-4 py-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm font-bold text-coffee-900"
                    />
                  </div>
                </div>
              </div>

              {/* Proof of Payment Upload */}
              <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100 mt-6">
                <h4 className="font-bold text-coffee-900 mb-4 flex items-center">
                  <Upload className="h-4 w-4 mr-2" /> 
                  Upload Proof of Payment
                </h4>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setBookingProof(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${bookingProof ? 'border-green-500 bg-green-50' : 'border-coffee-200 bg-white group-hover:border-[#A3402A] group-hover:bg-coffee-50'}`}>
                    {bookingProof ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-xs font-bold text-green-700">Proof uploaded successfully!</p>
                        <button onClick={(e) => { e.stopPropagation(); setBookingProof(null); }} className="text-[10px] text-red-500 mt-1 hover:underline">Remove and change</button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-coffee-300 mb-2 group-hover:text-[#A3402A] transition-colors" />
                        <p className="text-xs font-bold text-coffee-600">Click or drag to upload receipt</p>
                        <p className="text-[10px] text-coffee-400 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-coffee-900 text-white p-8 rounded-3xl shadow-xl h-fit sticky top-24 z-10">
            <h3 className="text-2xl font-serif font-bold mb-8 border-b border-white/20 pb-4">Booking Summary</h3>
            
            {(availabilityError || bookingError) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500 border-2 border-red-400 text-white p-4 rounded-2xl mb-6 text-sm flex items-start shadow-lg animate-pulse"
              >
                <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-base">Booking Conflict</p>
                  <p className="opacity-90">{availabilityError || bookingError}</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{selectedRoom.name}</p>
                  <p className="text-coffee-300 text-sm">{selectedRoom.type} • {guestsCount} Guests</p>
                </div>
                <p className="font-bold">₱{(selectedRoom.price || 0).toLocaleString()}</p>
              </div>
              {extraBed && (
                <div className="flex justify-between text-sm">
                  <p className="text-coffee-300">Extra Bed (₱500 x {nights})</p>
                  <p>₱{(extraBedCost || 0).toLocaleString()}</p>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <p className="text-coffee-300">Stay Duration</p>
                <p>{nights} Nights</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-coffee-300">Dates</p>
                <p>{format(new Date(bookingDates.checkIn), 'MMM dd')} - {format(new Date(bookingDates.checkOut), 'MMM dd')}</p>
              </div>
              <div className="pt-6 border-t border-white/20 space-y-2">
                <div className="flex justify-between items-center text-white/60">
                  <p className="text-sm">Total Quotation</p>
                  <p className="font-bold">₱{(totalPrice || 0).toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold">Downpayment (50%)</p>
                  <p className="text-3xl font-serif font-bold text-coffee-300">₱{((totalPrice || 0) / 2).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: (isBooking || !!availabilityError || !bookingProof || !bookingAmountPaid || !bookingTransactionReference) ? 1 : 1.02 }}
              whileTap={{ scale: (isBooking || !!availabilityError || !bookingProof || !bookingAmountPaid || !bookingTransactionReference) ? 1 : 0.98 }}
              onClick={handleBooking}
              disabled={isBooking || !!availabilityError || !bookingProof || !bookingAmountPaid || !bookingTransactionReference}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center ${
                (isBooking || !!availabilityError || !bookingProof || !bookingAmountPaid || !bookingTransactionReference) ? 'bg-coffee-700 cursor-not-allowed opacity-50' : 'bg-[#FFFBF7] hover:bg-[#FDF8F3] text-coffee-900'
              }`}
            >
              {isBooking ? (
                <>
                  <Clock className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </>
              ) : isCheckingAvailability ? (
                <>
                  <Clock className="animate-spin h-5 w-5 mr-2" />
                  Checking Availability...
                </>
              ) : availabilityError ? 'Room Occupied' : (!bookingProof || !bookingAmountPaid || !bookingTransactionReference) ? (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Complete Payment Details
                </>
              ) : 'Confirm & Pay'}
            </motion.button>
            <p className="text-center text-xs text-coffee-400 mt-4">Secure payment processed via {paymentMethod}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => {
    if (!lastBooking) return null;
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl border border-coffee-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">Booking Confirmed!</h2>
          <p className="text-coffee-600 mb-8 text-lg">
            Thank you for choosing Da Bali Resort. Your reservation for <span className="font-bold text-coffee-900">{lastBooking.room_name}</span> has been successfully processed.
          </p>
          
          <div className="bg-coffee-50 p-6 rounded-2xl mb-8 text-left border border-coffee-100">
            <h4 className="font-bold text-coffee-900 mb-4">Next Steps:</h4>
            <ul className="space-y-3 text-sm text-coffee-700">
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">1</span>
                Save or print your official receipt below.
              </li>
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">2</span>
                Present the Unique Check-in ID on your receipt upon arrival.
              </li>
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">3</span>
                Check your dashboard for any updates regarding your stay.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowReceipt(lastBooking)}
              className="bg-coffee-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-coffee-700 transition-all flex items-center justify-center"
            >
              <Receipt className="h-5 w-5 mr-2" /> View Official Receipt
            </button>
            <button 
              onClick={() => setPage(user?.role === 'admin' ? 'admin-dashboard' : 'guest-dashboard')}
              className="bg-coffee-100 text-coffee-800 px-8 py-4 rounded-xl font-bold hover:bg-coffee-200 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAmenityConfirmation = () => {
    if (!lastAmenityBooking) return null;
    const amenity = amenities.find(a => a.id === lastAmenityBooking.amenity_id);
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl border border-coffee-100"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-coffee-900 mb-4">Reservation Submitted!</h2>
          <p className="text-coffee-600 mb-8 text-lg">
            Thank you for choosing Da Bali Resort. Your reservation request for <span className="font-bold text-coffee-900">{amenity?.name}</span> has been successfully submitted and is now pending verification.
          </p>
          
          <div className="bg-coffee-50 p-6 rounded-2xl mb-8 text-left border border-coffee-100">
            <h4 className="font-bold text-coffee-900 mb-4">Summary & Next Steps:</h4>
            <div className="space-y-4 mb-6 pb-6 border-b border-coffee-200">
              <div className="flex justify-between text-sm">
                <span className="text-coffee-500">Total Quotation:</span>
                <span className="font-bold text-coffee-900">₱{(lastAmenityBooking.total_price || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-coffee-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">₱{(lastAmenityBooking.amount_paid || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-coffee-500">Remaining Balance:</span>
                <span className="font-bold text-[#A3402A]">₱{Math.max(0, (lastAmenityBooking.total_price || 0) - (lastAmenityBooking.amount_paid || 0)).toLocaleString()}</span>
              </div>
              {(lastAmenityBooking.amount_paid || 0) < (lastAmenityBooking.deposit_amount || 0) && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="font-bold">Note:</span> The required deposit is ₱{(lastAmenityBooking.deposit_amount || 0).toLocaleString()}. Your submitted payment is below this amount, so please settle the difference as soon as possible — your reservation cannot be confirmed until the deposit is met.
                </div>
              )}
            </div>
            <ul className="space-y-3 text-sm text-coffee-700">
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">1</span>
                Our staff will review your submitted proof of payment.
              </li>
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">2</span>
                Once verified, your reservation status will be updated to "Confirmed".
              </li>
              <li className="flex items-start">
                <span className="bg-coffee-200 text-coffee-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">3</span>
                The remaining balance will be settled upon your arrival at the resort.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                setPage(user?.role === 'admin' ? 'admin-dashboard' : 'guest-dashboard');
                setGuestActiveTab('bookings');
                setGuestBookingsCategory('amenities');
              }}
              className="bg-coffee-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-coffee-700 transition-all flex items-center justify-center"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAuth = () => {
    return (
      <div 
        className="flex-grow flex items-center justify-center py-16 px-4 relative"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px] z-0"></div>
        <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10">
        <div className="bg-[#5C3321] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          <div className="relative z-10">
            <Hotel className="h-12 w-12 mx-auto mb-4 text-coffee-300 drop-shadow-md" />
            <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D7A86E] to-[#FDF8F3] drop-shadow-sm">Da Bali Resort</h2>
            <p className="text-coffee-300 mt-2 font-medium tracking-wide">{authMode === 'login' ? 'Sign in to your account' : 'Create your guest account'}</p>
          </div>
        </div>
        <form onSubmit={handleAuth} className="p-8 space-y-5" autoComplete="off">
          {authError && (
            <div className="bg-red-50/90 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium animate-pulse shadow-sm">
              {authError}
            </div>
          )}
          {authMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  name="firstName"
                  placeholder="First Name" required
                  value={authForm.firstName}
                  className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                  onChange={e => setAuthForm({...authForm, firstName: sanitizeName(e.target.value)})}
                />
                <input 
                  name="lastName"
                  placeholder="Last Name" required
                  value={authForm.lastName}
                  className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                  onChange={e => setAuthForm({...authForm, lastName: sanitizeName(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  name="contactNo"
                  placeholder="09XX-XXX-XXXX" required
                  value={authForm.contactNo}
                  className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                  onChange={e => setAuthForm({...authForm, contactNo: sanitizePhone(e.target.value)})}
                />
                <input 
                  name="address"
                  placeholder="Address" required
                  value={authForm.address}
                  className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                  onChange={e => setAuthForm({...authForm, address: e.target.value})}
                />
              </div>
            </>
          )}
          <input 
            name="username"
            autoComplete="off"
            placeholder="Username" required
            value={authForm.username}
            className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
            onChange={e => setAuthForm({...authForm, username: e.target.value})}
          />
          {authMode === 'register' && (
            <input 
              name="email"
              type="email" placeholder="Email Address" required
              value={authForm.email}
              className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
              onChange={e => setAuthForm({...authForm, email: e.target.value})}
            />
          )}
          <div className="relative">
            <input 
              name="password"
              type={showPassword ? "text" : "password"} 
              autoComplete="off"
              placeholder="Password" required
              value={authForm.password}
              className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none pr-12"
              onChange={e => setAuthForm({...authForm, password: e.target.value})}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex items-center justify-end text-sm">
            {authMode === 'login' && (
              <button 
                type="button" 
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-coffee-600 hover:text-[#5C3321] font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          {resetToken ? (
            <div className="space-y-4">
              <div className="bg-coffee-50 p-4 rounded-xl text-xs text-coffee-600 mb-4">
                Please enter your new password below to reset your account access.
              </div>
              <input 
                type="password" placeholder="New Password" required
                value={newPassword}
                className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                onChange={e => setNewPassword(e.target.value)}
              />
              <input 
                type="password" placeholder="Confirm New Password" required
                value={confirmNewPassword}
                className="w-full p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                onChange={e => setConfirmNewPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className={`w-full bg-[#5C3321] text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center ${isResettingPassword ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#A3402A]'}`}
              >
                {isResettingPassword ? (
                  <>
                    <Clock className="animate-spin h-5 w-5 mr-2" />
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
              <button 
                type="button" 
                onClick={() => setResetToken(null)}
                className="w-full text-center text-sm text-coffee-600 hover:text-[#5C3321] font-medium mt-2"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <button 
                type="submit"
                disabled={isAuthLoading}
                className={`w-full bg-[#5C3321] text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center ${isAuthLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#A3402A]'}`}
              >
                {isAuthLoading ? (
                  <>
                    <Clock className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Register Now'
                )}
              </button>
              <div className="text-center text-sm text-coffee-600 pt-4">
                {authMode === 'login' ? (
                  <p>Don't have an account? <button type="button" onClick={() => setAuthMode('register')} className="text-[#A3402A] font-bold cursor-pointer hover:underline">Create Account</button></p>
                ) : (
                  <p>Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-[#A3402A] font-bold cursor-pointer hover:underline">Sign In</button></p>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

  const renderGuestDashboard = () => {
    const sidebarItems = [
      { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
      { id: 'bookings', label: 'My Reservations', icon: <Calendar className="h-5 w-5" /> },
      { id: 'profile', label: 'My Profile', icon: <UserIcon className="h-5 w-5" /> },
    ];

    return (
      <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[#FFFBF7]">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[300] w-64 h-full flex flex-col shrink-0 border-r border-[#A3402A]/20 bg-white pt-10 px-6 transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-10 flex justify-between items-center lg:flex-col lg:items-center lg:justify-center relative">
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-coffee-900">Guest Portal</h2>
              <p className="text-xs text-[#A3402A] font-bold tracking-widest uppercase mt-1">Welcome {user?.first_name}</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-coffee-600 hover:bg-coffee-50 rounded-lg absolute right-0 top-0">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setGuestActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-6 py-4 rounded-2xl font-bold transition-all ${
                  guestActiveTab === item.id 
                    ? 'bg-[#5C3321] text-white shadow-xl translate-x-1' 
                    : 'text-coffee-600 hover:bg-coffee-50 hover:text-coffee-900'
                }`}
              >
                <span className="mr-4">{item.icon}</span>
                <span className="text-base whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto py-10 border-t border-[#A3402A]/10">
             <div className="bg-coffee-50 p-6 rounded-3xl border border-[#A3402A]/10">
                <p className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-2">Need Help?</p>
                <p className="text-xs text-coffee-600 leading-relaxed">Contact our front desk for immediate assistance.</p>
             </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-coffee-100 shrink-0 z-[250]">
            <h2 className="text-xl font-serif font-bold text-coffee-900">Guest Portal</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-coffee-600 hover:bg-coffee-50 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Content Scrollable Area */}
          <div className={`flex-1 custom-scrollbar relative ${guestActiveTab === 'profile' ? 'p-3 lg:p-6 pt-4 lg:pt-8 overflow-hidden max-h-[90vh]' : 'p-4 lg:p-10 pt-8 lg:pt-16 overflow-y-auto'}`}>
            <div className="max-w-5xl mx-auto w-full">
              <AnimatePresence mode="wait">
                {guestActiveTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full min-h-full flex flex-col gap-y-6"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                      <div>
                        <h2 className="text-xl lg:text-3xl font-serif font-bold text-coffee-900 leading-tight">Dashboard Overview</h2>
                      <p className="text-[#A3402A] text-xs font-bold tracking-wide mt-1">Track your recent activities and stay details.</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs lg:text-sm font-bold text-coffee-400 uppercase tracking-widest">Current Date</p>
                       <p className="text-base lg:text-lg font-serif font-bold text-coffee-900">{format(new Date(), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {bookingsAwaitingFeedback.length > 0 && (() => {
                    const promptBooking = checkedInAwaitingFeedback || bookingsAwaitingFeedback[0];
                    const isBeforeCheckout = (promptBooking.status as string) === 'checked-in';
                    return (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border border-[#A3402A] rounded-2xl p-4 lg:p-6 shadow-lg">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-coffee-900 text-lg">
                            {isBeforeCheckout ? `Enjoying your stay in ${promptBooking.room_name}?` : `How was your stay in ${promptBooking.room_name}?`}
                          </p>
                          <p className="text-sm text-coffee-600">
                            {isBeforeCheckout
                              ? `Before you check out on ${format(new Date(promptBooking.check_out), 'MMM dd')}, please take a moment to rate your experience.`
                              : 'We\'d love to hear about your experience. It only takes a minute.'}
                          </p>
                        </div>
                        <button
                          onClick={() => openFeedbackModal(promptBooking)}
                          className="w-full sm:w-auto shrink-0 bg-[#A3402A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8a3624] transition-colors flex items-center justify-center gap-2"
                        >
                          <Star className="h-4 w-4" /> Rate Your Stay
                        </button>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow items-stretch">
                    {/* Recent Bookings - 8/12 */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-[#A3402A] overflow-hidden shadow-lg flex flex-col">
                      <div className="bg-[#5C3321] p-4 lg:p-6 text-white">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl lg:text-2xl font-serif font-bold">Upcoming Bookings</h3>
                          <button onClick={() => setGuestActiveTab('bookings')} className="bg-white/10 px-4 lg:px-6 py-2 rounded-full text-xs lg:text-sm font-bold hover:bg-white/20 transition-all">View All</button>
                        </div>
                      </div>
                      <div className="flex-grow overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="border-b border-[#A3402A]/10">
                            <tr className="text-[#A3402A] text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                              <th className="px-4 lg:px-10 py-4 lg:py-8">Room</th>
                              <th className="px-4 lg:px-10 py-4 lg:py-8">Dates</th>
                              <th className="px-4 lg:px-10 py-4 lg:py-8">Status</th>
                              <th className="px-4 lg:px-10 py-4 lg:py-8 text-right">Receipt & Info</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-coffee-50">
                            {bookings.filter(b => b.user_id === user?.id).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 lg:px-10 py-12 lg:py-16">
                                  <div className="flex flex-col items-center justify-center bg-coffee-50/50 rounded-2xl py-8 border border-dashed border-coffee-200">
                                    <Calendar className="h-10 w-10 text-coffee-300 mb-3 opacity-50" />
                                    <p className="text-coffee-600 font-bold text-sm lg:text-base">No reservation records found.</p>
                                    <p className="text-coffee-400 text-xs mt-1">When you book, it will appear here.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              bookings.filter(b => b.user_id === user?.id).slice(0, 5).map(booking => (
                                <tr key={booking.id} className="hover:bg-coffee-50/50 transition-colors">
                                  <td className="px-4 lg:px-10 py-4 lg:py-6">
                                    <div className="flex items-center">
                                      <img src={booking.image_url} className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover mr-3 lg:mr-6 shadow-md" alt="" referrerPolicy="no-referrer" />
                                      <span className="font-bold text-coffee-900 text-sm lg:text-lg">{booking.room_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-600 font-medium whitespace-nowrap">
                                    {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
                                  </td>
                                  <td className="px-4 lg:px-10 py-4 lg:py-6">
                                    <span className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[9px] lg:text-[11px] font-bold tracking-widest ${
                                      (booking.status as string) === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                                      (booking.status as string) === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {booking.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 lg:px-10 py-4 lg:py-6 text-right">
                                    <button onClick={() => setShowReceipt(booking)} className="p-2 lg:p-3 bg-coffee-50 text-coffee-600 hover:text-white hover:bg-coffee-600 rounded-lg lg:rounded-xl shadow-sm border border-coffee-200 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                      <Receipt className="h-4 w-4 lg:h-5 lg:w-5" /> Receipt & Info
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Booking Information - 4/12 */}
                    <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
                      <button 
                        onClick={() => {
                          setPage('rooms');
                          setIsFromDashboard(true);
                        }}
                        className="w-full bg-[#5C3321] text-white py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold hover:bg-coffee-800 transition-all shadow-xl flex items-center justify-center group"
                      >
                        <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2 group-hover:rotate-90 transition-transform" /> 
                        <span className="text-base lg:text-lg">New Bookings</span>
                      </button>
                      
                      <div className="bg-[#5C3321] rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-[#A3402A]/30 flex-grow flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Calendar className="h-16 w-16 lg:h-24 lg:w-24" />
                        </div>
                        <h4 className="text-xl lg:text-2xl font-serif font-bold mb-3 lg:mb-4 relative z-10">Booking Information</h4>
                        <p className="text-sm lg:text-base text-coffee-200 leading-relaxed relative z-10">
                          Manage your reservations and explore our world-class amenities. Our resort offers a variety of rooms and activities tailored to your needs.
                        </p>
                        <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-white/10 relative z-10">
                           <div className="flex items-center justify-between text-xs font-bold tracking-widest uppercase text-coffee-300">
                              <span>Active Bookings</span>
                              <span className="text-white text-lg lg:text-xl font-serif">{bookings.filter(b => b.user_id === user?.id && b.status === 'confirmed').length}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resort Services Section */}
                  <div id="dashboard-amenities-section" className="mt-8 bg-white rounded-2xl border border-[#A3402A] overflow-hidden shadow-lg p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-serif font-bold text-coffee-900">Resort Services & Amenities</h3>
                        <p className="text-coffee-600 text-sm mt-1">Explore our world-class offerings and enhance your stay.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setPage('amenities');
                          setIsFromDashboard(true);
                          window.location.hash = '#amenities-section';
                        }}
                        className="bg-coffee-50 text-coffee-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-coffee-100 transition-colors whitespace-nowrap"
                      >
                        Browse All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {amenities.filter(a => a.status === 'active').slice(0, 3).map(amenity => (
                        <div key={amenity.id} className="bg-coffee-50 rounded-xl overflow-hidden group cursor-pointer hover:shadow-md transition-all" onClick={() => { setPage('amenities'); setIsFromDashboard(true); }}>
                          <div className="h-40 overflow-hidden">
                            <img src={amenity.image_url} alt={amenity.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-coffee-900 text-lg mb-1">{amenity.name}</h4>
                            <p className="text-coffee-600 text-sm line-clamp-2">{amenity.description}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAmenity(amenity);
                              }}
                              className="w-full mt-3 bg-[#A3402A] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#8a3624] transition-colors"
                            >
                              Select Service
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div id="dashboard-rooms-section" className="mt-12">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl lg:text-2xl font-serif font-bold text-coffee-900">Resort Services Accommodations</h3>
                        <button 
                          onClick={() => {
                            setPage('rooms');
                            setIsFromDashboard(true);
                            window.location.hash = '#rooms-section';
                          }}
                          className="bg-coffee-50 text-coffee-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-coffee-100 transition-colors whitespace-nowrap"
                        >
                          Browse All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {rooms.filter(r => r.status === 'available').slice(0, 3).map(room => (
                          <div key={room.id} className="bg-coffee-50 rounded-xl overflow-hidden group cursor-pointer hover:shadow-md transition-all" onClick={() => { setPage('rooms'); setIsFromDashboard(true); }}>
                            <div className="h-40 overflow-hidden">
                              <img src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold text-coffee-900 text-lg mb-1">{room.name}</h4>
                              <p className="text-coffee-600 text-sm line-clamp-2">{room.description}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPage('rooms');
                                  setIsFromDashboard(true);
                                }}
                                className="w-full mt-3 bg-[#A3402A] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#8a3624] transition-colors"
                              >
                                Select Service
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

              {guestActiveTab === 'bookings' && (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full min-h-full flex flex-col gap-y-6 pt-4"
                >
                  {/* Dismantled standalone card container to align with open layout of Admin Dashboard */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 lg:px-0">
                    <div>
                      <h2 className="text-4xl font-serif font-bold text-coffee-900">Reservations Dashboard</h2>
                      <p className="text-[#A3402A]/70 text-xs font-bold tracking-wide mt-1">
                        {guestBookingsCategory === 'accommodations' 
                          ? 'View and manage your booked resort room accommodations.' 
                          : 'Organizes reservations for specific properties.'}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={() => {
                          setPage('rooms');
                          setIsFromDashboard(true);
                        }} 
                        className="bg-[#A3402A] text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-[#8a3624] transition-all shadow-md flex items-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Book Room</span>
                      </button>
                      <button 
                        onClick={() => {
                          setPage('amenities');
                          setIsFromDashboard(true);
                        }} 
                        className="bg-[#5C3321] text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-[#4a291a] transition-all shadow-md flex items-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Reserve Amenity</span>
                      </button>
                    </div>
                  </div>

                  {/* Upper Segment Filters */}
                  <div className="flex bg-white border border-[#A3402A] rounded-2xl p-1.5 w-full sm:w-fit shadow-lg overflow-x-auto custom-scrollbar px-4 lg:px-1.5 mx-4 lg:mx-0">
                    {(['accommodations', 'amenities'] as const).map((category) => (
                      <button
                        key={category}
                        onClick={() => setGuestBookingsCategory(category)}
                        className={`px-6 sm:px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
                          guestBookingsCategory === category 
                            ? 'bg-[#5C3321] text-white shadow-md' 
                            : 'text-[#A3402A]/70 hover:text-[#A3402A] hover:bg-white/60'
                        }`}
                      >
                        {category === 'accommodations' ? 'Accommodations' : 'Amenities'}
                      </button>
                    ))}
                  </div>

                  {/* Inner Layout Content - Dismantled standalone card wrapper */}
                  <div className="px-4 lg:px-0 flex-grow flex flex-col w-full">
                    {guestBookingsCategory === 'accommodations' ? (
                      <div className="overflow-hidden rounded-2xl border border-[#A3402A] bg-white shadow-lg flex-grow flex flex-col w-full">
                        <div className="flex-grow overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#FDF8F3] border-b border-[#A3402A]/10">
                              <tr className="text-[#A3402A] text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                                <th className="px-4 lg:px-10 py-5">Room</th>
                                <th className="px-4 lg:px-10 py-5">Check-in</th>
                                <th className="px-4 lg:px-10 py-5">Check-out</th>
                                <th className="px-4 lg:px-10 py-5">Total Price</th>
                                <th className="px-4 lg:px-10 py-5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-coffee-50 bg-white">
                              {bookings.filter(b => b.user_id === user?.id).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 lg:px-10 py-12 lg:py-16">
                                    <div className="flex flex-col items-center justify-center bg-coffee-50/50 rounded-2xl py-8 border border-dashed border-coffee-200">
                                      <Calendar className="h-10 w-10 text-coffee-300 mb-3 opacity-50" />
                                      <p className="text-coffee-600 font-bold text-sm lg:text-base">No booking records found.</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                bookings.filter(b => b.user_id === user?.id).map(booking => (
                                  <tr 
                                    key={booking.id} 
                                    className="hover:bg-coffee-50/50 transition-colors cursor-pointer"
                                    onClick={() => setShowReceipt(booking)}
                                  >
                                    <td className="px-4 lg:px-10 py-4 lg:py-6">
                                      <div className="flex items-center">
                                        <img src={booking.image_url} className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover mr-3 lg:mr-6 shadow-md" alt="" referrerPolicy="no-referrer" />
                                        <span className="font-bold text-coffee-900 text-sm lg:text-lg">{booking.room_name}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-600 whitespace-nowrap">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</td>
                                    <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-600 whitespace-nowrap">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</td>
                                    <td className="px-4 lg:px-10 py-4 lg:py-6">
                                      <p className="font-bold text-coffee-900 text-base lg:text-lg whitespace-nowrap">₱{(booking.total_price || 0).toLocaleString()}</p>
                                      <p className={`text-[10px] lg:text-xs font-bold ${booking.payment_status === 'Fully Paid' ? 'text-emerald-600' : 'text-[#A3402A]'}`}>
                                        {booking.payment_status || 'Pending'} {booking.payment_status && booking.payment_status !== 'Pending' ? `(₱${((booking.amount_paid || 0) + (booking.balance_amount_paid || 0)).toLocaleString()})` : ''}
                                      </p>
                                    </td>
                                    <td className="px-4 lg:px-10 py-4 lg:py-6">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span 
                                          onClick={(e) => {
                                            if ((booking.status as string) === 'rejected' && booking.admin_notes) {
                                              e.stopPropagation();
                                              setRejectionReasonToShow(booking.admin_notes);
                                              setIsRejectionModalOpen(true);
                                            }
                                          }}
                                          className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[9px] lg:text-[11px] font-bold tracking-widest ${
                                          (booking.status as string) === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                                          (booking.status as string) === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                          (booking.status as string) === 'pending_verification' ? 'bg-blue-100 text-blue-700' :
                                          booking.status === 'no-show' ? 'bg-gray-100 text-gray-700' :
                                          (booking.status as string) === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100 cursor-pointer hover:bg-red-100' :
                                          'bg-amber-100 text-amber-700'
                                        }`}>
                                          {booking.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {(() => {
                                          const review = myFeedbacks.find(f => f.booking_id === booking.id);
                                          if (review) {
                                            return (
                                              <span className="flex items-center gap-1 text-[10px] lg:text-xs font-bold text-coffee-500 whitespace-nowrap" title="You've reviewed this stay">
                                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {review.rating}/5 Reviewed
                                              </span>
                                            );
                                          }
                                          if (bookingsAwaitingFeedback.some(b => b.id === booking.id)) {
                                            return (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); openFeedbackModal(booking); }}
                                                className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#A3402A] text-[#A3402A] text-[10px] lg:text-xs font-bold hover:bg-[#A3402A] hover:text-white transition-colors whitespace-nowrap"
                                              >
                                                <Star className="h-3.5 w-3.5" /> Rate Stay
                                              </button>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-[#A3402A] bg-white shadow-lg flex-grow flex flex-col w-full">
                        <div className="flex-grow overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-[#FDF8F3] border-b border-[#A3402A]/10">
                              <tr className="text-[#A3402A] text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                                <th className="px-4 lg:px-10 py-5">Amenity</th>
                                <th className="px-4 lg:px-10 py-5">Date</th>
                                <th className="px-4 lg:px-10 py-5">Time</th>
                                <th className="px-4 lg:px-10 py-5">Pax</th>
                                <th className="px-4 lg:px-10 py-5">Total Price</th>
                                <th className="px-4 lg:px-10 py-5">Status</th>
                                <th className="px-4 lg:px-10 py-5">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-coffee-50 bg-white">
                              {amenityBookings.filter(b => b.user_id === user?.id).length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-4 lg:px-10 py-12 lg:py-16">
                                    <div className="flex flex-col items-center justify-center bg-coffee-50/50 rounded-2xl py-8 border border-dashed border-coffee-200">
                                      <Calendar className="h-10 w-10 text-coffee-300 mb-3 opacity-50" />
                                      <p className="text-coffee-600 font-bold text-sm lg:text-base">No reservation records found.</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                amenityBookings.filter(b => b.user_id === user?.id).map(res => {
                                  const amenity = amenities.find(a => a.id === res.amenity_id);
                                  return (
                                    <tr 
                                      key={res.id} 
                                      className="hover:bg-coffee-50/50 transition-colors cursor-pointer"
                                      onClick={() => setShowReceipt(res)}
                                    >
                                      <td className="px-4 lg:px-10 py-4 lg:py-6">
                                        <div className="flex items-center">
                                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-coffee-50 rounded-xl lg:rounded-2xl flex items-center justify-center mr-3 lg:mr-6 shadow-md">
                                            <Star className="h-5 w-5 lg:h-6 lg:w-6 text-coffee-400" />
                                          </div>
                                          <span className="font-bold text-coffee-900 text-sm lg:text-lg">{amenity?.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-600 whitespace-nowrap">{format(new Date(res.reservation_date), 'MMM dd, yyyy')}</td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-600 whitespace-nowrap">{res.reservation_time}</td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6 text-sm lg:text-base text-coffee-900 font-bold">{res.pax_count}</td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6">
                                        <p className="font-bold text-coffee-900 text-base lg:text-lg whitespace-nowrap">₱{(res.total_price || 0).toLocaleString()}</p>
                                        <p className={`text-[10px] lg:text-xs font-bold ${res.payment_status === 'Fully Paid' ? 'text-emerald-600' : 'text-[#A3402A]'}`}>
                                          {res.payment_status || 'Pending'} {res.payment_status && res.payment_status !== 'Pending' ? `(₱${((res.amount_paid || 0) + (res.balance_amount_paid || 0)).toLocaleString()})` : ''}
                                        </p>
                                      </td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <span 
                                            onClick={(e) => {
                                              if (res.status === 'rejected' && res.admin_notes) {
                                                e.stopPropagation();
                                                setRejectionReasonToShow(res.admin_notes);
                                                setIsRejectionModalOpen(true);
                                              }
                                            }}
                                            className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[9px] lg:text-[11px] font-bold uppercase tracking-wider ${
                                            res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                            res.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            res.status === 'pending_verification' ? 'bg-blue-100 text-blue-700' :
                                            res.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100 cursor-pointer hover:bg-red-100' :
                                            'bg-amber-100 text-amber-700'
                                          }`}>
                                            {res.status.replace('_', ' ').toUpperCase()}
                                          </span>
                                          {res.status === 'pending' && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDialog({
                                                  title: 'Cancel Reservation',
                                                   message: 'Are you sure you want to cancel this reservation?',
                                                   onConfirm: async () => {
                                                    try {
                                                      const response = await fetch(`/api/amenity-bookings/${res.id}`, {
                                                        method: 'PATCH',
                                                        headers: {
                                                          'Content-Type': 'application/json',
                                                          'x-user-id': user?.id?.toString() || '',
                                                          'x-user-role': user?.role || ''
                                                        },
                                                        body: JSON.stringify({ status: 'cancelled' })
                                                      });
                                                      if (response.ok) {
                                                        fetchMyAmenityBookings().catch(console.error);
                                                        setToastMessage({ title: 'Success', message: 'Reservation cancelled successfully.', type: 'success' });
                                                      } else {
                                                        setToastMessage({ title: 'Error', message: 'Failed to cancel reservation.', type: 'error' });
                                                      }
                                                    } catch (error) {
                                                      console.error('Failed to cancel reservation:', error);
                                                      setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
                                                    }
                                                   },
                                                  onCancel: () => {}
                                                });
                                              }}
                                              className="p-1 px-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm"
                                              title="Cancel Reservation"
                                            >
                                              <XCircle size={14} /> Cancel
                                            </button>
                                          )}
                                          {res.status === 'rejected' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAmenityProofModal(res);
                                              }}
                                              className="p-2 bg-[#A3402A] text-white rounded-lg hover:bg-[#8a3624] transition-all font-bold text-[10px] uppercase tracking-widest whitespace-nowrap shadow-sm"
                                            >
                                              Re-upload
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 lg:px-10 py-4 lg:py-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                          {res.details ? (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAmenityDetailsModal(res.details || '');
                                              }}
                                              className="px-4 py-2 bg-coffee-50 text-coffee-600 rounded-xl hover:bg-coffee-100 transition-colors text-xs font-bold whitespace-nowrap"
                                            >
                                              View Selected Items
                                            </button>
                                          ) : (
                                            <span className="text-sm text-coffee-500 italic">No items</span>
                                          )}
                                          {res.proof_of_payment && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAmenityProofViewer(res);
                                              }}
                                              className="p-2 bg-coffee-50 text-coffee-600 rounded-xl hover:bg-coffee-100 transition-colors inline-flex items-center justify-center shadow-sm border border-coffee-200"
                                              title="View Form Data & Proof"
                                            >
                                              <Eye size={16} />
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
                    )}
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-[#A3402A] transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

              {guestActiveTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-h-[82vh] flex flex-col gap-y-4 overflow-hidden"
                >
                  <div className="bg-white rounded-2xl lg:rounded-[2.5rem] border border-[#A3402A] overflow-hidden shadow-xl flex flex-col max-w-3xl mx-auto w-full max-h-[72vh] h-auto">
                    <div className="bg-[#5C3321] p-4 lg:p-6 text-white relative overflow-hidden shrink-0">
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-transparent rounded-full flex items-center justify-center text-xl lg:text-2xl font-serif border-4 border-white mb-2 lg:mb-3 shadow-2xl">
                          {user?.first_name?.[0]?.toLowerCase()}{user?.last_name?.[0]?.toLowerCase()}
                        </div>
                        <h3 className="text-xl lg:text-3xl font-serif font-bold">{user?.first_name} {user?.last_name}</h3>
                        <p className="text-coffee-200 mt-1 text-xs">Guest Member since {format(new Date(user?.created_at || new Date()), 'yyyy')}</p>
                      </div>
                    </div>
                    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6 bg-white overflow-y-auto custom-scrollbar flex-grow">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 max-w-lg mx-auto">
                        <div className="bg-coffee-50/50 p-2.5 lg:p-4 rounded-xl border border-coffee-100">
                          <label className="block text-[10px] lg:text-xs font-bold text-[#A3402A] uppercase tracking-widest mb-1">Email Address</label>
                          <p className="text-[#A3402A] font-bold text-xs lg:text-sm break-all">{user?.email}</p>
                        </div>
                        <div className="bg-coffee-50/50 p-2.5 lg:p-4 rounded-xl border border-coffee-100">
                          <label className="block text-[10px] lg:text-xs font-bold text-[#A3402A] uppercase tracking-widest mb-1">Phone Number</label>
                          <p className="text-[#A3402A] font-bold text-xs lg:text-sm">{user?.contact_no || 'Not provided'}</p>
                        </div>
                        <div className="sm:col-span-2 bg-coffee-50/50 p-2.5 lg:p-4 rounded-xl border border-coffee-100">
                          <label className="block text-[10px] lg:text-xs font-bold text-[#A3402A] uppercase tracking-widest mb-1">Home Address</label>
                          <p className="text-[#A3402A] font-bold text-xs lg:text-sm">{user?.address || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-3 lg:pt-4 border-t border-coffee-50">
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="flex-1 bg-[#5C3321] text-white py-2 px-4 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold hover:bg-coffee-800 transition-all shadow-xl flex items-center justify-center group text-xs lg:text-sm"
                        >
                          <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" /> Edit Profile
                        </button>
                        {bookingsAwaitingFeedback.length > 0 && (
                          <button
                            onClick={() => openFeedbackModal(checkedInAwaitingFeedback || bookingsAwaitingFeedback[0])}
                            className="flex-1 bg-white text-[#A3402A] border-2 border-[#A3402A] py-2 px-4 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold hover:bg-coffee-50 transition-all flex items-center justify-center group text-xs lg:text-sm shadow-xl"
                          >
                            <Star className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" /> Leave Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

          {/* Edit Profile Modal */}
          {isEditingProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden z-[210] max-h-[90vh] flex flex-col"
            >
              <div className="p-5 lg:p-6 border-b border-coffee-100 flex items-center justify-between bg-coffee-50/50 shrink-0">
                <div>
                  <h3 className="text-xl lg:text-2xl font-serif text-coffee-900">Edit Profile</h3>
                  <p className="text-xs text-coffee-500">Update your personal information</p>
                </div>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-coffee-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-5 lg:p-6 space-y-4 overflow-y-auto custom-scrollbar flex flex-col justify-center flex-1">
                {profileError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
                    {profileError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-1 ml-1">First Name</label>
                    <input 
                      required value={profileForm.firstName}
                      onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                      className="w-full py-3 px-4 rounded-xl border border-coffee-100 bg-coffee-50/30 outline-none focus:ring-2 focus:ring-coffee-500 transition-all font-sans text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-1 ml-1">Last Name</label>
                    <input 
                      required value={profileForm.lastName}
                      onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                      className="w-full py-3 px-4 rounded-xl border border-coffee-100 bg-coffee-50/30 outline-none focus:ring-2 focus:ring-coffee-500 transition-all font-sans text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                  <input 
                    required type="email" value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full py-3 px-4 rounded-xl border border-coffee-100 bg-coffee-50/30 outline-none focus:ring-2 focus:ring-coffee-500 transition-all font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                  <input 
                    required value={profileForm.contactNo}
                    onChange={e => setProfileForm({...profileForm, contactNo: e.target.value})}
                    className="w-full py-3 px-4 rounded-xl border border-coffee-100 bg-coffee-50/30 outline-none focus:ring-2 focus:ring-coffee-500 transition-all font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee-400 uppercase tracking-widest mb-1 ml-1">Address</label>
                  <input 
                    required value={profileForm.address}
                    onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    className="w-full py-3 px-4 rounded-xl border border-coffee-100 bg-coffee-50/30 outline-none focus:ring-2 focus:ring-coffee-500 transition-all font-sans text-sm"
                  />
                </div>
                <div className="pt-4 flex space-x-4 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-3 border border-coffee-200 text-coffee-600 rounded-xl hover:bg-coffee-50 transition-colors font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-coffee-800 text-white rounded-xl hover:bg-coffee-700 transition-all font-bold shadow-lg shadow-coffee-200 cursor-pointer relative z-10 text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
    );
  };

  const [adminMessagesMap, setAdminMessagesMap] = useState<any>({});
  const [adminInbox, setAdminInbox] = useState<any[]>([]);
  const [adminSelectedChatId, setAdminSelectedChatId] = useState<number | null>(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const adminScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = adminScrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    }
  }, [adminMessagesMap[adminSelectedChatId || 0]]);

  useEffect(() => {
    const el = adminScrollRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 50);
  }, [adminSelectedChatId]);

  const fetchAdminInbox = async () => {
    try {
      const res = await fetch('/api/admin/messages/inbox', {
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminInbox(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminInbox();
      const interval = setInterval(fetchAdminInbox, 60000); // poll every 60s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (adminSelectedChatId) {
      const fetchMsgs = async () => {
        try {
          const res = await fetch(`/api/messages/${adminSelectedChatId}`);
          if (res.ok) {
            const data = await res.json();
            setAdminMessagesMap((prev: any) => ({ ...prev, [adminSelectedChatId]: data }));
          }
          // mark as read
          await fetch(`/api/admin/messages/${adminSelectedChatId}/read`, {
            method: 'PATCH',
            headers: { 
              'x-user-id': user?.id?.toString() || '',
              'x-user-role': user?.role || ''
            }
          });
          fetchAdminInbox(); // refresh badge
        } catch (e) {
          console.error(e);
        }
      };
      fetchMsgs();
      const interval = setInterval(fetchMsgs, 30000);
      return () => clearInterval(interval);
    }
  }, [adminSelectedChatId]);

  const renderAdminDashboard = () => {
    const totalUnreadMessages = adminInbox.filter(curr => (curr.unread_count || 0) > 0).length;

    const sidebarItems = [
      { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'analytics', label: 'Analytics', icon: <PieChart className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'reservations', label: 'All Reservation', icon: <Calendar className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'rooms', label: 'Room Management', icon: <Bed className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'amenities', label: 'Amenity Management', icon: <Flower className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'slideshow', label: 'Slideshow Management', icon: <LayoutDashboard className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'staff-records', label: 'Staff Records', icon: <Users className="h-4 w-4 stroke-[1.5]" />, roles: ['admin', 'staff'] },
      { id: 'housekeeping', label: 'Housekeeping', icon: <Sparkles className="h-4 w-4 stroke-[1.5]" />, roles: ['admin', 'staff', 'housekeeping'] },
      { id: 'feedback', label: 'Guest Feedback', icon: <Star className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'audit-logs', label: 'Audit Logs', icon: <ScrollText className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'faq-chatbot', label: 'FAQ Chatbot', icon: <Bot className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'] },
      { id: 'messages', label: 'Support Chat', icon: <MessageSquare className="h-4 w-4 stroke-[1.5]" />, roles: ['admin'], badge: totalUnreadMessages },
    ].filter(item => item.roles.includes(user?.role || ''));

    return (
      <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-[#FFFBF7]">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[300] w-72 h-full flex flex-col shrink-0 border-r border-[#5C3321]/20 bg-white pt-10 px-6 transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-10 flex justify-between items-center lg:flex-col lg:justify-center">
            <div className="text-center flex flex-col items-center w-full">
              <h2 className="text-2xl font-serif font-bold text-[#5C3321] whitespace-nowrap text-center">Admin Panel</h2>
              <p className="text-[9px] text-[#5C3321]/60 uppercase tracking-[0.2em] mt-1 whitespace-nowrap font-bold text-center">RESORT MANAGEMENT</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-coffee-600 hover:bg-coffee-50 rounded-lg shrink-0 ml-4">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setAdminActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${
                  adminActiveTab === item.id 
                    ? 'bg-[#5C3321] text-white shadow-xl translate-x-1' 
                    : 'text-[#5C3321]/70 hover:bg-coffee-50 hover:text-[#5C3321]'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-4">{item.icon}</span>
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          
          <div className="mt-auto py-10 border-t border-[#5C3321]/10">
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-coffee-100 shrink-0 z-[250]">
            <h2 className="text-xl font-serif font-bold text-[#5C3321]">Admin Panel</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-coffee-600 hover:bg-coffee-50 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar relative">
            <div className="w-full">
              {/* Welcome Greeting */}
              {adminActiveTab === 'overview' && (
                <div className="max-w-5xl mx-auto w-full mb-8">
                  <h1 className="text-4xl font-serif font-bold text-coffee-900">Welcome, Admin</h1>
                  <p className="text-coffee-500 mt-2">Manage your resort operations and overall business performance.</p>
                </div>
              )}

              <div className="">
                <AnimatePresence mode="wait">
                  {adminActiveTab === 'staff-records' && (
                    <motion.div
                      key="staff-records"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-5xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">Daily Time Record (DTR)</h1>
                          <p className="text-coffee-500 mt-2">Manage your staff attendance and daily logs efficiently.</p>
                        </div>

                        <div className="flex space-x-4 mb-2 bg-coffee-50/50 p-1.5 rounded-2xl w-fit border border-[#A3402A]">
                          <button
                            onClick={() => setStaffRecordsTab('directory')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              staffRecordsTab === 'directory'
                                ? 'bg-[#5C3321] text-white shadow-lg'
                                : 'text-coffee-600 hover:bg-coffee-100'
                            }`}
                          >
                            Staff Directory
                          </button>
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => setStaffRecordsTab('management')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  staffRecordsTab === 'management'
                                    ? 'bg-[#5C3321] text-white shadow-lg'
                                    : 'text-coffee-600 hover:bg-coffee-100'
                                }`}
                              >
                                Staff Management
                              </button>
                              <button
                                onClick={() => setStaffRecordsTab('history')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                  staffRecordsTab === 'history'
                                    ? 'bg-[#5C3321] text-white shadow-lg'
                                    : 'text-coffee-600 hover:bg-coffee-100'
                                }`}
                              >
                                Attendance History
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <DTRDashboard 
                        staffRecord={staffRecord}
                        staffMembers={staffMembers}
                        currentUser={user!}
                        onCheckIn={(id) => handleCheckIn(id)}
                        onCheckOut={(id) => handleCheckOut(id)}
                        onAddStaff={handleCreateStaff}
                        onEditStaff={setEditingScheduleRecord}
                        onDeleteStaff={async (id) => {
                          setConfirmDialog({
                            title: 'Delete Staff',
                            message: 'Are you sure you want to delete this staff?',
                            onConfirm: async () => {
                              try {
                                const res = await fetch(`/api/users/${id}`, { 
                                  method: 'DELETE',
                                  headers: {
                                    'x-user-id': user?.id?.toString() || '',
                                    'x-user-role': user?.role || ''
                                  }
                                });
                                if (res.ok) {
                                  setToastMessage({ title: 'Success', message: 'Staff member deleted successfully.', type: 'success' });
                                  fetchAdminData().catch(console.error);
                                } else {
                                  setToastMessage({ title: 'Error', message: 'Failed to delete staff member.', type: 'error' });
                                }
                              } catch (error) {
                                setToastMessage({ title: 'Error', message: 'An error occurred.', type: 'error' });
                              }
                            },
                            onCancel: () => {}
                          });
                        }}
                        fetchAdminData={fetchAdminData}
                        setToastMessage={setToastMessage}
                        setConfirmDialog={setConfirmDialog}
                        onExport={exportStaffRecordsToCSV}
                        onExportAttendance={handleExportAttendance}
                        view={staffRecordsTab === 'directory' ? 'dashboard' : staffRecordsTab === 'management' ? 'management' : 'history'}
                      />
                    </motion.div>
                  )}
                  {adminActiveTab === 'housekeeping' && (
                    <motion.div
                      key="housekeeping"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-6xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">Housekeeping</h1>
                          <p className="text-coffee-500 mt-2">Daily room turnover list and cleanup schedule.</p>
                        </div>
                      </div>
                      <HousekeepingDashboard
                        currentUser={user!}
                        onRoomsRefresh={fetchRooms}
                        setToastMessage={setToastMessage}
                      />
                    </motion.div>
                  )}
                  {adminActiveTab === 'analytics' && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-7xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">Analytics</h1>
                          <p className="text-coffee-500 mt-2">Revenue, occupancy, rooms, amenities, and payments at a glance.</p>
                        </div>
                      </div>
                      <div className="max-w-7xl mx-auto w-full">
                        <AnalyticsDashboard
                          currentUser={user!}
                          analytics={analytics}
                          onRefresh={fetchAnalytics}
                        />
                      </div>
                    </motion.div>
                  )}
                  {adminActiveTab === 'audit-logs' && (
                    <motion.div
                      key="audit-logs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-7xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">Audit Logs</h1>
                          <p className="text-coffee-500 mt-2">A record of who did what — booking status changes, payment verification, staff/room/amenity edits, and more.</p>
                        </div>
                      </div>
                      <div className="max-w-7xl mx-auto w-full">
                        <AuditLogsDashboard currentUser={user!} />
                      </div>
                    </motion.div>
                  )}
                  {adminActiveTab === 'feedback' && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-7xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">Guest Feedback</h1>
                          <p className="text-coffee-500 mt-2">Review what guests say about their stays, and hide or remove reviews from the public website.</p>
                        </div>
                      </div>
                      <div className="max-w-7xl mx-auto w-full">
                        <FeedbackManagementDashboard currentUser={user!} />
                      </div>
                    </motion.div>
                  )}
                  {adminActiveTab === 'faq-chatbot' && (
                    <motion.div
                      key="faq-chatbot"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-6"
                    >
                      <div className="max-w-7xl mx-auto w-full">
                        <div className="mb-2">
                          <h1 className="text-4xl font-serif font-bold text-coffee-900">FAQ Chatbot</h1>
                          <p className="text-coffee-500 mt-2">Manage the question templates, key phrases, and canned responses the guest chatbot uses to answer inquiries automatically.</p>
                        </div>
                      </div>
                      <div className="max-w-7xl mx-auto w-full">
                        <FaqManagementDashboard currentUser={user!} />
                      </div>
                    </motion.div>
                  )}
                  {adminActiveTab === 'overview' && (
                    <motion.div
                      key="overview-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full min-h-full flex flex-col gap-y-8"
                    >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[
                      { label: 'Total Revenue', value: `₱${(analytics?.revenue || 0).toLocaleString()}`, icon: <CreditCard className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Total Monthly Sales', value: `₱${(analytics?.monthly_revenue || 0).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Occupancy Rate', value: `${(((analytics?.occupancy_rate || 0) * 100)).toFixed(1)}%`, icon: <Percent className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Total Bookings', value: analytics?.bookings, icon: <Calendar className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Total Reservations', value: analytics?.amenity_bookings, icon: <Star className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Active Rooms', value: analytics?.rooms, icon: <Bed className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600' },
                      { label: 'Total Guests', value: analytics?.users, icon: <UserIcon className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
                      { label: 'Total Staff', value: staffMembers.length, icon: <Users className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
                      // Temporarily hidden to keep the grid at exactly 8 cards:
                      // { label: 'Present Today', value: (staffRecord || []).filter(r => r.date === format(new Date(), 'yyyy-MM-dd') && r.status === 'present').length, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white p-4 rounded-2xl border border-[#A3402A] shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${stat.color} group-hover:scale-105 transition-transform`}>
                            {stat.icon}
                          </div>
                          <div className="h-1 w-8 bg-coffee-50 rounded-full" />
                        </div>
                        <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <h4 className="text-lg font-serif font-bold text-[#5C3321]">{stat.value}</h4>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow items-stretch">
                    <div className="lg:col-span-8 bg-white rounded-2xl lg:rounded-[2.5rem] shadow-xl border border-[#A3402A] overflow-hidden flex flex-col">
                      <div className="p-6 lg:p-10 border-b border-coffee-50 flex justify-between items-center bg-coffee-50/30">
                        <h3 className="text-xl lg:text-2xl font-serif font-bold text-coffee-900">Recent Activity</h3>
                        <button onClick={() => setAdminActiveTab('reservations')} className="text-[#A3402A] text-xs lg:text-sm font-bold hover:underline">View All</button>
                      </div>
                      <div className="flex-grow overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                          <thead className="text-coffee-400 text-[10px] uppercase tracking-widest bg-coffee-50/50">
                            <tr>
                              <th className="px-6 lg:px-10 py-4 lg:py-6">Guest</th>
                              <th className="px-6 lg:px-10 py-4 lg:py-6">Room</th>
                              <th className="px-6 lg:px-10 py-4 lg:py-6">Status</th>
                              <th className="px-6 lg:px-10 py-4 lg:py-6 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-coffee-50">
                            {bookings.slice(0, 5).map(booking => (
                              <tr key={booking.id} className="hover:bg-coffee-50/50 transition-colors cursor-pointer group" onClick={() => setShowReceipt(booking)}>
                                <td className="px-6 lg:px-10 py-4 lg:py-6">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#5C3321] text-white rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold mr-3 lg:mr-4 shadow-md">
                                      {booking.first_name?.[0]}{booking.last_name?.[0]}
                                    </div>
                                    <span className="font-bold text-coffee-900 text-sm lg:text-base">{booking.first_name} {booking.last_name}</span>
                                  </div>
                                </td>
                                <td className="px-6 lg:px-10 py-4 lg:py-6 text-xs lg:text-sm text-coffee-600 font-medium">{booking.room_name}</td>
                                <td className="px-6 lg:px-10 py-4 lg:py-6">
                                  <span className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-[9px] lg:text-[10px] font-bold tracking-widest ${
                                    (booking.status as string) === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                                    (booking.status as string) === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {booking.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 lg:px-10 py-4 lg:py-6 text-right font-bold text-coffee-900 text-sm lg:text-base">₱{(booking.total_price || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-8">
                      <div className="bg-coffee-900 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-10 text-white shadow-2xl border border-[#A3402A]">
                        <h4 className="text-xl lg:text-2xl font-serif font-bold mb-6 lg:mb-8">Quick Actions</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <button onClick={() => setAdminActiveTab('rooms')} className="w-full py-4 lg:py-5 bg-white/10 hover:bg-white/20 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all text-left px-4 lg:px-6 flex items-center group">
                            <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-3 lg:mr-4 group-hover:rotate-90 transition-transform" /> Add New Room
                          </button>
                          <button onClick={() => setAdminActiveTab('amenities')} className="w-full py-4 lg:py-5 bg-white/10 hover:bg-white/20 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all text-left px-4 lg:px-6 flex items-center group">
                            <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-3 lg:mr-4 group-hover:rotate-90 transition-transform" /> Add New Amenity
                          </button>
                          <button onClick={() => setShowExportModal(true)} className="w-full py-4 lg:py-5 bg-[#A3402A] hover:bg-[#8F3523] text-white rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all text-left px-4 lg:px-6 flex items-center group shadow-md border border-[#A3402A]/20">
                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 mr-3 lg:mr-4 group-hover:scale-110 transition-transform" /> Export Report
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-10 border border-[#A3402A] shadow-xl flex-grow flex flex-col justify-center">
                        <h4 className="text-xl lg:text-2xl font-serif font-bold text-coffee-900 mb-4 lg:mb-6">Resort Overview</h4>
                        <p className="text-sm lg:text-base text-coffee-600 leading-relaxed">
                          Real-time monitoring of bookings, guest activity, and room availability to ensure seamless operations.
                        </p>
                      </div>
                    </div>
                  </div>

                  <RoomAvailabilityCalendar bookings={bookings} rooms={rooms} />

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

                  {adminActiveTab === 'slideshow' && (
                    <motion.div
                      key="slideshow"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full min-h-full flex flex-col gap-y-8"
                    >
                      <div className="bg-white rounded-2xl lg:rounded-[2.5rem] border border-[#A3402A] overflow-hidden shadow-xl flex-grow flex flex-col">
                        <div className="bg-[#5C3321] p-4 lg:p-6 text-white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-xl lg:text-2xl font-serif font-bold">Hero Slideshow Management</h3>
                          <p className="text-xs text-white/60 mt-1">Manage announcements, advertisements, and promotions on the homepage.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingBanner(null);
                            setBannerForm({
                              title: '',
                              description: '',
                              image_url: '',
                              link_url: '',
                              type: 'Announcement',
                              order_index: heroBanners.length,
                              is_active: 1
                            });
                            setShowBannerModal(true);
                          }} 
                          className="bg-white text-[#A3402A] px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-[1.25rem] text-xs lg:text-sm font-bold hover:bg-coffee-50 transition-all shadow-md flex items-center space-x-2"
                        >
                          <Plus size={18} />
                          <span>Add New Banner</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 lg:p-8 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dynamic Banners */}
                        {heroBanners.map((banner) => (
                          <div key={banner.id} className="bg-white rounded-3xl p-6 border border-[#A3402A] shadow-sm hover:shadow-md transition-all flex flex-col group">
                            <div className="flex justify-between items-start mb-4">
                              {banner.type ? (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                  banner.type === 'Announcement' ? 'bg-blue-100 text-blue-700' :
                                  banner.type === 'Advertisement' ? 'bg-purple-100 text-purple-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {banner.type}
                                </span>
                              ) : (
                                <div />
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-coffee-400">ORDER: {banner.order_index + 1}</span>
                              </div>
                            </div>
                            <div className="h-40 rounded-2xl overflow-hidden mb-4 bg-coffee-50 relative">
                              {isVideo(banner.image_url) ? (
                                <video src={banner.image_url} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBanner(banner);
                                    setBannerForm({
                                      title: banner.title,
                                      description: banner.description,
                                      image_url: banner.image_url,
                                      link_url: banner.link_url || '',
                                      type: banner.type,
                                      order_index: banner.order_index,
                                      is_active: banner.is_active
                                    });
                                    setShowBannerModal(true);
                                  }}
                                  className="p-2 bg-white rounded-full text-coffee-900 hover:scale-110 transition-transform shadow-lg"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBanner(banner.id);
                                  }}
                                  className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform shadow-lg"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-coffee-900 mb-2 truncate">{banner.title}</h4>
                            <p className="text-xs text-coffee-600 mb-4 flex-grow line-clamp-2">{banner.description}</p>
                            <div className="pt-4 border-t border-coffee-100 flex justify-between items-center">
                              <span className="text-[10px] text-coffee-400 font-mono truncate max-w-[150px]">{banner.link_url || 'No Link'}</span>
                            </div>
                          </div>
                        ))}

                        {heroBanners.length === 0 && (
                          <div className="col-span-1 md:col-span-2 py-20 text-center border-2 border-dashed border-coffee-100 rounded-[2.5rem]">
                            <LayoutDashboard className="h-12 w-12 text-coffee-200 mx-auto mb-4" />
                            <p className="text-coffee-400 font-bold">No dynamic banners added yet.</p>
                            <p className="text-xs text-coffee-300 mt-1">Click "Add New Banner" to start cycling content after the welcome slide.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {adminActiveTab === 'reservations' && (
                <motion.div
                  key="reservations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full min-h-full flex flex-col gap-y-8"
                >
                  <div className="space-y-8 flex-grow flex flex-col pt-4">
                    <div className="px-4 lg:px-0">
                      <h2 className="text-4xl font-serif font-bold text-coffee-900">Reservations Dashboard</h2>
                    </div>
                    
                    <div className="flex flex-col gap-6 px-4 lg:px-0">
                      {/* Upper Control Row: Segment Controls & Direct Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                        {/* Segmented Control Navigation */}
                        <div className="flex bg-white border border-[#A3402A] rounded-2xl p-1.5 w-full sm:w-fit shadow-lg overflow-x-auto custom-scrollbar">
                          {(['all', 'accommodation', 'amenity'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setReservationsTab(tab)}
                              className={`px-6 sm:px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 flex-1 sm:flex-none whitespace-nowrap ${
                                reservationsTab === tab 
                                  ? 'bg-[#5C3321] text-white shadow-md' 
                                  : 'text-[#A3402A]/70 hover:text-[#A3402A] hover:bg-white/60'
                              }`}
                            >
                              {tab === 'all' ? 'All Reservations' : tab === 'accommodation' ? 'Accommodations' : 'Amenities'}
                            </button>
                          ))}
                        </div>

                        {/* Direct Action Buttons - Aligned to Upper Control Row */}
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                          <button 
                            onClick={() => setShowExportModal(true)}
                            className="bg-white border border-[#A3402A]/20 text-[#A3402A] px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#FDF8F3] transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </button>
                          <button 
                            onClick={() => setShowWalkInModal(true)}
                            className="bg-[#518C63] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#41704F] transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <UserPlus className="h-4 w-4" />
                            Walk-In
                          </button>
                        </div>
                      </div>

                      {/* Lower Control Row: Sub-navigation Tab Filters & Repositioned Search Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full border-t border-[#A3402A]/10 pt-4">
                        {/* Flat Design Status Filters */}
                        <div className="flex items-center gap-6 shrink-0 overflow-x-auto custom-scrollbar w-full sm:w-auto">
                          {(['Upcoming', 'Completed', 'Archived'] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setReservationFilter(filter)}
                              className={`pb-1 text-sm font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                                reservationFilter === filter 
                                  ? 'border-[#A3402A] text-[#A3402A]' 
                                  : 'border-transparent text-[#A3402A]/50 hover:text-[#A3402A]'
                              }`}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                        
                        {/* Search Bar - Repositioned underneath buttons and adjacent to sub-navigation */}
                        <div className="relative w-full sm:w-80">
                          <input 
                            placeholder="Search reservations..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(searchQuery)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-[#A3402A]/20 text-xs outline-none focus:ring-1 focus:ring-[#A3402A] focus:border-[#A3402A] w-full bg-white shadow-sm transition-all" 
                          />
                          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3402A]/40" />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 lg:px-0 flex-grow flex flex-col w-full max-w-full">
                      <div className="overflow-hidden rounded-2xl lg:rounded-[2.5rem] border border-[#A3402A] bg-white shadow-sm flex-grow flex flex-col w-full max-w-full">
                        <div className="flex-grow overflow-x-hidden w-full max-w-full">
                          <table className="w-full max-w-full text-left border-collapse table-fixed min-w-0">
                            <thead>
                              <tr className="bg-[#FDF8F3] text-[#A3402A] border-b border-[#A3402A]/20">
                                {reservationsTab === 'all' ? (
                                  <>
                                    <th className="w-[30%] pl-5 lg:pl-8 pr-2 py-3 text-[10px] uppercase tracking-wider font-bold">Guest</th>
                                    <th className="w-[20%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Room</th>
                                    <th className="w-[24%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Dates</th>
                                    <th className="w-[12%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Amount</th>
                                    <th className="w-[14%] pr-5 lg:pr-8 pl-2 py-3 text-[10px] uppercase tracking-wider font-bold">Status</th>
                                  </>
                                ) : reservationsTab === 'accommodation' ? (
                                  <>
                                    <th className="w-[30%] pl-5 lg:pl-8 pr-2 py-3 text-[10px] uppercase tracking-wider font-bold">Guest</th>
                                    <th className="w-[20%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Room</th>
                                    <th className="w-[24%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Dates</th>
                                    <th className="w-[12%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Amount</th>
                                    <th className="w-[14%] pr-5 lg:pr-8 pl-2 py-3 text-[10px] uppercase tracking-wider font-bold">Status</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="w-[30%] pl-5 lg:pl-8 pr-2 py-3 text-[10px] uppercase tracking-wider font-bold">Guest</th>
                                    <th className="w-[20%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Room</th>
                                    <th className="w-[24%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Dates</th>
                                    <th className="w-[12%] px-1.5 lg:px-2 py-3 text-[10px] uppercase tracking-wider font-bold">Amount</th>
                                    <th className="w-[14%] pr-5 lg:pr-8 pl-2 py-3 text-[10px] uppercase tracking-wider font-bold">Status</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#A3402A]/10">
                              {reservationsTab === 'all' ? (
                                  [
                                    ...bookings.map(b => ({ ...b, unified_type: 'Accommodation' as const, unified_item: b.room_name, sort_date: b.created_at || b.check_in })),
                                    ...amenityBookings.map(b => ({ ...b, unified_type: 'Amenity' as const, unified_item: b.amenity_name, sort_date: b.created_at || b.reservation_date }))
                                  ]
                                    .sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime())
                                    .filter(b => {
                                      if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                      if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                      if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                      if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                      return true;
                                    })
                                    .filter(b => {
                                      if (!activeSearch) return true;
                                      const s = activeSearch.toLowerCase();
                                      return (
                                        (b.first_name || '').toLowerCase().includes(s) ||
                                        (b.last_name || '').toLowerCase().includes(s) ||
                                        (b.email || '').toLowerCase().includes(s) ||
                                        (b.unified_item || '').toLowerCase().includes(s) ||
                                        (b.status || '').toLowerCase().includes(s) ||
                                        (b.qr_code || '').toLowerCase().includes(s)
                                      );
                                    }).length === 0 ? (
                                      <tr>
                                        <td colSpan={5} className="px-8 py-16">
                                          <div className="flex flex-col items-center justify-center bg-[#FDF8F3]/50 rounded-2xl py-12 border border-dashed border-[#A3402A]/20">
                                            <Calendar className="h-12 w-12 text-[#A3402A] mb-4 opacity-30" />
                                            <p className="text-[#A3402A] font-bold text-lg">No reservation records found.</p>
                                            <p className="text-[#5C3321]/60 text-sm mt-1">There are no {reservationFilter.toLowerCase()} reservations.</p>
                                          </div>
                                        </td>
                                      </tr>
                                    ) : (
                                      [
                                        ...bookings.map(b => ({ ...b, unified_type: 'Accommodation' as const, unified_item: b.room_name, sort_date: b.created_at || b.check_in })),
                                        ...amenityBookings.map(b => ({ ...b, unified_type: 'Amenity' as const, unified_item: b.amenity_name, sort_date: b.created_at || b.reservation_date }))
                                      ]
                                        .sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime())
                                        .filter(b => {
                                          if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                          if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                          if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                          if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                          return true;
                                        })
                                        .filter(b => {
                                          if (!activeSearch) return true;
                                          const s = activeSearch.toLowerCase();
                                          return (
                                            (b.first_name || '').toLowerCase().includes(s) ||
                                            (b.last_name || '').toLowerCase().includes(s) ||
                                            (b.email || '').toLowerCase().includes(s) ||
                                            (b.unified_item || '').toLowerCase().includes(s) ||
                                            (b.status || '').toLowerCase().includes(s) ||
                                            (b.qr_code || '').toLowerCase().includes(s)
                                          );
                                        })
                                        .map(booking => {
                                          const paid = Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0);
                                          const total = Number(booking.total_price || 0);
                                          const remainingBalance = total - paid;

                                          return (
                                            <tr 
                                              key={`${booking.unified_type}-${booking.id}`} 
                                              className="hover:bg-[#FDF8F3]/50 transition-colors cursor-pointer"
                                              onClick={() => {
                                                setShowReceipt(booking as any);
                                              }}
                                            >
                                              <td className="pl-5 lg:pl-8 pr-2 py-3.5">
                                                <div className="flex items-center min-w-0">
                                                  <div className="w-7.5 h-7.5 lg:w-8 lg:h-8 bg-coffee-50 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[#A3402A] mr-2 lg:mr-3 text-[10px] border border-[#A3402A]/10 shadow-sm">
                                                    {booking.first_name?.[0] || ''}{booking.last_name?.[0] || ''}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-[#5C3321] text-xs truncate">{booking.first_name || ''} {booking.last_name || ''}</p>
                                                    <p className="text-[10px] text-[#5C3321]/50 truncate">{booking.email}</p>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="px-1.5 lg:px-2 py-3.5">
                                                <p className="text-[11px] lg:text-xs font-bold text-[#5C3321] truncate">{booking.unified_item}</p>
                                                <p className="text-[9px] lg:text-[10px] text-[#A3402A]/70 font-bold uppercase tracking-wider mt-0.5">{booking.unified_type}</p>
                                              </td>
                                              <td className="px-1.5 lg:px-2 py-3.5">
                                                <div className="flex items-center text-[11px] lg:text-xs text-[#5C3321]/70 font-medium whitespace-nowrap">
                                                  {booking.unified_type === 'Accommodation' ? (
                                                    <>
                                                      <Calendar className="h-3 w-3 mr-1 text-[#A3402A]/50 flex-shrink-0" />
                                                      <span className="truncate">{format(new Date((booking as any).check_in), 'MMM dd')} - {format(new Date((booking as any).check_out), 'MMM dd')}</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Clock className="h-3 w-3 mr-1 text-[#A3402A]/50 flex-shrink-0" />
                                                      <span className="truncate">{format(new Date((booking as any).reservation_date), 'MMM dd')} @ {(booking as any).reservation_time}</span>
                                                    </>
                                                  )}
                                                </div>
                                              </td>
                                              <td className="px-1.5 lg:px-2 py-3.5">
                                                <p className="font-bold text-[#5C3321] text-xs whitespace-nowrap">₱{(booking.total_price || 0).toLocaleString()}</p>
                                              </td>
                                              <td className="pr-5 lg:pr-8 pl-2 py-3.5">
                                                <span className={`px-1.5 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-wider inline-block whitespace-nowrap shadow-sm border ${
                                                  (booking.status as string) === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                  (booking.status as string) === 'cancelled' || (booking.status as string) === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                                                  (booking.status as string) === 'checked-in' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                  (booking.status as string) === 'Completed' || (booking.status as string) === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                  (booking.status as string) === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                  'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                  {(booking.status || 'pending').replace('_', ' ')}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )
                              ) : reservationsTab === 'accommodation' ? (
                                bookings
                                  .filter(b => {
                                    if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                    if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                    if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                    if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                    return true;
                                  })
                                  .filter(b => {
                                    if (!activeSearch) return true;
                                    const s = activeSearch.toLowerCase();
                                    return (
                                      (b.first_name || '').toLowerCase().includes(s) ||
                                      (b.last_name || '').toLowerCase().includes(s) ||
                                      (b.email || '').toLowerCase().includes(s) ||
                                      (b.room_name || '').toLowerCase().includes(s) ||
                                      (b.status || '').toLowerCase().includes(s) ||
                                      (b.qr_code || '').toLowerCase().includes(s)
                                    );
                                  }).length === 0 ? (
                                      <tr>
                                              <td colSpan={5} className="px-8 py-16">
                                                <div className="flex flex-col items-center justify-center bg-[#FDF8F3]/50 rounded-2xl py-12 border border-dashed border-[#A3402A]/20">
                                                  <Calendar className="h-12 w-12 text-[#A3402A] mb-4 opacity-30" />
                                                  <p className="text-[#A3402A] font-bold text-lg">No reservation records found.</p>
                                                  <p className="text-[#5C3321]/60 text-sm mt-1">There are no {reservationFilter.toLowerCase()} accommodation reservations.</p>
                                                </div>
                                              </td>
                                      </tr>
                                  ) : (
                                    bookings
                                      .filter(b => {
                                        if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                        if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                        if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                        if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                        return true;
                                      })
                                      .filter(b => {
                                        if (!activeSearch) return true;
                                        const s = activeSearch.toLowerCase();
                                        return (
                                          (b.first_name || '').toLowerCase().includes(s) ||
                                          (b.last_name || '').toLowerCase().includes(s) ||
                                          (b.email || '').toLowerCase().includes(s) ||
                                          (b.room_name || '').toLowerCase().includes(s) ||
                                          (b.status || '').toLowerCase().includes(s) ||
                                          (b.qr_code || '').toLowerCase().includes(s)
                                        );
                                      })
                                      .map(booking => {
                                        const paid = Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0);
                                        const total = Number(booking.total_price || 0);
                                        const remainingBalance = total - paid;
                                        return (
                                          <tr 
                                            key={booking.id} 
                                            className="hover:bg-[#FDF8F3]/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                              setShowReceipt(booking);
                                            }}
                                          >
                                            <td className="pl-5 lg:pl-8 pr-2 py-3.5">
                                              <div className="flex items-center min-w-0">
                                                <div className="w-7.5 h-7.5 lg:w-8 lg:h-8 bg-coffee-50 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[#A3402A] mr-2 lg:mr-3 text-[10px] border border-[#A3402A]/10 shadow-sm">
                                                  {booking.first_name?.[0]}{booking.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-bold text-[#5C3321] text-[11px] lg:text-xs truncate">{booking.first_name} {booking.last_name}</p>
                                                  <p className="text-[9px] lg:text-[10px] text-[#5C3321]/50 truncate">{booking.email}</p>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-1.5 lg:px-2 py-3.5">
                                              <p className="text-[11px] lg:text-xs font-bold text-[#5C3321] truncate">{booking.room_name}</p>
                                            </td>
                                            <td className="px-1.5 lg:px-2 py-3.5">
                                              <div className="flex items-center text-[11px] lg:text-xs text-[#5C3321]/70 font-medium whitespace-nowrap">
                                                <Calendar className="h-3 w-3 mr-1 text-[#A3402A]/50 flex-shrink-0" />
                                                <span className="truncate">{format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}</span>
                                              </div>
                                            </td>
                                            <td className="px-1.5 lg:px-2 py-3.5">
                                              <p className="font-bold text-[#5C3321] text-xs whitespace-nowrap">₱{(booking.total_price || 0).toLocaleString()}</p>
                                              <p className={`text-[9px] font-bold ${booking.payment_status === 'Fully Paid' ? 'text-emerald-600' : 'text-[#A3402A]'}`}>
                                                {booking.payment_status || 'Pending'}
                                              </p>
                                            </td>
                                             <td className="pr-5 lg:pr-8 pl-2 py-3.5">
                                               <span className={`px-1.5 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-wider inline-block whitespace-nowrap shadow-sm border ${
                                                 (booking.status as string) === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                 (booking.status as string) === 'cancelled' || (booking.status as string) === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                                                 (booking.status as string) === 'checked-in' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                 (booking.status as string) === 'Completed' || (booking.status as string) === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                 (booking.status as string) === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                 'bg-gray-50 text-gray-700 border-gray-100'
                                               }`}>
                                                 {(booking.status || 'pending').replace('_', ' ')}
                                               </span>
                                             </td>
                                             <td className="pr-5 lg:pr-8 pl-2 py-3.5">
                                               {booking.status === 'confirmed' && (Number(booking.total_price || 0) - (Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0))) < 0.1 && (
                                                 <button
                                                   className="px-2 py-1 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700"
                                                   onClick={async (e) => {
                                                     e.stopPropagation();
                                                     const paid = (Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0));
                                                     const total = Number(booking.total_price || 0);
                                                     const bal = total - paid;
                                                     const msg = bal > 0.1 
                                                       ? `This booking has a remaining balance of ₱${bal.toLocaleString()}. Are you sure you want to check in?`
                                                       : 'Are you sure you want to check in this reservation?';
                                                     if (window.confirm(msg)) {
                                                       await handleUpdateStatus(booking.id, 'checked-in');
                                                     }
                                                   }}
                                                 >
                                                   Check In
                                                 </button>
                                               )}
                                               {booking.status === 'confirmed' && (Number(booking.total_price || 0) - (Number(booking.amount_paid || 0) + Number(booking.balance_amount_paid || 0))) > 0.1 && (
                                                 <button
                                                   className="px-2 py-1 bg-gray-500 text-white text-[10px] rounded hover:bg-gray-600 ml-1"
                                                   onClick={async (e) => {
                                                     e.stopPropagation();
                                                     if (window.confirm('Are you sure you want to mark this reservation as No-Show?')) {
                                                       await handleUpdateStatus(booking.id, 'no-show');
                                                     }
                                                   }}
                                                 >
                                                   No-Show
                                                 </button>
                                               )}
                                               {booking.status === 'checked-in' && (
                                                 <button
                                                   className="px-2 py-1 bg-purple-600 text-white text-[10px] rounded hover:bg-purple-700"
                                                   onClick={async (e) => {
                                                     e.stopPropagation();
                                                     if (window.confirm(getCheckoutConfirmMessage(booking))) {
                                                       await handleUpdateStatus(booking.id, 'Completed');
                                                     }
                                                   }}
                                                 >
                                                   Check Out
                                                 </button>
                                               )}
                                             </td>
                                          </tr>
                                        );
                                      })
                                    )
                                  ) : (
                                    amenityBookings
                                      .filter(b => {
                                        if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                        if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                        if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                        if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                        return true;
                                      })
                                      .filter(b => {
                                        if (!activeSearch) return true;
                                        const s = activeSearch.toLowerCase();
                                        return (
                                          (b.first_name || '').toLowerCase().includes(s) ||
                                          (b.last_name || '').toLowerCase().includes(s) ||
                                          (b.email || '').toLowerCase().includes(s) ||
                                          (b.amenity_name || '').toLowerCase().includes(s) ||
                                          (b.status || '').toLowerCase().includes(s) ||
                                          (b.qr_code || '').toLowerCase().includes(s)
                                        );
                                      }).length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="px-8 py-16">
                                            <div className="flex flex-col items-center justify-center bg-[#FDF8F3]/50 rounded-2xl py-12 border border-dashed border-[#A3402A]/20">
                                              <Calendar className="h-12 w-12 text-[#A3402A] mb-4 opacity-30" />
                                              <p className="text-[#A3402A] font-bold text-lg">No reservation records found.</p>
                                              <p className="text-[#5C3321]/60 text-sm mt-1">There are no {reservationFilter.toLowerCase()} amenity reservations.</p>
                                            </div>
                                          </td>
                                        </tr>
                                      ) : (
                                        amenityBookings
                                          .filter(b => {
                                            if (reservationFilter === 'Archived') return b.is_archived === 1 || b.status === 'cancelled';
                                            if (b.is_archived === 1 || b.status === 'cancelled') return false;
                                            if (reservationFilter === 'Completed') return b.status === 'Completed' || b.status === 'no-show';
                                            if (reservationFilter === 'Upcoming') return b.status !== 'Completed' && b.status !== 'no-show';
                                            return true;
                                          })
                                          .filter(b => {
                                            if (!activeSearch) return true;
                                            const s = activeSearch.toLowerCase();
                                            return (
                                              (b.first_name || '').toLowerCase().includes(s) ||
                                              (b.last_name || '').toLowerCase().includes(s) ||
                                              (b.email || '').toLowerCase().includes(s) ||
                                              (b.amenity_name || '').toLowerCase().includes(s) ||
                                              (b.status || '').toLowerCase().includes(s) ||
                                              (b.qr_code || '').toLowerCase().includes(s)
                                            );
                                          })
                                          .map(booking => (
                                        <tr 
                                          key={booking.id} 
                                          className="hover:bg-[#FDF8F3]/50 transition-colors cursor-pointer"
                                          onClick={() => setShowReceipt(booking as any)}
                                        >
                                          <td className="pl-5 lg:pl-8 pr-2 py-3.5">
                                            <div className="flex items-center min-w-0">
                                              <div className="w-7.5 h-7.5 lg:w-8 lg:h-8 bg-coffee-50 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[#A3402A] mr-2 lg:mr-3 text-[10px] border border-[#A3402A]/10 shadow-sm">
                                                {booking.first_name?.[0]}{booking.last_name?.[0]}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-[#5C3321] text-[11px] lg:text-xs truncate">{booking.first_name} {booking.last_name}</p>
                                                <p className="text-[9px] lg:text-[10px] text-[#5C3321]/50 truncate">{booking.email}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-1.5 lg:px-2 py-3.5">
                                            <p className="text-[11px] lg:text-xs font-bold text-[#5C3321] truncate">{booking.amenity_name}</p>
                                          </td>
                                          <td className="px-1.5 lg:px-2 py-3.5">
                                            <div className="flex items-center text-[11px] lg:text-xs text-[#5C3321]/70 font-medium whitespace-nowrap">
                                              <Clock className="h-3 w-3 mr-1 text-[#A3402A]/50 flex-shrink-0" />
                                              <span className="truncate">{format(new Date(booking.reservation_date || new Date()), 'MMM dd')} @ {booking.reservation_time}</span>
                                            </div>
                                          </td>
                                          <td className="px-1.5 lg:px-2 py-3.5">
                                            <p className="font-bold text-[#5C3321] text-xs whitespace-nowrap">₱{(booking.total_price || 0).toLocaleString()}</p>
                                          </td>
                                              <td className="pr-5 lg:pr-8 pl-2 py-3.5">
                                                <span className={`px-1.5 py-0.5 lg:px-2.5 lg:py-1 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-wider inline-block whitespace-nowrap shadow-sm border ${
                                                  (booking.status as string) === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                  (booking.status as string) === 'cancelled' || (booking.status as string) === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 
                                                  (booking.status as string) === 'checked-in' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                  (booking.status as string) === 'Completed' || (booking.status as string) === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                  (booking.status as string) === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                  'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                  {(booking.status || 'pending').replace('_', ' ')}
                                                </span>
                                              </td>
                                        </tr>
                                      ))
                                    )
                                  )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                  </div>
                </motion.div>
              )}

              {adminActiveTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full min-h-full flex flex-col gap-y-8"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-4xl font-serif font-bold text-[#5C3321]">Payment Transactions</h3>
                      <p className="text-[#A3402A] text-sm font-bold">View and manage all resort payments</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <input 
                        type="date"
                        value={paymentDateFilter}
                        onChange={(e) => setPaymentDateFilter(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 w-full sm:w-auto bg-[#FDF8F3] text-coffee-800 font-medium"
                      />
                      <button 
                        onClick={exportPaymentsToCSV}
                        className="w-full sm:w-auto bg-[#5C3321] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#4A291A] transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Download className="h-5 w-5" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#A3402A] overflow-hidden flex-grow flex flex-col">
                    <div className="flex-grow overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="text-[#A3402A] text-[10px] uppercase tracking-widest bg-[#FDF8F3] border-b border-coffee-100">
                          <tr>
                            <th className="px-8 py-6 font-bold">TRANSACTION ID</th>
                            <th className="px-8 py-6 font-bold">GUEST</th>
                            <th className="px-8 py-6 font-bold">ROOM</th>
                            <th className="px-8 py-6 font-bold">AMOUNT</th>
                            <th className="px-8 py-6 font-bold">METHOD</th>
                            <th className="px-8 py-6 font-bold">DATE</th>
                            <th className="px-8 py-6 font-bold text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-coffee-50">
                          {payments
                            .filter(payment => !paymentDateFilter || payment.created_at.startsWith(paymentDateFilter))
                            .map(payment => (
                            <tr key={payment.id} className="hover:bg-coffee-50/50 transition-colors">
                              <td className="px-8 py-6 font-mono text-xs text-coffee-600">{payment.transaction_id}</td>
                              <td className="px-8 py-6">
                                <div className="font-bold text-coffee-900">{payment.first_name} {payment.last_name}</div>
                                <div className="text-[10px] text-coffee-400 uppercase tracking-wider">{payment.email}</div>
                              </td>
                              <td className="px-8 py-6 text-sm text-coffee-700">{payment.room_name}</td>
                              <td className="px-8 py-6 font-bold text-coffee-900">₱{(payment.amount || 0).toLocaleString()}</td>
                              <td className="px-8 py-6 text-xs text-coffee-600">{payment.transaction_id === 'MANUAL_SETTLEMENT' ? 'Cash' : payment.method}</td>
                              <td className="px-8 py-6 text-xs text-coffee-500">{format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}</td>
                              <td className="px-8 py-6 text-right">
                                <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-100 text-emerald-700">
                                  {payment.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {payments.filter(payment => !paymentDateFilter || payment.created_at.startsWith(paymentDateFilter)).length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-8 py-32 text-center text-[#5C3321]/40 text-sm font-medium">No payment transactions found {paymentDateFilter && `for ${paymentDateFilter}`}.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

              {adminActiveTab === 'rooms' && (
                <motion.div
                  key="rooms"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full min-h-full flex flex-col gap-y-8"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-coffee-900">Room Management</h3>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search rooms..." 
                            className="pl-10 pr-4 py-3 rounded-2xl border border-[#A3402A] focus:outline-none focus:ring-2 focus:ring-coffee-500"
                            onChange={(e) => setRoomSearch(e.target.value)}
                          />
                          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                        </div>
                        <button 
                          onClick={() => setEditingRoom({ name: '', type: 'Salakot', description: '', price: 0, capacity: 2, beds: '1 Queen Bed', image_url: '', status: 'available' })}
                          className="bg-coffee-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg hover:bg-coffee-800 transition-all whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add New Room
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-coffee-400 uppercase tracking-wider">Show Archived</span>
                        <button 
                          onClick={() => setShowArchivedRooms(!showArchivedRooms)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showArchivedRooms ? 'bg-coffee-900' : 'bg-coffee-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchivedRooms ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    {(() => {
                      const filtered = rooms.filter(r => {
                        const matchesSearch = (r.name || '').toLowerCase().includes((roomSearch || '').toLowerCase());
                        const isArchived = (r.status || '').toLowerCase() === 'inactive';
                        return matchesSearch && (showArchivedRooms ? isArchived : !isArchived);
                      });
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-full py-12 flex flex-col items-center justify-center text-coffee-400 bg-coffee-50/30 rounded-3xl border border-dashed border-coffee-200">
                            <Archive className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">
                              {showArchivedRooms ? 'No archived records found.' : 'No active rooms found.'}
                            </p>
                          </div>
                        );
                      }
                      
                      return filtered.map(room => (
                        <div key={room.id} className="bg-white rounded-3xl shadow-sm border border-[#A3402A] overflow-hidden flex group hover:shadow-md transition-all h-fit">
                          <div className="w-32 h-full relative">
                            <img src={room.image_url} className="w-full h-full object-cover" alt={room.name} referrerPolicy="no-referrer" />
                            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${getRoomStatusBadgeClass(room.status)}`}>
                              {getRoomStatusLabel(room.status)}
                            </div>
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-coffee-900 break-words line-clamp-1 text-sm">{room.name}</h4>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingRoom(room)} className="p-2 text-coffee-400 hover:text-coffee-900 hover:bg-coffee-50 rounded-xl transition-all">
                                  <Edit className="h-4 w-4" />
                                </button>
                                {showArchivedRooms ? (
                                  <button onClick={() => handleRestoreRoom(room)} className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all" title="Restore Room">
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleArchiveRoom(room)} className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all" title="Archive Room">
                                    <Archive className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-coffee-500 line-clamp-2 mb-4">{room.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-coffee-900">₱{(room.price || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-coffee-400 uppercase tracking-widest font-bold">{room.type}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

              {adminActiveTab === 'amenities' && (
                <motion.div
                  key="amenities-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full min-h-full flex flex-col gap-y-8"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-coffee-900">Amenity Management</h3>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search amenities..." 
                            className="pl-10 pr-4 py-3 rounded-2xl border border-[#A3402A] focus:outline-none focus:ring-2 focus:ring-coffee-500"
                            onChange={(e) => setAmenitySearch(e.target.value)}
                          />
                          <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
                        </div>
                        <button 
                          onClick={() => setEditingAmenity({ name: '', description: '', icon: 'Star', status: 'active', images: [], price: undefined })}
                          className="bg-coffee-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-lg hover:bg-coffee-800 transition-all whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add New Amenity
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-coffee-400 uppercase tracking-wider">Show Archived</span>
                        <button 
                          onClick={() => setShowArchivedAmenities(!showArchivedAmenities)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showArchivedAmenities ? 'bg-coffee-900' : 'bg-coffee-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showArchivedAmenities ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    {(() => {
                      const filtered = amenities.filter(a => {
                        const matchesSearch = (a.name || '').toLowerCase().includes((amenitySearch || '').toLowerCase());
                        const isArchived = (a.status || '').toLowerCase() === 'inactive';
                        return matchesSearch && (showArchivedAmenities ? isArchived : !isArchived);
                      });
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-full py-12 flex flex-col items-center justify-center text-coffee-400 bg-coffee-50/30 rounded-3xl border border-dashed border-coffee-200">
                            <Archive className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">
                              {showArchivedAmenities ? 'No archived records found.' : 'No active amenities found.'}
                            </p>
                          </div>
                        );
                      }
                      
                      return filtered.map(amenity => (
                        <div key={amenity.id} className="bg-white rounded-3xl shadow-sm border border-[#A3402A] overflow-hidden flex group hover:shadow-md transition-all h-fit">
                          <div className="w-32 h-full bg-coffee-50 flex items-center justify-center overflow-hidden">
                            {amenity.images && amenity.images.length > 0 ? (
                              <ImageSlider images={amenity.images} className="w-full h-full" alt={amenity.name} compact />
                            ) : amenity.image_url ? (
                              <img src={amenity.image_url} className="w-full h-full object-cover" alt={amenity.name} referrerPolicy="no-referrer" />
                            ) : (
                              <AmenityIcon name={amenity.icon} className="h-8 w-8 text-coffee-300" />
                            )}
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-coffee-900 break-words line-clamp-1 text-sm">{amenity.name}</h4>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingAmenity(amenity)} className="p-2 text-coffee-400 hover:text-coffee-900 hover:bg-coffee-50 rounded-xl transition-all">
                                  <Edit className="h-4 w-4" />
                                </button>
                                {showArchivedAmenities ? (
                                  <button onClick={() => handleRestoreAmenity(amenity)} className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all" title="Restore Amenity">
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleArchiveAmenity(amenity)} className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all" title="Archive Amenity">
                                    <Archive className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-coffee-500 line-clamp-2">{amenity.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                ₱{(amenity.price || 0).toLocaleString()}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                amenity.stock === null || amenity.stock === undefined ? 'bg-coffee-100 text-coffee-600' :
                                amenity.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {amenity.stock === null || amenity.stock === undefined ? 'Unlimited Stock' : `${amenity.stock} in stock`}
                              </span>
                              {amenity.images && amenity.images.length > 0 && (
                                <span className="text-[10px] bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full font-bold">
                                  {amenity.images.length} Images
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Dashboard Footer */}
                  <div className="mt-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-coffee-400 text-xs font-bold uppercase tracking-widest">
                     <p>© 2026 DA BALI RESORT MANAGEMENT SYSTEM</p>
                     <div className="flex gap-8 mt-4 sm:mt-0">
                        <button className="hover:text-coffee-900 transition-colors">Privacy Policy</button>
                        <button className="hover:text-coffee-900 transition-colors">Terms of Service</button>
                     </div>
                  </div>
                </motion.div>
              )}

              {adminActiveTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col pb-8 pt-4 lg:pt-0"
                >
                  <div className="flex justify-between items-end mb-6 shrink-0">
                    <div>
                      <h3 className="text-3xl lg:text-4xl font-serif font-bold text-[#5C3321] leading-tight flex items-center">
                        <MessageSquare className="h-8 w-8 lg:h-10 lg:w-10 mr-3 lg:mr-4 stroke-[1.5]" />
                        Support Chat
                      </h3>
                      <p className="text-coffee-600 mt-2 font-medium">Manage guest messages and inquiries.</p>
                    </div>
                  </div>
                  <div className="flex flex-1 min-h-[500px] bg-white rounded-3xl shadow-xl border border-coffee-100 overflow-hidden">
                    {/* Sidebar for conversations */}
                    <div className="w-[30%] border-r border-coffee-100 flex flex-col shrink-0">
                      <div className="p-4 border-b border-coffee-100 bg-coffee-50/50">
                        <h4 className="font-bold text-coffee-900">Conversations</h4>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {adminInbox.map(conv => (
                          <button 
                            key={conv.user_id}
                            onClick={() => setAdminSelectedChatId(conv.user_id)}
                            className={`w-full text-left p-4 border-b border-coffee-100 hover:bg-coffee-50 transition-colors flex items-center justify-between ${adminSelectedChatId === conv.user_id ? 'bg-coffee-50 border-l-4 border-l-coffee-900' : ''}`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-coffee-900 text-sm truncate">{conv.first_name} {conv.last_name}</p>
                              <p className="text-[10px] text-coffee-500 truncate">{conv.last_message}</p>
                            </div>
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </button>
                        ))}
                        {adminInbox.length === 0 && (
                          <div className="p-8 text-center text-coffee-400 text-sm italic">No conversations.</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-[#FFFBF7]">
                      {adminSelectedChatId ? (
                        <>
                          <div className="p-4 border-b border-coffee-100 bg-white">
                            <h4 className="font-bold text-coffee-900 text-lg">
                              {adminInbox.find(c => c.user_id === adminSelectedChatId)?.first_name} {adminInbox.find(c => c.user_id === adminSelectedChatId)?.last_name}
                            </h4>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={adminScrollRef}>
                            {(() => {
                              const msgs = adminMessagesMap[adminSelectedChatId] || [];
                              const allMsgs = [
                                { id: 'welcome', sender_id: user?.id, content: 'Welcome to Da Bali Resort! How can we help you today?' },
                                ...msgs
                              ];
                              return allMsgs.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.sender_id !== adminSelectedChatId ? 'justify-start flex-row-reverse' : 'justify-start'} group relative items-center gap-2`}>
                                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender_id !== adminSelectedChatId ? 'bg-coffee-800 text-white rounded-tr-none' : 'bg-white text-coffee-900 border border-coffee-100 rounded-tl-none shadow-sm'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-center gap-1">
                                        {msg.sender_id !== adminSelectedChatId && msg.id !== 'welcome' && (
                                          <button 
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(`/api/messages/${msg.id}`, { 
                                                  method: 'DELETE',
                                                  headers: {
                                                    'x-user-id': user?.id?.toString() || '',
                                                    'x-user-role': user?.role || ''
                                                  }
                                                });
                                                if (res.ok) {
                                                  setAdminMessagesMap((prev: any) => ({
                                                    ...prev,
                                                    [adminSelectedChatId]: prev[adminSelectedChatId].filter((m: any) => m.id !== msg.id)
                                                  }));
                                                } else {
                                                  const err = await res.json();
                                                  alert(err.error || 'Failed to delete message');
                                                }
                                              } catch (e) {
                                                console.error(e);
                                              }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-100 transition-opacity"
                                            title="Delete message"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {msg.content}
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    {msg.sender_id === adminSelectedChatId && msg.id !== 'welcome' && (
                                      <button 
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/messages/${msg.id}/heart`, {
                                              method: 'PATCH',
                                              headers: {
                                                'x-user-id': user?.id?.toString() || '',
                                                'x-user-role': user?.role || ''
                                              }
                                            });
                                            if (res.ok) {
                                              const data = await res.json();
                                              setAdminMessagesMap((prev: any) => ({
                                                ...prev,
                                                [adminSelectedChatId]: prev[adminSelectedChatId].map((m: any) => m.id === msg.id ? { ...m, has_heart: data.has_heart } : m)
                                              }));
                                            }
                                          } catch (e) {}
                                        }}
                                        className={`p-1 transition-opacity ${msg.has_heart ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        title="React with heart"
                                      >
                                        <svg className={`h-4 w-4 ${msg.has_heart ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                      </button>
                                    )}
                                    {msg.sender_id !== adminSelectedChatId && msg.has_heart ? (
                                      <div className="p-1">
                                        <svg className="h-4 w-4 fill-red-500 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!adminReplyMessage.trim()) return;
                              try {
                                const res = await fetch('/api/messages', {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-id': user?.id?.toString() || '',
                                    'x-user-role': user?.role || ''
                                  },
                                  body: JSON.stringify({ sender_id: user?.id, receiver_id: adminSelectedChatId, content: adminReplyMessage })
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setAdminMessagesMap({
                                    ...adminMessagesMap,
                                    [adminSelectedChatId]: [...(adminMessagesMap[adminSelectedChatId] || []), data.message]
                                  });
                                  setAdminReplyMessage('');
                                  fetchAdminInbox();
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }} 
                            className="p-4 bg-white border-t border-coffee-100 flex gap-2 shrink-0"
                          >
                            <input 
                              value={adminReplyMessage}
                              onChange={e => setAdminReplyMessage(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1 bg-coffee-50 p-3 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none w-full min-w-0 text-sm"
                            />
                            <button disabled={!adminReplyMessage.trim()} type="submit" className="bg-coffee-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-coffee-900 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex flex-1 items-center justify-center flex-col text-coffee-300">
                          <MessageSquare className="w-16 h-16 mb-4 opacity-50 stroke-[1]" />
                          <p className="font-medium">Select a conversation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {showExportModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#FDF8F3] rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-[#A3402A]/20">
                <div className="bg-[#5C3321] p-6 lg:p-8 flex justify-between items-center text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-serif font-bold mb-1">Export Report</h3>
                    <p className="text-white/70 text-sm">Download sales and reservations data</p>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 lg:p-8">
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-coffee-800 uppercase tracking-widest mb-3">Report Scope</label>
                    <div className="flex bg-[#A3402A]/10 p-1 rounded-xl mb-4">
                      <button
                        onClick={() => setExportReportType('overall')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${exportReportType === 'overall' ? 'bg-white text-[#A3402A] shadow-sm' : 'text-[#A3402A]/60 hover:text-[#A3402A]'}`}
                      >
                        Overall History
                      </button>
                      <button
                        onClick={() => setExportReportType('monthly')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${exportReportType === 'monthly' ? 'bg-white text-[#A3402A] shadow-sm' : 'text-[#A3402A]/60 hover:text-[#A3402A]'}`}
                      >
                        Monthly Breakdown
                      </button>
                    </div>
                  </div>

                  {exportReportType === 'monthly' && (
                    <div className="mb-8">
                      <label className="block text-xs font-bold text-coffee-800 uppercase tracking-widest mb-2">Select Month</label>
                      <input 
                        type="month" 
                        value={selectedMonthForReport}
                        onChange={(e) => setSelectedMonthForReport(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#A3402A]/20 focus:border-[#A3402A] focus:ring-2 focus:ring-[#A3402A]/20 outline-none text-coffee-900 bg-white"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowExportModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-coffee-200 text-coffee-700 font-bold hover:bg-coffee-50 hover:border-coffee-300 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (exportReportType === 'overall') {
                          exportBookingsToCSV();
                          setShowExportModal(false);
                        } else {
                          exportMonthlyReportToCSV();
                          setShowExportModal(false);
                        }
                      }}
                      disabled={exportReportType === 'monthly' && !selectedMonthForReport}
                      className="flex-1 py-3 px-4 bg-[#A3402A] text-white rounded-xl font-bold hover:bg-[#8F3523] shadow-md shadow-[#A3402A]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex justify-center items-center gap-2"
                    >
                      <Download size={16} /> Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showWalkInModal && (
            <WalkInModal 
              rooms={rooms} 
              bookings={bookings}
              onClose={() => setShowWalkInModal(false)} 
              onSubmit={handleWalkInSubmit} 
              setToastMessage={setToastMessage}
            />
          )}
          {editingScheduleRecord && (
            <EditStaffModal 
              record={editingScheduleRecord} 
              onClose={() => setEditingScheduleRecord(null)} 
              onSubmit={handleUpdateStaff} 
            />
          )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<ChatTab>('assistant');
  // Only counts as "read" while the guest is actually looking at the staff conversation.
  const isStaffChatVisible = user?.role === 'guest' && isChatOpen && chatTab === 'staff';
  const [chatMessages, setChatMessages] = useState<SupportChatMessage[]>([
    { sender: 'Admin', text: 'Welcome to Da Bali Resort! How can we help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [chatAutoResponsesSent, setChatAutoResponsesSent] = useState(0);
  const [guestUnreadCount, setGuestUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'guest') {
      const fetchUnread = async () => {
        try {
          const res = await fetch('/api/messages/guest/unread', {
            headers: {
              'x-user-id': user?.id?.toString() || '',
              'x-user-role': user?.role || ''
            }
          });
          if (res.ok) {
            const data = await res.json();
            setGuestUnreadCount(data.count || 0);
          }
        } catch (e) {}
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (isStaffChatVisible) {
      const markRead = async () => {
        try {
          const res = await fetch('/api/messages/guest/read', {
            method: 'PATCH',
            headers: {
              'x-user-id': user?.id?.toString() || '',
              'x-user-role': user?.role || ''
            }
          });
          if (res.ok) {
            setGuestUnreadCount(0);
          }
        } catch (e) {}
      };
      markRead();
    }
  }, [isStaffChatVisible, user, chatMessages]);

  useEffect(() => {
    if (user?.role === 'guest') {
      const fetchMsgs = async () => {
         try {
           const res = await fetch(`/api/messages/${user.id}`);
           if (res.ok) {
             const msgs = await res.json();
             const formatted = [
               { sender: 'Admin', text: 'Welcome to Da Bali Resort! How can we help you today?' },
               ...msgs.map((m: any) => ({ 
                 sender: m.sender_id === user.id ? 'You' : 'Admin', 
                 text: m.content, 
                 id: m.id,
                 has_heart: m.has_heart
               }))
             ];
             setChatMessages(prev => {
                const localOnly = prev.filter(m => m.tempId && !m.id);
                return [...formatted, ...localOnly];
             });
           }
         } catch (e) {
           console.error(e);
         }
      };
      
      fetchMsgs();
      const interval = setInterval(fetchMsgs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleToggleHeart = async (msgId: number) => {
    try {
      const res = await fetch(`/api/messages/${msgId}/heart`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, has_heart: data.has_heart } : m));
      }
    } catch (e) {}
  };

  const handleDeleteGuestMessage = async (msgId: number) => {
    try {
      const res = await fetch(`/api/messages/${msgId}`, { 
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (res.ok) {
        setChatMessages(prev => prev.filter(m => m.id !== msgId));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete message');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while deleting message');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const currentMessage = newMessage;
    const tempId = Date.now();
    // Add locally for instant feedback
    setChatMessages(prev => [...prev, { sender: 'You', text: currentMessage, tempId }]);
    setNewMessage('');
    
    if (user && user.role !== 'admin') {
      let isFirstMessage = chatAutoResponsesSent === 0;
      if (chatMessages.some(m => m.sender === 'You')) {
        isFirstMessage = false;
      }
      
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: user.id, receiver_id: 1, content: currentMessage })
        });
        if (res.ok) {
           const data = await res.json();
           setChatMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, id: data.message.id } : m));
        }
      } catch (e) {
        console.error("Failed to send msg to API", e);
      }
      
      if (isFirstMessage) {
        setChatAutoResponsesSent(1);
        const autoTempId = Date.now() + 1;
        setChatMessages(prev => [...prev, { sender: 'Admin', text: 'Thank you for your message. A representative will be with you shortly.', tempId: autoTempId }]);
        try {
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender_id: 1, receiver_id: user.id, content: 'Thank you for your message. A representative will be with you shortly.' })
          });
          if (res.ok) {
            const data = await res.json();
            setChatMessages(prev => prev.map(m => m.tempId === autoTempId ? { ...m, id: data.message.id } : m));
          }
        } catch (e) {
          console.error("Failed to send auto-reply to API", e);
        }
      }
    }
  };

  const calculateAmenityTotalPrice = () => {
    let total = 0;
    const amenityName = selectedAmenity?.name || '';
    const options = AMENITY_OPTIONS[amenityName];
    
    if (options && Object.keys(amenitySelections).length > 0) {
      Object.entries(amenitySelections).forEach(([itemName, qty]) => {
        if (qty > 0) {
          for (const cat of options) {
            const item = cat.items.find(i => i.name === itemName);
            if (item && cat.category !== 'Entrance Fee') total += item.price * qty;
          }
        }
      });
    } else {
      total = selectedAmenity?.price || 0;
    }
    return total;
  };

  const handleAmenityReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPage('login');
      setIsReservingAmenity(false);
      return;
    }
    if (user.role !== 'guest') {
      setToastMessage({ title: 'Error', message: 'Only guests can make reservations. Please log in with a guest account.', type: 'error' });
      setIsReservingAmenity(false);
      return;
    }

    try {
      if (amenityStep === 'details') {
        const formData = new FormData(e.target as HTMLFormElement);
        
        // Format selected items into details
        const selectedItemsText = Object.entries(amenitySelections)
          .filter(([_, qty]) => qty > 0)
          .map(([name, qty]) => `${qty}x ${name}`)
          .join(', ');
          
        const userDetails = formData.get('details') as string;
        const finalDetails = selectedItemsText 
          ? `Selected Items: ${selectedItemsText}${userDetails ? `\n\nAdditional Details: ${userDetails}` : ''}`
          : userDetails;

        const data = {
          date: formData.get('date'),
          time: formData.get('time'),
          pax: formData.get('pax'),
          details: finalDetails
        };
        setAmenityFormData(data);
        setAmenityStep('payment');
        return;
      }

      if (!amenityBookingProof) {
        setToastMessage({ title: 'Proof Required', message: 'Please upload your proof of payment to proceed.', type: 'error' });
        return;
      }

      const paxCount = parseInt(amenityFormData.pax);
      const totalPrice = calculateAmenityTotalPrice();
      const depositAmount = selectedAmenity?.name === 'Infinity Pool' ? totalPrice : totalPrice * 0.5;
      const balanceAmount = totalPrice - depositAmount;
      const amountPaidValue = parseFloat(amenityAmountPaid) || 0;

      // Block the reservation entirely if the reported payment doesn't meet the
      // required deposit — guests must fully settle the deposit before a booking
      // can even be created, so every pending request starts from a clean, valid state.
      if (amountPaidValue < depositAmount - 0.1) {
        setToastMessage({
          title: 'Deposit Not Met',
          message: `The required deposit for this reservation is ₱${depositAmount.toLocaleString()}. Please pay at least this amount and enter the correct amount paid before submitting.`,
          type: 'error'
        });
        return;
      }

      const reservationData = {
        user_id: user.id,
        amenity_id: selectedAmenity?.id,
        reservation_date: amenityFormData.date,
        reservation_time: amenityFormData.time,
        pax_count: paxCount,
        details: amenityFormData.details,
        // Sent for display/reference only — the server independently recomputes
        // total_price/deposit_amount/balance_amount from selections + amenity price
        // so a tampered request can never change what the guest is charged.
        total_price: totalPrice,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        selections: amenitySelections,
        proofOfPayment: amenityBookingProof,
        paymentMethod: amenityPaymentMethod,
        amountPaid: amountPaidValue,
        transactionReference: amenityTransactionReference
      };

      setIsBooking(true);
      // Check availability first for Pavilion
      if (selectedAmenity?.name === 'Pavilion') {
        const checkRes = await fetch(`/api/amenity-bookings/check-availability?amenityId=${selectedAmenity.id}&date=${amenityFormData.date}&time=${amenityFormData.time}`);
        const contentType = checkRes.headers.get('content-type');
        if (!checkRes.ok || !contentType?.includes('application/json')) {
           setToastMessage({ title: 'Error', message: 'Failed to check availability', type: 'error' });
           setIsBooking(false);
           return;
        }
        const checkData = await checkRes.json();
        if (!checkData.available) {
          setToastMessage({ title: 'Conflict', message: 'Sorry, the Pavilion is already reserved for this date and time.', type: 'error' });
          setIsBooking(false);
          return;
        }
      }

      const res = await fetch('/api/amenity-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      if (res.ok) {
        const newBooking = await res.json();
        setIsReservingAmenity(false);
        resetAmenityBookingState();
        setLastAmenityBooking(newBooking);
        setPage('amenity-confirmation');
        fetchMyAmenityBookings().catch(console.error);
      } else {
        const err = await res.json();
        setToastMessage({ title: 'Error', message: err.error || 'Failed to reserve amenity', type: 'error' });
      }
    } catch (error) {
      console.error('Error reserving amenity:', error);
      setToastMessage({ title: 'Error', message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsBooking(false);
    }
  };

  const fetchMyAmenityBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/my-amenity-bookings/${user.id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await res.json();
      setAmenityBookings(data);
    } catch (error) {
      console.error('Error fetching amenity bookings:', error);
    }
  };

  const fetchAllAmenityBookings = async () => {
    try {
      const res = await fetch('/api/amenity-bookings', { 
        credentials: 'include',
        headers: {
          'x-user-id': user?.id?.toString() || '',
          'x-user-role': user?.role || ''
        }
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Failed to fetch amenity bookings (Status: ${res.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) errorMessage += `: ${errorData.details}`;
        } catch (e) {
          if (errorText.includes('<html>')) {
            errorMessage = 'Server returned an HTML error page. This usually means the API route is missing or you were redirected. Check if you are logged in as admin.';
          }
        }
        console.error(errorMessage);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Expected JSON response but got ' + contentType);
      }
      const data = await res.json();
      setAmenityBookings(data);
    } catch (error: any) {
      console.error('Error fetching all amenity bookings:', error);
      setToastMessage({ title: 'Error', type: 'error', message: `Error fetching all amenity bookings: ${error.message}` });
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyAmenityBookings().catch(console.error);
      if (user.role === 'admin') fetchAllAmenityBookings().catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (page === 'guest-dashboard' && (user.role === 'admin' || user.role === 'staff' || user.role === 'housekeeping')) {
        setPage('admin-dashboard');
      } else if (page === 'admin-dashboard' && user.role === 'guest') {
        setPage('guest-dashboard');
      }
    } else if (page === 'admin-dashboard' || page === 'guest-dashboard') {
      setPage('login');
    }
  }, [user, page]);

  useEffect(() => {
    if (user?.role === 'staff' && adminActiveTab !== 'staff-records') {
      setAdminActiveTab('staff-records');
    } else if (user?.role === 'housekeeping' && adminActiveTab !== 'housekeeping') {
      setAdminActiveTab('housekeeping');
    }
  }, [user, adminActiveTab]);

  return (
    <div className={`min-h-screen flex flex-col justify-between ${page === 'admin-dashboard' || page === 'guest-dashboard' ? 'h-screen overflow-hidden bg-coffee-50' : ''}`}>
      {toastMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-sm px-4">
          <div className={`rounded-2xl shadow-2xl p-4 flex items-start gap-4 border-2 ${
            toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10' :
            toastMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 shadow-red-500/10' :
            'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-500/10'
          }`}>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{toastMessage.title}</h4>
              <p className="text-xs mt-1 opacity-90">{toastMessage.message}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6"
          >
            <h3 className="text-xl font-serif font-bold text-coffee-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-coffee-600 mb-6 whitespace-pre-line">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  confirmDialog.onCancel();
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await confirmDialog.onConfirm();
                  } catch (e) {
                    console.error("Confirm action failed:", e);
                  }
                  setConfirmDialog(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md text-sm"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Navbar 
        user={user} 
        page={page}
        onLogout={handleLogout} 
        onNavigate={(p) => {
          setPage(p);
          setIsFromDashboard(false);
          window.scrollTo(0, 0);
        }} 
      />
      
      <main className={`flex-grow flex flex-col ${page === 'admin-dashboard' || page === 'guest-dashboard' ? 'h-[calc(100vh-64px)] overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className={page === 'admin-dashboard' || page === 'guest-dashboard' ? 'h-full flex flex-col' : ''}
          >
            {page === 'home' && renderHome()}
            {page === 'rooms' && renderRooms()}
            {page === 'amenities' && renderAmenities()}
            {page === 'booking' && renderBooking()}
            {page === 'confirmation' && renderConfirmation()}
            {page === 'amenity-confirmation' && renderAmenityConfirmation()}
            {page === 'login' && renderAuth()}
            {page === 'guest-dashboard' && renderGuestDashboard()}
            {page === 'admin-dashboard' && renderAdminDashboard()}
          </motion.div>
        </AnimatePresence>
      </main>

      {page !== 'admin-dashboard' && page !== 'guest-dashboard' && <Footer onNavigate={(p) => {
        setPage(p);
        setIsFromDashboard(false);
      }} />}

      {selectedAmenity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            <div className="md:w-2/5 relative h-64 md:h-auto">
              <ImageSlider 
                images={selectedAmenity.images && selectedAmenity.images.length > 0 ? selectedAmenity.images : [selectedAmenity.image_url || "https://picsum.photos/seed/resort/1200/800"]} 
                className="w-full h-full"
                alt={selectedAmenity.name}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:hidden pointer-events-none" />
              <button 
                onClick={() => setSelectedAmenity(null)}
                className="absolute top-6 left-6 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all md:hidden z-20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="md:w-3/5 flex flex-col relative bg-white">
              <button 
                onClick={() => setSelectedAmenity(null)}
                className="absolute top-8 right-8 p-3 text-coffee-400 hover:text-coffee-900 hover:bg-coffee-50 rounded-full transition-all hidden md:block"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex-1 overflow-y-auto p-10 md:p-16">
                <div className="mb-10">
                  <span className="text-coffee-400 font-bold tracking-widest uppercase text-[10px] mb-2 block">World-Class Amenity</span>
                  <h3 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900">{selectedAmenity.name}</h3>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-4">Description</h4>
                    <div className="text-lg text-coffee-800 leading-relaxed font-serif markdown-body">
                      <Markdown>{selectedAmenity.description}</Markdown>
                    </div>
                    {selectedAmenity.name === 'Infinity Pool' && (
                      <div className="mt-6 p-5 bg-coffee-50 border border-coffee-200 rounded-xl">
                        <h5 className="font-bold text-coffee-900 mb-2">Entrance Fees (Payable directly at Resort)</h5>
                        <ul className="text-coffee-700 text-sm space-y-1 list-disc list-inside">
                          <li>Adult: ₱90</li>
                          <li>Child (5yrs old & below): ₱60</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(() => {
                      const details = [
                        { label: 'Location', value: selectedAmenity.location || 'Main Resort Area' },
                        { label: 'Access', value: 'Complimentary for Guests' },
                        { label: 'Staffing', value: 'Fully Attended' }
                      ];
                      
                      if (selectedAmenity.name === 'Infinity Pool') {
                        details.unshift({ label: 'Day-Use Access', value: '8:00 AM to 7:00 PM (Pool is closed overnight, but checked-in guests stay eligible until check-out.)' });
                      } else if (selectedAmenity.name === 'Pavilion') {
                        details.unshift({ label: 'Standard Duration', value: 'Pavilion use is limited to 6 hours, but pool access remains available afterward.' });
                      } else if (selectedAmenity.name === 'Colored Tent/Team Building') {
                        details.unshift({ label: 'Standard Duration', value: 'Tent use is limited to 6 hours; swimming is not included and requires a paid entrance fee.' });
                      } else if (selectedAmenity.name === 'Fine Dining') {
                        details.unshift({ label: 'Dining Service Periods', value: '8:00 AM – 7:00 PM (Last orders for checked-in guests will be taken shortly before closing time.)' });
                      } else {
                        details.unshift({ label: 'Operating Hours', value: '6:00 AM - 10:00 PM' });
                      }

                      return details.map((detail, idx) => (
                        <div key={detail.label} className="flex flex-col p-5 bg-coffee-50 rounded-2xl border border-coffee-100/50">
                          <span className="text-[10px] font-bold text-coffee-400 uppercase mb-1">{detail.label}</span>
                          <span className="text-coffee-900 font-bold">{detail.value}</span>
                        </div>
                      ));
                    })()}
                  </div>

                  {isReservingAmenity ? (
                    <div className="pt-10 border-t border-coffee-100">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-bold text-coffee-900">{amenityStep === 'details' ? 'Reservation Details' : 'Payment Details'}</h4>
                        <button onClick={() => {
                          setIsReservingAmenity(false);
                          setAmenityStep('details');
                          setAmenitySelections({});
                        }} className="text-coffee-400 hover:text-coffee-900">
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      <form onSubmit={handleAmenityReservation} className="space-y-6">
                        {amenityStep === 'details' ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Preferred Date</label>
                                <input 
                                  required name="date" type="date" 
                                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                  className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Preferred Time</label>
                                <input 
                                  required name="time" type="time" 
                                  className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Number of People</label>
                              <input 
                                required name="pax" type="number" min="1"
                                placeholder="e.g. 10"
                                className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                              />
                            </div>
                            
                            {AMENITY_OPTIONS[selectedAmenity.name] && AMENITY_OPTIONS[selectedAmenity.name].filter(c => c.category !== 'Entrance Fee').length > 0 && (
                              <div className="space-y-4">
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Select Items (Optional)</label>
                                {AMENITY_OPTIONS[selectedAmenity.name].filter(c => c.category !== 'Entrance Fee').map(category => (
                                  <div key={category.category} className="bg-coffee-50 p-4 rounded-xl border border-coffee-100">
                                    <h5 className="font-bold text-coffee-900 mb-3">{category.category}</h5>
                                    <div className="space-y-2">
                                      {category.items.map(item => (
                                        <div key={item.name} className="flex justify-between items-center bg-white p-3 rounded-lg border border-coffee-100">
                                          <div>
                                            <p className="font-bold text-coffee-900 text-sm">{item.name}</p>
                                            <p className="text-xs text-coffee-500">₱{item.price.toLocaleString()}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <button 
                                              type="button"
                                              onClick={() => setAmenitySelections(prev => ({...prev, [item.name]: Math.max(0, (prev[item.name] || 0) - 1)}))}
                                              className="w-8 h-8 rounded-full bg-coffee-100 text-coffee-900 flex items-center justify-center hover:bg-coffee-200"
                                            >-</button>
                                            <span className="w-4 text-center font-bold">{amenitySelections[item.name] || 0}</span>
                                            <button 
                                              type="button"
                                              onClick={() => setAmenitySelections(prev => ({...prev, [item.name]: (prev[item.name] || 0) + 1}))}
                                              className="w-8 h-8 rounded-full bg-coffee-900 text-white flex items-center justify-center hover:bg-coffee-800"
                                            >+</button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Additional Details / Special Requests (Optional)</label>
                              <textarea 
                                name="details" rows={3}
                                placeholder="e.g. Specific cottage preference, dietary restrictions, etc."
                                className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                              ></textarea>
                            </div>
                            <button 
                              type="submit"
                              className="w-full bg-coffee-900 text-white py-4 rounded-2xl font-bold hover:bg-coffee-800 transition-all shadow-xl active:scale-95"
                            >
                              Next: Payment Details
                            </button>
                          </>
                        ) : (
                          <div className="space-y-6">
                            {/* Quotation Summary */}
                            <div className="bg-coffee-50 p-6 rounded-2xl border border-coffee-100">
                              <h4 className="font-bold text-coffee-900 mb-4 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" /> 
                                Quotation Summary
                              </h4>
                              {selectedAmenity?.name === 'Infinity Pool' && (
                                <div className="mb-4 bg-yellow-100/50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                                  <span className="font-bold">Note:</span> Entrance fees are not included in this total and must be paid directly at the resort upon arrival.
                                </div>
                              )}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <p className="text-coffee-500">Full Quotation</p>
                                  <p className="font-bold text-coffee-900">₱{(calculateAmenityTotalPrice() || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-coffee-200">
                                  <p className="text-sm font-bold text-coffee-900">
                                    {selectedAmenity?.name === 'Infinity Pool' ? 'Full Payment Required' : '50% Deposit Required'}
                                  </p>
                                  <p className="text-xl font-bold text-[#A3402A]">₱{((selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setAmenityPaymentMethod('GCash')}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${amenityPaymentMethod === 'GCash' ? 'border-[#A3402A] bg-coffee-50 shadow-md' : 'border-coffee-100 hover:border-coffee-200'}`}
                              >
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs italic">G</div>
                                <span className="text-xs font-bold text-coffee-900">GCash</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAmenityPaymentMethod('BPI')}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${amenityPaymentMethod === 'BPI' ? 'border-[#A3402A] bg-coffee-50 shadow-md' : 'border-coffee-100 hover:border-coffee-200'}`}
                              >
                                <div className="w-10 h-10 bg-[#B11116] rounded-full flex items-center justify-center text-white font-bold text-xs">BPI</div>
                                <span className="text-xs font-bold text-coffee-900">BPI Transfer</span>
                              </button>
                            </div>

                            {/* Payment Instructions */}
                            <div className="bg-white p-6 rounded-2xl border border-coffee-200">
                              <h5 className="font-bold text-coffee-900 mb-2">Payment Instructions</h5>
                              {amenityPaymentMethod === 'GCash' ? (
                                <div className="space-y-2 text-sm text-coffee-600">
                                  <p>1. Open GCash app</p>
                                  <p>2. Send to: <span className="font-bold text-coffee-900">09123456789</span> (Da Bali Resort)</p>
                                  <p>3. Amount: <span className="font-bold text-[#A3402A]">₱{((selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0).toLocaleString()}</span></p>
                                  <p>4. Save the receipt screenshot</p>
                                </div>
                              ) : (
                                <div className="space-y-2 text-sm text-coffee-600">
                                  <p>1. Open BPI app or online banking</p>
                                  <p>2. Transfer to: <span className="font-bold text-coffee-900">1234 5678 90</span></p>
                                  <p>3. Account Name: Da Bali Resort</p>
                                  <p>4. Amount: <span className="font-bold text-[#A3402A]">₱{((selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0).toLocaleString()}</span></p>
                                  <p>5. Save the transfer confirmation</p>
                                </div>
                              )}
                            </div>

                            {/* Proof Upload */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Amount Paid</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-500 font-bold">₱</span>
                                  <input
                                    type="number"
                                    required
                                    min={(selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0}
                                    value={amenityAmountPaid}
                                    onChange={(e) => setAmenityAmountPaid(e.target.value)}
                                    placeholder={((selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0).toString()}
                                    className="w-full pl-8 p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                                  />
                                </div>
                                <p className="text-[10px] text-coffee-400 mt-1">
                                  Minimum required deposit: ₱{((selectedAmenity?.name === 'Infinity Pool' ? calculateAmenityTotalPrice() : calculateAmenityTotalPrice() * 0.5) || 0).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Transaction Reference No.</label>
                                <input 
                                  type="text" 
                                  required
                                  value={amenityTransactionReference}
                                  onChange={(e) => setAmenityTransactionReference(e.target.value)}
                                  placeholder="e.g. 1002938475"
                                  className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Upload Proof of Payment</label>
                                <div className="border-2 border-dashed border-coffee-200 rounded-2xl p-6 text-center hover:bg-coffee-50 transition-colors">
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setAmenityBookingProof(reader.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden" 
                                    id="amenity-proof-upload" 
                                  />
                                  <label htmlFor="amenity-proof-upload" className="cursor-pointer flex flex-col items-center">
                                    {amenityBookingProof ? (
                                      <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                                        <img src={amenityBookingProof} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                          <span className="text-white font-bold">Change Image</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="h-8 w-8 text-coffee-400 mb-2" />
                                        <span className="text-sm font-bold text-coffee-900">Click to upload receipt</span>
                                        <span className="text-xs text-coffee-400 mt-1">JPG, PNG up to 5MB</span>
                                      </>
                                    )}
                                  </label>
                                </div>
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="w-full bg-[#A3402A] text-white py-4 rounded-2xl font-bold hover:bg-[#8A3623] transition-all shadow-xl active:scale-95"
                            >
                              Submit Reservation
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div className="pt-10 border-t border-coffee-100 flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-coffee-900 mb-2">Ready to experience this?</h4>
                        <p className="text-coffee-500 text-sm">
                          {selectedAmenity.stock !== null && selectedAmenity.stock !== undefined && selectedAmenity.stock <= 0
                            ? 'This amenity is fully booked right now — please check back later.'
                            : 'Book your spot now.'}
                        </p>
                      </div>
                      <div className="flex gap-4 w-full sm:w-auto">
                        <button
                          disabled={selectedAmenity.stock !== null && selectedAmenity.stock !== undefined && selectedAmenity.stock <= 0}
                          onClick={() => {
                            setIsReservingAmenity(true);
                            setAmenityStep('details');
                            setAmenityFormData(null);
                            setAmenityBookingProof(null);
                            setAmenityAmountPaid('');
                            setAmenityTransactionReference('');
                          }}
                          className="flex-1 sm:flex-none px-8 py-4 bg-coffee-900 text-white rounded-2xl font-bold hover:bg-coffee-800 transition-all shadow-xl active:scale-95 whitespace-nowrap disabled:bg-coffee-200 disabled:text-coffee-400 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
                        >
                          {selectedAmenity.stock !== null && selectedAmenity.stock !== undefined && selectedAmenity.stock <= 0 ? 'Fully Booked' : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showReceipt && (
        <ReceiptModal 
          booking={showReceipt} 
          onClose={() => setShowReceipt(null)} 
          onPay={() => {
            const isAmenity = 'amenity_name' in showReceipt;
            if (isAmenity) {
              setShowAmenityProofModal(showReceipt as AmenityBooking);
            } else {
              setShowProofModal(showReceipt as Booking);
            }
            setShowReceipt(null);
          }}
          onUpdateStatus={async (id, isAmenity, status) => {
            if (isAmenity) {
              await handleUpdateAmenityStatus(id, status);
            } else {
              await handleUpdateStatus(id, status);
            }
            setShowReceipt(prev => prev ? { ...prev, status: status as any } : null);
            await fetchAdminData();
          }}
          onRefresh={fetchAdminData}
          setConfirmDialog={setConfirmDialog}
          isAdminView={user?.role === 'admin' || user?.role === 'staff'}
          currentUserId={user?.id}
          currentUserRole={user?.role}
          onVerify={async (status, notes) => {
            const isAmenity = 'amenity_name' in showReceipt;
            if (status === 'confirmed') {
              setConfirmDialog({
                title: 'Confirm Payment',
                message: 'Are you sure you want to approve this payment proof?',
                onConfirm: async () => {
                  try {
                    if (isAmenity) {
                      await handleVerifyAmenityPayment(showReceipt.id, 'confirmed');
                    } else {
                      await handleUpdateStatus(showReceipt.id, 'confirmed');
                    }
                    setShowReceipt(null);
                    setConfirmDialog(null);
                  } catch (e) {
                    console.error("Failed to approve payment proof:", e);
                  }
                },
                onCancel: () => setConfirmDialog(null)
              });
            } else {
              setConfirmDialog({
                title: 'Reject Payment',
                message: 'Are you sure you want to reject this payment proof?',
                onConfirm: async () => {
                  try {
                    if (isAmenity) {
                      await handleVerifyAmenityPayment(showReceipt.id, 'rejected', notes);
                    } else {
                      await handleUpdateStatus(showReceipt.id, 'rejected', notes);
                    }
                    setShowReceipt(null);
                    setConfirmDialog(null);
                  } catch (e) {
                    console.error("Failed to reject payment proof:", e);
                  }
                },
                onCancel: () => setConfirmDialog(null)
              });
            }
          }}
          onSettlePayment={async (id, isAmenity, paid, total, amount) => {
            await handleUpdatePaymentStatus(id, isAmenity, paid, total, amount);
            setShowReceipt(null);
          }}
          onArchive={async (id, isAmenity) => {
            if (isAmenity) {
              await archiveAmenityBooking(id);
            } else {
              await archiveBooking(id);
            }
            setShowReceipt(null);
          }}
        />
      )}

      {showAmenityDetailsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50/50">
              <h3 className="text-lg font-serif font-bold text-coffee-900">Selected Items</h3>
              <button onClick={() => setShowAmenityDetailsModal(null)} className="p-2 hover:bg-coffee-100 rounded-full transition-colors">
                <X size={20} className="text-coffee-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {showAmenityDetailsModal.split(',').map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-coffee-50 rounded-xl border border-coffee-100">
                  <div className="w-8 h-8 rounded-full bg-coffee-200 flex items-center justify-center text-coffee-600 font-bold text-xs">{i + 1}</div>
                  <span className="text-sm font-medium text-coffee-900">{item.trim()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {isRejectionModalOpen && rejectionReasonToShow && (
        <RejectionReasonModal 
          reason={rejectionReasonToShow} 
          onClose={() => {
            setIsRejectionModalOpen(false);
            setRejectionReasonToShow(null);
          }} 
        />
      )}

      {showProofModal && (
        <ProofUploadModal
          booking={showProofModal}
          onClose={() => setShowProofModal(null)}
          onUpload={handleUploadProof}
          isUploading={isUploadingProof}
          setToastMessage={setToastMessage}
          isBalance={showProofModal.payment_status === 'Partially Paid' || ((showProofModal.amount_paid || 0) > 0 && (showProofModal.amount_paid || 0) < showProofModal.total_price)}
        />
      )}

      {showAmenityProofModal && (
        <AmenityProofUploadModal
          booking={showAmenityProofModal}
          onClose={() => setShowAmenityProofModal(null)}
          onUpload={handleUploadAmenityProof}
          isUploading={isUploadingProof}
          isBalance={showAmenityProofModal.payment_status === 'Partially Paid' || ((showAmenityProofModal.amount_paid || 0) > 0 && (showAmenityProofModal.amount_paid || 0) < showAmenityProofModal.total_price)}
        />
      )}

      {showProofViewer && (
        <ProofViewerModal 
          booking={showProofViewer} 
          onClose={() => setShowProofViewer(null)} 
          onVerify={async (status, notes) => {
            if (status === 'confirmed') {
              setConfirmDialog({
                title: 'Confirm Proof',
                message: 'Are you sure you want to confirm the proof?',
                onConfirm: async () => {
                  try {
                    await handleUpdateStatus(showProofViewer.id, 'confirmed');
                    setShowProofViewer(null);
                    setConfirmDialog(null);
                  } catch (e) {
                    console.error("Failed to update booking status:", e);
                  }
                },
                onCancel: () => setConfirmDialog(null)
              });
            } else {
              try {
                await handleUpdateStatus(showProofViewer.id, status, notes);
                setShowProofViewer(null);
              } catch (e) {
                console.error("Failed to update booking status:", e);
              }
            }
          }}
        />
      )}

      {showAmenityProofViewer && (
        <AmenityProofViewerModal 
          booking={showAmenityProofViewer}
          onClose={() => setShowAmenityProofViewer(null)}
          onVerify={async (status, notes) => {
            if (status === 'confirmed') {
              setConfirmDialog({
                title: 'Confirm Proof',
                message: 'Are you sure you want to confirm the proof?',
                onConfirm: async () => {
                  try {
                    await handleVerifyAmenityPayment(showAmenityProofViewer.id, 'confirmed');
                    setShowAmenityProofViewer(null);
                    setConfirmDialog(null);
                  } catch (e) {
                    console.error("Failed to verify amenity payment:", e);
                  }
                },
                onCancel: () => setConfirmDialog(null)
              });
            } else {
              try {
                await handleVerifyAmenityPayment(showAmenityProofViewer.id, status, notes);
                setShowAmenityProofViewer(null);
              } catch (e) {
                console.error("Failed to verify amenity payment:", e);
              }
            }
          }}
        />
      )}

      {/* Guest-facing chat: FAQ assistant for visitors and guests, plus staff support for guests. */}
      {(!user || user.role === 'guest') && (
        <ResortChatWidget
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          activeTab={chatTab}
          onTabChange={setChatTab}
          staffChat={user?.role === 'guest' ? {
            messages: chatMessages,
            draft: newMessage,
            onDraftChange: setNewMessage,
            onSend: handleSendMessage,
            onDeleteMessage: handleDeleteGuestMessage,
            onHeartClick: handleToggleHeart,
            unreadCount: guestUnreadCount,
          } : undefined}
        />
      )}

      {viewingAdminNoteContent !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <div className="bg-amber-100 p-6 flex justify-between items-center border-b border-amber-200">
              <h3 className="text-xl font-serif font-bold text-amber-900">Admin Notes</h3>
              <button 
                onClick={() => setViewingAdminNoteContent(null)}
                className="text-amber-700 hover:text-amber-900 p-1.5 hover:bg-amber-200/50 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-coffee-700 whitespace-pre-wrap leading-relaxed text-sm">
                {viewingAdminNoteContent || 'No notes available.'}
              </p>
            </div>
            <div className="p-4 bg-coffee-50 border-t border-coffee-100 flex justify-end">
              <button 
                onClick={() => setViewingAdminNoteContent(null)}
                className="px-6 py-2 bg-white border border-coffee-200 text-coffee-700 rounded-xl font-bold hover:bg-coffee-100 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {editingAdminNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-coffee-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold">Admin Notes</h3>
              <button onClick={() => setEditingAdminNote(null)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAdminNote} className="p-8 space-y-6">
              <p className="text-coffee-600 text-sm">
                Add internal notes for this reservation. These notes are only visible to admins and staff.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold text-coffee-400 uppercase tracking-widest">Notes</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Enter notes here..."
                  value={editingAdminNote.notes}
                  onChange={e => setEditingAdminNote({...editingAdminNote, notes: e.target.value})}
                  className="w-full p-4 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      title: 'Remove Notes',
                      message: 'Are you sure you want to clear these notes?',
                      onConfirm: () => {
                        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSaveAdminNote(syntheticEvent, "");
                      },
                      onCancel: () => {}
                    });
                  }}
                  className="flex-1 border-2 border-red-100 text-red-500 py-4 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Remove
                </button>
                <button 
                  type="submit"
                  disabled={isAdminNoteLoading}
                  className={`flex-[2] bg-coffee-800 text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${isAdminNoteLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-coffee-700'}`}
                >
                  {isAdminNoteLoading ? (
                    <>
                      <Clock className="animate-spin h-5 w-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Notes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-[#5C3321] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold">Forgot Password</h3>
              <button onClick={() => setShowForgotPasswordModal(false)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="p-8 space-y-6">
              <p className="text-coffee-600 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              {forgotPasswordMessage && (
                <div className={`p-4 rounded-xl text-sm font-medium ${forgotPasswordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {forgotPasswordMessage.text}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-coffee-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" required
                  placeholder="your@email.com"
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                  className="w-full p-4 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-[#5C3321] outline-none"
                />
              </div>
              <button 
                type="submit"
                disabled={isForgotPasswordLoading}
                className={`w-full bg-[#5C3321] text-white py-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center ${isForgotPasswordLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4A2B1B]'}`}
              >
                {isForgotPasswordLoading ? (
                  <>
                    <Clock className="animate-spin h-5 w-5 mr-2" />
                    Sending...
                  </>
                ) : 'Send Reset Link'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleSaveRoom}>
              <div className="p-6 border-b border-coffee-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-coffee-900">{editingRoom.id ? 'Edit Room' : 'Add New Room'}</h3>
                <button type="button" onClick={() => setEditingRoom(null)} className="text-coffee-400 hover:text-coffee-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Room Name</label>
                  <input 
                    required value={editingRoom.name}
                    onChange={e => setEditingRoom({...editingRoom, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Type</label>
                  <select 
                    value={editingRoom.type ?? ''}
                    onChange={e => setEditingRoom({...editingRoom, type: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  >
                    <option>Standard</option>
                    <option>Family Suite</option>
                    <option>Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Price (₱)</label>
                  <input 
                    type="number" required value={editingRoom.price ?? ''}
                    onChange={e => setEditingRoom({...editingRoom, price: e.target.value === '' ? 0 : Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Capacity</label>
                  <input 
                    type="number" required value={editingRoom.capacity ?? ''}
                    onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value === '' ? 0 : Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Beds</label>
                  <input 
                    required value={editingRoom.beds}
                    onChange={e => setEditingRoom({...editingRoom, beds: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Image URL</label>
                  <input 
                    required value={editingRoom.image_url}
                    onChange={e => setEditingRoom({...editingRoom, image_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Gallery Images (Comma separated URLs)</label>
                  <textarea 
                    value={editingRoom.images?.join(', ') || ''} rows={2}
                    onChange={e => setEditingRoom({...editingRoom, images: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Description</label>
                  <textarea 
                    required value={editingRoom.description} rows={3}
                    onChange={e => setEditingRoom({...editingRoom, description: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-coffee-50 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingRoom(null)} className="px-6 py-2 rounded-xl font-bold text-coffee-600">Cancel</button>
                <button type="submit" className="bg-coffee-800 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingAmenity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleSaveAmenity}>
              <div className="p-6 border-b border-coffee-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-coffee-900">{editingAmenity.id ? 'Edit Amenity' : 'Add New Amenity'}</h3>
                <button type="button" onClick={() => setEditingAmenity(null)} className="text-coffee-400 hover:text-coffee-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Amenity Name</label>
                  <input 
                    required value={editingAmenity.name}
                    onChange={e => setEditingAmenity({...editingAmenity, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Icon Name (Lucide)</label>
                  <input 
                    required value={editingAmenity.icon}
                    onChange={e => setEditingAmenity({...editingAmenity, icon: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Main Image URL</label>
                  <input
                    required value={editingAmenity.image_url || ''}
                    onChange={e => setEditingAmenity({...editingAmenity, image_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Price (₱)</label>
                  <input
                    type="number" min="0" step="0.01" required value={editingAmenity.price ?? ''}
                    onChange={e => setEditingAmenity({...editingAmenity, price: e.target.value === '' ? undefined : Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                  <p className="text-[10px] text-coffee-400 mt-1">This is the amount guests are charged when reserving this amenity.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Stock (leave blank for unlimited)</label>
                  <input
                    type="number" min="0" value={editingAmenity.stock ?? ''}
                    onChange={e => setEditingAmenity({...editingAmenity, stock: e.target.value === '' ? null : Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Gallery Images (Comma separated URLs)</label>
                  <textarea 
                    value={editingAmenity.images?.join(', ') || ''} rows={2}
                    onChange={e => setEditingAmenity({...editingAmenity, images: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Description</label>
                  <textarea 
                    required value={editingAmenity.description} rows={3}
                    onChange={e => setEditingAmenity({...editingAmenity, description: e.target.value})}
                    className="w-full p-3 rounded-xl border border-coffee-200 outline-none focus:ring-2 focus:ring-coffee-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-coffee-50 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingAmenity(null)} className="px-6 py-2 rounded-xl font-bold text-coffee-600">Cancel</button>
                <button type="submit" className="bg-coffee-800 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <FeedbackFormModal
        booking={feedbackBooking}
        onClose={closeFeedbackModal}
        onSubmit={handleSubmitFeedback}
        form={feedbackForm}
        setForm={setFeedbackForm}
        isSubmitting={isSubmittingFeedback}
        error={feedbackError}
      />

      {/* Banner Management Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-coffee-100"
          >
            <div className="bg-[#5C3321] p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-serif font-bold">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
              <button onClick={() => setShowBannerModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleBannerSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Banner Title</label>
                  <input 
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]"
                    placeholder="e.g. Summer Promo 2026"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Description</label>
                  <textarea 
                    rows={3}
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A] resize-none"
                    placeholder="Briefly describe the announcement or promotion..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Banner Type (Optional)</label>
                  <select 
                    value={bannerForm.type ?? ''}
                    onChange={(e) => setBannerForm({...bannerForm, type: e.target.value as any})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]"
                  >
                    <option value="">None</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Promotion">Promotion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Order Index</label>
                  <input 
                    type="number"
                    value={bannerForm.order_index ?? ''}
                    onChange={(e) => setBannerForm({...bannerForm, order_index: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Media URL (Image or Video)</label>
                  <input 
                    required
                    type="text"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({...bannerForm, image_url: e.target.value})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]"
                    placeholder="https://... or src/video.mp4"
                  />
                  {bannerForm.image_url && (
                    <div className="mt-4 h-32 rounded-xl overflow-hidden bg-coffee-50 border border-coffee-100">
                      {isVideo(bannerForm.image_url) ? (
                        <video src={bannerForm.image_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={bannerForm.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-2 tracking-widest">Link URL (Optional)</label>
                  <input 
                    type="url"
                    value={bannerForm.link_url}
                    onChange={(e) => setBannerForm({...bannerForm, link_url: e.target.value})}
                    className="w-full p-4 bg-coffee-50 rounded-2xl border border-coffee-100 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="flex-1 py-4 bg-coffee-50 text-coffee-600 rounded-2xl hover:bg-coffee-100 transition-all font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isHeroBannersLoading}
                  className="flex-1 py-4 bg-[#A3402A] text-white rounded-2xl hover:bg-[#8B3624] transition-all font-bold shadow-xl shadow-[#A3402A]/20 disabled:opacity-50"
                >
                  {isHeroBannersLoading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Add Banner'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
