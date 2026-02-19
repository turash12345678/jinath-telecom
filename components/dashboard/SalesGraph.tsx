"use client";
import * as React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SalesGraphProps {
    data: { date: string; total: number }[];
}

export function SalesGraph({ data }: SalesGraphProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[350px] w-full bg-gray-50 animate-pulse rounded-lg" />;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    dy={10}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}`;
                    }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#FFFFFF', color: '#111827' }}
                    itemStyle={{ color: '#0065F4', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Income']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Line
                    type="linear"
                    dataKey="total"
                    stroke="#0065F4"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF', stroke: '#0065F4' }}
                    activeDot={{ r: 6, strokeWidth: 2, fill: '#0065F4', stroke: '#0065F4' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
