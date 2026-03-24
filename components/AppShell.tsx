"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LoginDialog from "./LoginDialog";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();

    return (
        <>
            {/* 401 内联登录对话框（全局挂载） */}
            <LoginDialog />

            {/* 未登录则不渲染 Shell */}
            {!isAuthenticated ? (
                <>{children}</>
            ) : (
                <div className="app-layout">
                    <Sidebar />
                    <div className="main-area">
                        <TopBar />
                        <main className="content-area fade-in">{children}</main>
                    </div>
                </div>
            )}
        </>
    );
}
