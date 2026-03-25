"use client";

import React, { useState, useEffect, useCallback } from "react";
import { pairing } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { PairingCodeOut } from "@/lib/types";
import {
    Button, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Checkmark24Regular, Dismiss24Regular } from "@fluentui/react-icons";

export default function PairingPage() {
    const { accountId } = useAccount();
    const [codes, setCodes] = useState<PairingCodeOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (!accountId) return;
            const res = await pairing.listCodes(accountId);
            setCodes(res || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleApprove(pairingId: string) {
        try {
            await pairing.approve(accountId, pairingId);
            setMsg({ type: "success", text: `配对码已批准` });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "审批失败" });
        }
    }

    async function handleReject(pairingId: string) {
        if (!confirm(`确定要拒绝此配对码吗？`)) return;
        try {
            await pairing.reject(accountId, pairingId);
            setMsg({ type: "success", text: "配对码已拒绝" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">配对码管理</h1>
                    <p className="page-subtitle">管理客户端配对码的审批</p>
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
                ) : codes.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无待处理的配对码</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>配对码</th>
                                <th>客户端 UID</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600, fontFamily: "monospace", letterSpacing: 1 }}>{c.code}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{c.client_uid || "-"}</td>
                                    <td>
                                        {c.used ? (
                                            <span className="badge badge-info">已使用</span>
                                        ) : c.approved ? (
                                            <span className="badge badge-success">已批准</span>
                                        ) : (
                                            <span className="badge badge-warning">待审批</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 12 }}>{c.created_at ? new Date(c.created_at).toLocaleString("zh-CN") : "-"}</td>
                                    <td>
                                        <div className="flex gap-4">
                                            {!c.approved && !c.used && (
                                                <Button appearance="primary" size="small" icon={<Checkmark24Regular />} onClick={() => handleApprove(c.id)}>
                                                    批准
                                                </Button>
                                            )}
                                            {!c.used && (
                                                <Button appearance="subtle" size="small" icon={<Dismiss24Regular />} onClick={() => handleReject(c.id)}
                                                    style={{ color: "var(--danger-color)" }}>
                                                    拒绝
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
