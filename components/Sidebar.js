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
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
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
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b flex items-center px-4 z-40">
                <button
                    className="p-2 -ml-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                    onClick={toggleSidebar}
                    aria-label="Toggle Menu"
                >
                    <Menu size={24} />
                </button>
                <div className="ml-4 font-semibold text-lg">Jinath Telecom</div>
            </div>

            {/* Overlay (Mobile Only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 border-r bg-card text-card-foreground transition-transform duration-300 ease-in-out md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:static md:block
            `}>
                <div className="flex h-16 items-center border-b px-6">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Jinath Telecom</h2>
                        <p className="text-xs text-muted-foreground">Management System</p>
                    </div>
                </div>

                <div className="px-3 py-2">
                    <div className="mb-2 px-4 text-[10px] font-mono uppercase text-muted-foreground/50 text-right">
                        DEV v0.5
                    </div>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`
                                        flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }
                                    `}
                                    onClick={closeSidebar}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-4 left-0 right-0 px-3">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}
