import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Percent,
  BedDouble,
  CalendarCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { User, Analytics, AnalyticsDetailed } from '../types';

interface AnalyticsDashboardProps {
  currentUser: User;
  analytics: Analytics | null;
  onRefresh: () => Promise<void>;
}

// Fixed categorical palette (validated for CVD-safe adjacent contrast) - hues are
// assigned in this order and never re-cycled per render so a slice/bar keeps its
// color across refreshes even if the underlying ranking changes.
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const SERIES_BLUE = '#2a78d6';
const SERIES_ORANGE = '#eb6834';
const GRID = '#e1e0d9';
const AXIS = '#c3c2b7';
const MUTED = '#898781';
const INK_SECONDARY = '#52514e';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#0ca30c',
  'checked-in': '#0ca30c',
  Completed: '#0ca30c',
  completed: '#0ca30c',
  pending: '#fab219',
  pending_verification: '#fab219',
  cancelled: '#d03b3b',
  rejected: '#d03b3b',
  'no-show': '#d03b3b',
};

const colorForMethod = (method: string, index: number) => CATEGORICAL[index % CATEGORICAL.length];

const peso = (n: number) => `₱${Math.round(n || 0).toLocaleString()}`;
const pct = (n: number) => `${((n || 0) * 100).toFixed(1)}%`;

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(11,11,11,0.10)',
  borderRadius: '0.75rem',
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  fontSize: '12px',
};

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-[#A3402A] shadow-lg p-6 flex flex-col">
    <div className="mb-4">
      <h3 className="text-base font-serif font-bold text-coffee-900">{title}</h3>
      {subtitle && <p className="text-xs text-coffee-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex-1 min-h-[260px]">{children}</div>
  </div>
);

const EmptyState = () => (
  <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-coffee-400">
    No data yet
  </div>
);

export const AnalyticsDashboard = ({ currentUser, analytics, onRefresh }: AnalyticsDashboardProps) => {
  const [detailed, setDetailed] = useState<AnalyticsDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const authHeaders = {
    'x-user-id': currentUser?.id?.toString() || '',
    'x-user-role': currentUser?.role || '',
  };

  const fetchDetailed = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/detailed', { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setDetailed(await res.json());
    } catch (e) {
      console.error('fetchDetailed analytics failed:', e);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([onRefresh(), fetchDetailed()]);
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([onRefresh(), fetchDetailed()]);
    setIsRefreshing(false);
  };

  const kpis = [
    {
      label: 'Total Revenue',
      value: peso(analytics?.revenue || 0),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Monthly Revenue',
      value: peso(analytics?.monthly_revenue || 0),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Occupancy Rate (This Month)',
      value: pct(analytics?.occupancy_rate || 0),
      sub: `${Math.round(analytics?.booked_room_nights || 0).toLocaleString()} / ${(analytics?.available_room_nights || 0).toLocaleString()} room-nights`,
      icon: <Percent className="h-5 w-5" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Bookings',
      value: (analytics?.bookings || 0).toLocaleString(),
      icon: <CalendarCheck className="h-5 w-5" />,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Amenity Reservations',
      value: (analytics?.amenity_bookings || 0).toLocaleString(),
      icon: <CalendarCheck className="h-5 w-5" />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Active Rooms',
      value: (analytics?.rooms || 0).toLocaleString(),
      icon: <BedDouble className="h-5 w-5" />,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center text-coffee-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading analytics...
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#A3402A] text-[#5C3321] text-sm font-bold hover:bg-coffee-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-[#A3402A] shadow-lg hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${stat.color} group-hover:scale-105 transition-transform`}>
                {stat.icon}
              </div>
              <div className="h-1 w-8 bg-coffee-50 rounded-full" />
            </div>
            <p className="text-[9px] font-bold text-coffee-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
            <h4 className="text-lg font-serif font-bold text-[#5C3321]">{stat.value}</h4>
            {stat.sub && <p className="text-[10px] text-coffee-400 mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend" subtitle="Last 6 months, fully-paid revenue">
          {detailed?.revenueTrend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={detailed.revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [peso(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke={SERIES_BLUE} strokeWidth={2} dot={{ r: 4, fill: SERIES_BLUE, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Occupancy Rate Trend" subtitle="Booked room-nights ÷ available room-nights, per month">
          {detailed?.occupancyTrend?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={detailed.occupancyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [pct(v), 'Occupancy']} />
                <Line type="monotone" dataKey="occupancy_rate" stroke={SERIES_ORANGE} strokeWidth={2} dot={{ r: 4, fill: SERIES_ORANGE, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Bookings by Room Type" subtitle="Active bookings (excludes cancelled / rejected / no-show)">
          {detailed?.roomTypeBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={detailed.roomTypeBreakdown} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="type" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Bookings']} />
                <Bar dataKey="bookings" fill={SERIES_BLUE} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Revenue by Room Type" subtitle="Total booking value, active bookings">
          {detailed?.roomTypeBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={detailed.roomTypeBreakdown} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="type" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [peso(v), 'Revenue']} />
                <Bar dataKey="revenue" fill={SERIES_ORANGE} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Amenity Performance" subtitle="Bookings and revenue per amenity">
          {detailed?.amenityBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={detailed.amenityBreakdown} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: INK_SECONDARY, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, key: string) => [key === 'revenue' ? peso(v) : v, key === 'revenue' ? 'Revenue' : 'Bookings']}
                />
                <Bar dataKey="revenue" fill={SERIES_BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>

        <ChartCard title="Payment Methods" subtitle="Share of recorded room payments">
          {detailed?.paymentMethodBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={detailed.paymentMethodBreakdown}
                  dataKey="total"
                  nameKey="method"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {detailed.paymentMethodBreakdown.map((entry, index) => (
                    <Cell key={entry.method} fill={colorForMethod(entry.method, index)} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => peso(v)} />
                <Legend wrapperStyle={{ fontSize: '11px', color: INK_SECONDARY }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </ChartCard>
      </div>

      <ChartCard title="Booking Status Breakdown" subtitle="All room bookings, current state">
        {detailed?.bookingStatusBreakdown?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={detailed.bookingStatusBreakdown} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="status" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Bookings']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {detailed.bookingStatusBreakdown.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || MUTED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </ChartCard>
    </div>
  );
};
