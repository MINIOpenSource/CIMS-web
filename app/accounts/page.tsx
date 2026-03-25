"use client";

import React, { useState, useEffect, useCallback } from "react";
import { accounts } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { AccountOut, SlugUpdate } from "@/lib/types";
import {
    Button, Input, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Edit24Regular, Delete24Regular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
    const { accountId, currentAccount, refreshAccounts } = useAccount();
    const router = useRouter();
    const [accountInfo, setAccountInfo] = useState<AccountOut | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingSlug, setEditingSlug] = useState(false);
    const [newSlug, setNewSlug] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            const info = await accounts.info(accountId);
            setAccountInfo(info);
        } catch {
            setAccountInfo(currentAccount);
        }
        setLoading(false);
    }, [accountId, currentAccount]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleSlugChange(e: React.FormEvent) {
        e.preventDefault();
        if (!accountId || !newSlug) return;
        setSaving(true);
        setMsg(null);
        try {
            const data: SlugUpdate = { slug: newSlug };
            const updated = await accounts.changeSlug(accountId, data);
            setAccountInfo(updated);
            setEditingSlug(false);
            setMsg({ type: "success", text: "Slug 已更新" });
            refreshAccounts();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "更新失败" });
        }
        setSaving(false);
    }

    async function handleDeleteAccount() {
        if (!accountInfo || deleteConfirm !== accountInfo.name) return;
        setDeleting(true);
        try {
            await accounts.delete(accountId);
            setMsg({ type: "success", text: "账户已停用" });
            refreshAccounts();
            router.push("/");
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
            setDeleting(false);
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">账户概览</h1>
                    <p className="page-subtitle">查看和管理当前账户信息</p>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : !accountInfo ? (
                    <div className="empty-state"><div className="empty-state-text">暂无账户数据</div></div>
                ) : (
                    <div style={{ display: "grid", gap: 20 }}>
                        <div className="detail-row">
                            <div className="detail-label">账户名称</div>
                            <div className="detail-value" style={{ fontWeight: 600 }}>{accountInfo.name}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">账户 ID</div>
                            <div className="detail-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{accountInfo.id}</div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Slug</div>
                            <div className="detail-value">
                                {editingSlug ? (
                                    <form onSubmit={handleSlugChange} className="flex items-center gap-8">
                                        <Input
                                            value={newSlug}
                                            onChange={(_, d) => setNewSlug(d.value)}
                                            placeholder="3-64 位 slug"
                                            size="small"
                                        />
                                        <Button appearance="primary" size="small" type="submit" disabled={saving || !newSlug}>
                                            {saving ? <Spinner size="tiny" /> : "保存"}
                                        </Button>
                                        <Button appearance="subtle" size="small" onClick={() => setEditingSlug(false)}>
                                            取消
                                        </Button>
                                    </form>
                                ) : (
                                    <span className="flex items-center gap-8">
                                        <code style={{ fontSize: 12 }}>{accountInfo.slug}</code>
                                        <Button appearance="subtle" size="small" icon={<Edit24Regular />}
                                            onClick={() => { setNewSlug(accountInfo.slug); setEditingSlug(true); }}>
                                            修改
                                        </Button>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">API Key</div>
                            <div className="detail-value" style={{ fontFamily: "monospace", fontSize: 11 }}>
                                {accountInfo.api_key}
                            </div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">状态</div>
                            <div className="detail-value">
                                <span className={`badge ${accountInfo.is_active ? "badge-success" : "badge-danger"}`}>
                                    {accountInfo.is_active ? "活跃" : "停用"}
                                </span>
                            </div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">创建时间</div>
                            <div className="detail-value" style={{ fontSize: 12 }}>
                                {new Date(accountInfo.created_at).toLocaleString("zh-CN")}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 危险操作区域 */}
            {accountInfo && (
                <div className="card mt-16" style={{
                    borderColor: "var(--danger-color)",
                    borderWidth: 1,
                    borderStyle: "solid",
                }}>
                    <div className="card-title" style={{ color: "var(--danger-color)" }}>
                        危险操作
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
                        停用账户后，所有成员和预注册客户端将被清理，此操作不可撤销。
                        仅账户所有者可执行此操作。
                    </p>
                    <div style={{ display: "grid", gap: 12, maxWidth: 400 }}>
                        <label style={{ fontSize: 13, fontWeight: 500 }}>
                            请输入账户名称「{accountInfo.name}」以确认:
                        </label>
                        <Input
                            value={deleteConfirm}
                            onChange={(_, d) => setDeleteConfirm(d.value)}
                            placeholder={accountInfo.name}
                        />
                        <Button appearance="primary" icon={<Delete24Regular />}
                            onClick={handleDeleteAccount}
                            disabled={deleting || deleteConfirm !== accountInfo.name}
                            style={{
                                backgroundColor: deleteConfirm === accountInfo.name ? "var(--danger-color)" : undefined,
                            }}>
                            {deleting ? <Spinner size="tiny" /> : "停用账户"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
