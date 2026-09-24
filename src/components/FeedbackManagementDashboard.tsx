import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Star, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import { User, Feedback } from '../types';

interface FeedbackManagementDashboardProps {
  currentUser: User;
}

type VisibilityFilter = 'all' | 'visible' | 'hidden';

const Stars = ({ rating, size = 'h-4 w-4' }: { rating: number, size?: string }) => (
  <div className="flex">
    {[1, 2, 3, 4, 5].map(star => (
      <Star key={star} className={`${size} ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
    ))}
  </div>
);

export const FeedbackManagementDashboard = ({ currentUser }: FeedbackManagementDashboardProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const authHeaders = {
    'x-user-id': currentUser?.id?.toString() || '',
    'x-user-role': currentUser?.role || '',
  };

  const fetchFeedbacks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/feedbacks/all', { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setFeedbacks(await res.json());
    } catch (e) {
      console.error('fetchFeedbacks failed:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const toggleVisibility = async (feedback: Feedback) => {
    setBusyId(feedback.id);
    try {
      const res = await fetch(`/api/feedbacks/${feedback.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ is_hidden: !feedback.is_hidden }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setFeedbacks(prev => prev.map(f => f.id === feedback.id ? { ...f, is_hidden: f.is_hidden ? 0 : 1 } : f));
    } catch (e) {
      console.error('toggleVisibility failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  const deleteFeedback = async (feedback: Feedback) => {
    if (!window.confirm(`Permanently delete this review by ${feedback.first_name} ${feedback.last_name}? This cannot be undone.`)) return;
    setBusyId(feedback.id);
    try {
      const res = await fetch(`/api/feedbacks/${feedback.id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setFeedbacks(prev => prev.filter(f => f.id !== feedback.id));
    } catch (e) {
      console.error('deleteFeedback failed:', e);
    } finally {
      setBusyId(null);
    }
  };

  const total = feedbacks.length;
  const averageRating = total > 0 ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total : 0;
  const hiddenCount = feedbacks.filter(f => f.is_hidden).length;
  const distribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedbacks.filter(f => f.rating === rating).length,
  }));

  const filtered = feedbacks.filter(f => {
    if (visibilityFilter === 'visible' && f.is_hidden) return false;
    if (visibilityFilter === 'hidden' && !f.is_hidden) return false;
    if (ratingFilter !== null && f.rating !== ratingFilter) return false;
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#A3402A] p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2">Average Rating</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-serif font-bold text-coffee-900">{total > 0 ? averageRating.toFixed(1) : '—'}</span>
            <div className="pb-2"><Stars rating={Math.round(averageRating)} /></div>
          </div>
          <p className="text-xs text-coffee-500 mt-2">Across all {total} {total === 1 ? 'review' : 'reviews'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#A3402A] p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-3">Rating Breakdown</p>
          <div className="space-y-1.5">
            {distribution.map(({ rating, count }) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                className={`w-full flex items-center gap-2 text-xs rounded-md px-1 ${ratingFilter === rating ? 'bg-coffee-50' : 'hover:bg-coffee-50/60'}`}
                title={`Show only ${rating}-star reviews`}
              >
                <span className="w-3 font-bold text-coffee-700">{rating}</span>
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <div className="flex-1 h-2 bg-coffee-50 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                </div>
                <span className="w-6 text-right text-coffee-500">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#A3402A] p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2">Hidden From Website</p>
          <span className="text-4xl font-serif font-bold text-coffee-900">{hiddenCount}</span>
          <p className="text-xs text-coffee-500 mt-2">Hidden reviews still count toward the stats here, but guests on the landing page won't see them.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}
            className="px-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 bg-[#FDF8F3] text-coffee-800 font-medium"
          >
            <option value="all">All Reviews</option>
            <option value="visible">Visible on Website</option>
            <option value="hidden">Hidden</option>
          </select>
          <select
            value={ratingFilter ?? ''}
            onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 bg-[#FDF8F3] text-coffee-800 font-medium"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <button
          onClick={() => fetchFeedbacks()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#A3402A] text-[#5C3321] text-sm font-bold hover:bg-coffee-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#A3402A] overflow-hidden flex-grow flex flex-col">
        <div className="flex-grow overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="text-[#A3402A] text-[10px] uppercase tracking-widest bg-[#FDF8F3] border-b border-coffee-100">
              <tr>
                <th className="px-8 py-6 font-bold">GUEST</th>
                <th className="px-8 py-6 font-bold">STAY</th>
                <th className="px-8 py-6 font-bold">RATING</th>
                <th className="px-8 py-6 font-bold">COMMENT</th>
                <th className="px-8 py-6 font-bold">SUBMITTED</th>
                <th className="px-8 py-6 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-[#5C3321]/40 text-sm font-medium">
                    <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" /> Loading reviews...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-[#5C3321]/40 text-sm font-medium">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    No reviews found.
                  </td>
                </tr>
              ) : filtered.map(feedback => (
                <tr key={feedback.id} className={`transition-colors align-top ${feedback.is_hidden ? 'bg-coffee-50/40' : 'hover:bg-coffee-50/50'}`}>
                  <td className="px-8 py-6">
                    <div className="font-bold text-coffee-900">{feedback.first_name} {feedback.last_name}</div>
                    <div className="text-[10px] text-coffee-400">{feedback.email}</div>
                  </td>
                  <td className="px-8 py-6 text-sm text-coffee-700">
                    {feedback.room_name ? (
                      <>
                        <div className="font-medium">{feedback.room_name}</div>
                        {feedback.check_in && feedback.check_out && (
                          <div className="text-[10px] text-coffee-400 whitespace-nowrap">
                            {new Date(feedback.check_in).toLocaleDateString()} – {new Date(feedback.check_out).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-coffee-400">Not linked to a stay</span>
                    )}
                  </td>
                  <td className="px-8 py-6"><Stars rating={feedback.rating} /></td>
                  <td className="px-8 py-6 text-sm text-coffee-700 max-w-md">
                    <p className="whitespace-pre-line break-words">{feedback.comment}</p>
                    {!!feedback.is_hidden && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-600 text-[10px] font-bold tracking-widest">HIDDEN</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-xs text-coffee-500 whitespace-nowrap">
                    {new Date(feedback.created_at).toLocaleString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleVisibility(feedback)}
                        disabled={busyId === feedback.id}
                        className="p-2 rounded-lg border border-coffee-200 text-coffee-600 hover:bg-coffee-50 disabled:opacity-40"
                        title={feedback.is_hidden ? 'Show on website' : 'Hide from website'}
                      >
                        {feedback.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteFeedback(feedback)}
                        disabled={busyId === feedback.id}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        title="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
