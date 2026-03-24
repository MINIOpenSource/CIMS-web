"use client";

import React from "react";
import {
    FluentProvider,
    webLightTheme,
} from "@fluentui/react-components";
import type { Theme } from "@fluentui/react-components";
import { AuthProvider } from "@/lib/auth-context";

/* 自定义主题：覆盖字体为 HarmonyOS Sans SC */
const cimsTheme: Theme = {
    ...webLightTheme,
    fontFamilyBase: "'HarmonyOS Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FluentProvider theme={cimsTheme}>
            <AuthProvider>{children}</AuthProvider>
        </FluentProvider>
    );
}
