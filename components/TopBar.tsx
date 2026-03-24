"use client";

import React from "react";
import UserMenu from "./UserMenu";

export default function TopBar({ title }: { title?: string }) {
    return (
        <header className="topbar">
            <div className="topbar-title">{title || "CIMS 管理面板"}</div>
            <div className="topbar-right">
                <UserMenu />
            </div>
        </header>
    );
}
