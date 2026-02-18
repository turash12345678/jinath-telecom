"use client";

import { Trash2, AlertCircle, ChevronDown, ChevronRight, ShoppingBag } from "lucide-react";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <div className="w-full h-full flex flex-col">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.length > 0 ? (
                            sales.map((sale) => {
                                const { date, time } = formatDate(sale.created_at);
                                const isExpanded = expandedIds.has(sale.id);

                                return (
                                    <>
                                        <TableRow
                                            key={sale.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleExpand(sale.id)}
                                        >
                                            <TableCell>
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{date}</span>
                                                    <span className="text-xs text-muted-foreground">{time}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{sale.payment_method}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                ৳{sale.total_amount}
                                            </TableCell>
                                            <TableCell>
                                                {onDeleteSale && (!('canEdit' in props) || props.canEdit) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => handleDeleteClick(e, sale.id)}
                                                        disabled={deletingId === sale.id}
                                                    >
                                                        {deletingId === sale.id ? (
                                                            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 border-t border-b">
                                                        <div className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                                                            <ShoppingBag className="h-4 w-4" /> Order Details
                                                        </div>
                                                        <div className="rounded-md border bg-background">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
                                                                        <TableHead className="h-8">Item</TableHead>
                                                                        <TableHead className="h-8 text-center">Qty</TableHead>
                                                                        <TableHead className="h-8 text-right">Price</TableHead>
                                                                        <TableHead className="h-8 text-right">Total</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {sale.items && sale.items.length > 0 ? (
                                                                        sale.items.map((item, idx) => (
                                                                            <TableRow key={idx} className="hover:bg-transparent border-0">
                                                                                <TableCell className="py-2">{item.name || 'Unknown'}</TableCell>
                                                                                <TableCell className="py-2 text-center">{item.quantity}</TableCell>
                                                                                <TableCell className="py-2 text-right">৳{item.price}</TableCell>
                                                                                <TableCell className="py-2 text-right font-medium">৳{(item.quantity * item.price).toFixed(2)}</TableCell>
                                                                            </TableRow>
                                                                        ))
                                                                    ) : (
                                                                        <TableRow>
                                                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No item details available</TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 opacity-50" />
                                        <p>No sales found in this period</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
