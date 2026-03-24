"use client";

import React, { useState, useEffect, useCallback } from "react";
import { permissions } from "@/lib/api";
import type { PermissionDefOut } from "@/lib/types";
import {
    Button, Input, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Checkmark24Regular, Dismiss24Regular } from "@fluentui/react-icons";

export default function PermissionsPage() {
    const [defs, setDefs] = useState<PermissionDefOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [memberId, setMemberId] = useState("");
    const [selectedPerm, setSelectedPerm] = useState("");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadDefs = useCallback(async () => {
        setLoading(true);
        try { setDefs(await permissions.listDefs()); } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadDefs(); }, [loadDefs]);

    const categories = [...new Set(defs.map(d => d.category))];

    async function handleGrant(granted: boolean) {
        if (!memberId || !selectedPerm) return;
        setActionLoading(true);
        setMsg(null);
        try {
            await permissions.grant({ member_id: memberId, permission_code: selectedPerm, granted });
            setMsg({ type: "success", text: `权限已${granted ? "授予" : "拒绝"}` });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
        setActionLoading(false);
    }

    async function handleRevoke() {
        if (!memberId || !selectedPerm) return;
        setActionLoading(true);
        setMsg(null);
        try {
            await permissions.revoke({ member_id: memberId, permission_code: selectedPerm });
            setMsg({ type: "success", text: "权限覆盖已撤销" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
        setActionLoading(false);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">权限管理</h1>
                    <p className="page-subtitle">管理成员的细粒度权限</p>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card mb-16">
                <div className="card-title">权限操作</div>
                <div className="flex items-center gap-12" style={{ flexWrap: "wrap" }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label">成员 ID</label>
                        <Input value={memberId} onChange={(_, d) => setMemberId(d.value)} placeholder="请输入成员 ID" style={{ width: "100%" }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label">权限编码</label>
                        <Input value={selectedPerm} onChange={(_, d) => setSelectedPerm(d.value)} placeholder="如 manage_users" style={{ width: "100%" }}
                            list="perm-list" />
                        <datalist id="perm-list">
                            {defs.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                        </datalist>
                    </div>
                    <div className="flex gap-8" style={{ paddingTop: 20 }}>
                        <Button appearance="primary" icon={<Checkmark24Regular />}
                            onClick={() => handleGrant(true)} disabled={actionLoading || !memberId || !selectedPerm}>
                            授予
                        </Button>
                        <Button appearance="secondary" icon={<Dismiss24Regular />}
                            onClick={() => handleGrant(false)} disabled={actionLoading || !memberId || !selectedPerm}>
                            拒绝
                        </Button>
                        <Button appearance="subtle" onClick={handleRevoke} disabled={actionLoading || !memberId || !selectedPerm}>
                            撤销覆盖
                        </Button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-title">权限定义列表</div>
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : defs.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无权限定义</div></div>
                ) : (
                    categories.map(cat => (
                        <div key={cat} className="settings-section">
                            <div className="settings-section-title">{cat}</div>
                            <table className="data-table">
                                <thead><tr><th>权限编码</th><th>说明</th></tr></thead>
                                <tbody>
                                    {defs.filter(d => d.category === cat).map(d => (
                                        <tr key={d.code} onClick={() => setSelectedPerm(d.code)} style={{ cursor: "pointer" }}>
                                            <td style={{ fontFamily: "monospace", fontWeight: 500 }}>{d.code}</td>
                                            <td>{d.label}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
