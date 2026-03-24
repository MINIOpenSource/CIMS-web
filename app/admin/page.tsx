"use client";

/**
 * SuperAdmin 仪表盘 - 全局统计概览。
 */

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Spinner } from "@fluentui/react-components";
import {
    People24Regular, PersonAccounts24Regular,
} from "@fluentui/react-icons";

function AdminStatCard({
    icon, label, value, color,
}: {
    icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
    return (
        <div className="stat-card admin-stat-card">
            <div className="flex items-center gap-8" style={{ color: color || "var(--admin-accent)" }}>
                {icon}
                <span className="stat-value">{value}</span>
            </div>
            <div className="stat-label">{label}</div>
        </div>
    );
}

export default function AdminDashboard() {
    const [accountCount, setAccountCount] = useState<string>("-");
    const [userCount, setUserCount] = useState<string>("-");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const [accts, users] = await Promise.allSettled([
                adminApi.listAccounts(),
                adminApi.listUsers(0, 1),
            ]);
            setAccountCount(
                accts.status === "fulfilled" ? String(accts.value.length) : "0"
            );
            setUserCount(
                users.status === "fulfilled" ? String(users.value.length) : "0"
            );
        } catch {
            /* keep defaults */
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
                <Spinner size="medium" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">超级管理员面板</h1>
                    <p className="page-subtitle">CIMS 平台全局管理</p>
                </div>
            </div>

            <div className="grid-4">
                <AdminStatCard
                    icon={<PersonAccounts24Regular />}
                    label="总账户数"
                    value={accountCount}
                    color="#c239b3"
                />
                <AdminStatCard
                    icon={<People24Regular />}
                    label="总用户数"
                    value={userCount}
                    color="#0078d4"
                />
            </div>

            <div className="card mt-16">
                <div className="card-title">管理功能</div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    使用左侧导航栏管理全平台的用户和账户。
                    您可以查看所有用户、修改角色权限、管理账户启停状态。
                </p>
            </div>
        </div>
    );
}
