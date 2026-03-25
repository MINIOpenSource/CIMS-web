"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { ManagementCredentialConfig, AuthorizeLevel } from "@/lib/types";
import { AUTHORIZE_LEVEL_LABELS } from "@/lib/types";
import {
    Button, Input, Select, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

const AUTH_LEVEL_FIELDS: { key: keyof ManagementCredentialConfig; label: string; hint: string }[] = [
    { key: "EditAuthorizeSettingsAuthorizeLevel", label: "编辑授权设置", hint: "编辑授权配置所需的认证等级" },
    { key: "EditPolicyAuthorizeLevel", label: "编辑策略", hint: "编辑限制策略所需的认证等级" },
    { key: "ExitManagementAuthorizeLevel", label: "退出集控", hint: "退出集控管理模式所需的认证等级" },
    { key: "EditProfileAuthorizeLevel", label: "编辑档案", hint: "编辑档案所需的认证等级" },
    { key: "EditSettingsAuthorizeLevel", label: "编辑设置", hint: "编辑应用设置所需的认证等级" },
    { key: "ExitApplicationAuthorizeLevel", label: "退出应用", hint: "退出 ClassIsland 应用所需的认证等级" },
    { key: "ChangeLessonsAuthorizeLevel", label: "换课", hint: "进行换课操作所需的认证等级" },
];

export default function CredentialsPage() {
    const { accountId } = useAccount();
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [cred, setCred] = useState<ManagementCredentialConfig>({});
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setFileList(await data.list(accountId, "Credentials")); } catch { setFileList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setDataLoading(true);
        setMsg(null);
        try {
            const content = await data.read(accountId, "Credentials", name);
            setCred((content as ManagementCredentialConfig) || {});
        } catch { setCred({}); }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write(accountId, "Credentials", selectedFile, cred);
            setMsg({ type: "success", text: "凭据配置已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        try {
            await data.create(accountId, "Credentials", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData(accountId, "Credentials", name);
            if (selectedFile === name) setSelectedFile(null);
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function update<K extends keyof ManagementCredentialConfig>(key: K, value: ManagementCredentialConfig[K]) {
        setCred({ ...cred, [key]: value });
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">凭据管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 凭据与授权等级 (ManagementCredentialConfig)</p>
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
                        <div className="card-title">凭据文件</div>
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
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择凭据文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="card-title">编辑凭据: {selectedFile}</div>
                                <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                    {saving ? <Spinner size="tiny" /> : "保存"}
                                </Button>
                            </div>

                            {/* 凭据区 */}
                            <div className="settings-section">
                                <div className="settings-section-title">凭据密码</div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">用户凭据</label>
                                        <Input type="password" value={cred.UserCredential || ""}
                                            onChange={(_, d) => update("UserCredential", d.value)}
                                            placeholder="客户端用户密码" style={{ width: "100%" }} />
                                        <div className="form-hint">客户端端用户操作时需要输入的密码</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">管理员凭据</label>
                                        <Input type="password" value={cred.AdminCredential || ""}
                                            onChange={(_, d) => update("AdminCredential", d.value)}
                                            placeholder="管理员密码" style={{ width: "100%" }} />
                                        <div className="form-hint">客户端管理员操作时需要输入的密码</div>
                                    </div>
                                </div>
                            </div>

                            {/* 授权等级区 */}
                            <div className="settings-section">
                                <div className="settings-section-title">授权等级</div>
                                {AUTH_LEVEL_FIELDS.map(({ key, label, hint }) => (
                                    <div key={key} className="settings-item">
                                        <div className="settings-item-info">
                                            <div className="settings-item-label">{label}</div>
                                            <div className="settings-item-hint">{hint}</div>
                                        </div>
                                        <Select
                                            value={String((cred[key] as number) ?? 0)}
                                            onChange={(_, d) => update(key, parseInt(d.value) as AuthorizeLevel)}
                                            style={{ minWidth: 140 }}>
                                            {([0, 1, 2] as AuthorizeLevel[]).map(lv => (
                                                <option key={lv} value={lv}>{AUTHORIZE_LEVEL_LABELS[lv]}</option>
                                            ))}
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建凭据文件</DialogTitle>
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
