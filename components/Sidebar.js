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
                fixed top-0 left-0 z-50 h-[100dvh] w-64 bg-white border-r border-gray-100 text-gray-900 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex h-16 items-center px-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-gray-900">Jinath Telecom</h2>
                            <p className="text-xs text-gray-500 font-medium">Management System</p>
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
                                            flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }
                                        `}
                                        onClick={closeSidebar}
                                    >
                                        <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
