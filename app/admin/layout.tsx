"use client";

/**
 * SuperAdmin 面板布局。
 * 仅超级管理员可访问，否则重定向到首页。
 */

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home24Regular, People24Regular,
    PersonAccounts24Regular, ArrowLeft24Regular,
} from "@fluentui/react-icons";

const ADMIN_NAV = [
    { label: "概览", href: "/admin", icon: <Home24Regular /> },
    { label: "用户管理", href: "/admin/users", icon: <People24Regular /> },
    { label: "账户管理", href: "/admin/accounts", icon: <PersonAccounts24Regular /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isSuperAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        } else if (!isSuperAdmin) {
            router.push("/");
        }
    }, [isAuthenticated, isSuperAdmin, router]);

    if (!isAuthenticated || !isSuperAdmin) return null;

    return (
        <div className="app-layout">
            <aside className="sidebar admin-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.svg" alt="ClassIsland" className="sidebar-logo" />
                    <div className="sidebar-title">超管面板</div>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-label">平台管理</div>
                        {ADMIN_NAV.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${isActive ? "active" : ""}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="sidebar-section">
                        <Link href="/" className="sidebar-link">
                            <ArrowLeft24Regular />
                            <span>返回管理面板</span>
                        </Link>
                    </div>
                </nav>
            </aside>
            <div className="main-area">
                <header className="topbar admin-topbar">
                    <div className="topbar-title">CIMS 超级管理员</div>
                    <div className="topbar-right">
                        {/* UserMenu is in the parent AppShell, not duplicated here */}
                    </div>
                </header>
                <main className="content-area fade-in">{children}</main>
            </div>
        </div>
    );
}
