"use client";

import React, { useState, useEffect, useCallback } from "react";
import { users, roles } from "@/lib/api";
import type { UserOut, RoleOut, UserUpdateRequest } from "@/lib/types";
import {
    Button, Input, Spinner, Dialog, DialogSurface, DialogBody,
    DialogTitle, DialogContent, DialogActions, Select, Switch,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Edit24Regular, Search24Regular } from "@fluentui/react-icons";

export default function UsersPage() {
    const [userList, setUserList] = useState<UserOut[]>([]);
    const [roleList, setRoleList] = useState<RoleOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editUser, setEditUser] = useState<UserOut | null>(null);
    const [editForm, setEditForm] = useState<UserUpdateRequest>({});
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const limit = 50;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [u, r] = await Promise.all([
                users.list(offset, limit),
                roles.list(),
            ]);
            setUserList(u);
            setRoleList(r);
        } catch { /* ignore */ }
        setLoading(false);
    }, [offset]);

    useEffect(() => { loadData(); }, [loadData]);

    const filtered = userList.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.display_name.toLowerCase().includes(search.toLowerCase())
    );

    function openEdit(user: UserOut) {
        setEditUser(user);
        setEditForm({
            display_name: user.display_name,
            role_code: user.role_code,
            is_active: user.is_active,
        });
        setMsg(null);
    }

    async function handleSave() {
        if (!editUser) return;
        setSaving(true);
        setMsg(null);
        try {
            await users.update(editUser.id, editForm);
            setMsg("保存成功");
            setEditUser(null);
            loadData();
        } catch (e: unknown) {
            setMsg(e instanceof Error ? e.message : "保存失败");
        }
        setSaving(false);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">用户管理</h1>
                    <p className="page-subtitle">管理所有注册用户</p>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center gap-12 mb-16">
                    <Input
                        contentBefore={<Search24Regular />}
                        placeholder="搜索用户名、邮箱或显示名称..."
                        value={search}
                        onChange={(_, d) => setSearch(d.value)}
                        style={{ flex: 1 }}
                    />
                </div>

                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无用户数据</div></div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>邮箱</th>
                                    <th>显示名称</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(user => (
                                    <tr key={user.id}>
                                        <td style={{ fontWeight: 500 }}>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.display_name || "-"}</td>
                                        <td><span className="badge badge-info">{user.role_code}</span></td>
                                        <td>
                                            <span className={`badge ${user.is_active ? "badge-success" : "badge-danger"}`}>
                                                {user.is_active ? "活跃" : "禁用"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>{new Date(user.created_at).toLocaleString("zh-CN")}</td>
                                        <td>
                                            <Button appearance="subtle" size="small" icon={<Edit24Regular />} onClick={() => openEdit(user)}>
                                                编辑
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center gap-8 mt-16">
                            <Button size="small" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                                上一页
                            </Button>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                第 {offset / limit + 1} 页
                            </span>
                            <Button size="small" disabled={userList.length < limit} onClick={() => setOffset(offset + limit)}>
                                下一页
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {editUser && (
                <Dialog open onOpenChange={() => setEditUser(null)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>编辑用户 - {editUser.username}</DialogTitle>
                            <DialogContent>
                                <div className="form-group">
                                    <label className="form-label">显示名称</label>
                                    <Input value={editForm.display_name || ""} onChange={(_, d) => setEditForm({ ...editForm, display_name: d.value })} style={{ width: "100%" }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">角色</label>
                                    <Select value={editForm.role_code || ""} onChange={(_, d) => setEditForm({ ...editForm, role_code: d.value })} style={{ width: "100%" }}>
                                        {roleList.map(r => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
                                    </Select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">启用状态</label>
                                    <Switch checked={editForm.is_active ?? true} onChange={(_, d) => setEditForm({ ...editForm, is_active: d.checked })} label={editForm.is_active ? "活跃" : "禁用"} />
                                </div>
                                {msg && (
                                    <MessageBar intent={msg === "保存成功" ? "success" : "error"}>
                                        <MessageBarBody>{msg}</MessageBarBody>
                                    </MessageBar>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={() => setEditUser(null)}>取消</Button>
                                <Button appearance="primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <Spinner size="tiny" /> : "保存"}
                                </Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
