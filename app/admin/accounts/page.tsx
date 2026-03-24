"use client";

/**
 * SuperAdmin 全局账户管理页面。
 * 调用 Admin API: GET /admin/accounts, GET /admin/accounts/{account_id}
 */

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import type { AccountOut } from "@/lib/types";
import {
    Spinner, Badge,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";

export default function AdminAccountsPage() {
    const [accountsList, setAccountsList] = useState<AccountOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        setLoading(true);
        try {
            const list = await adminApi.listAccounts();
            setAccountsList(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : "加载失败");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">全局账户管理</h1>
                    <p className="page-subtitle">管理平台中所有注册账户</p>
                </div>
            </div>

            {error && (
                <MessageBar intent="error" style={{ marginBottom: 12 }}>
                    <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
            )}

            {loading ? (
                <div className="flex items-center justify-center" style={{ height: 200 }}>
                    <Spinner size="medium" />
                </div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>名称</th>
                                <th>Slug</th>
                                <th>API Key</th>
                                <th>状态</th>
                                <th>创建时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountsList.map(acct => (
                                <tr key={acct.id}>
                                    <td>{acct.name}</td>
                                    <td><code>{acct.slug}</code></td>
                                    <td>
                                        <code className="api-key-cell">
                                            {acct.api_key.substring(0, 8)}...
                                        </code>
                                    </td>
                                    <td>
                                        <Badge color={acct.is_active ? "success" : "severe"}>
                                            {acct.is_active ? "活跃" : "停用"}
                                        </Badge>
                                    </td>
                                    <td>{new Date(acct.created_at).toLocaleDateString("zh-CN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
