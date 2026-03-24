"use client";

import React, { useState, useEffect, useCallback } from "react";
import { accounts, quotas } from "@/lib/api";
import type { AccountOut, QuotaOut, QuotaSetRequest } from "@/lib/types";
import {
    Button, Input, Spinner, Dialog, DialogSurface, DialogBody,
    DialogTitle, DialogContent, DialogActions,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Settings24Regular } from "@fluentui/react-icons";

export default function AccountsPage() {
    const [accountList, setAccountList] = useState<AccountOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<AccountOut | null>(null);
    const [quotaList, setQuotaList] = useState<QuotaOut[]>([]);
    const [quotaLoading, setQuotaLoading] = useState(false);
    const [quotaKey, setQuotaKey] = useState("");
    const [maxValue, setMaxValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try { setAccountList(await accounts.list()); } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    async function openQuotas(account: AccountOut) {
        setSelectedAccount(account);
        setQuotaLoading(true);
        setMsg(null);
        try { setQuotaList(await quotas.list(account.id)); } catch { setQuotaList([]); }
        setQuotaLoading(false);
    }

    async function handleSetQuota(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAccount) return;
        setSaving(true);
        setMsg(null);
        try {
            const req: QuotaSetRequest = { quota_key: quotaKey, max_value: parseInt(maxValue) };
            await quotas.update(selectedAccount.id, req);
            setMsg("限额已更新");
            setQuotaList(await quotas.list(selectedAccount.id));
            setQuotaKey(""); setMaxValue("");
        } catch (err: unknown) {
            setMsg(err instanceof Error ? err.message : "设置失败");
        }
        setSaving(false);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">账户管理</h1>
                    <p className="page-subtitle">管理租户账户和限额配置</p>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : accountList.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无账户数据</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>名称</th>
                                <th>Slug</th>
                                <th>API Key</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountList.map(acc => (
                                <tr key={acc.id}>
                                    <td style={{ fontWeight: 500 }}>{acc.name}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{acc.slug}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{acc.api_key.substring(0, 16)}...</td>
                                    <td>
                                        <span className={`badge ${acc.is_active ? "badge-success" : "badge-danger"}`}>
                                            {acc.is_active ? "活跃" : "停用"}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12 }}>{new Date(acc.created_at).toLocaleString("zh-CN")}</td>
                                    <td>
                                        <Button appearance="subtle" size="small" icon={<Settings24Regular />} onClick={() => openQuotas(acc)}>
                                            限额管理
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedAccount && (
                <Dialog open onOpenChange={() => setSelectedAccount(null)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>限额管理 - {selectedAccount.name}</DialogTitle>
                            <DialogContent>
                                {quotaLoading ? <Spinner size="small" /> : (
                                    <>
                                        {quotaList.length > 0 && (
                                            <table className="data-table mb-16">
                                                <thead><tr><th>限额键</th><th>当前值</th><th>最大值</th></tr></thead>
                                                <tbody>
                                                    {quotaList.map(q => (
                                                        <tr key={q.id}>
                                                            <td style={{ fontFamily: "monospace" }}>{q.quota_key}</td>
                                                            <td>{q.current_value}</td>
                                                            <td>{q.max_value === -1 ? "无限" : q.max_value}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <form onSubmit={handleSetQuota}>
                                            <div className="form-group">
                                                <label className="form-label">限额键</label>
                                                <Input value={quotaKey} onChange={(_, d) => setQuotaKey(d.value)} placeholder="如 max_clients" style={{ width: "100%" }} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">最大值</label>
                                                <Input type="number" value={maxValue} onChange={(_, d) => setMaxValue(d.value)} placeholder="-1 = 无限" style={{ width: "100%" }} />
                                            </div>
                                        </form>
                                        {msg && (
                                            <MessageBar intent={msg === "限额已更新" ? "success" : "error"} style={{ marginTop: 8 }}>
                                                <MessageBarBody>{msg}</MessageBarBody>
                                            </MessageBar>
                                        )}
                                    </>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={() => setSelectedAccount(null)}>关闭</Button>
                                <Button appearance="primary" onClick={handleSetQuota} disabled={saving || !quotaKey || !maxValue}>
                                    {saving ? <Spinner size="tiny" /> : "设置限额"}
                                </Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
