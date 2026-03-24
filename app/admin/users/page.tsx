"use client";

/**
 * SuperAdmin 全局用户管理页面。
 * 调用 Admin API: GET /admin/users, PATCH /admin/users/{user_id}
 */

import React, { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import type { UserOut, UserUpdateRequest } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import {
    Button, Input, Spinner, Badge,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody,
    DialogTitle, DialogContent, DialogActions,
    Label, Select,
} from "@fluentui/react-components";
import { Edit24Regular } from "@fluentui/react-icons";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [editUser, setEditUser] = useState<UserOut | null>(null);
    const [editForm, setEditForm] = useState<UserUpdateRequest>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const limit = 20;

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const list = await adminApi.listUsers(offset, limit);
            setUsers(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : "加载失败");
        } finally {
            setLoading(false);
        }
    }, [offset]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    async function handleSave() {
        if (!editUser) return;
        setSaving(true);
        setError(null);
        try {
            await adminApi.updateUser(editUser.id, editForm);
            setEditUser(null);
            await loadUsers();
        } catch (e) {
            setError(e instanceof Error ? e.message : "更新失败");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">全局用户管理</h1>
                    <p className="page-subtitle">管理平台中所有注册用户</p>
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
                <>
                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>邮箱</th>
                                    <th>显示名</th>
                                    <th>角色</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>{u.display_name}</td>
                                        <td>
                                            <Badge
                                                appearance="filled"
                                                color={u.role_code === "superadmin" ? "danger" : u.role_code === "admin" ? "warning" : "informative"}
                                            >
                                                {ROLE_LABELS[u.role_code] || u.role_code}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge color={u.is_active ? "success" : "severe"}>
                                                {u.is_active ? "活跃" : "禁用"}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                appearance="subtle"
                                                icon={<Edit24Regular />}
                                                size="small"
                                                onClick={() => {
                                                    setEditUser(u);
                                                    setEditForm({
                                                        display_name: u.display_name,
                                                        role_code: u.role_code,
                                                        is_active: u.is_active,
                                                    });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center gap-8 mt-16">
                        <Button
                            disabled={offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            size="small"
                        >
                            上一页
                        </Button>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                            第 {offset / limit + 1} 页
                        </span>
                        <Button
                            disabled={users.length < limit}
                            onClick={() => setOffset(offset + limit)}
                            size="small"
                        >
                            下一页
                        </Button>
                    </div>
                </>
            )}

            {/* 编辑对话框 */}
            {editUser && (
                <Dialog open onOpenChange={(_, d) => { if (!d.open) setEditUser(null); }}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>编辑用户: {editUser.username}</DialogTitle>
                            <DialogContent>
                                <div className="form-group">
                                    <Label>显示名</Label>
                                    <Input
                                        value={editForm.display_name || ""}
                                        onChange={(_, d) => setEditForm({ ...editForm, display_name: d.value })}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <Label>角色</Label>
                                    <Select
                                        value={editForm.role_code || ""}
                                        onChange={(_, d) => setEditForm({ ...editForm, role_code: d.value })}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([code, label]) => (
                                            <option key={code} value={code}>{label}</option>
                                        ))}
                                    </Select>
                                </div>
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={() => setEditUser(null)}>
                                    取消
                                </Button>
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
