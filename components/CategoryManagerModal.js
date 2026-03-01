'use client';
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Check, XCircle, Plus } from 'lucide-react';

export default function CategoryManagerModal({ isOpen, onClose, onUpdate }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab state
    const tabs = [
        { id: 'product', label: 'Models' },
        { id: 'ram', label: 'RAM' },
        { id: 'rom', label: 'ROM' },
        { id: 'color', label: 'Color' }
    ];
    const [activeTab, setActiveTab] = useState('product');

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // Add state
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            setIsAdding(false);
            setEditingId(null);
            setError('');
        }
    }, [isOpen, activeTab]); // Automatically fetch when tab changes

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/inventory/categories?type=${activeTab}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Failed to load categories', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // --- Add ---
    const handleSaveAdd = async (e) => {
        if (e) e.preventDefault();
        if (!newName.trim()) return;

        try {
            const res = await fetch('/api/inventory/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, type: activeTab }),
            });

            if (res.ok) {
                const newCategory = await res.json();
                setCategories([...categories, newCategory]);
                setIsAdding(false);
                setNewName('');
                if (onUpdate) onUpdate();
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to add');
            }
        } catch (error) {
            setError('Failed to add');
        }
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewName('');
        setError('');
    }

    // --- Edit ---
    const handleEditClick = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setIsAdding(false); // cancel adding if editing
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setError('');
    };

    const handleSaveEdit = async (id) => {
        if (!editName.trim()) return;

        try {
            const res = await fetch('/api/inventory/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName })
            });

            if (res.ok) {
                setCategories(categories.map(c => c.id === id ? { ...c, name: editName } : c));
                setEditingId(null);
                if (onUpdate) onUpdate(); // Refresh parent list
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to update');
            }
        } catch (error) {
            setError('Failed to update');
        }
    };

    // --- Delete ---
    const handleDelete = async (id) => {
        if (!confirm('Are you sure? Removing this will affect products using it.')) return;

        try {
            const res = await fetch(`/api/inventory/categories?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
                if (onUpdate) onUpdate();
            } else {
                // Usually blocked if there are products attached
                const err = await res.json();
                setError(err.error || 'Failed to delete');
            }
        } catch (error) {
            setError('Failed to delete');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Categories & Specs</h2>
                        <p className="text-xs text-gray-500 mt-1">Add, edit, or remove dropdown options.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-4 border-b border-gray-100 gap-6 overflow-x-auto shrink-0 hide-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 overflow-y-auto bg-gray-50">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError('')}><X size={16} /></button>
                        </div>
                    )}

                    {/* Add New Button/Form */}
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dashed border-gray-300 rounded-xl text-blue-600 font-medium hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4"
                        >
                            <Plus size={18} />
                            Add New {tabs.find(t => t.id === activeTab)?.label}
                        </button>
                    ) : (
                        <form onSubmit={handleSaveAdd} className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm mb-4 flex gap-2 animate-in slide-in-from-top-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter name..."
                                className="flex-1 px-3 py-2 text-sm border-none focus:ring-0 bg-transparent outline-none"
                                autoFocus
                            />
                            <div className="flex gap-1 shrink-0">
                                <button type="button" onClick={handleCancelAdd} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <XCircle size={20} />
                                </button>
                                <button type="submit" className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1">
                                    <Check size={20} />
                                    <span>Save</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
                            No items found in this category.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {categories.map((cat) => (
                                <li key={cat.id} className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                                    {editingId === cat.id ? (
                                        <div className="flex items-center flex-1 gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 border-b-2 border-blue-500 px-1 py-1 text-sm text-gray-900 focus:outline-none bg-blue-50"
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveEdit(cat.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={handleCancelEdit} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(cat)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
