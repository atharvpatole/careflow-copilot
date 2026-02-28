"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, FileText, Menu, X } from "lucide-react";

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/forecast", label: "Forecast", icon: TrendingUp },
    { href: "/note-analyzer", label: "Note Analyzer", icon: FileText },
];

export function MobileNav() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pathname = usePathname();

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-14 md:h-16 items-center px-4 md:px-6">
                    {/* Hamburger - mobile only */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="md:hidden mr-3 p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-stone-700" />
                    </button>

                    <Link
                        href="/"
                        className="flex items-center gap-1.5 font-semibold tracking-tight text-base md:text-lg mr-6"
                    >
                        <span className="text-blue-600">CareFlow</span>
                        <span className="text-stone-400">Copilot</span>
                    </Link>

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 transition-colors ${isActive
                                            ? "text-blue-600 font-semibold"
                                            : "text-stone-600 hover:text-stone-900"
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-[100] mobile-nav-backdrop"
                    onClick={() => setDrawerOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* Drawer Panel */}
                    <div
                        className="mobile-nav-drawer absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                            <div className="flex items-center gap-1.5 font-semibold text-lg">
                                <span className="text-blue-600">CareFlow</span>
                                <span className="text-stone-400">Copilot</span>
                            </div>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 -mr-2 rounded-xl hover:bg-stone-100 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5 text-stone-500" />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 py-4 px-3 space-y-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? "bg-blue-50 text-blue-700 font-semibold"
                                                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100"
                                            }`}
                                    >
                                        <link.icon
                                            className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-stone-400"
                                                }`}
                                        />
                                        {link.label}
                                        {isActive && (
                                            <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Drawer Footer */}
                        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/50">
                            <p className="text-xs text-stone-400 text-center">
                                CareFlow Copilot &middot; Clinical AI
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
