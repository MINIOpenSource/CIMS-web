"use client";

import React, { useState, useEffect, useCallback } from "react";
import { access } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { AccessMember } from "@/lib/types";
import { ACCOUNT_ROLE_LABELS } from "@/lib/types";
import {
    Button, Input, Spinner, Select,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Search24Regular, Delete24Regular } from "@fluentui/react-icons";

export default function AccessPage() {
    const { accountId } = useAccount();
    const [members, setMembers] = useState<AccessMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState("");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            setMembers(await access.list(accountId));
        } catch { setMembers([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleSearch() {
        if (!accountId || !searchQ.trim()) { loadData(); return; }
        setLoading(true);
        try {
            setMembers(await access.search(accountId, searchQ.trim()));
        } catch { setMembers([]); }
        setLoading(false);
    }

    async function handleRoleChange(memberId: string, newRole: string) {
        try {
            await access.update(accountId, memberId, { role_in_account: newRole });
            setMsg({ type: "success", text: "角色已更新" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "更新失败" });
        }
    }

    async function handleDelete(memberId: string) {
        if (!confirm("确定要移除此成员吗？移除后该用户将无法访问此账户。")) return;
        try {
            await access.delete(accountId, memberId);
            setMsg({ type: "success", text: "成员已移除" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "移除失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">访问控制</h1>
                    <p className="page-subtitle">管理账户下的具权用户</p>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card" style={{ marginBottom: 16 }}>
                <form onSubmit={e => { e.preventDefault(); handleSearch(); }}
                    className="flex items-center gap-8">
                    <Input
                        placeholder="按 User ID 搜索…"
                        value={searchQ}
                        onChange={(_, d) => setSearchQ(d.value)}
                        contentBefore={<Search24Regular />}
                        style={{ flex: 1 }}
                    />
                    <Button appearance="primary" type="submit">搜索</Button>
                    {searchQ && (
                        <Button appearance="subtle" onClick={() => { setSearchQ(""); loadData(); }}>
                            清除
                        </Button>
                    )}
                </form>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : members.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无具权用户</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>用户 ID</th>
                                <th>角色</th>
                                <th>加入时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.id}>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{m.user_id}</td>
                                    <td>
                                        <Select size="small"
                                            value={m.role_in_account}
                                            onChange={(_, d) => handleRoleChange(m.id, d.value)}
                                            disabled={m.role_in_account === "owner"}>
                                            {Object.entries(ACCOUNT_ROLE_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </Select>
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                        {new Date(m.joined_at).toLocaleString("zh-CN")}
                                    </td>
                                    <td>
                                        {m.role_in_account !== "owner" && (
                                            <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                                onClick={() => handleDelete(m.id)}
                                                style={{ color: "var(--danger-color)" }}>
                                                移除
                                            </Button>
                                        )}
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
