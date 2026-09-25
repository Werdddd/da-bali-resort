import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  RefreshCw, Plus, Minus, Trash2, ShoppingCart, Receipt, Download, Ban, Undo2, Waves, Tent, CheckCircle2, Users, Wallet,
} from 'lucide-react';
import { User, PosCatalogAmenity, PosTransaction, PosDailySummary } from '../types';
import { POS_ENTRANCE_CATEGORY } from '../amenityOptions';

interface POSDashboardProps {
  currentUser: User;
  setToastMessage: (msg: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  // Bumped by the app's WebSocket listener when another terminal records a sale or stock changes
  refreshKey?: number;
}

type CartLine = { amenityName: string; category: string; itemName: string; price: number; quantity: number; deductsStock: boolean };
type PaymentMethod = 'Cash' | 'GCash' | 'BPI';

const peso = (n: number) => `₱${(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// SQLite CURRENT_TIMESTAMP is UTC without a zone marker
const parseDbTimestamp = (value: string) => new Date(value.replace(' ', 'T') + 'Z');
const lineKey = (amenityName: string, itemName: string) => `${amenityName}::${itemName}`;

export const POSDashboard = ({ currentUser, setToastMessage, refreshKey = 0 }: POSDashboardProps) => {
  const [catalog, setCatalog] = useState<PosCatalogAmenity[]>([]);
  const [transactions, setTransactions] = useState<PosTransaction[]>([]);
  const [summary, setSummary] = useState<PosDailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<PosTransaction | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const fetchCatalog = useCallback(async () => {
    const res = await fetch('/api/pos/catalog', { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setCatalog(await res.json());
  }, []);

  const fetchTransactions = useCallback(async () => {
    const res = await fetch(`/api/pos/transactions?date=${selectedDate}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setTransactions(data.transactions);
    setSummary(data.summary);
  }, [selectedDate]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchCatalog(), fetchTransactions()]);
    } catch (e) {
      console.error('POS refresh failed:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchCatalog, fetchTransactions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll, refreshKey]);

  const cartTotal = useMemo(() => cart.reduce((sum, l) => sum + l.price * l.quantity, 0), [cart]);
  const tenderedNumber = parseFloat(amountTendered);
  const changeDue = paymentMethod === 'Cash' && !isNaN(tenderedNumber) ? tenderedNumber - cartTotal : 0;

  // Rental units already in the cart per amenity, so staff can't add more than is in stock
  const rentalQtyInCart = (amenityName: string) =>
    cart.filter(l => l.amenityName === amenityName && l.deductsStock).reduce((sum, l) => sum + l.quantity, 0);

  const canAddRental = (amenity: PosCatalogAmenity) =>
    amenity.stock === null || amenity.stock === undefined || rentalQtyInCart(amenity.amenity_name) < amenity.stock;

  const addToCart = (amenity: PosCatalogAmenity, category: string, item: { name: string; price: number }) => {
    const deductsStock = category !== POS_ENTRANCE_CATEGORY;
    if (deductsStock && !canAddRental(amenity)) {
      setToastMessage({ title: 'Out of Stock', message: `No more ${amenity.amenity_name} rentals available.`, type: 'error' });
      return;
    }
    setLastSale(null);
    setCart(prev => {
      const key = lineKey(amenity.amenity_name, item.name);
      const existing = prev.find(l => lineKey(l.amenityName, l.itemName) === key);
      if (existing) return prev.map(l => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { amenityName: amenity.amenity_name, category, itemName: item.name, price: item.price, quantity: 1, deductsStock }];
    });
  };

  const changeQuantity = (line: CartLine, delta: number) => {
    if (delta > 0 && line.deductsStock) {
      const amenity = catalog.find(a => a.amenity_name === line.amenityName);
      if (amenity && !canAddRental(amenity)) {
        setToastMessage({ title: 'Out of Stock', message: `No more ${line.amenityName} rentals available.`, type: 'error' });
        return;
      }
    }
    setCart(prev => prev
      .map(l => (l === line ? { ...l, quantity: l.quantity + delta } : l))
      .filter(l => l.quantity > 0));
  };

  const resetSale = () => {
    setCart([]);
    setCustomerName('');
    setContactNo('');
    setPaymentMethod('Cash');
    setAmountTendered('');
    setTransactionReference('');
    setNotes('');
  };

  const downloadReceipt = async (txn: PosTransaction) => {
    setBusyId(txn.id);
    try {
      const res = await fetch(`/api/pos/transactions/${txn.id}/receipt`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to generate receipt');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${txn.receipt_no}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Receipt download error:', e);
      setToastMessage({ title: 'Error', message: 'Failed to download receipt. Please try again.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      setToastMessage({ title: 'Error', message: 'Add at least one item to the sale.', type: 'error' });
      return;
    }
    if (paymentMethod === 'Cash' && (isNaN(tenderedNumber) || tenderedNumber < cartTotal)) {
      setToastMessage({ title: 'Error', message: 'Cash received must cover the total amount.', type: 'error' });
      return;
    }
    if (paymentMethod !== 'Cash' && !transactionReference.trim()) {
      setToastMessage({ title: 'Error', message: `Enter the ${paymentMethod} reference number.`, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map(l => ({ amenityName: l.amenityName, itemName: l.itemName, quantity: l.quantity })),
          customerName,
          contactNo,
          paymentMethod,
          amountTendered: paymentMethod === 'Cash' ? tenderedNumber : undefined,
          transactionReference: paymentMethod !== 'Cash' ? transactionReference : undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToastMessage({ title: 'Error', message: data.error || 'Failed to record the sale.', type: 'error' });
        return;
      }
      setLastSale(data);
      resetSale();
      setToastMessage({ title: 'Sale Recorded', message: `Receipt ${data.receipt_no} saved.`, type: 'success' });
      if (selectedDate !== format(new Date(), 'yyyy-MM-dd')) setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      await refreshAll();
    } catch (e) {
      console.error('POS sale failed:', e);
      setToastMessage({ title: 'Error', message: 'An error occurred while recording the sale.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnRentals = async (txn: PosTransaction) => {
    if (!window.confirm(`Mark the rentals on ${txn.receipt_no} as returned? Their units go back into stock.`)) return;
    setBusyId(txn.id);
    try {
      const res = await fetch(`/api/pos/transactions/${txn.id}/return-rentals`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to return rentals.');
      setToastMessage({ title: 'Rentals Returned', message: `Stock restored for ${txn.receipt_no}.`, type: 'success' });
      await refreshAll();
    } catch (e: any) {
      setToastMessage({ title: 'Error', message: e.message || 'Failed to return rentals.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const voidSale = async (txn: PosTransaction) => {
    const reason = window.prompt(`Void ${txn.receipt_no} (${peso(txn.total)})? Enter a reason:`);
    if (reason === null) return;
    if (!reason.trim()) {
      setToastMessage({ title: 'Error', message: 'A reason is required to void a sale.', type: 'error' });
      return;
    }
    setBusyId(txn.id);
    try {
      const res = await fetch(`/api/pos/transactions/${txn.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to void the sale.');
      setToastMessage({ title: 'Sale Voided', message: `${txn.receipt_no} has been voided.`, type: 'success' });
      await refreshAll();
    } catch (e: any) {
      setToastMessage({ title: 'Error', message: e.message || 'Failed to void the sale.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const stockBadge = (amenity: PosCatalogAmenity) => {
    const hasRentals = amenity.categories.some(c => c.category !== POS_ENTRANCE_CATEGORY);
    if (!hasRentals) return null;
    if (amenity.stock === null || amenity.stock === undefined) {
      return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-coffee-100 text-coffee-600">Unlimited Stock</span>;
    }
    const left = amenity.stock - rentalQtyInCart(amenity.amenity_name);
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${left <= 0 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
        {left <= 0 ? 'Out of Stock' : `${left} rental${left === 1 ? '' : 's'} left`}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full flex items-center justify-center py-20 text-coffee-500">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading POS…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Catalog */}
        <div className="lg:col-span-3 space-y-4">
          {catalog.length === 0 && (
            <div className="bg-white rounded-2xl border border-coffee-100 p-8 text-center text-coffee-500">No POS items are configured.</div>
          )}
          {catalog.map(amenity => {
            const inactive = amenity.status === 'inactive';
            return (
              <div key={amenity.amenity_id} className={`bg-white rounded-2xl border border-[#A3402A] p-5 shadow-sm ${inactive ? 'opacity-50' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-serif font-bold text-coffee-900">{amenity.amenity_name}</h3>
                  <div className="flex items-center gap-2">
                    {inactive && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Unavailable</span>}
                    {stockBadge(amenity)}
                  </div>
                </div>
                <div className="space-y-4">
                  {amenity.categories.map(cat => {
                    const isEntrance = cat.category === POS_ENTRANCE_CATEGORY;
                    return (
                      <div key={cat.category}>
                        <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          {isEntrance ? <Waves className="h-3 w-3" /> : <Tent className="h-3 w-3" />}
                          {cat.category}{!isEntrance && <span className="text-coffee-400 normal-case tracking-normal font-medium"> · deducts stock</span>}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cat.items.map(item => {
                            const disabled = inactive || (!isEntrance && !canAddRental(amenity));
                            return (
                              <button
                                key={item.name}
                                type="button"
                                disabled={disabled}
                                onClick={() => addToCart(amenity, cat.category, item)}
                                className="flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border border-coffee-100 hover:border-coffee-300 hover:bg-coffee-50 transition-all disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-coffee-100"
                              >
                                <span className="text-sm font-medium text-coffee-900">{item.name}</span>
                                <span className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm font-bold text-coffee-700">{peso(item.price)}</span>
                                  <Plus className="h-4 w-4 text-[#518C63]" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current sale */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#A3402A] shadow-sm lg:sticky lg:top-4 overflow-hidden">
            <div className="bg-coffee-900 text-white px-5 py-4 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-coffee-300" />
              <h3 className="font-serif font-bold text-lg">Current Sale</h3>
            </div>

            {lastSale && cart.length === 0 ? (
              <div className="p-6 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-[#518C63] mx-auto" />
                <div>
                  <p className="text-sm text-coffee-500">Sale recorded</p>
                  <p className="text-xl font-serif font-bold text-coffee-900">{lastSale.receipt_no}</p>
                  <p className="text-sm text-coffee-700 mt-1">{peso(lastSale.total)} · {lastSale.payment_method}</p>
                  {lastSale.payment_method === 'Cash' && (
                    <p className="text-lg font-bold text-[#518C63] mt-2">Change: {peso(lastSale.change_due)}</p>
                  )}
                </div>
                <button
                  onClick={() => downloadReceipt(lastSale)}
                  disabled={busyId === lastSale.id}
                  className="w-full py-3 rounded-xl font-bold bg-[#A3402A] text-white hover:bg-[#8a3623] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" /> Download PDF Receipt
                </button>
                <button onClick={() => setLastSale(null)} className="w-full py-2.5 rounded-xl font-bold text-coffee-600 hover:bg-coffee-50 transition-all">
                  New Sale
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-coffee-400 text-center py-6">Tap an item on the left to add it to the sale.</p>
                ) : (
                  <ul className="divide-y divide-coffee-50">
                    {cart.map(line => (
                      <li key={lineKey(line.amenityName, line.itemName)} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-coffee-900 truncate">{line.itemName}</p>
                          <p className="text-[11px] text-coffee-500 truncate">{line.amenityName} · {peso(line.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => changeQuantity(line, -1)} className="p-1 rounded-lg hover:bg-coffee-50 text-coffee-600" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-7 text-center text-sm font-bold">{line.quantity}</span>
                          <button onClick={() => changeQuantity(line, 1)} className="p-1 rounded-lg hover:bg-coffee-50 text-coffee-600" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="w-24 text-right text-sm font-bold text-coffee-900">{peso(line.price * line.quantity)}</span>
                        <button onClick={() => changeQuantity(line, -line.quantity)} className="p-1 rounded-lg hover:bg-red-50 text-red-500" aria-label="Remove item"><Trash2 className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-between border-t border-coffee-100 pt-3">
                  <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-serif font-bold text-coffee-900">{peso(cartTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">Guest Name</label>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in Guest" maxLength={100}
                      className="w-full px-3 py-2 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">Contact No.</label>
                    <input value={contactNo} onChange={e => setContactNo(e.target.value.replace(/[^\d+\- ]/g, ''))} placeholder="Optional" maxLength={30}
                      className="w-full px-3 py-2 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash', 'GCash', 'BPI'] as PaymentMethod[]).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl text-sm font-bold border transition-all ${paymentMethod === method ? 'bg-coffee-900 text-white border-coffee-900' : 'bg-white text-coffee-700 border-coffee-200 hover:bg-coffee-50'}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'Cash' ? (
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">Cash Received</label>
                      <input type="number" min={0} step="0.01" inputMode="decimal" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm" />
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm font-bold ${changeDue < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                      {changeDue < 0 ? `Short ${peso(-changeDue)}` : `Change ${peso(changeDue)}`}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">{paymentMethod} Reference No.</label>
                    <input value={transactionReference} onChange={e => setTransactionReference(e.target.value)} maxLength={100} placeholder="e.g. 1234 567 890"
                      className="w-full px-3 py-2 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm" />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-coffee-500 uppercase mb-1">Notes</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl border border-coffee-200 focus:ring-2 focus:ring-coffee-500 outline-none text-sm" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={resetSale} disabled={cart.length === 0 || isSubmitting}
                    className="px-4 py-3 rounded-xl font-bold text-coffee-500 hover:bg-coffee-50 transition-all disabled:opacity-40">
                    Clear
                  </button>
                  <button type="button" onClick={completeSale} disabled={cart.length === 0 || isSubmitting}
                    className="flex-1 py-3 rounded-xl font-bold bg-[#518C63] text-white hover:bg-[#41704F] transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed">
                    {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    Complete Sale
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily summary */}
      <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-coffee-900">POS Transactions</h2>
          <p className="text-sm text-coffee-500">Walk-in sales recorded at the front desk.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={selectedDate} max={format(new Date(), 'yyyy-MM-dd')} onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-coffee-200 text-sm bg-white" />
          <button onClick={refreshAll} className="p-2.5 rounded-xl border border-coffee-200 bg-white hover:bg-coffee-50 text-coffee-600" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#A3402A] p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Total Sales</p>
            <p className="text-2xl font-serif font-bold text-coffee-900">{peso(summary.total_sales)}</p>
            <p className="text-xs text-coffee-500 mt-1">{summary.transaction_count} sale{summary.transaction_count === 1 ? '' : 's'}{summary.voided_count > 0 ? ` · ${summary.voided_count} voided` : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#A3402A] p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Waves className="h-3 w-3" /> Entrance Fees</p>
            <p className="text-2xl font-serif font-bold text-coffee-900">{peso(summary.entrance_fees)}</p>
            <p className="text-xs text-coffee-500 mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> {summary.entrance_headcount} swimmer{summary.entrance_headcount === 1 ? '' : 's'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#A3402A] p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tent className="h-3 w-3" /> Amenity Rentals</p>
            <p className="text-2xl font-serif font-bold text-coffee-900">{peso(summary.rentals)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#A3402A] p-5 shadow-sm">
            <p className="text-[10px] font-bold text-[#A3402A] uppercase tracking-widest mb-2">By Payment Method</p>
            <div className="space-y-1">
              {summary.by_payment_method.map(m => (
                <div key={m.method} className="flex justify-between text-sm">
                  <span className="text-coffee-600">{m.method}</span>
                  <span className="font-bold text-coffee-900">{peso(m.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#A3402A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-coffee-50 text-[10px] uppercase tracking-widest text-coffee-500">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Receipt</th>
                <th className="text-left px-4 py-3">Guest</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {transactions.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-coffee-400">No POS sales on this date.</td></tr>
              )}
              {transactions.map(txn => {
                const voided = txn.status === 'voided';
                const hasRentals = txn.items.some(i => i.deducts_stock);
                return (
                  <tr key={txn.id} className={voided ? 'bg-red-50/40 text-coffee-400' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">{format(parseDbTimestamp(txn.created_at), 'h:mm a')}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{txn.receipt_no}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-coffee-900">{txn.customer_name}</div>
                      <div className="text-[11px] text-coffee-400">by {txn.cashier_name || 'Front Desk'}</div>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {txn.items.map(i => (
                        <div key={i.id} className="text-xs">{i.quantity}× {i.item_name} <span className="text-coffee-400">({i.amenity_name})</span></div>
                      ))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{txn.payment_method}</div>
                      {txn.transaction_reference && <div className="text-[11px] text-coffee-400 font-mono">{txn.transaction_reference}</div>}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${voided ? 'line-through' : 'text-coffee-900'}`}>{peso(txn.total)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {voided ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700" title={txn.void_reason || ''}>Voided</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Completed</span>
                      )}
                      {!voided && hasRentals && (
                        <div className="text-[10px] text-coffee-400 mt-1">{txn.rentals_returned_at ? 'Rentals returned' : 'Rentals out'}</div>
                      )}
                      {voided && txn.void_reason && <div className="text-[10px] text-red-600 mt-1 max-w-[160px] truncate" title={txn.void_reason}>{txn.void_reason}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => downloadReceipt(txn)} disabled={busyId === txn.id} title="Download PDF receipt"
                          className="p-2 rounded-lg hover:bg-coffee-50 text-coffee-600 disabled:opacity-40"><Download className="h-4 w-4" /></button>
                        {!voided && hasRentals && !txn.rentals_returned_at && (
                          <button onClick={() => returnRentals(txn)} disabled={busyId === txn.id} title="Mark rentals returned (restores stock)"
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-40"><Undo2 className="h-4 w-4" /></button>
                        )}
                        {isAdmin && !voided && (
                          <button onClick={() => voidSale(txn)} disabled={busyId === txn.id} title="Void sale"
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40"><Ban className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
