"use client";

import React, { useState, useEffect, useCallback } from "react";
import { roles } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { RoleOut } from "@/lib/types";
import {
    Button, Input, Spinner, Dialog, DialogSurface, DialogBody,
    DialogTitle, DialogContent, DialogActions,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular } from "@fluentui/react-icons";

export default function RolesPage() {
    const { accountId } = useAccount();
    const [roleList, setRoleList] = useState<RoleOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [code, setCode] = useState("");
    const [label, setLabel] = useState("");
    const [priority, setPriority] = useState("0");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setRoleList(await roles.list(accountId)); } catch { /* ignore */ }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await roles.create(accountId, { code, label, priority: parseInt(priority) || 0 });
            setMsg({ type: "success", text: "角色创建成功" });
            setShowCreate(false);
            setCode(""); setLabel(""); setPriority("0");
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
        setSaving(false);
    }

    async function handleDelete(roleCode: string) {
        if (!confirm(`确定要删除角色 "${roleCode}" 吗？`)) return;
        try {
            await roles.delete(accountId, roleCode);
            setMsg({ type: "success", text: "角色已删除" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">角色管理</h1>
                    <p className="page-subtitle">管理系统角色和自定义角色</p>
                </div>
                <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>
                    新建角色
                </Button>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : roleList.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无角色数据</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>角色编码</th>
                                <th>显示名称</th>
                                <th>优先级</th>
                                <th>类型</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roleList.map(role => (
                                <tr key={role.id}>
                                    <td style={{ fontWeight: 500, fontFamily: "monospace" }}>{role.code}</td>
                                    <td>{role.label}</td>
                                    <td>{role.priority}</td>
                                    <td>
                                        <span className={`badge ${role.is_system ? "badge-info" : "badge-warning"}`}>
                                            {role.is_system ? "系统内置" : "自定义"}
                                        </span>
                                    </td>
                                    <td>
                                        {!role.is_system && (
                                            <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                                onClick={() => handleDelete(role.code)} style={{ color: "var(--danger-color)" }}>
                                                删除
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>新建角色</DialogTitle>
                            <DialogContent>
                                <form onSubmit={handleCreate}>
                                    <div className="form-group">
                                        <label className="form-label">角色编码</label>
                                        <Input value={code} onChange={(_, d) => setCode(d.value)} placeholder="如 moderator" style={{ width: "100%" }} />
                                        <div className="form-hint">2-32 个字符</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">显示名称</label>
                                        <Input value={label} onChange={(_, d) => setLabel(d.value)} placeholder="如 审核员" style={{ width: "100%" }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">优先级</label>
                                        <Input type="number" value={priority} onChange={(_, d) => setPriority(d.value)} style={{ width: "100%" }} />
                                        <div className="form-hint">-100 到 99，数值越大权限越高</div>
                                    </div>
                                </form>
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={() => setShowCreate(false)}>取消</Button>
                                <Button appearance="primary" onClick={handleCreate} disabled={saving || !code || !label}>
                                    {saving ? <Spinner size="tiny" /> : "创建"}
                                </Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
