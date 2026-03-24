"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import type { ManagementPolicy } from "@/lib/types";
import {
    Button, Switch, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Input,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

const POLICY_FIELDS: { key: keyof ManagementPolicy; label: string; hint: string }[] = [
    { key: "DisableProfileClassPlanEditing", label: "禁止编辑课表", hint: "阻止客户端用户修改课表" },
    { key: "DisableProfileTimeLayoutEditing", label: "禁止编辑时间表", hint: "阻止客户端用户修改时间表" },
    { key: "DisableProfileSubjectsEditing", label: "禁止编辑科目", hint: "阻止客户端用户修改科目列表" },
    { key: "DisableProfileEditing", label: "禁止编辑档案", hint: "禁止客户端用户进行任何档案编辑" },
    { key: "DisableSettingsEditing", label: "禁止编辑设置", hint: "阻止客户端用户修改应用设置" },
    { key: "DisableSplashCustomize", label: "禁止自定义启动页", hint: "禁止客户端用户自定义启动画面" },
    { key: "DisableDebugMenu", label: "禁止调试菜单", hint: "隐藏客户端调试功能入口" },
    { key: "AllowExitManagement", label: "允许退出集控", hint: "允许客户端用户退出集控管理模式" },
    { key: "DisableEasterEggs", label: "禁止彩蛋", hint: "禁用客户端内的彩蛋功能" },
];

export default function PolicyPage() {
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [policy, setPolicy] = useState<ManagementPolicy>({});
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { setFileList(await data.list("Policy")); } catch { setFileList([]); }
        setLoading(false);
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setDataLoading(true);
        setMsg(null);
        try {
            const content = await data.read("Policy", name);
            setPolicy((content as ManagementPolicy) || {});
        } catch { setPolicy({}); }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write("Policy", selectedFile, policy);
            setMsg({ type: "success", text: "策略已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        try {
            await data.create("Policy", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData("Policy", name);
            if (selectedFile === name) setSelectedFile(null);
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">策略管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 客户端限制策略 (ManagementPolicy)</p>
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
                        <div className="card-title">策略文件</div>
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
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择策略文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="card-title">编辑策略: {selectedFile}</div>
                                <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                    {saving ? <Spinner size="tiny" /> : "保存"}
                                </Button>
                            </div>

                            {POLICY_FIELDS.map(({ key, label, hint }) => (
                                <div key={key} className="settings-item">
                                    <div className="settings-item-info">
                                        <div className="settings-item-label">{label}</div>
                                        <div className="settings-item-hint">{hint}</div>
                                    </div>
                                    <Switch
                                        checked={!!policy[key]}
                                        onChange={(_, d) => setPolicy({ ...policy, [key]: d.checked })}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建策略文件</DialogTitle>
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
