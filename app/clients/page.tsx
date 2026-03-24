"use client";

import React, { useState, useEffect, useCallback } from "react";
import { clients } from "@/lib/api";
import type { NotificationPayload, ClientInfo } from "@/lib/types";
import {
    Button, Input, Spinner, Dialog, DialogSurface, DialogBody,
    DialogTitle, DialogContent, DialogActions,
    Switch, Textarea,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import {
    ArrowSync24Regular, Send24Regular,
    ArrowClockwise24Regular, Settings24Regular, Info24Regular,
} from "@fluentui/react-icons";

export default function ClientsPage() {
    const [clientList, setClientList] = useState<string[]>([]);
    const [statusMap, setStatusMap] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [selectedUid, setSelectedUid] = useState<string | null>(null);
    const [clientDetail, setClientDetail] = useState<ClientInfo | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showNotify, setShowNotify] = useState<string | null>(null);
    const [notifyForm, setNotifyForm] = useState<NotificationPayload>({
        MessageMask: "", MessageContent: "", DurationSeconds: 5, RepeatCounts: 1,
        IsEmergency: false, IsSpeechEnabled: false, IsEffectEnabled: false,
        IsSoundEnabled: false, IsTopmost: false,
    });
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [cl, st] = await Promise.allSettled([clients.list(), clients.status()]);
            setClientList(cl.status === "fulfilled" ? (cl.value as string[]) : []);
            if (st.status === "fulfilled" && st.value && typeof st.value === "object") {
                setStatusMap(st.value as Record<string, unknown>);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    async function showDetails(uid: string) {
        setSelectedUid(uid);
        setDetailLoading(true);
        try {
            const detail = await clients.details(uid);
            setClientDetail(detail as ClientInfo);
        } catch { setClientDetail(null); }
        setDetailLoading(false);
    }

    async function handleRestart(uid: string) {
        setActionLoading(uid);
        try {
            await clients.restart(uid);
            setMsg({ type: "success", text: `已向 ${uid} 发送重启指令` });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
        setActionLoading(null);
    }

    async function handleSync(uid: string) {
        setActionLoading(uid);
        try {
            await clients.forceSync(uid);
            setMsg({ type: "success", text: `已向 ${uid} 发送同步指令` });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "操作失败" });
        }
        setActionLoading(null);
    }

    async function handleSendNotification() {
        if (!showNotify) return;
        try {
            await clients.sendNotification(showNotify, notifyForm);
            setMsg({ type: "success", text: "通知已推送" });
            setShowNotify(null);
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "推送失败" });
        }
    }

    const isOnline = (uid: string) => {
        if (statusMap && typeof statusMap === "object") {
            return uid in statusMap;
        }
        return false;
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">客户端管理</h1>
                    <p className="page-subtitle">管理已注册的 ClassIsland 客户端</p>
                </div>
                <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadData}>
                    刷新
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
                ) : clientList.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无已注册的客户端</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>客户端 UID</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientList.map(uid => (
                                <tr key={uid}>
                                    <td style={{ fontFamily: "monospace", fontWeight: 500 }}>{uid}</td>
                                    <td>
                                        <span className={`badge ${isOnline(uid) ? "badge-success" : "badge-danger"}`}>
                                            {isOnline(uid) ? "在线" : "离线"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-4">
                                            <Button appearance="subtle" size="small" icon={<Info24Regular />} onClick={() => showDetails(uid)}>详情</Button>
                                            <Button appearance="subtle" size="small" icon={<ArrowClockwise24Regular />}
                                                onClick={() => handleRestart(uid)} disabled={actionLoading === uid}>重启</Button>
                                            <Button appearance="subtle" size="small" icon={<ArrowSync24Regular />}
                                                onClick={() => handleSync(uid)} disabled={actionLoading === uid}>同步</Button>
                                            <Button appearance="subtle" size="small" icon={<Send24Regular />}
                                                onClick={() => setShowNotify(uid)}>通知</Button>
                                            <Button appearance="subtle" size="small" icon={<Settings24Regular />}
                                                onClick={async () => {
                                                    try {
                                                        const cfg = await clients.getConfig(uid, 0);
                                                        alert(JSON.stringify(cfg, null, 2));
                                                    } catch (e: unknown) { alert(e instanceof Error ? e.message : "获取失败"); }
                                                }}>配置</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUid && (
                <Dialog open onOpenChange={() => setSelectedUid(null)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>客户端详情 - {selectedUid}</DialogTitle>
                            <DialogContent>
                                {detailLoading ? <Spinner size="small" /> : clientDetail ? (
                                    <div className="json-editor">
                                        <textarea readOnly value={JSON.stringify(clientDetail, null, 2)} />
                                    </div>
                                ) : (
                                    <div className="empty-state"><div className="empty-state-text">无法获取客户端详情</div></div>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setSelectedUid(null)}>关闭</Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}

            {showNotify && (
                <Dialog open onOpenChange={() => setShowNotify(null)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>推送通知 - {showNotify}</DialogTitle>
                            <DialogContent>
                                <div className="form-group">
                                    <label className="form-label">消息标题</label>
                                    <Input value={notifyForm.MessageMask || ""} onChange={(_, d) => setNotifyForm({ ...notifyForm, MessageMask: d.value })} style={{ width: "100%" }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">消息内容</label>
                                    <Textarea value={notifyForm.MessageContent || ""} onChange={(_, d) => setNotifyForm({ ...notifyForm, MessageContent: d.value })} style={{ width: "100%" }} rows={3} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">持续时间（秒）</label>
                                    <Input type="number" value={String(notifyForm.DurationSeconds || 5)}
                                        onChange={(_, d) => setNotifyForm({ ...notifyForm, DurationSeconds: parseFloat(d.value) || 5 })} style={{ width: "100%" }} />
                                </div>
                                <div className="flex gap-16" style={{ flexWrap: "wrap" }}>
                                    <Switch checked={notifyForm.IsEmergency || false} onChange={(_, d) => setNotifyForm({ ...notifyForm, IsEmergency: d.checked })} label="紧急通知" />
                                    <Switch checked={notifyForm.IsSpeechEnabled || false} onChange={(_, d) => setNotifyForm({ ...notifyForm, IsSpeechEnabled: d.checked })} label="语音播报" />
                                    <Switch checked={notifyForm.IsSoundEnabled || false} onChange={(_, d) => setNotifyForm({ ...notifyForm, IsSoundEnabled: d.checked })} label="声音提示" />
                                    <Switch checked={notifyForm.IsEffectEnabled || false} onChange={(_, d) => setNotifyForm({ ...notifyForm, IsEffectEnabled: d.checked })} label="特效" />
                                    <Switch checked={notifyForm.IsTopmost || false} onChange={(_, d) => setNotifyForm({ ...notifyForm, IsTopmost: d.checked })} label="置顶显示" />
                                </div>
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={() => setShowNotify(null)}>取消</Button>
                                <Button appearance="primary" onClick={handleSendNotification}>发送通知</Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
