'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Search, ChevronDown, ChevronRight, History, TrendingDown, BanknoteIcon, ShoppingBag, RotateCcw, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

// Format date nicely
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const PAYMENT_COLORS = {
    cash: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Cash' },
    card: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Card' },
    mobile: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Mobile' },
};

function SaleRow({ sale }) {
    const [expanded, setExpanded] = useState(false);
    const isDeleted = !!sale.is_deleted;
    const pmColor = PAYMENT_COLORS[sale.payment_method] || { bg: 'bg-gray-50', text: 'text-gray-600', label: sale.payment_method };

    return (
        <div className={cn(
            'rounded-2xl border transition-all duration-200',
            isDeleted
                ? 'border-red-100 bg-red-50/40 opacity-75'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
        )}>
            {/* Row Header */}
            <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(v => !v)}
            >
                {/* Expand icon */}
                <span className={cn('text-gray-400 flex-none transition-transform', expanded ? 'rotate-90' : '')}>
                    <ChevronRight size={16} />
                </span>

                {/* Date & Time */}
                <div className="flex-none w-[90px]">
                    <p className={cn('text-xs font-semibold', isDeleted ? 'text-red-500 line-through' : 'text-gray-800')}>
                        {formatDate(sale.created_at)}
                    </p>
                    <p className="text-[11px] text-gray-400">{formatTime(sale.created_at)}</p>
                </div>

                {/* Items preview */}
                <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', isDeleted ? 'text-gray-400 line-through' : 'text-gray-800')}>
                        {sale.items?.length > 0
                            ? sale.items.map(i => i.name).filter(Boolean).join(', ')
                            : '—'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        {sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''}
                        {sale.user_name ? ` · ${sale.user_name}` : ''}
                    </p>
                </div>

                {/* Payment method */}
                <span className={cn('hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full', pmColor.bg, pmColor.text)}>
                    {pmColor.label}
                </span>

                {/* Amount */}
                <div className="flex-none text-right">
                    <p className={cn('text-sm font-bold', isDeleted ? 'text-red-400 line-through' : 'text-gray-900')}>
                        ৳{Number(sale.total_amount).toLocaleString()}
                    </p>
                </div>

                {/* Deleted badge */}
                {isDeleted && (
                    <span className="flex-none inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                        <RotateCcw size={10} />
                        Deleted
                    </span>
                )}
            </button>

            {/* Expanded Items */}
            {expanded && sale.items?.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    {isDeleted && (
                        <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                            <RotateCcw size={12} />
                            Deleted on {formatDate(sale.deleted_at)} · Stock has been restored
                        </p>
                    )}
                    <div className="space-y-2">
                        {sale.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={cn('w-1.5 h-1.5 rounded-full flex-none', item.type === 'product' ? 'bg-blue-400' : 'bg-purple-400')} />
                                    <span className={cn('font-medium', isDeleted ? 'text-gray-400' : 'text-gray-700')}>
                                        {item.name || '—'}
                                    </span>
                                    <span className="text-gray-400 text-xs">× {item.quantity}</span>
                                </div>
                                <span className={cn('font-semibold', isDeleted ? 'text-gray-400' : 'text-gray-800')}>
                                    ৳{Number(item.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SalesHistoryPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ total: 0, amount: 0, deleted: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Date range — default current month
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [showDeleted, setShowDeleted] = useState(true);

    // Auth
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (d.user) setUser(d.user);
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const startISO = new Date(startDate + 'T00:00:00').toISOString();
            const endISO = new Date(endDate + 'T23:59:59').toISOString();
            const res = await fetch(`/api/sales/history?startDate=${startISO}&endDate=${endISO}&search=${encodeURIComponent(search)}`);
            const data = await res.json();
            if (!data.error) {
                setSales(data.sales || []);
                setSummary(data.summary || { total: 0, amount: 0, deleted: 0 });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, startDate, endDate, search]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    if (!user) return <div className="flex justify-center items-center h-screen bg-[#EFF3F9]">Loading...</div>;

    const filteredSales = showDeleted ? sales : sales.filter(s => !s.is_deleted);

    return (
        <div className="min-h-screen bg-[#EFF3F9]">
            <Sidebar />
            <main className="flex-1 p-3 md:p-5 pt-20 md:pt-5 md:ml-64 min-h-screen">
                <div className="mx-auto max-w-4xl flex flex-col gap-4">

                    {/* Header */}
                    <header className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#EFF3F9] flex items-center justify-center">
                                    <History className="h-5 w-5 text-[#0065F4]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-[#111827]">Sales History</h1>
                                    <p className="text-xs text-gray-500">Complete audit log · Deletions preserved</p>
                                </div>
                            </div>

                            {/* Show Deleted Toggle */}
                            <button
                                onClick={() => setShowDeleted(v => !v)}
                                className={cn(
                                    'inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                                    showDeleted
                                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                )}
                            >
                                <RotateCcw size={12} />
                                {showDeleted ? 'Hiding deleted: OFF' : 'Show deleted: OFF'}
                            </button>
                        </div>
                    </header>

                    {/* Filters */}
                    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by item name..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065F4] focus:border-transparent"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-500 font-medium">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065F4]"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500 font-medium">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065F4]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <ShoppingBag size={14} className="text-[#0065F4]" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Sales</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                        </div>
                        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <BanknoteIcon size={14} className="text-emerald-500" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Net Revenue</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">৳{Number(summary.amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingDown size={14} className="text-red-500" />
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Deleted</span>
                            </div>
                            <p className="text-2xl font-bold text-red-500">{summary.deleted}</p>
                        </div>
                    </div>

                    {/* Sales List */}
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                                <div className="w-8 h-8 border-2 border-[#0065F4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">Loading sales history...</p>
                            </div>
                        ) : filteredSales.length === 0 ? (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                                <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No sales found</p>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting the date range or search</p>
                            </div>
                        ) : (
                            filteredSales.map(sale => (
                                <SaleRow key={sale.id} sale={sale} />
                            ))
                        )}
                    </div>

                    {/* Footer count */}
                    {!loading && filteredSales.length > 0 && (
                        <p className="text-center text-xs text-gray-400 pb-4">
                            Showing {filteredSales.length} of {sales.length} records
                        </p>
                    )}

                </div>
            </main>
        </div>
    );
}
