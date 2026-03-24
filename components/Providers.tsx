"use client";

import React from "react";
import {
    FluentProvider,
    webLightTheme,
} from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AccountProvider } from "@/lib/account-context";

/* 自定义主题：覆盖字体为 HarmonyOS Sans SC */
const cimsTheme: Theme = {
    ...webLightTheme,
    fontFamilyBase: "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** 内部包裹层，确保 AccountProvider 能读取 Auth 状态 */
function InnerProviders({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    return (
        <AccountProvider isAuthenticated={isAuthenticated}>
            {children}
        </AccountProvider>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FluentProvider theme={cimsTheme}>
            <AuthProvider>
                <InnerProviders>{children}</InnerProviders>
            </AuthProvider>
        </FluentProvider>
    );
}
