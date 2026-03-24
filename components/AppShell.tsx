"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();

    /* 未登录则不渲染 Shell */
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <TopBar />
                <main className="content-area fade-in">{children}</main>
            </div>
        </div>
    );
}
