'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, LayoutDashboard, Package, Wrench, ShoppingCart } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    const menuItems = [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', path: '/inventory/products', icon: Package },
        { name: 'Services', path: '/inventory/services', icon: Wrench },
        { name: 'New Sale (POS)', path: '/pos', icon: ShoppingCart },
    ];

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-40 shadow-sm">
                <button
                    className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-700"
                    onClick={toggleSidebar}
                    aria-label="Toggle Menu"
                >
                    <Menu size={24} />
                </button>
                <div className="ml-4 font-bold text-lg text-gray-900">Jinath Telecom</div>
            </div>

            {/* Overlay (Mobile Only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#E0E0E0] text-[#0F1828] transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="flex h-full flex-col font-sans">
                    {/* Header */}
                    <div className="flex h-[60px] items-center px-6 border-b border-[#E0E0E0]">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-[#0F1828]">Jinath Telecom</h2>
                            <p className="text-xs text-[#6B7280] font-medium">Management System</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-4 px-3">
                        <nav className="space-y-1">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`
                                            flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200
                                            ${isActive
                                                ? 'bg-[#EFF3F9] text-[#0065F4]'
                                                : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                                            }
                                        `}
                                        onClick={closeSidebar}
                                    >
                                        {/* Icon removed as per user request */}
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-[#E0E0E0]">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
