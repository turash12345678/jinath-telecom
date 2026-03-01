"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductItem } from "./ProductItem";
import { toast } from "sonner";

interface Variant {
    id: string;
    originalId: string;
    productName: string;
    productImage: string | null;
    buyingPrice: number;
    sellingPrice: number;
    type?: 'product' | 'service';
    salesCount: number;
    stockQuantity: number | null;
    categoryName?: string | null;
    ramName?: string | null;
    romName?: string | null;
    colorName?: string | null;
    imei?: string | null;
}

interface ProductGroupProps {
    groupName: string;
    variants: Variant[];
    // Cart state (per-id from parent PosContainer)
    selectedIds: Set<string>;
    quantities: Record<string, number>;
    priceOptions: Record<string, 'fixed' | 'custom'>;
    customPrices: Record<string, string>;
    onSelect: (id: string) => void;
    onQuantityChange: (id: string, delta: number) => void;
    onPriceOptionChange: (id: string, option: 'fixed' | 'custom') => void;
    onCustomPriceChange: (id: string, value: string) => void;
}

/** Build a short spec label from variant fields, e.g. "4GB/64GB · Black" */
function buildSpecLabel(v: Variant): string {
    const parts: string[] = [];
    if (v.categoryName) parts.push(v.categoryName);
    const memory = [v.ramName, v.romName].filter(Boolean).join('/');
    if (memory) parts.push(memory);
    if (v.colorName) parts.push(v.colorName);
    return parts.join(' · ');
}

export function ProductGroup({
    groupName,
    variants,
    selectedIds,
    quantities,
    priceOptions,
    customPrices,
    onSelect,
    onQuantityChange,
    onPriceOptionChange,
    onCustomPriceChange,
}: ProductGroupProps) {

    const [expanded, setExpanded] = useState(false);

    // Check if any variant in this group is selected
    const selectedVariant = variants.find(v => selectedIds.has(v.id));

    // ── SINGLE VARIANT ──────────────────────────────────────────────────────────
    // For single variants just render a normal ProductItem with spec tag
    if (variants.length === 1) {
        const v = variants[0];
        const specLabel = buildSpecLabel(v);
        return (
            <ProductItem
                id={v.id}
                name={v.productName}
                buyingPrice={v.buyingPrice}
                sellingPrice={v.sellingPrice}
                isSelected={selectedIds.has(v.id)}
                quantity={quantities[v.id] || 1}
                onSelect={() => onSelect(v.id)}
                onQuantityChange={(delta) => onQuantityChange(v.id, delta)}
                priceOption={priceOptions[v.id] || 'fixed'}
                customPrice={customPrices[v.id] || ''}
                onPriceOptionChange={(opt) => onPriceOptionChange(v.id, opt)}
                onCustomPriceChange={(val) => onCustomPriceChange(v.id, val)}
                stock={v.stockQuantity}
                specLabel={specLabel || undefined}
            />
        );
    }

    // ── MULTI VARIANT ───────────────────────────────────────────────────────────
    return (
        <div className={cn(
            "w-full transition-all duration-300 ease-in-out rounded-[26px]",
            selectedVariant
                ? "bg-[#EFF3F9] p-2"
                : "bg-white p-2 hover:bg-gray-50"
        )}>

            {/* Group Header Row */}
            <div
                className="flex items-center gap-3 py-1 min-h-[56px] cursor-pointer"
                onClick={() => setExpanded(prev => !prev)}
            >
                {/* Icon */}
                <div className={cn(
                    "flex-none w-[56px] h-[56px] rounded-full flex items-center justify-center transition-colors duration-300 self-start",
                    selectedVariant ? "bg-[#0065F4]" : "bg-[#00D2E6]"
                )}>
                    {selectedVariant
                        ? <Check className="text-white w-7 h-7" strokeWidth={3} />
                        : <ImageIcon className="text-white w-7 h-7" />
                    }
                </div>

                {/* Name + selected variant tag */}
                <div className="flex-1 min-w-0">
                    <p className="font-roboto font-medium text-[22px] text-[#0F1828] leading-tight">{groupName}</p>
                    {selectedVariant && (
                        <p className="text-[12px] text-[#0065F4] font-semibold mt-0.5">
                            {buildSpecLabel(selectedVariant) || 'Variant selected'}
                        </p>
                    )}
                    {!selectedVariant && (
                        <p className="text-[12px] text-[#7A8C9E] font-medium mt-0.5">
                            {variants.length} variants
                        </p>
                    )}
                </div>

                {/* Expand / Collapse icon */}
                <div className="text-[#7A8C9E]">
                    {expanded
                        ? <ChevronUp size={20} strokeWidth={2} />
                        : <ChevronDown size={20} strokeWidth={2} />
                    }
                </div>
            </div>

            {/* Variant List - when expanded */}
            {expanded && (
                <div className="mt-1 flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    {variants.map(v => {
                        const isOutOfStock = v.stockQuantity !== null && v.stockQuantity <= 0;
                        const isSelected = selectedIds.has(v.id);
                        const specLabel = buildSpecLabel(v);

                        return (
                            <div
                                key={v.id}
                                onClick={() => {
                                    if (isOutOfStock) {
                                        toast.error("This variant isn't in stock");
                                        return;
                                    }
                                    // Deselect other variants in this group first
                                    variants.forEach(other => {
                                        if (other.id !== v.id && selectedIds.has(other.id)) {
                                            onSelect(other.id); // toggle off
                                        }
                                    });
                                    onSelect(v.id);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-[18px] cursor-pointer transition-colors",
                                    isOutOfStock ? "opacity-50 cursor-not-allowed" : "",
                                    isSelected
                                        ? "bg-white shadow-sm border border-blue-200"
                                        : "hover:bg-white/60 border border-transparent"
                                )}
                            >
                                {/* Small check circle */}
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    isSelected ? "bg-[#0065F4]" : "bg-gray-200"
                                )}>
                                    {isSelected && <Check className="text-white w-4 h-4" strokeWidth={3} />}
                                </div>

                                {/* Spec info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[15px] text-[#0F1828] leading-tight">
                                        {specLabel || 'Default'}
                                    </p>
                                    <p className="text-[12px] text-[#7A8C9E]">
                                        Stock: {v.stockQuantity ?? '∞'} · ৳{v.sellingPrice}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Price + Qty controls for the selected variant */}
            {selectedVariant && (
                <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-200">

                    {/* Quantity stepper */}
                    <div className="flex items-center justify-end mb-2">
                        <div
                            className="flex items-center bg-white border border-[#E0E0E0] rounded-[64px] h-[42px] px-[5px] gap-[2px] shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => onQuantityChange(selectedVariant.id, -1)}
                                className="w-[33px] h-[33px] rounded-full bg-[#F2F4F5] flex items-center justify-center text-[#0065F4] hover:bg-gray-200 active:scale-95 transition"
                            >
                                <span className="text-xl font-bold">−</span>
                            </button>
                            <span className="w-[33px] text-center font-roboto font-medium text-[17px] text-[#0F1828]">
                                {quantities[selectedVariant.id] || 1}
                            </span>
                            <button
                                onClick={() => onQuantityChange(selectedVariant.id, 1)}
                                className="w-[33px] h-[33px] rounded-full bg-[#F2F4F5] flex items-center justify-center text-[#0065F4] hover:bg-gray-200 active:scale-95 transition"
                            >
                                <span className="text-xl font-bold">+</span>
                            </button>
                        </div>
                    </div>

                    {/* Price options */}
                    <div className="flex gap-2">
                        {/* Fixed Price */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onPriceOptionChange(selectedVariant.id, 'fixed');
                            }}
                            className="flex-1 h-[38px] bg-white border border-[#E0E0E0] rounded-[18px] p-[4px] flex items-center cursor-pointer hover:border-blue-400 transition-colors"
                        >
                            <div className={cn(
                                "w-full h-full rounded-[43px] flex items-center justify-center transition-colors duration-200",
                                (priceOptions[selectedVariant.id] || 'fixed') === 'fixed' ? "bg-[#F2F4F5]" : "bg-transparent"
                            )}>
                                <span className={cn(
                                    "font-roboto text-[18px]",
                                    (priceOptions[selectedVariant.id] || 'fixed') === 'fixed' ? "font-bold text-[#0065F4]" : "font-normal text-[#0F1828]"
                                )}>
                                    {selectedVariant.sellingPrice}
                                </span>
                            </div>
                        </div>

                        {/* Custom Price */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onPriceOptionChange(selectedVariant.id, 'custom');
                            }}
                            className="flex-1 h-[38px] bg-white border border-[#E0E0E0] rounded-[18px] p-[4px] flex items-center cursor-pointer hover:border-blue-400 transition-colors"
                        >
                            <div className={cn(
                                "w-full h-full rounded-[43px] flex items-center justify-center transition-colors duration-200",
                                priceOptions[selectedVariant.id] === 'custom' ? "bg-[#F2F4F5]" : "bg-transparent"
                            )}>
                                {priceOptions[selectedVariant.id] === 'custom' ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        inputMode="decimal"
                                        value={customPrices[selectedVariant.id] || ''}
                                        onChange={(e) => onCustomPriceChange(selectedVariant.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-transparent text-center font-roboto font-bold text-[18px] text-[#0F1828] outline-none placeholder:text-gray-400"
                                        placeholder="0"
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
