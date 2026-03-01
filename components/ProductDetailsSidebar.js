'use client';

import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Check, ChevronLeft } from 'lucide-react';

export default function ProductDetailsSidebar({ product, onClose }) {
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
        });
    };

    const handleEditSave = async (logId) => {
        try {
            const res = await fetch('/api/inventory/logs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: logId, ...editForm }),
            });
            const data = await res.json();
            if (data.success) {
                setEditingLogId(null);
                fetchLogs();
            } else {
                alert('Update failed: ' + (data.error || 'Unknown error'));
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
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h2>
                            <p className="text-sm text-gray-500">Inventory Details</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors bg-gray-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Integrated Specs Banner */}
                    <div className="flex flex-wrap gap-2">
                        {product.category_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 cursor-default" title="Model">
                                {product.category_name}
                            </span>
                        )}
                        {(product.ram_name || product.rom_name) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 cursor-default" title="RAM / ROM">
                                {product.ram_name || 'N/A'}/{product.rom_name || 'N/A'}
                            </span>
                        )}
                        {product.color_name && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 cursor-default" title="Color">
                                {product.color_name}
                            </span>
                        )}
                        {product.imei && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200 cursor-default" title="IMEI Number">
                                IMEI: {product.imei}
                            </span>
                        )}
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
                                                    { editingLogId === log.id ? (
                                                        // --- EDIT ROW FULL WIDTH (Fixes layout breaks) ---
                                                        <td colSpan="5" className="p-3 bg-blue-50/50">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Date</label>
                                                                        <input
                                                                            type="date"
                                                                            value={editForm.created_at}
                                                                            onChange={e => setEditForm(f => ({ ...f, created_at: e.target.value }))}
                                                                            className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Quantity</label>
                                                                        <input
                                                                            type="number"
                                                                            value={editForm.quantity}
                                                                            onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                                                                            className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Buy Price</label>
                                                                        <input
                                                                            type="number"
                                                                            value={editForm.buy_price}
                                                                            onChange={e => setEditForm(f => ({ ...f, buy_price: parseFloat(e.target.value) }))}
                                                                            className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Sell Price</label>
                                                                        <input
                                                                            type="number"
                                                                            value={editForm.sell_price}
                                                                            onChange={e => setEditForm(f => ({ ...f, sell_price: parseFloat(e.target.value) }))}
                                                                            className="w-full text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-100 mt-1">
                                                                    <button
                                                                        onClick={() => setEditingLogId(null)}
                                                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-md transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditSave(log.id)}
                                                                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Check size={14} /> Save Changes
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        // --- VIEW ROW ---
                                                        <>
                                                            <td className="px-3 py-3 text-gray-600">
                                                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{log.note || 'Restock'}</div>
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
