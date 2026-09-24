import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Plus, Pencil, Trash2, Bot, Search, HelpCircle, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, FaqEntry, FaqUnmatchedQuery, FaqChatResponse } from '../types';

interface FaqManagementDashboardProps {
  currentUser: User;
}

interface FaqForm {
  id?: number;
  question: string;
  answer: string;
  keywords: string;
  category: string;
  is_active: boolean;
  order_index: number;
}

const EMPTY_FORM: FaqForm = { question: '', answer: '', keywords: '', category: 'General', is_active: true, order_index: 0 };
const CATEGORY_OPTIONS = ['General', 'Booking', 'Payment', 'Rooms', 'Amenities', 'Stay'];

export const FaqManagementDashboard = ({ currentUser }: FaqManagementDashboardProps) => {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [unmatched, setUnmatched] = useState<FaqUnmatchedQuery[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [form, setForm] = useState<FaqForm | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FaqEntry | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<FaqChatResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id?.toString() || '',
    'x-user-role': currentUser?.role || '',
  };

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [faqRes, unmatchedRes] = await Promise.all([
        fetch('/api/faq/admin', { headers: authHeaders }),
        fetch('/api/faq/unmatched', { headers: authHeaders }),
      ]);
      if (!faqRes.ok || !unmatchedRes.ok) throw new Error('Failed to load FAQ data');
      setFaqs(await faqRes.json());
      setUnmatched(await unmatchedRes.json());
    } catch (e) {
      console.error('fetchData failed:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = (question = '') => {
    setFormError('');
    const nextOrder = faqs.reduce((max, f) => Math.max(max, f.order_index), 0) + 1;
    setForm({ ...EMPTY_FORM, question, order_index: nextOrder });
  };

  const openEdit = (faq: FaqEntry) => {
    setFormError('');
    setForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords,
      category: faq.category || 'General',
      is_active: !!faq.is_active,
      order_index: faq.order_index,
    });
  };

  const saveForm = async () => {
    if (!form) return;
    if (!form.question.trim() || !form.answer.trim()) {
      setFormError('Question and answer are required.');
      return;
    }
    if (!form.keywords.trim()) {
      setFormError('Add at least one key phrase so the chatbot can recognize this question.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(form.id ? `/api/faq/${form.id}` : '/api/faq', {
        method: form.id ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save FAQ');
      }
      setForm(null);
      fetchData();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const res = await fetch(`/api/faq/${pendingDelete.id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setFaqs(prev => prev.filter(f => f.id !== pendingDelete.id));
    } catch (e) {
      console.error('Delete FAQ failed:', e);
    } finally {
      setPendingDelete(null);
    }
  };

  const toggleActive = async (faq: FaqEntry) => {
    const updated = { ...faq, is_active: !faq.is_active };
    setFaqs(prev => prev.map(f => (f.id === faq.id ? { ...f, is_active: faq.is_active ? 0 : 1 } : f)));
    try {
      const res = await fetch(`/api/faq/${faq.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(updated) });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (e) {
      console.error('Toggle FAQ failed:', e);
      fetchData();
    }
  };

  const dismissUnmatched = async (id: number) => {
    setUnmatched(prev => prev.filter(q => q.id !== id));
    try {
      await fetch(`/api/faq/unmatched/${id}`, { method: 'DELETE', headers: authHeaders });
    } catch (e) {
      console.error('Dismiss unmatched query failed:', e);
    }
  };

  const runTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setIsTesting(true);
    try {
      const res = await fetch('/api/faq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testQuery, preview: true }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setTestResult(await res.json());
    } catch (err) {
      console.error('FAQ test failed:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const term = search.trim().toLowerCase();
  const filteredFaqs = term
    ? faqs.filter(f => [f.question, f.answer, f.keywords, f.category].some(v => (v || '').toLowerCase().includes(term)))
    : faqs;

  const totalHits = faqs.reduce((sum, f) => sum + (f.hit_count || 0), 0);
  const activeCount = faqs.filter(f => f.is_active).length;

  return (
    <div className="w-full flex flex-col gap-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active FAQs', value: `${activeCount} / ${faqs.length}` },
          { label: 'Questions Answered', value: totalHits.toLocaleString() },
          { label: 'Unanswered Questions', value: unmatched.length.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#A3402A] p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#A3402A]">{stat.label}</p>
            <p className="text-3xl font-serif font-bold text-coffee-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, answers, key phrases..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#A3402A]/20 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/40 bg-[#FDF8F3] text-coffee-800"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#A3402A] text-[#5C3321] text-sm font-bold hover:bg-coffee-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A3402A] text-white text-sm font-bold hover:bg-[#8a3522] transition-all shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-[#A3402A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[#A3402A] text-[10px] uppercase tracking-widest bg-[#FDF8F3] border-b border-coffee-100">
                <tr>
                  <th className="px-6 py-5 font-bold">QUESTION / RESPONSE</th>
                  <th className="px-6 py-5 font-bold">KEY PHRASES</th>
                  <th className="px-6 py-5 font-bold text-center">HITS</th>
                  <th className="px-6 py-5 font-bold">STATUS</th>
                  <th className="px-6 py-5 font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-[#5C3321]/40 text-sm font-medium">
                      <RefreshCw className="h-5 w-5 animate-spin inline-block mr-2" /> Loading FAQs...
                    </td>
                  </tr>
                ) : filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-[#5C3321]/40 text-sm font-medium">
                      <HelpCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
                      {term ? 'No FAQs match your search.' : 'No FAQs yet. Add one to get the chatbot started.'}
                    </td>
                  </tr>
                ) : filteredFaqs.map(faq => (
                  <tr key={faq.id} className={`hover:bg-coffee-50/50 transition-colors align-top ${faq.is_active ? '' : 'opacity-60'}`}>
                    <td className="px-6 py-5 max-w-sm">
                      <div className="text-[10px] text-coffee-400 uppercase tracking-wider mb-1">{faq.category || 'General'}</div>
                      <div className="font-bold text-coffee-900 text-sm">{faq.question}</div>
                      <p className="text-xs text-coffee-600 mt-1 line-clamp-2">{faq.answer}</p>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {faq.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 6).map(k => (
                          <span key={k} className="px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-700 text-[10px] font-medium">{k}</span>
                        ))}
                        {faq.keywords.split(',').filter(k => k.trim()).length > 6 && (
                          <span className="px-2 py-0.5 text-coffee-400 text-[10px]">+{faq.keywords.split(',').filter(k => k.trim()).length - 6} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-coffee-800">{faq.hit_count}</td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => toggleActive(faq)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest ${faq.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-coffee-100 text-coffee-500'}`}
                        title="Click to toggle"
                      >
                        {faq.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(faq)} className="p-2 rounded-lg text-coffee-600 hover:bg-coffee-100" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setPendingDelete(faq)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Delete">
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

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#A3402A] p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-5 w-5 text-[#A3402A]" />
              <h3 className="font-serif font-bold text-lg text-coffee-900">Test the Chatbot</h3>
            </div>
            <p className="text-xs text-coffee-500 mb-4">Type a guest question to see which FAQ it matches. Tests don't count toward hits.</p>
            <form onSubmit={runTest} className="flex gap-2">
              <input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="e.g. what time can we check in?"
                className="flex-1 px-3 py-2 rounded-xl border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-[#A3402A]/30"
              />
              <button type="submit" disabled={isTesting || !testQuery.trim()} className="p-2.5 rounded-xl bg-coffee-800 text-white disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
            {testResult && (
              <div className={`mt-4 p-4 rounded-xl text-sm ${testResult.matched ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                {testResult.matched ? (
                  <>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs mb-1">
                      <CheckCircle2 className="h-4 w-4" /> Matched: {testResult.question}
                    </div>
                    <p className="text-coffee-700 text-xs whitespace-pre-line">{testResult.answer}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 text-xs">
                    <AlertCircle className="h-4 w-4" /> No match — the guest would see the fallback reply.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#A3402A] p-6">
            <h3 className="font-serif font-bold text-lg text-coffee-900 mb-1">Unanswered Questions</h3>
            <p className="text-xs text-coffee-500 mb-4">Guest questions the chatbot couldn't match. Turn them into FAQs or add key phrases to an existing one.</p>
            {unmatched.length === 0 ? (
              <p className="text-sm text-[#5C3321]/40 text-center py-8">Nothing here — the chatbot answered everything.</p>
            ) : (
              <ul className="divide-y divide-coffee-50 max-h-96 overflow-y-auto -mx-2">
                {unmatched.map(q => (
                  <li key={q.id} className="px-2 py-3 flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-coffee-900 break-words">"{q.query}"</p>
                      <p className="text-[10px] text-coffee-400 mt-0.5">{new Date(q.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => openCreate(q.query)} className="p-1.5 rounded-lg text-[#A3402A] hover:bg-coffee-100" title="Create FAQ from this">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => dismissUnmatched(q.id)} className="p-1.5 rounded-lg text-coffee-400 hover:bg-coffee-100" title="Dismiss">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit FAQ Modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] p-6"
            >
              <h3 className="text-xl font-serif font-bold text-coffee-900 mb-4">{form.id ? 'Edit FAQ' : 'Add FAQ'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest">Question Template</label>
                  <input
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    placeholder="What time is check-in?"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest">Key Phrases</label>
                  <input
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="check in, arrival time, what time"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                  />
                  <p className="text-[11px] text-coffee-400 mt-1">Comma-separated. Multi-word phrases count more than single words, so add specific phrases guests actually type.</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest">Canned Response</label>
                  <textarea
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    rows={5}
                    placeholder="Check-in starts at 2:00 PM..."
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-coffee-200 text-sm outline-none focus:ring-2 focus:ring-coffee-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-coffee-200 text-sm outline-none bg-white"
                    >
                      {Array.from(new Set([...CATEGORY_OPTIONS, form.category])).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest">Display Order</label>
                    <input
                      type="number"
                      value={form.order_index}
                      onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })}
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-coffee-200 text-sm outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-coffee-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 accent-[#A3402A]"
                  />
                  Active (the chatbot can use this answer)
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setForm(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveForm}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#A3402A] hover:bg-[#8a3522] transition-colors shadow-md text-sm disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <h3 className="text-xl font-serif font-bold text-coffee-900 mb-2">Delete FAQ?</h3>
              <p className="text-sm text-coffee-600 mb-4">"{pendingDelete.question}" will be removed and the chatbot will stop using it. To hide it temporarily, mark it inactive instead.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
