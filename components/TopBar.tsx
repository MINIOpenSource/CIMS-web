"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@fluentui/react-components";
import { SignOut24Regular, Settings24Regular } from "@fluentui/react-icons";

export default function TopBar({ title }: { title?: string }) {
    const { logout } = useAuth();

    return (
        <header className="topbar">
            <div className="topbar-title">{title || "CIMS 管理面板"}</div>
            <div className="topbar-right">
                <Button
                    appearance="subtle"
                    icon={<Settings24Regular />}
                    as="a"
                    href="/security"
                    size="small"
                />
                <Button
                    appearance="subtle"
                    icon={<SignOut24Regular />}
                    onClick={logout}
                    size="small"
                >
                    登出
                </Button>
            </div>
        </header>
    );
}
