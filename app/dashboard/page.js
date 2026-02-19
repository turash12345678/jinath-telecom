'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesGraph } from '@/components/dashboard/SalesGraph';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { SalesHistoryTable } from '@/components/dashboard/SalesHistoryTable';
import { BadgeDollarSign, ShoppingCart, Download, CircleDollarSign, Calendar as CalendarIcon, Package, AlertTriangle, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Custom Button Component for replacement
const Button = ({ children, onClick, className, variant = 'primary', size = 'md' }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
        primary: "bg-[#0065F4] text-white hover:bg-[#0052cc]",
        outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900",
        ghost: "hover:bg-gray-100 text-gray-700",
        destructive: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 py-2 px-4",
        icon: "h-9 w-9",
    };
    return (
        <button onClick={onClick} className={cn(baseStyle, variants[variant], sizes[size], className)}>
            {children}
        </button>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    // Stats State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [data, setData] = useState({
        daily: { revenue: 0, orders: 0, profit: 0, history: [] },
        monthly: { revenue: 0, orders: 0, profit: 0, graph_data: [], top_products: [] },
        user_performance: { revenue: 0, orders: 0 },
        alerts: []
    });

    // Investment Tracker State
    const [showInvestment, setShowInvestment] = useState(false);
    const [investmentData, setInvestmentData] = useState({ invest: 0, revenue: 0, profit: 0 });
    const [investmentFilter, setInvestmentFilter] = useState('January'); // Default to Jan
    const [loading, setLoading] = useState(true);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // 1. Fetch User Session
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) setUser(data.user);
                else router.push('/login');
            })
            .catch(() => router.push('/login'));
    }, [router]);

    // Sync investment filter
    useEffect(() => {
        if (investmentFilter !== 'All Time') {
            const date = new Date(selectedDate);
            const mName = date.toLocaleString('default', { month: 'long' });
            setInvestmentFilter(mName);
        }
    }, [selectedDate, investmentFilter]);

    // 2. Fetch Dashboard Data
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                const [y, m, d] = selectedDate.split('-').map(Number);
                const startDt = new Date(y, m - 1, d, 0, 0, 0, 0);
                const endDt = new Date(y, m - 1, d, 23, 59, 59, 999);
                const start = startDt.toISOString();
                const end = endDt.toISOString();

                const res = await fetch(`/api/dashboard/stats?startDate=${start}&endDate=${end}&userId=${user.id}&dateStr=${selectedDate}&_t=${Date.now()}`);
                const data = await res.json();
                if (!data.error) setData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, user]);

    // Fetch Investment Data
    useEffect(() => {
        if (!user) return;
        const fetchInvestment = async () => {
            let param = '';
            if (investmentFilter === 'All Time') {
                param = 'filter=all';
            } else {
                const [y] = selectedDate.split('-');
                const mIdx = months.indexOf(investmentFilter);
                if (mIdx !== -1) {
                    const mStr = String(mIdx + 1).padStart(2, '0');
                    param = `filter=${y}-${mStr}`;
                } else {
                    param = `date=${selectedDate}`;
                }
            }

            try {
                const res = await fetch(`/api/dashboard/investment?${param}`);
                const json = await res.json();
                if (!json.error) setInvestmentData(json);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInvestment();
    }, [investmentFilter, selectedDate, user, months]);

    const changeDate = (days) => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + days);
        const nextY = date.getFullYear();
        const nextM = String(date.getMonth() + 1).padStart(2, '0');
        const nextD = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    };

    if (!user) return <div className="flex justify-center items-center h-screen bg-gray-100">Loading...</div>;

    const [yVal, mVal, dVal] = selectedDate.split('-').map(Number);
    const dateObj = new Date(yVal, mVal - 1, dVal);
    const day = String(dVal).padStart(2, '0');
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = yVal;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans">
            <Sidebar />

            <main className="flex-1 p-3 md:p-5 lg:p-6 md:ml-64 transition-all duration-300 bg-[#EFF3F9] min-h-screen">
                <div className="mx-auto max-w-7xl flex flex-col gap-4">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Dashboard</h1>
                            <p className="text-gray-500">Welcome back, {user.name}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-4 font-medium min-w-[120px] text-center text-[#111827]">
                                {day} {month} {year}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Net Sale"
                            value={`৳${(data?.daily?.revenue || 0).toLocaleString()}`}
                            icon={CircleDollarSign}
                            color="#10B981" // Green
                            description="Revenue"
                        />
                        <StatsCard
                            title="Net Income"
                            value={`৳${(data?.daily?.profit || 0).toLocaleString()}`}
                            icon={BadgeDollarSign}
                            color="#0065F4" // Blue
                            description="Profit"
                        />
                        <StatsCard
                            title="Orders"
                            value={data?.monthly?.orders || 0}
                            icon={ShoppingCart}
                            color="#F59E0B" // Orange
                            description={`${data?.monthly?.service_count || 0} Service, ${data?.monthly?.product_count || 0} Product`}
                        />
                        <StatsCard
                            title="Monthly Revenue"
                            value={`৳${(data?.monthly?.revenue || 0).toLocaleString()}`}
                            icon={TrendingUp}
                            color="#8B5CF6" // Purple
                            description="Total Sales"
                        />
                    </div>

                    {/* Investment Section Toggle */}
                    <div className="flex items-center justify-between mt-2">
                        <h2 className="text-lg font-bold text-[#111827]">Analytics & Reports</h2>
                        <Button variant="outline" size="sm" onClick={() => setShowInvestment(!showInvestment)} className="rounded-xl border-gray-200">
                            {showInvestment ? "Hide Investment" : "Show Investment"}
                        </Button>
                    </div>

                    {/* Investment Section */}
                    {showInvestment && (
                        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <StatsCard title="Net Investment" value={`৳${(investmentData?.invest || 0).toLocaleString()}`} icon={BadgeDollarSign} color="#EC4899" />
                            <StatsCard title="Net Sold" value={`৳${(investmentData?.revenue || 0).toLocaleString()}`} icon={CircleDollarSign} color="#10B981" />
                            <StatsCard title="Net Profit" value={`৳${(investmentData?.profit || 0).toLocaleString()}`} icon={TrendingUp} color="#0065F4" />
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                        {/* Left Column: Charts (4 cols) */}
                        <div className="col-span-4 flex flex-col gap-6">
                            {/* Monthly Sales Chart */}
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[#111827]">Monthly Sales</h3>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg text-sm font-medium text-gray-600">
                                        <CalendarIcon size={16} />
                                        {month}
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <SalesGraph data={data?.monthly?.graph_data || []} />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Top Products */}
                                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-[#111827]">Top Selling Products</h3>
                                        <p className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{month}</p>
                                    </div>
                                    <TopProducts products={data?.monthly?.top_products || []} />
                                </div>

                                {/* Stock Alerts */}
                                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Stock Alerts
                                        </h3>
                                    </div>
                                    <StockAlerts items={data?.alerts || []} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Recent Sales (3 cols) */}
                        <div className="col-span-3">
                            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                                <div className="flex flex-row items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-[#111827]">Transactions</h3>
                                    <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={() => window.open(`/api/export?startDate=${selectedDate}&endDate=${selectedDate}`, '_blank')}>
                                        <Download className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-auto min-h-[400px]">
                                    <SalesHistoryTable
                                        sales={data?.daily?.history || []}
                                        canEdit={true}
                                        onDeleteSale={(id) => {
                                            setData(prev => ({
                                                ...prev,
                                                daily: {
                                                    ...prev.daily,
                                                    history: prev.daily.history.filter(s => s.id !== id)
                                                }
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
