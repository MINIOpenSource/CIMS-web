"use client";

import React, { useState, useEffect, useCallback } from "react";
import { pairing } from "@/lib/api";
import type { PairingCodeDetail } from "@/lib/types";
import {
    Button, Spinner, Switch,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Checkmark24Regular, Delete24Regular } from "@fluentui/react-icons";

export default function PairingPage() {
    const [codes, setCodes] = useState<PairingCodeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [pairingEnabled, setPairingEnabled] = useState(true);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await pairing.listCodes();
            setCodes(res.codes || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleApprove(code: string) {
        try {
            await pairing.approve(code);
            setMsg({ type: "success", text: `配对码 ${code} 已审批` });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "审批失败" });
        }
    }

    async function handleDelete(code: string) {
        if (!confirm(`确定要删除配对码 "${code}" 吗？`)) return;
        try {
            await pairing.deleteCode(code);
            setMsg({ type: "success", text: "配对码已删除" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    async function handleToggle(enabled: boolean) {
        try {
            await pairing.toggle({ enabled });
            setPairingEnabled(enabled);
            setMsg({ type: "success", text: `配对功能已${enabled ? "启用" : "禁用"}` });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">配对码管理</h1>
                    <p className="page-subtitle">管理客户端配对码的审批和设置</p>
                </div>
                <div className="flex items-center gap-12">
                    <Switch
                        checked={pairingEnabled}
                        onChange={(_, d) => handleToggle(d.checked)}
                        label={pairingEnabled ? "配对功能已启用" : "配对功能已禁用"}
                    />
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
                                <th>客户端 ID</th>
                                <th>IP 地址</th>
                                <th>MAC 地址</th>
                                <th>状态</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map(c => (
                                <tr key={c.code}>
                                    <td style={{ fontWeight: 600, fontFamily: "monospace", letterSpacing: 1 }}>{c.code}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{c.client_uid || "-"}</td>
                                    <td style={{ fontSize: 11 }}>{c.client_id || "-"}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.client_ip || "-"}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.client_mac || "-"}</td>
                                    <td>
                                        {c.used ? (
                                            <span className="badge badge-info">已使用</span>
                                        ) : c.approved ? (
                                            <span className="badge badge-success">已审批</span>
                                        ) : (
                                            <span className="badge badge-warning">待审批</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 12 }}>{c.created_at ? new Date(c.created_at).toLocaleString("zh-CN") : "-"}</td>
                                    <td>
                                        <div className="flex gap-4">
                                            {!c.approved && !c.used && (
                                                <Button appearance="primary" size="small" icon={<Checkmark24Regular />} onClick={() => handleApprove(c.code)}>
                                                    审批
                                                </Button>
                                            )}
                                            <Button appearance="subtle" size="small" icon={<Delete24Regular />} onClick={() => handleDelete(c.code)}
                                                style={{ color: "var(--danger-color)" }}>
                                                删除
                                            </Button>
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
