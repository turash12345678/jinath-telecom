"use client";

import React, { useState } from "react";
import { Trash2, AlertCircle, ChevronDown, ChevronRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    payment_method: string;
    items?: {
        name: string;
        quantity: number;
        price: number;
        type: string;
    }[];
}

interface SalesHistoryTableProps {
    sales: Sale[];
    onDeleteSale: (id: number) => void;
    canEdit?: boolean;
}

export function SalesHistoryTable({ sales, onDeleteSale, canEdit = true }: SalesHistoryTableProps) {
    const props = { canEdit };
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const handleDeleteClick = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this sale? Stock will be restored.")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                onDeleteSale(id);
            } else {
                const errorData = await res.json();
                alert(`Failed to delete sale: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
        } catch (e) {
            alert(`Error deleting sale: ${e instanceof Error ? e.message : 'Network error'}`);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
            const date = new Date(isoString);
            return {
                date: date.toLocaleDateString(),
                time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } catch (e) {
            return { date: "Invalid", time: "" };
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-auto">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[#F9FAFB] border-b border-gray-100">
                        <tr className="text-left">
                            <th className="h-10 px-4 w-[30px]"></th>
                            <th className="h-10 px-4 font-medium text-gray-500">Date & Time</th>
                            <th className="h-10 px-4 font-medium text-gray-500">Method</th>
                            <th className="h-10 px-4 font-medium text-gray-500 text-right">Amount</th>
                            <th className="h-10 px-4 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length > 0 ? (
                            sales.map((sale) => {
                                const { date, time } = formatDate(sale.created_at);
                                const isExpanded = expandedIds.has(sale.id);

                                return (
                                    <React.Fragment key={sale.id}>
                                        <tr
                                            key={sale.id}
                                            className="cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                                            onClick={() => toggleExpand(sale.id)}
                                        >
                                            <td className="p-4 align-middle">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{date}</span>
                                                    <span className="text-xs text-gray-500">{time}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-700 capitalize">
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold text-[#0065F4]">
                                                ৳{sale.total_amount}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {onDeleteSale && (!('canEdit' in props) || props.canEdit) && (
                                                    <button
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        onClick={(e) => handleDeleteClick(e, sale.id)}
                                                        disabled={deletingId === sale.id}
                                                    >
                                                        {deletingId === sale.id ? (
                                                            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-50/30">
                                                <td colSpan={5} className="p-0">
                                                    <div className="p-4 border-t border-b border-gray-100">
                                                        <div className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-500">
                                                            <ShoppingBag className="h-4 w-4" /> Order Details
                                                        </div>
                                                        <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-[#F9FAFB] border-b border-gray-100">
                                                                    <tr className="text-left">
                                                                        <th className="h-8 px-4 font-medium text-gray-500">Item</th>
                                                                        <th className="h-8 px-4 font-medium text-gray-500 text-center">Qty</th>
                                                                        <th className="h-8 px-4 font-medium text-gray-500 text-right">Price</th>
                                                                        <th className="h-8 px-4 font-medium text-gray-500 text-right">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sale.items && sale.items.length > 0 ? (
                                                                        sale.items.map((item, idx) => (
                                                                            <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20">
                                                                                <td className="px-4 py-2 font-medium text-gray-900">{item.name || 'Unknown'}</td>
                                                                                <td className="px-4 py-2 text-center text-gray-600">{item.quantity}</td>
                                                                                <td className="px-4 py-2 text-right text-gray-600">৳{item.price}</td>
                                                                                <td className="px-4 py-2 text-right font-medium text-gray-900">৳{(item.quantity * item.price).toFixed(2)}</td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={4} className="text-center text-gray-400 py-4">No item details available</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                        <AlertCircle className="h-8 w-8 opacity-50" />
                                        <p>No sales found in this period</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
