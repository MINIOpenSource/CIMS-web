"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccount } from "@/lib/account-context";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LoginDialog from "./LoginDialog";

/** 不需要侧栏的页面 */
const SHELL_EXCLUDED_PATHS = ["/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const { accountId } = useAccount();
    const pathname = usePathname();

    const isExcluded = SHELL_EXCLUDED_PATHS.some(p => pathname.startsWith(p));
    const isAccountListPage = pathname === "/";

    // 需要完整 Shell 的条件：已登录 + 已选择账户 + 不在排除页面 + 不在账户列表页
    const showFullShell = isAuthenticated && accountId && !isExcluded && !isAccountListPage;

    return (
        <>
            {/* 401 内联登录对话框（全局挂载） */}
            <LoginDialog />

            {showFullShell ? (
                <div className="app-layout">
                    <Sidebar />
                    <div className="main-area">
                        <TopBar />
                        <main className="content-area fade-in">{children}</main>
                    </div>
                </div>
            ) : (
                <>{children}</>
            )}
        </>
    );
}
