"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import type { TimeLayout, TimeLayoutItem, TimeType } from "@/lib/types";
import { TIME_TYPE_LABELS } from "@/lib/types";
import {
    Button, Input, Select, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

type TimeLayoutsData = Record<string, TimeLayout>;

function formatTime(ts: string): string {
    if (!ts) return "00:00";
    const parts = ts.split(":");
    return `${(parts[0] || "00").padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}`;
}

function timeToSpan(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    return `${String(h || 0).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00`;
}

export default function TimeLayoutPage() {
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [layouts, setLayouts] = useState<TimeLayoutsData>({});
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try { setFileList(await data.list("TimeLayout")); } catch { setFileList([]); }
        setLoading(false);
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setSelectedLayoutId(null);
        setDataLoading(true);
        try {
            const content = await data.read("TimeLayout", name);
            setLayouts((content as TimeLayoutsData) || {});
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "加载失败" });
            setLayouts({});
        }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write("TimeLayout", selectedFile, layouts);
            setMsg({ type: "success", text: "时间表数据已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        if (!newFileName.trim()) return;
        try {
            await data.create("TimeLayout", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
            setMsg({ type: "success", text: "文件已创建" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除文件 "${name}"？`)) return;
        try {
            await data.deleteData("TimeLayout", name);
            if (selectedFile === name) { setSelectedFile(null); setLayouts({}); }
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function addLayout() {
        const id = crypto.randomUUID();
        setLayouts({ ...layouts, [id]: { Name: "新时间表", Layouts: [] } });
        setSelectedLayoutId(id);
    }

    function deleteLayout(id: string) {
        const copy = { ...layouts };
        delete copy[id];
        setLayouts(copy);
        if (selectedLayoutId === id) setSelectedLayoutId(null);
    }

    function addTimePoint(layoutId: string) {
        const copy = { ...layouts };
        const layout = copy[layoutId];
        if (!layout) return;
        const lastItem = layout.Layouts[layout.Layouts.length - 1];
        const newItem: TimeLayoutItem = {
            StartTime: lastItem ? lastItem.EndTime : "08:00:00",
            EndTime: lastItem ? timeToSpan(formatTime(lastItem.EndTime).replace(/(\d+):(\d+)/, (_, h, m) => `${h}:${String(parseInt(m) + 45).padStart(2, "0")}`)) : "08:45:00",
            TimeType: 0,
        };
        layout.Layouts.push(newItem);
        setLayouts(copy);
    }

    function updateTimePoint(layoutId: string, idx: number, field: keyof TimeLayoutItem, value: unknown) {
        const copy = { ...layouts };
        const items = [...copy[layoutId].Layouts];
        items[idx] = { ...items[idx], [field]: value };
        copy[layoutId] = { ...copy[layoutId], Layouts: items };
        setLayouts(copy);
    }

    function deleteTimePoint(layoutId: string, idx: number) {
        const copy = { ...layouts };
        const items = [...copy[layoutId].Layouts];
        items.splice(idx, 1);
        copy[layoutId] = { ...copy[layoutId], Layouts: items };
        setLayouts(copy);
    }

    const currentLayout = selectedLayoutId ? layouts[selectedLayoutId] : null;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">时间表管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 时间表档案 (TimeLayout)</p>
                </div>
                <div className="flex gap-8">
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>新建文件</Button>
                    <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadFiles}>刷新</Button>
                </div>
            </div>

            {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

            <div className="flex gap-24">
                {/* 左侧文件+时间表列表 */}
                <div style={{ width: 260, flexShrink: 0 }}>
                    <div className="card mb-16">
                        <div className="card-title">时间表文件</div>
                        {loading ? <Spinner size="small" /> : fileList.length === 0 ? (
                            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>暂无文件</div>
                        ) : fileList.map(f => (
                            <div key={f} className={`sidebar-link ${selectedFile === f ? "active" : ""}`} onClick={() => selectFile(f)}>
                                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{f}</span>
                                <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(f); }} style={{ color: "var(--danger-color)", minWidth: 24, padding: 2 }} />
                            </div>
                        ))}
                    </div>

                    {selectedFile && !dataLoading && (
                        <div className="card">
                            <div className="flex items-center justify-between mb-8">
                                <div className="card-title" style={{ margin: 0 }}>时间表列表</div>
                                <Button appearance="subtle" size="small" icon={<Add24Regular />} onClick={addLayout} />
                            </div>
                            {Object.entries(layouts).map(([id, tl]) => (
                                <div key={id} className={`sidebar-link ${selectedLayoutId === id ? "active" : ""}`} onClick={() => setSelectedLayoutId(id)}>
                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{tl.Name}</span>
                                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{tl.Layouts?.length || 0}项</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 编辑器区域 */}
                <div style={{ flex: 1 }}>
                    {!selectedFile ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择一个时间表文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : !currentLayout ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请从左侧选择或添加一个时间表</div></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <div className="flex items-center gap-12">
                                    <Input value={currentLayout.Name}
                                        onChange={(_, d) => { const c = { ...layouts }; c[selectedLayoutId!] = { ...c[selectedLayoutId!], Name: d.value }; setLayouts(c); }}
                                        style={{ fontWeight: 600, fontSize: 16 }} />
                                    <Button appearance="subtle" size="small" icon={<Delete24Regular />} onClick={() => deleteLayout(selectedLayoutId!)}
                                        style={{ color: "var(--danger-color)" }} />
                                </div>
                                <div className="flex gap-8">
                                    <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                        {saving ? <Spinner size="tiny" /> : "保存"}
                                    </Button>
                                    <Button appearance="secondary" icon={<Add24Regular />} onClick={() => addTimePoint(selectedLayoutId!)}>添加时间点</Button>
                                </div>
                            </div>

                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12, fontFamily: "monospace" }}>
                                ID: {selectedLayoutId}
                            </div>

                            {currentLayout.Layouts.length === 0 ? (
                                <div className="empty-state"><div className="empty-state-text">暂无时间点，点击"添加时间点"开始</div></div>
                            ) : (
                                <div className="classplan-grid">
                                    {currentLayout.Layouts.map((item, idx) => (
                                        <div key={idx} className={`timeline-item type-${item.TimeType}`}>
                                            <div className="timeline-time">
                                                <Input type="time" value={formatTime(item.StartTime)}
                                                    onChange={(_, d) => updateTimePoint(selectedLayoutId!, idx, "StartTime", timeToSpan(d.value))}
                                                    style={{ width: 100, padding: "2px 4px", fontSize: 12 }} />
                                                <span style={{ margin: "0 4px" }}>→</span>
                                                <Input type="time" value={formatTime(item.EndTime)}
                                                    onChange={(_, d) => updateTimePoint(selectedLayoutId!, idx, "EndTime", timeToSpan(d.value))}
                                                    style={{ width: 100, padding: "2px 4px", fontSize: 12 }} />
                                            </div>
                                            <Select value={String(item.TimeType)}
                                                onChange={(_, d) => updateTimePoint(selectedLayoutId!, idx, "TimeType", parseInt(d.value))}
                                                style={{ width: 120 }}>
                                                {([0, 1, 2, 3] as TimeType[]).map(t => (
                                                    <option key={t} value={t}>{TIME_TYPE_LABELS[t]}</option>
                                                ))}
                                            </Select>
                                            {item.TimeType === 1 && (
                                                <Input value={item.BreakName || ""} placeholder="课间名称"
                                                    onChange={(_, d) => updateTimePoint(selectedLayoutId!, idx, "BreakName", d.value)}
                                                    style={{ width: 120 }} />
                                            )}
                                            <Button appearance="subtle" size="small" icon={<Delete24Regular />}
                                                onClick={() => deleteTimePoint(selectedLayoutId!, idx)}
                                                style={{ color: "var(--danger-color)" }} />
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
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建时间表文件</DialogTitle>
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
