'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesGraph } from '@/components/dashboard/SalesGraph';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { StockAlerts } from '@/components/dashboard/StockAlerts';
import { SalesHistoryTable } from '@/components/dashboard/SalesHistoryTable';
import { BadgeDollarSign, ShoppingCart, Download, CircleDollarSign, Calendar as CalendarIcon, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

    if (!user) return <div className="flex justify-center items-center h-screen bg-muted/40">Loading...</div>;

    const [yVal, mVal, dVal] = selectedDate.split('-').map(Number);
    const dateObj = new Date(yVal, mVal - 1, dVal);
    const day = String(dVal).padStart(2, '0');
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = yVal;

    return (
        <div className="flex h-screen bg-muted/40 font-sans">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl flex flex-col gap-6">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                            <p className="text-muted-foreground">Welcome back, {user.name}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
                            <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-4 font-medium min-w-[120px] text-center">
                                {day} {month} {year}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Daily Revenue"
                            value={`৳${(data.daily.revenue || 0).toLocaleString()}`}
                            icon={CircleDollarSign}
                            description={`Today's date`}
                        />
                        <StatsCard
                            title="Daily Profit"
                            value={`৳${(data.daily.profit || 0).toLocaleString()}`}
                            icon={BadgeDollarSign}
                            description={`Net profit today`}
                        />
                        <StatsCard
                            title="Monthly Revenue"
                            value={`৳${(data.monthly.revenue || 0).toLocaleString()}`}
                            icon={TrendingUp}
                        />
                        <StatsCard
                            title="Monthly Orders"
                            value={data.monthly.orders || 0}
                            icon={ShoppingCart}
                            description={`${data.monthly.service_count} Svc, ${data.monthly.product_count} Prd`}
                        />
                    </div>

                    {/* Investment Section Toggle */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">Analytics & Reports</h2>
                        <Button variant="outline" size="sm" onClick={() => setShowInvestment(!showInvestment)}>
                            {showInvestment ? "Hide Investment" : "Show Investment"}
                        </Button>
                    </div>

                    {/* Investment Section */}
                    {showInvestment && (
                        <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <StatsCard title="Net Investment" value={`৳${(investmentData.invest || 0).toLocaleString()}`} icon={BadgeDollarSign} />
                            <StatsCard title="Net Sold" value={`৳${(investmentData.revenue || 0).toLocaleString()}`} icon={CircleDollarSign} />
                            <StatsCard title="Net Profit" value={`৳${(investmentData.profit || 0).toLocaleString()}`} icon={TrendingUp} />
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                        {/* Left Column: Charts (4 cols) */}
                        <div className="col-span-4 flex flex-col gap-4">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Monthly Sales Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <SalesGraph data={data.monthly.graph_data} />
                                </CardContent>
                            </Card>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Top Selling Products</CardTitle>
                                        <CardDescription>{month}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <TopProducts products={data.monthly.top_products} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            Stock Alerts
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <StockAlerts items={data.alerts} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column: Recent Sales (3 cols) */}
                        <div className="col-span-3">
                            <Card className="h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => window.open(`/api/export?startDate=${selectedDate}&endDate=${selectedDate}`, '_blank')}>
                                        <Download className="h-3.5 w-3.5" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto min-h-[400px]">
                                    <SalesHistoryTable
                                        sales={data.daily.history}
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
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
