'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Pencil, Trash2, Check, Filter } from 'lucide-react';

// Helper for formatting dates nicely - defined at module scope for reliability
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ProductDetailsSidebar({ product, onClose, onUpdate, categories = [], ramCategories = [], romCategories = [], colorCategories = [] }) {
    // All variants of the same model (same product name)
    const [variants, setVariants] = useState([]);
    const [loadingVariants, setLoadingVariants] = useState(true);

    // Expanded variant → shows its logs
    const [expandedId, setExpandedId] = useState(null);
    const [logsMap, setLogsMap] = useState({});         // productId -> logs[]
    const [loadingLogs, setLoadingLogs] = useState({});  // productId -> bool
    const [totalEarnedMap, setTotalEarnedMap] = useState({});

    // Per-variant (or per-group) filter state
    const [filterType, setFilterType] = useState({});   // id -> 'all'|'initial'|'restock'
    const [filterMonth, setFilterMonth] = useState({}); // id -> 'yyyy-mm'
    const [filterRam, setFilterRam] = useState({});     // groupName -> ramName
    const [filterRom, setFilterRom] = useState({});     // groupName -> romName
    const [filterColor, setFilterColor] = useState({}); // groupName -> colorName
    const [categoryFilter, setCategoryFilter] = useState(''); // Category filter for entire sidebar

    // Edit state
    const [editingLogId, setEditingLogId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // When product changes, fetch all variants with the same name
    useEffect(() => {
        if (!product) return;
        setLoadingVariants(true);
        setLogsMap({});
        setExpandedId(product.id);

        // Fetch all products, filter by same name
        fetch('/api/inventory/products')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const sameModel = data.filter(p => p.name === product.name);
                    setVariants(sameModel.length > 0 ? sameModel : [product]);
                } else {
                    setVariants([product]);
                }
                setLoadingVariants(false);
                // Auto-load logs for the clicked product
                fetchLogs(product.id);
            })
            .catch(() => {
                setVariants([product]);
                setLoadingVariants(false);
            });
    }, [product?.id]);

    const fetchLogs = async (productId) => {
        if (logsMap[productId] !== undefined) return;
        setLoadingLogs(prev => ({ ...prev, [productId]: true }));
        try {
            const res = await fetch(`/api/inventory/logs?product_id=${productId}`);
            const data = await res.json();
            setLogsMap(prev => ({ ...prev, [productId]: data.logs || [] }));
            setTotalEarnedMap(prev => ({ ...prev, [productId]: data.total_earned || 0 }));
        } catch (e) {
            setLogsMap(prev => ({ ...prev, [productId]: [] }));
        }
        setLoadingLogs(prev => ({ ...prev, [productId]: false }));
    };

    const refreshLogs = (productId) => {
        setLogsMap(prev => { const n = { ...prev }; delete n[productId]; return n; });
        fetchLogs(productId);
    };

    const toggleVariant = (productId) => {
        if (expandedId === productId) {
            setExpandedId(null);
            setEditingLogId(null);
        } else {
            setExpandedId(productId);
            setEditingLogId(null);
            fetchLogs(productId);
        }
    };

    const getFilterType = (id) => filterType[id] || 'all';
    const getFilterMonth = (id) => filterMonth[id] || '';
    const getFilterRam = (group) => filterRam[group] || '';
    const getFilterRom = (group) => filterRom[group] || '';
    const getFilterColor = (group) => filterColor[group] || '';

    const handleEditClick = (log, prod) => {
        setEditingLogId(log.id);
        setEditForm({
            quantity: log.quantity,
            buy_price: log.buy_price,
            sell_price: log.sell_price || 0,
            created_at: log.created_at ? log.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            category_id: prod.category_id || '',
            ram_id: prod.ram_id || '',
            rom_id: prod.rom_id || '',
            color_id: prod.color_id || ''
        });
    };

    const handleEditSave = async (logId, prod) => {
        try {
            const logRes = await fetch('/api/inventory/logs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: logId, quantity: editForm.quantity, buy_price: editForm.buy_price, sell_price: editForm.sell_price, created_at: editForm.created_at }),
            });
            const logData = await logRes.json();

            const hasCategoryChanges = editForm.category_id != prod.category_id || editForm.ram_id != prod.ram_id || editForm.rom_id != prod.rom_id || editForm.color_id != prod.color_id;
            if (hasCategoryChanges) {
                await fetch('/api/inventory/products', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: prod.id, name: prod.name, category_id: editForm.category_id || null, ram_id: editForm.ram_id || null, rom_id: editForm.rom_id || null, color_id: editForm.color_id || null })
                });
                if (onUpdate) onUpdate();
            }

            if (logData.success) {
                setEditingLogId(null);
                refreshLogs(prod.id);
            } else {
                alert('Update failed: ' + (logData.error || 'Unknown'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async (logId, productId) => {
        if (!confirm('Delete this stock entry?')) return;
        try {
            const res = await fetch(`/api/inventory/logs?id=${logId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) refreshLogs(productId);
            else alert('Delete failed: ' + (data.error || 'Unknown'));
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (!product) return null;

    // Group variants by Category (Model) Name
    const groupeds = variants.reduce((acc, v) => {
        const key = v.category_name || v.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
    }, {});
    const groupedKeys = Object.keys(groupeds);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-[99] backdrop-blur-[2px]" onClick={onClose} />

            {/* Panel */}
            <div className="
                fixed z-[100] bg-white shadow-2xl flex flex-col
                bottom-0 left-0 right-0 h-[90vh] rounded-t-[28px]
                md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-full md:max-w-lg md:rounded-none md:border-l md:border-gray-100
            ">
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Inventory Details</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Product</p>
                            <p className="text-base font-semibold text-gray-800">{product.name}</p>
                        </div>
                        <div className="shrink-0">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Category</p>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 bg-white"
                            >
                                <option value="">All</option>
                                {Array.from(new Set(groupedKeys)).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-12 flex flex-col gap-3">

                    {loadingVariants ? (
                        <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
                    ) : (
                        /* Group boxes */
                        groupedKeys
                            .filter(groupName => !categoryFilter || groupName === categoryFilter)
                            .map(groupName => {
                                const groupVariants = groupeds[groupName];
                                // We use the groupName as the expandedId since it represents a model
                                const isExpanded = expandedId === groupName;

                                // Fetch logs for all variants in group if expanded
                                // But actual logsMap fetching logic uses productId.
                                // We need to trigger fetch for all variants when group is expanded:
                                const handleGroupClick = () => {
                                    if (isExpanded) {
                                        setExpandedId(null);
                                        setEditingLogId(null);
                                    } else {
                                        setExpandedId(groupName);
                                        setEditingLogId(null);
                                        groupVariants.forEach(v => fetchLogs(v.id));
                                    }
                                };

                                // Aggregate data
                                const totalStock = groupVariants.reduce((s, v) => s + v.stock_quantity, 0);
                                // For display, just taking the first price or lowest price
                                const minPrice = Math.min(...groupVariants.map(v => v.sell_price || 0));

                                // Gather all logs for group (flattened)
                                let allLogs = [];
                                let totalEarned = 0;
                                let anyLoadingLog = false;
                                groupVariants.forEach(v => {
                                    const vLogs = logsMap[v.id] || [];
                                    // Tag logs with the variant they belong to so we can filter later
                                    vLogs.forEach(l => allLogs.push({ ...l, _variant: v }));
                                    totalEarned += totalEarnedMap[v.id] || 0;
                                    if (loadingLogs[v.id]) anyLoadingLog = true;
                                });
                                // Sort combined logs by date descending
                                allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                                const totalInvest = allLogs.reduce((s, l) => s + l.buy_price * l.quantity, 0);

                                // Distinct RAM, ROM, Color in this group for the dropdowns
                                const distinctRams = Array.from(new Set(groupVariants.map(v => v.ram_name).filter(Boolean)));
                                const distinctRoms = Array.from(new Set(groupVariants.map(v => v.rom_name).filter(Boolean)));
                                const distinctColors = Array.from(new Set(groupVariants.map(v => v.color_name).filter(Boolean)));

                                // Apply group filters
                                const fType = getFilterType(groupName);
                                const fMonth = getFilterMonth(groupName);
                                const fRam = getFilterRam(groupName);
                                const fRom = getFilterRom(groupName);
                                const fColor = getFilterColor(groupName);

                                const filteredLogs = allLogs.filter(log => {
                                    if (fType === 'initial' && log.note !== 'Initial Stock') return false;
                                    if (fType === 'restock' && log.note === 'Initial Stock') return false;
                                    if (fMonth && log.created_at?.slice(0, 7) !== fMonth) return false;
                                    if (fRam && log._variant.ram_name !== fRam) return false;
                                    if (fRom && log._variant.rom_name !== fRom) return false;
                                    if (fColor && log._variant.color_name !== fColor) return false;
                                    return true;
                                });

                                return (
                                    <div key={groupName} className={`bg-white rounded-2xl border shadow-sm shrink-0 relative ${isExpanded ? 'border-blue-200 pb-2' : 'border-gray-100'}`}>

                                        {/* Group header — clickable to expand */}
                                        <button
                                            className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left sticky top-0 z-10 bg-white rounded-t-2xl ${isExpanded ? 'border-b border-gray-100 shadow-sm' : 'rounded-b-2xl'}`}
                                            onClick={handleGroupClick}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-semibold text-gray-800 truncate">{groupName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {groupVariants.length} distinct spec{groupVariants.length > 1 ? 's' : ''} inside
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-2 shrink-0">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 font-medium">Total Stock: <span className="font-bold text-gray-800">{totalStock}</span></div>
                                                    <div className="text-sm font-bold text-emerald-600">From ৳{minPrice}</div>
                                                </div>
                                                {isExpanded ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-gray-400" />}
                                            </div>
                                        </button>

                                        {/* Expanded: full history */}
                                        {isExpanded && (
                                            <div>
                                                {/* Financial summary */}
                                                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50/50">
                                                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center shadow-sm">
                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Invest</p>
                                                        <p className="text-lg font-bold text-gray-800">৳{totalInvest.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center shadow-sm">
                                                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Total Earned</p>
                                                        <p className="text-lg font-bold text-emerald-700">৳{totalEarned.toLocaleString()}</p>
                                                    </div>
                                                </div>



                                                {/* History table */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-gray-100/50 text-xs text-gray-500 uppercase tracking-wider">
                                                            <tr>
                                                                <th className="px-4 py-3 font-semibold">Specs & Date</th>
                                                                <th className="px-3 py-3 font-semibold text-right">Qty</th>
                                                                <th className="px-3 py-3 font-semibold text-right">Buy</th>
                                                                <th className="px-3 py-3 font-semibold text-right">Sell</th>
                                                                <th className="px-3 py-3 font-semibold text-center">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {anyLoadingLog ? (
                                                                <tr><td colSpan="5" className="p-6 text-center text-gray-500 text-sm font-medium">Loading history...</td></tr>
                                                            ) : filteredLogs.length === 0 ? (
                                                                <tr><td colSpan="5" className="p-6 text-center text-gray-500 text-sm font-medium">No entries found for this combination.</td></tr>
                                                            ) : filteredLogs.map(log => (
                                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                                            {log._variant.ram_name && <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{log._variant.ram_name}</span>}
                                                                            {log._variant.rom_name && <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{log._variant.rom_name}</span>}
                                                                            {log._variant.color_name && <span className="text-[11px] font-medium text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded">{log._variant.color_name}</span>}
                                                                        </div>
                                                                        <div className="font-medium text-gray-800 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                                                            {formatDate(log.created_at)}
                                                                            <span className="text-xs text-gray-400 font-normal uppercase tracking-wider">{log.note === 'Initial Stock' ? 'INITIAL' : log.note === 'Restock' ? 'RESTOCK' : 'SALE'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-3 text-right font-medium text-gray-900">{log.quantity}</td>
                                                                    <td className="px-3 py-3 text-right text-gray-600"><span className="font-extrabold pr-0.5">৳</span>{log.buy_price}</td>
                                                                    <td className="px-3 py-3 text-right text-emerald-600 font-medium"><span className="font-extrabold pr-0.5">৳</span>{log.sell_price || '-'}</td>
                                                                    <td className="px-3 py-3 text-center">
                                                                        <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => handleEditClick(log, log._variant)} className={`p-2 rounded-lg transition-colors ${editingLogId === log.id ? 'text-blue-600 bg-blue-100' : 'text-blue-500 hover:bg-blue-50'}`}><Pencil size={14} /></button>
                                                                            <button onClick={() => handleDelete(log.id, log._variant.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Edit Form */}
                                                {editingLogId && filteredLogs.some(l => l.id === editingLogId) && (() => {
                                                    const log = filteredLogs.find(l => l.id === editingLogId);
                                                    return (
                                                        <div className="mx-3 mb-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-3">✏️ Editing Entry</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                                                    <input type="date" value={editForm.created_at} onChange={e => setEditForm(f => ({ ...f, created_at: e.target.value }))} className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qty</label>
                                                                    <input type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Buy Price</label>
                                                                    <input type="number" value={editForm.buy_price} onChange={e => setEditForm(f => ({ ...f, buy_price: parseFloat(e.target.value) }))} className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sell Price</label>
                                                                    <input type="number" value={editForm.sell_price} onChange={e => setEditForm(f => ({ ...f, sell_price: parseFloat(e.target.value) }))} className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Model</label>
                                                                    <select className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none" value={editForm.category_id} onChange={e => setEditForm(f => ({ ...f, category_id: e.target.value }))}>
                                                                        <option value="">None</option>
                                                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Color</label>
                                                                    <select className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none" value={editForm.color_id} onChange={e => setEditForm(f => ({ ...f, color_id: e.target.value }))}>
                                                                        <option value="">None</option>
                                                                        {colorCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">RAM</label>
                                                                    <select className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none" value={editForm.ram_id} onChange={e => setEditForm(f => ({ ...f, ram_id: e.target.value }))}>
                                                                        <option value="">None</option>
                                                                        {ramCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ROM</label>
                                                                    <select className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none" value={editForm.rom_id} onChange={e => setEditForm(f => ({ ...f, rom_id: e.target.value }))}>
                                                                        <option value="">None</option>
                                                                        {romCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-blue-200">
                                                                <button onClick={() => setEditingLogId(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                                                <button onClick={() => handleEditSave(log.id, log._variant)} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
                                                                    <Check size={14} /> Save Changes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                    <button onClick={onClose} className="w-full py-3 text-base bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        Close
                    </button>
                </div>
            </div>
        </>
    );
}
