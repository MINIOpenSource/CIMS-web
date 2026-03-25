"use client";

import React, { useState, useEffect, useCallback } from "react";
import { preRegistration } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { PreRegOut } from "@/lib/types";
import {
    Button, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Delete24Regular, ArrowDownload24Regular } from "@fluentui/react-icons";

export default function PreRegistrationPage() {
    const { accountId } = useAccount();
    const [list, setList] = useState<PreRegOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            setList(await preRegistration.list(accountId));
        } catch { setList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleDelete(preRegId: string) {
        if (!confirm("确定要删除此预注册客户端吗？")) return;
        try {
            await preRegistration.delete(accountId, preRegId);
            setMsg({ type: "success", text: "已删除" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    async function handleDownload(preRegId: string) {
        try {
            const preset = await preRegistration.downloadPreset(accountId, preRegId);
            const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ManagementPreset.json";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "下载失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">预注册客户端</h1>
                    <p className="page-subtitle">管理预注册的 ClassIsland 客户端</p>
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
                ) : list.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无预注册客户端</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>标签</th>
                                <th>班级标识</th>
                                <th>创建时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 500 }}>{item.label}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{item.class_identity}</td>
                                    <td style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleString("zh-CN")}</td>
                                    <td>
                                        <div className="flex gap-4">
                                            <Button appearance="subtle" size="small" icon={<ArrowDownload24Regular />}
                                                onClick={() => handleDownload(item.id)}>
                                                下载配置
                                            </Button>
                                            <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                                onClick={() => handleDelete(item.id)}
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
