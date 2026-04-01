"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api";
import { Spinner } from "@fluentui/react-components";

export default function AuthTransferPage() {
    const router = useRouter();

    useEffect(() => {
        // Run on client side only, avoids Next.js build failures with Static Export
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");
            if (token) {
                setToken(token);
            }
            // Navigate to the dashboard or admin entry
            // Using replace to prevent back navigation loop
            router.replace("/admin");
        }
    }, [router]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Spinner label="正在验证并登录管理面板..." />
        </div>
    );
}
