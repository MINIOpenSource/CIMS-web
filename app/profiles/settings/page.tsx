"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { ManagementSettings, ManagementServerKind } from "@/lib/types";
import { MANAGEMENT_SERVER_KIND_LABELS } from "@/lib/types";
import {
    Button, Input, Select, Switch, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

export default function SettingsPage() {
    const { accountId } = useAccount();
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [settings, setSettings] = useState<ManagementSettings>({});
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setFileList(await data.list(accountId, "DefaultSettings")); } catch { setFileList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setDataLoading(true);
        setMsg(null);
        try {
            const content = await data.read(accountId, "DefaultSettings", name);
            setSettings((content as ManagementSettings) || {});
        } catch { setSettings({}); }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write(accountId, "DefaultSettings", selectedFile, settings);
            setMsg({ type: "success", text: "设置已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        try {
            await data.create(accountId, "DefaultSettings", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData(accountId, "DefaultSettings", name);
            if (selectedFile === name) setSelectedFile(null);
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function update<K extends keyof ManagementSettings>(key: K, value: ManagementSettings[K]) {
        setSettings({ ...settings, [key]: value });
    }

    const isServer = (settings.ManagementServerKind ?? 0) === 1;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">默认设置管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 集控默认设置 (ManagementSettings)</p>
                </div>
                <div className="flex gap-8">
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>新建文件</Button>
                    <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadFiles}>刷新</Button>
                </div>
            </div>

            {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

            <div className="flex gap-24">
                <div style={{ width: 240, flexShrink: 0 }}>
                    <div className="card">
                        <div className="card-title">设置文件</div>
                        {loading ? <Spinner size="small" /> : fileList.map(f => (
                            <div key={f} className={`sidebar-link ${selectedFile === f ? "active" : ""}`} onClick={() => selectFile(f)}>
                                <span style={{ flex: 1 }}>{f}</span>
                                <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(f); }} style={{ color: "var(--danger-color)", minWidth: 24, padding: 2 }} />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    {!selectedFile ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择设置文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="card-title">编辑设置: {selectedFile}</div>
                                <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                    {saving ? <Spinner size="tiny" /> : "保存"}
                                </Button>
                            </div>

                            {/* 基本开关 */}
                            <div className="settings-item">
                                <div className="settings-item-info">
                                    <div className="settings-item-label">启用集控</div>
                                    <div className="settings-item-hint">是否启用集控管理功能</div>
                                </div>
                                <Switch checked={!!settings.IsManagementEnabled}
                                    onChange={(_, d) => update("IsManagementEnabled", d.checked)} />
                            </div>

                            {/* 服务器类型 */}
                            <div className="settings-section" style={{ marginTop: 24 }}>
                                <div className="settings-section-title">服务器配置</div>
                                <div className="form-group">
                                    <label className="form-label">管理服务器类型</label>
                                    <Select value={String(settings.ManagementServerKind ?? 0)}
                                        onChange={(_, d) => update("ManagementServerKind", parseInt(d.value) as ManagementServerKind)}
                                        style={{ width: "100%" }}>
                                        {([0, 1] as ManagementServerKind[]).map(k => (
                                            <option key={k} value={k}>{MANAGEMENT_SERVER_KIND_LABELS[k]}</option>
                                        ))}
                                    </Select>
                                </div>

                                {isServer && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">集控服务器地址</label>
                                            <Input value={settings.ManagementServer || ""}
                                                onChange={(_, d) => update("ManagementServer", d.value)}
                                                placeholder="如 https://cims.example.com" style={{ width: "100%" }} />
                                            <div className="form-hint">ManagementServerKind 为 ManagementServer 时生效</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">集控服务器 gRPC 地址</label>
                                            <Input value={settings.ManagementServerGrpc || ""}
                                                onChange={(_, d) => update("ManagementServerGrpc", d.value)}
                                                placeholder="如 https://cims.example.com:50051" style={{ width: "100%" }} />
                                        </div>
                                    </>
                                )}

                                {!isServer && (
                                    <div className="form-group">
                                        <label className="form-label">清单 URL 模板</label>
                                        <Input value={settings.ManifestUrlTemplate || ""}
                                            onChange={(_, d) => update("ManifestUrlTemplate", d.value)}
                                            placeholder="ManagementServerKind 为 Serverless 时使用" style={{ width: "100%" }} />
                                        <div className="form-hint">ManagementServerKind 为 Serverless 时生效</div>
                                    </div>
                                )}
                            </div>

                            {/* 班级标识 */}
                            <div className="settings-section">
                                <div className="settings-section-title">班级配置</div>
                                <div className="form-group">
                                    <label className="form-label">班级标识符</label>
                                    <Input value={settings.ClassIdentity || ""}
                                        onChange={(_, d) => update("ClassIdentity", d.value)}
                                        placeholder="可选，用于区分不同班级" style={{ width: "100%" }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建设置文件</DialogTitle>
                        <DialogContent>
                            <div className="form-group">
                                <label className="form-label">文件名</label>
                                <Input value={newFileName} onChange={(_, d) => setNewFileName(d.value)} placeholder="如 default" style={{ width: "100%" }} />
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setShowCreate(false)}>取消</Button>
                            <Button appearance="primary" onClick={handleCreateFile} disabled={!newFileName.trim()}>创建</Button>
                        </DialogActions>
                    </DialogBody></DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
