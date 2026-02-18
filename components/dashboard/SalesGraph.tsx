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

    if (!mounted) return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}`;
                    }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Income']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6, strokeWidth: 2, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary))' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
