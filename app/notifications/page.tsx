"use client";

import React, { useState, useEffect, useCallback } from "react";
import { clients } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { NotificationPayload } from "@/lib/types";
import {
    Button, Input, Spinner, Select, Switch, Textarea,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Send24Regular } from "@fluentui/react-icons";

export default function NotificationsPage() {
    const { accountId } = useAccount();
    const [clientList, setClientList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState("");
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [form, setForm] = useState<NotificationPayload>({
        MessageMask: "", MessageContent: "",
        OverlayIconLeft: 0, OverlayIconRight: 0,
        IsEmergency: false, IsSpeechEnabled: false,
        IsEffectEnabled: false, IsSoundEnabled: false,
        IsTopmost: false, DurationSeconds: 5, RepeatCounts: 1,
    });

    const load = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setClientList(await clients.list(accountId) as string[]); } catch { /* ignore */ }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { load(); }, [load]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedClient) return;
        setSending(true);
        setMsg(null);
        try {
            await clients.sendNotification(accountId, selectedClient, form);
            setMsg({ type: "success", text: `通知已推送至 ${selectedClient}` });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "推送失败" });
        }
        setSending(false);
    }

    async function handleBroadcast() {
        if (!confirm("确定要向所有客户端发送通知吗？")) return;
        setSending(true);
        setMsg(null);
        let success = 0, fail = 0;
        for (const uid of clientList) {
            try {
                await clients.sendNotification(accountId, uid, form);
                success++;
            } catch { fail++; }
        }
        setMsg({ type: success > 0 ? "success" : "error", text: `广播完成：${success} 成功，${fail} 失败` });
        setSending(false);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">通知推送</h1>
                    <p className="page-subtitle">向指定客户端或广播推送桌面通知</p>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card">
                {loading ? <Spinner size="small" /> : (
                    <form onSubmit={handleSend}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">目标客户端</label>
                                <Select value={selectedClient} onChange={(_, d) => setSelectedClient(d.value)} style={{ width: "100%" }}>
                                    <option value="">-- 选择客户端 --</option>
                                    {clientList.map(uid => <option key={uid} value={uid}>{uid}</option>)}
                                </Select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">持续时间（秒）</label>
                                <Input type="number" value={String(form.DurationSeconds || 5)}
                                    onChange={(_, d) => setForm({ ...form, DurationSeconds: parseFloat(d.value) || 5 })} style={{ width: "100%" }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">消息标题 (Mask)</label>
                            <Input value={form.MessageMask || ""} onChange={(_, d) => setForm({ ...form, MessageMask: d.value })} style={{ width: "100%" }}
                                placeholder="通知标题文本" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">消息内容</label>
                            <Textarea value={form.MessageContent || ""} onChange={(_, d) => setForm({ ...form, MessageContent: d.value })} style={{ width: "100%" }}
                                rows={4} placeholder="通知正文内容" />
                        </div>
                        <div className="grid-2 mb-16">
                            <div className="form-group">
                                <label className="form-label">重复次数</label>
                                <Input type="number" value={String(form.RepeatCounts || 1)}
                                    onChange={(_, d) => setForm({ ...form, RepeatCounts: parseInt(d.value) || 1 })} style={{ width: "100%" }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">覆层图标</label>
                                <div className="flex gap-8">
                                    <Input type="number" value={String(form.OverlayIconLeft || 0)} placeholder="左图标"
                                        onChange={(_, d) => setForm({ ...form, OverlayIconLeft: parseInt(d.value) || 0 })} style={{ flex: 1 }} />
                                    <Input type="number" value={String(form.OverlayIconRight || 0)} placeholder="右图标"
                                        onChange={(_, d) => setForm({ ...form, OverlayIconRight: parseInt(d.value) || 0 })} style={{ flex: 1 }} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-16 mb-16" style={{ flexWrap: "wrap" }}>
                            <Switch checked={form.IsEmergency || false} onChange={(_, d) => setForm({ ...form, IsEmergency: d.checked })} label="紧急通知" />
                            <Switch checked={form.IsSpeechEnabled || false} onChange={(_, d) => setForm({ ...form, IsSpeechEnabled: d.checked })} label="语音播报" />
                            <Switch checked={form.IsSoundEnabled || false} onChange={(_, d) => setForm({ ...form, IsSoundEnabled: d.checked })} label="声音提示" />
                            <Switch checked={form.IsEffectEnabled || false} onChange={(_, d) => setForm({ ...form, IsEffectEnabled: d.checked })} label="特效" />
                            <Switch checked={form.IsTopmost || false} onChange={(_, d) => setForm({ ...form, IsTopmost: d.checked })} label="置顶显示" />
                        </div>
                        <div className="flex gap-12">
                            <Button appearance="primary" type="submit" icon={<Send24Regular />} disabled={sending || !selectedClient}>
                                {sending ? <Spinner size="tiny" /> : "发送通知"}
                            </Button>
                            <Button appearance="secondary" onClick={handleBroadcast} disabled={sending || clientList.length === 0}>
                                广播所有客户端
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
