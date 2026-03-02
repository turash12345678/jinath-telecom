'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Check, ChevronLeft } from 'lucide-react';

export default function ProductDetailsSidebar({ product, onClose, onUpdate, onEditRequest, categories = [], ramCategories = [], romCategories = [], colorCategories = [] }) {
    const [logs, setLogs] = useState([]);
    const [totalEarned, setTotalEarned] = useState(0);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [editingLogId, setEditingLogId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const fetchLogs = () => {
        if (!product) return;
        setLoading(true);
        fetch(`/api/inventory/logs?product_id=${product.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.logs) {
                    setLogs(data.logs);
                    setTotalEarned(data.total_earned || 0);
                } else if (Array.isArray(data)) {
                    setLogs(data);
                    setTotalEarned(0);
                } else {
                    setLogs([]);
                    setTotalEarned(0);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch logs", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (product) fetchLogs();
    }, [product]);

    if (!product) return null;

    const totalInvestment = logs.reduce((sum, log) => sum + (log.buy_price * log.quantity), 0);

    const handleEditClick = (log) => {
        setEditingLogId(log.id);
        setEditForm({
            quantity: log.quantity,
            buy_price: log.buy_price,
            sell_price: log.sell_price || 0,
            created_at: log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            // Product fields (to allow editing categories alongside restocks)
            category_id: product.category_id || '',
            ram_id: product.ram_id || '',
            rom_id: product.rom_id || '',
            color_id: product.color_id || ''
        });
    };

    const handleEditSave = async (logId) => {
        try {
            // 1. Update Restock Log
            const logRes = await fetch('/api/inventory/logs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: logId,
                    quantity: editForm.quantity,
                    buy_price: editForm.buy_price,
                    sell_price: editForm.sell_price,
                    created_at: editForm.created_at
                }),
            });
            const logData = await logRes.json();

            // 2. Update Product Categories if they were changed
            const hasCategoryChanges =
                editForm.category_id != product.category_id ||
                editForm.ram_id != product.ram_id ||
                editForm.rom_id != product.rom_id ||
                editForm.color_id != product.color_id;

            if (hasCategoryChanges) {
                await fetch('/api/inventory/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: product.id,
                        name: product.name, // Keep existing name
                        category_id: editForm.category_id || null,
                        ram_id: editForm.ram_id || null,
                        rom_id: editForm.rom_id || null,
                        color_id: editForm.color_id || null
                    })
                });

                // Let the parent component know so it refreshes the product UI
                if (onUpdate) onUpdate();
            }

            if (logData.success) {
                setEditingLogId(null);
                fetchLogs();
            } else {
                alert('Update failed: ' + (logData.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (logId) => {
        if (!confirm('Are you sure you want to delete this stock entry? The quantity will be deducted from the product.')) return;
        try {
            const res = await fetch(`/api/inventory/logs?id=${logId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchLogs();
            } else {
                alert('Delete failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[99] backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Panel: bottom sheet on mobile, right sidebar on desktop */}
            <div className="
                fixed z-[100] bg-white shadow-2xl flex flex-col
                /* Mobile: bottom sheet */
                bottom-0 left-0 right-0 h-[85vh] rounded-t-[28px]
                /* Desktop: right sidebar */
                md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-full md:max-w-md md:rounded-none md:border-l md:border-gray-100
                transition-all duration-300 ease-out
            ">
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="px-5 py-5 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                            </div>
                            <p className="text-sm text-gray-500">Inventory Details</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors bg-gray-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable History */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Batch History Table */}
                    <div className="mb-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            Restock & Sales History
                        </h3>

                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-2 py-3 text-right">Qty</th>
                                        <th className="px-2 py-3 text-right">Buy</th>
                                        <th className="px-2 py-3 text-right">Sell</th>
                                        <th className="px-2 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-4 text-center text-gray-400">Loading history...</td></tr>
                                    ) : logs.length === 0 ? (
                                        <tr><td colSpan="5" className="p-4 text-center text-gray-400">No history found.</td></tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                {editingLogId === log.id ? (
                                                    // --- EDIT ROW FULL WIDTH (Fixes layout breaks) ---
                                                    <td colSpan="5" className="px-6 py-4 bg-white border-b border-gray-100">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={editForm.created_at}
                                                                        onChange={e => setEditForm(f => ({ ...f, created_at: e.target.value }))}
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Quantity</label>
                                                                    <input
                                                                        type="number"
                                                                        value={editForm.quantity}
                                                                        onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Buy Price</label>
                                                                    <input
                                                                        type="number"
                                                                        value={editForm.buy_price}
                                                                        onChange={e => setEditForm(f => ({ ...f, buy_price: parseFloat(e.target.value) }))}
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Sell Price</label>
                                                                    <input
                                                                        type="number"
                                                                        value={editForm.sell_price}
                                                                        onChange={e => setEditForm(f => ({ ...f, sell_price: parseFloat(e.target.value) }))}
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-1">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Model</label>
                                                                    <select
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                        value={editForm.category_id}
                                                                        onChange={e => setEditForm(f => ({ ...f, category_id: e.target.value }))}
                                                                    >
                                                                        <option value="">None</option>
                                                                        {(Array.isArray(categories) ? categories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Color</label>
                                                                    <select
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                        value={editForm.color_id}
                                                                        onChange={e => setEditForm(f => ({ ...f, color_id: e.target.value }))}
                                                                    >
                                                                        <option value="">None</option>
                                                                        {(Array.isArray(colorCategories) ? colorCategories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">RAM</label>
                                                                    <select
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                        value={editForm.ram_id}
                                                                        onChange={e => setEditForm(f => ({ ...f, ram_id: e.target.value }))}
                                                                    >
                                                                        <option value="">None</option>
                                                                        {(Array.isArray(ramCategories) ? ramCategories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">ROM</label>
                                                                    <select
                                                                        className="w-full text-sm font-medium border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 bg-white"
                                                                        value={editForm.rom_id}
                                                                        onChange={e => setEditForm(f => ({ ...f, rom_id: e.target.value }))}
                                                                    >
                                                                        <option value="">None</option>
                                                                        {(Array.isArray(romCategories) ? romCategories : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
                                                                <button
                                                                    onClick={() => setEditingLogId(null)}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-gray-50 rounded-md transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditSave(log.id)}
                                                                    className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                                                                >
                                                                    <Check size={16} strokeWidth={2.5} /> Save Changes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    // --- VIEW ROW ---
                                                    <>
                                                        <td className="px-3 py-3 text-gray-600">
                                                            {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                            <div className="text-[10px] text-gray-400 uppercase tracking-wide flex flex-wrap gap-1 mt-0.5">
                                                                {log.note === 'Initial Stock' ? (
                                                                    <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-semibold">Initial</span>
                                                                ) : (
                                                                    <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Restock</span>
                                                                )}
                                                                {log.ram_name && <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{log.ram_name}</span>}
                                                                {log.rom_name && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{log.rom_name}</span>}
                                                                {log.color_name && <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded">{log.color_name}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-3 text-right font-medium text-gray-900">{log.quantity}</td>
                                                        <td className="px-2 py-3 text-right text-gray-600">
                                                            <span className="font-extrabold mr-0.5">৳</span>{log.buy_price}
                                                        </td>
                                                        <td className="px-2 py-3 text-right text-emerald-600">
                                                            <span className="font-extrabold mr-0.5">৳</span>{log.sell_price || '-'}
                                                        </td>
                                                        <td className="px-2 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handleEditClick(log)}
                                                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(log.id)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Overview Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Total Invest</p>
                            <p className="text-xl font-bold text-gray-900 flex items-center">
                                <span className="text-xl mr-1 font-extrabold">৳</span>
                                {totalInvestment.toLocaleString()}
                            </p>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Total Earned</p>
                            <p className="text-xl font-bold text-emerald-700 flex items-center">
                                <span className="text-xl mr-1 font-extrabold">৳</span>
                                {totalEarned.toLocaleString()}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
