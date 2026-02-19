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
    // Date Format: MM / DD / YYYY
    const formattedDate = `${String(mVal).padStart(2, '0')} / ${String(dVal).padStart(2, '0')} / ${yVal}`;
    const monthName = new Date(yVal, mVal - 1, dVal).toLocaleString('default', { month: 'long' });

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans">
            <Sidebar />

            <main className="flex-1 p-3 md:p-4 lg:p-5 md:ml-64 transition-all duration-300 bg-[#EFF3F9] min-h-screen">
                <div className="mx-auto max-w-[1600px] flex flex-col gap-4">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-3 rounded-[20px] shadow-sm border border-gray-100">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-[#111827]">Dashboard</h1>
                            <p className="text-gray-500 text-xs">Welcome back, {user.name}</p>
                        </div>

                        <div className="flex items-center gap-3 bg-[#F3F4F6] p-1 rounded-full border border-gray-200">
                            <button onClick={() => changeDate(-1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <div className="px-3 font-bold text-[#111827] text-sm tracking-wide">
                                {formattedDate}
                            </div>
                            <button onClick={() => changeDate(1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                        {/* LEFT COLUMN: Monthly Report (Span 2) */}
                        <div className="lg:col-span-2 flex flex-col gap-5">

                            {/* Monthly Cards Section */}
                            <section className="flex flex-col gap-3">
                                <div className="flex justify-between items-end px-1">
                                    <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Monthly Report</h3>
                                    <button className="text-xs font-medium text-[#3B82F6] flex items-center gap-1 hover:underline">
                                        <Download size={12} /> Download Month CSV
                                    </button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <StatsCard
                                        title="Net Sale"
                                        value={`৳${(data?.monthly?.revenue || 0).toLocaleString()}`}
                                        icon={CircleDollarSign}
                                        color="#10B981"
                                        description="Profit"
                                    />
                                    <StatsCard
                                        title="Net Income"
                                        value={`৳${(data?.monthly?.profit || 0).toLocaleString()}`}
                                        icon={BadgeDollarSign}
                                        color="#0065F4"
                                        description="Revenue"
                                    />
                                    <StatsCard
                                        title="Orders"
                                        value={data?.monthly?.orders || 0}
                                        icon={ShoppingCart}
                                        color="#F59E0B"
                                        description={`${data?.monthly?.service_count || 0} Service : ${data?.monthly?.product_count || 0} Product`}
                                    />
                                </div>
                            </section>

                            {/* Monthly Sales Graph */}
                            <section className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-base font-bold text-[#111827]">Monthly Sales</h3>
                                    <div className="relative">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100">
                                            <CalendarIcon size={14} />
                                            <span>{monthName}</span>
                                            {/* In a real implementation, this would trigger a dropdown */}
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <SalesGraph data={data?.monthly?.graph_data || []} />
                                </div>
                            </section>

                            {/* Bottom Grid: Top Products & Alerts */}
                            <section className="grid gap-5 md:grid-cols-2">
                                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-base font-bold text-[#111827]">Top Selling Products</h3>
                                        <p className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{monthName}</p>
                                    </div>
                                    <TopProducts products={data?.monthly?.top_products || []} />
                                </div>

                                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            Stock Alerts
                                        </h3>
                                    </div>
                                    <StockAlerts items={data?.alerts || []} />
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: Daily Overview (Span 1) */}
                        <div className="lg:col-span-1 flex flex-col gap-5 h-full">

                            {/* Daily Cards Section */}
                            <section className="flex flex-col gap-3">
                                <div className="flex justify-between items-end px-1">
                                    <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Daily Overview</h3>
                                    <button className="text-xs font-medium text-[#3B82F6] flex items-center gap-1 hover:underline">
                                        <Download size={12} /> Daily CSV
                                    </button>
                                </div>
                                <div className="grid gap-4 grid-cols-2">
                                    {/* Total Sale Card */}
                                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col justify-center gap-1 h-[140px] relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <h3 className="text-[#6B7280] font-medium text-xs tracking-wide">Total Sale</h3>
                                        <div className="flex items-baseline">
                                            <span className="text-xl font-extrabold mr-1 text-[#111827]">৳</span>
                                            <span className="text-2xl font-bold text-[#111827]">
                                                {(data?.daily?.revenue || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total Profit Card */}
                                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col justify-center gap-1 h-[140px] relative overflow-hidden group hover:shadow-md transition-shadow">
                                        <h3 className="text-[#6B7280] font-medium text-xs tracking-wide">Total Profit</h3>
                                        <div className="flex items-baseline">
                                            <span className="text-xl font-extrabold mr-1 text-[#F97316]">৳</span>
                                            <span className="text-2xl font-bold text-[#F97316]">
                                                {(data?.daily?.profit || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Transactions Section */}
                            <section className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[500px]">
                                <div className="flex flex-row items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-[#111827]">Transactions</h3>
                                    <Button size="sm" variant="outline" className="h-7 gap-1 rounded-lg text-xs" onClick={() => window.open(`/api/export?startDate=${selectedDate}&endDate=${selectedDate}`, '_blank')}>
                                        <Download className="h-3 w-3" />
                                        <span>Export</span>
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-auto">
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
                            </section>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
