"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import type { ResourceType } from "@/lib/types";
import {
    Button, Input, Spinner, Textarea,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

/**
 * 通用 JSON 资源编辑器
 * 用于 DefaultSettings / Components / Credentials 三种资源类型
 */
export default function JsonResourceEditor({
    resourceType, title, subtitle,
}: {
    resourceType: ResourceType;
    title: string;
    subtitle: string;
}) {
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [jsonContent, setJsonContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [parseError, setParseError] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { setFileList(await data.list(resourceType)); } catch { setFileList([]); }
        setLoading(false);
    }, [resourceType]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setDataLoading(true);
        setMsg(null);
        setParseError(null);
        try {
            const content = await data.read(resourceType, name);
            setJsonContent(JSON.stringify(content, null, 2));
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "加载失败" });
            setJsonContent("{}");
        }
        setDataLoading(false);
    }

    function handleJsonChange(value: string) {
        setJsonContent(value);
        try {
            JSON.parse(value);
            setParseError(null);
        } catch (e: unknown) {
            setParseError(e instanceof Error ? e.message : "JSON 格式错误");
        }
    }

    async function handleSave() {
        if (!selectedFile || parseError) return;
        setSaving(true);
        setMsg(null);
        try {
            const parsed = JSON.parse(jsonContent);
            await data.write(resourceType, selectedFile, parsed);
            setMsg({ type: "success", text: "数据已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        try {
            await data.create(resourceType, newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
            setMsg({ type: "success", text: "文件已创建" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData(resourceType, name);
            if (selectedFile === name) { setSelectedFile(null); setJsonContent(""); }
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function formatJson() {
        try {
            const parsed = JSON.parse(jsonContent);
            setJsonContent(JSON.stringify(parsed, null, 2));
            setParseError(null);
        } catch { /* ignore */ }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{title}</h1>
                    <p className="page-subtitle">{subtitle}</p>
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
                        <div className="card-title">资源文件</div>
                        {loading ? <Spinner size="small" /> : fileList.length === 0 ? (
                            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>暂无文件</div>
                        ) : fileList.map(f => (
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
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择一个文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="card-title">编辑: {selectedFile}</div>
                                <div className="flex gap-8">
                                    <Button appearance="subtle" size="small" onClick={formatJson}>格式化</Button>
                                    <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving || !!parseError}>
                                        {saving ? <Spinner size="tiny" /> : "保存"}
                                    </Button>
                                </div>
                            </div>

                            {parseError && (
                                <MessageBar intent="error" style={{ marginBottom: 12 }}>
                                    <MessageBarBody>JSON 格式错误: {parseError}</MessageBarBody>
                                </MessageBar>
                            )}

                            <div className="json-editor">
                                <Textarea
                                    value={jsonContent}
                                    onChange={(_, d) => handleJsonChange(d.value)}
                                    style={{
                                        width: "100%",
                                        minHeight: 400,
                                        fontFamily: "'Cascadia Code', 'Courier New', monospace",
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                    }}
                                    resize="vertical"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建{title.replace("管理", "")}文件</DialogTitle>
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
