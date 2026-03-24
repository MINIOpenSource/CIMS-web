"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import type { Subject } from "@/lib/types";
import {
    Button, Input, Switch, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

type SubjectsData = Record<string, Subject>;

export default function SubjectsPage() {
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<SubjectsData>({});
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { setFileList(await data.list("Subjects")); } catch { setFileList([]); }
        setLoading(false);
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setDataLoading(true);
        setMsg(null);
        try {
            const content = await data.read("Subjects", name);
            setSubjects((content as SubjectsData) || {});
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "加载失败" });
            setSubjects({});
        }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write("Subjects", selectedFile, subjects);
            setMsg({ type: "success", text: "科目数据已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        if (!newFileName.trim()) return;
        try {
            await data.create("Subjects", newFileName.trim());
            setMsg({ type: "success", text: `文件 "${newFileName}" 已创建` });
            setShowCreate(false);
            setNewFileName("");
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定要删除科目文件 "${name}" 吗？`)) return;
        try {
            await data.deleteData("Subjects", name);
            if (selectedFile === name) { setSelectedFile(null); setSubjects({}); }
            loadFiles();
            setMsg({ type: "success", text: "文件已删除" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function addSubject() {
        const id = crypto.randomUUID();
        setSubjects({ ...subjects, [id]: { Name: "新科目", Initial: "", TeacherName: "", IsOutDoor: false } });
    }

    function updateSubject(id: string, field: keyof Subject, value: string | boolean) {
        const copy = { ...subjects };
        copy[id] = { ...copy[id], [field]: value };
        // 自动生成简称
        if (field === "Name" && typeof value === "string" && value.length > 0 && !copy[id].Initial) {
            copy[id].Initial = value[0];
        }
        setSubjects(copy);
    }

    function deleteSubject(id: string) {
        const copy = { ...subjects };
        delete copy[id];
        setSubjects(copy);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">科目管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 科目档案 (Subjects)</p>
                </div>
                <div className="flex gap-8">
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>新建文件</Button>
                    <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadFiles}>刷新</Button>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="flex gap-24">
                {/* 文件列表 */}
                <div style={{ width: 240, flexShrink: 0 }}>
                    <div className="card">
                        <div className="card-title">科目文件</div>
                        {loading ? <Spinner size="small" /> : fileList.length === 0 ? (
                            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>暂无文件</div>
                        ) : (
                            fileList.map(f => (
                                <div key={f} className={`sidebar-link ${selectedFile === f ? "active" : ""}`}
                                    onClick={() => selectFile(f)}>
                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{f}</span>
                                    <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(f); }}
                                        style={{ color: "var(--danger-color)", minWidth: 24, padding: 2 }} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 编辑器 */}
                <div style={{ flex: 1 }}>
                    {!selectedFile ? (
                        <div className="card">
                            <div className="empty-state"><div className="empty-state-text">请从左侧选择一个科目文件</div></div>
                        </div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="card-title">编辑: {selectedFile}</div>
                                <div className="flex gap-8">
                                    <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                        {saving ? <Spinner size="tiny" /> : "保存"}
                                    </Button>
                                    <Button appearance="secondary" icon={<Add24Regular />} onClick={addSubject}>添加科目</Button>
                                </div>
                            </div>

                            {Object.keys(subjects).length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-text">暂无科目，点击"添加科目"开始</div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {Object.entries(subjects).map(([id, sub]) => (
                                        <div key={id} className="card" style={{ padding: 16, margin: 0, border: "1px solid var(--border-color)" }}>
                                            <div className="flex items-center gap-12" style={{ flexWrap: "wrap" }}>
                                                <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--accent-color)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                                                    {sub.Initial || sub.Name?.[0] || "?"}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 150 }}>
                                                    <label className="form-label">科目名称</label>
                                                    <Input value={sub.Name} onChange={(_, d) => updateSubject(id, "Name", d.value)} style={{ width: "100%" }} />
                                                </div>
                                                <div style={{ width: 80 }}>
                                                    <label className="form-label">简称</label>
                                                    <Input value={sub.Initial} onChange={(_, d) => updateSubject(id, "Initial", d.value)} style={{ width: "100%" }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 150 }}>
                                                    <label className="form-label">教师名</label>
                                                    <Input value={sub.TeacherName} onChange={(_, d) => updateSubject(id, "TeacherName", d.value)} style={{ width: "100%" }} />
                                                </div>
                                                <div>
                                                    <label className="form-label">户外</label>
                                                    <Switch checked={sub.IsOutDoor} onChange={(_, d) => updateSubject(id, "IsOutDoor", d.checked)} />
                                                </div>
                                                <Button appearance="subtle" icon={<Delete24Regular />}
                                                    onClick={() => deleteSubject(id)}
                                                    style={{ color: "var(--danger-color)" }} />
                                            </div>
                                            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4, fontFamily: "monospace" }}>
                                                ID: {id}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>新建科目文件</DialogTitle>
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
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            )}
        </div>
    );
}
