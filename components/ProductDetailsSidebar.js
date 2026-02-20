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
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-out border-l border-gray-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                    <p className="text-sm text-gray-500">Inventory Details</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">

                {/* Batch History Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Batch History
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
                                                // --- EDIT ROW ---
                                                <>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="date"
                                                            value={editForm.created_at}
                                                            onChange={e => setEditForm(f => ({ ...f, created_at: e.target.value }))}
                                                            className="w-full text-xs border border-blue-300 rounded px-1 py-0.5"
                                                        />
                                                        <div className="text-[10px] text-gray-400 uppercase mt-0.5">{log.note || 'Restock'}</div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={editForm.quantity}
                                                            onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                                                            className="w-14 text-xs border border-blue-300 rounded px-1 py-0.5 text-right"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={editForm.buy_price}
                                                            onChange={e => setEditForm(f => ({ ...f, buy_price: parseFloat(e.target.value) }))}
                                                            className="w-16 text-xs border border-blue-300 rounded px-1 py-0.5 text-right"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            value={editForm.sell_price}
                                                            onChange={e => setEditForm(f => ({ ...f, sell_price: parseFloat(e.target.value) }))}
                                                            className="w-16 text-xs border border-blue-300 rounded px-1 py-0.5 text-right"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleEditSave(log.id)}
                                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                                title="Save"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingLogId(null)}
                                                                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                                                title="Cancel"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
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
                        <p className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="text-2xl mr-1 font-extrabold">৳</span>
                            {totalInvestment.toLocaleString()}
                        </p>
                    </div>

                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">Total Earned</p>
                        <p className="text-2xl font-bold text-emerald-700 flex items-center">
                            <span className="text-2xl mr-1 font-extrabold">৳</span>
                            {totalEarned.toLocaleString()}
                        </p>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Close Details
                </button>
            </div>
        </div>
    );
}
