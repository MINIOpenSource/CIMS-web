"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { ComponentSettingsItem, HorizontalAlignmentType } from "@/lib/types";
import { HORIZONTAL_ALIGNMENT_LABELS } from "@/lib/types";
import {
    Button, Input, Select, Switch, Spinner, Textarea,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import {
    Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular,
    ChevronDown24Regular, ChevronRight24Regular,
} from "@fluentui/react-icons";

type ComponentsData = ComponentSettingsItem[];

export default function ComponentsPage() {
    const { accountId } = useAccount();
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [components, setComponents] = useState<ComponentsData>([]);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true, fonts: false, colors: false, layout: false, advanced: false,
    });

    const loadFiles = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setFileList(await data.list(accountId, "Components")); } catch { setFileList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setSelectedIdx(-1);
        setDataLoading(true);
        try {
            const content = await data.read(accountId, "Components", name);
            // 组件数据可能为数组或对象
            if (Array.isArray(content)) {
                setComponents(content as ComponentsData);
            } else if (content && typeof content === "object") {
                // 可能是 { Lines: [...] } 或类似结构
                const obj = content as Record<string, unknown>;
                if (Array.isArray(obj.Lines)) {
                    setComponents(obj.Lines as ComponentsData);
                } else {
                    setComponents([content as ComponentSettingsItem]);
                }
            } else {
                setComponents([]);
            }
        } catch { setComponents([]); }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write(accountId, "Components", selectedFile, components);
            setMsg({ type: "success", text: "组件设置已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        try {
            await data.create(accountId, "Components", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData(accountId, "Components", name);
            if (selectedFile === name) { setSelectedFile(null); setComponents([]); }
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function addComponent() {
        setComponents([...components, {
            Id: "",
            NameCache: "新组件",
            HideOnRule: false,
            IsResourceOverridingEnabled: false,
            MainWindowSecondaryFontSize: 14,
            MainWindowBodyFontSize: 16,
            MainWindowEmphasizedFontSize: 18,
            MainWindowLargeFontSize: 20,
            Opacity: 1,
            RelativeLineNumber: 0,
            HorizontalAlignment: 0,
        }]);
        setSelectedIdx(components.length);
    }

    function deleteComponent(idx: number) {
        const copy = [...components];
        copy.splice(idx, 1);
        setComponents(copy);
        if (selectedIdx === idx) setSelectedIdx(-1);
        else if (selectedIdx > idx) setSelectedIdx(selectedIdx - 1);
    }

    function updateComp<K extends keyof ComponentSettingsItem>(idx: number, key: K, value: ComponentSettingsItem[K]) {
        const copy = [...components];
        copy[idx] = { ...copy[idx], [key]: value };
        setComponents(copy);
    }

    function toggleSection(key: string) {
        setExpandedSections({ ...expandedSections, [key]: !expandedSections[key] });
    }

    const current = selectedIdx >= 0 && selectedIdx < components.length ? components[selectedIdx] : null;

    function SectionHeader({ id, title }: { id: string; title: string }) {
        const open = expandedSections[id];
        return (
            <div className="settings-section-title" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, userSelect: "none" }}
                onClick={() => toggleSection(id)}>
                {open ? <ChevronDown24Regular style={{ width: 16, height: 16 }} /> : <ChevronRight24Regular style={{ width: 16, height: 16 }} />}
                {title}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">组件设置管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 主界面组件配置 (ComponentSettings)</p>
                </div>
                <div className="flex gap-8">
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>新建文件</Button>
                    <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadFiles}>刷新</Button>
                </div>
            </div>

            {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

            <div className="flex gap-24">
                {/* 左侧: 文件 + 组件列表 */}
                <div style={{ width: 260, flexShrink: 0 }}>
                    <div className="card mb-16">
                        <div className="card-title">组件文件</div>
                        {loading ? <Spinner size="small" /> : fileList.map(f => (
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
                                <div className="card-title" style={{ margin: 0 }}>组件列表</div>
                                <Button appearance="subtle" size="small" icon={<Add24Regular />} onClick={addComponent} />
                            </div>
                            {components.length === 0 ? (
                                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>暂无组件</div>
                            ) : components.map((comp, idx) => (
                                <div key={idx} className={`sidebar-link ${selectedIdx === idx ? "active" : ""}`}
                                    onClick={() => setSelectedIdx(idx)}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                        background: comp.IsCustomForegroundColorEnabled && comp.ForegroundColor
                                            ? comp.ForegroundColor : "var(--accent-color)",
                                    }} />
                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {comp.NameCache || comp.Id || `组件 ${idx + 1}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 右侧编辑区 */}
                <div style={{ flex: 1 }}>
                    {!selectedFile ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择组件文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : !current ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请从左侧选择或添加组件</div></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <Input value={current.NameCache || ""}
                                    onChange={(_, d) => updateComp(selectedIdx, "NameCache", d.value)}
                                    placeholder="组件名称" style={{ fontWeight: 600, fontSize: 16 }} />
                                <div className="flex gap-8">
                                    <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                        {saving ? <Spinner size="tiny" /> : "保存"}
                                    </Button>
                                    <Button appearance="subtle" icon={<Delete24Regular />} onClick={() => deleteComponent(selectedIdx)}
                                        style={{ color: "var(--danger-color)" }} />
                                </div>
                            </div>

                            {/* 基本信息 */}
                            <div className="settings-section">
                                <SectionHeader id="basic" title="基本信息" />
                                {expandedSections.basic && (
                                    <div style={{ paddingTop: 8 }}>
                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label">组件 ID</label>
                                                <Input value={current.Id || ""}
                                                    onChange={(_, d) => updateComp(selectedIdx, "Id", d.value)}
                                                    placeholder="组件 GUID" style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">相对行号</label>
                                                <Input type="number" value={String(current.RelativeLineNumber ?? 0)}
                                                    onChange={(_, d) => updateComp(selectedIdx, "RelativeLineNumber", parseInt(d.value) || 0)}
                                                    style={{ width: "100%" }} />
                                            </div>
                                        </div>
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">条件隐藏</div>
                                                <div className="settings-item-hint">在满足规则条件时自动隐藏此组件</div>
                                            </div>
                                            <Switch checked={!!current.HideOnRule}
                                                onChange={(_, d) => updateComp(selectedIdx, "HideOnRule", d.checked)} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 字体大小 */}
                            <div className="settings-section">
                                <SectionHeader id="fonts" title="字体大小" />
                                {expandedSections.fonts && (
                                    <div style={{ paddingTop: 8 }}>
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">启用资源覆盖</div>
                                                <div className="settings-item-hint">启用后，以下字体大小设置才会生效</div>
                                            </div>
                                            <Switch checked={!!current.IsResourceOverridingEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsResourceOverridingEnabled", d.checked)} />
                                        </div>
                                        <div className="grid-2" style={{ marginTop: 12 }}>
                                            {([
                                                ["MainWindowSecondaryFontSize", "次要字体", 14],
                                                ["MainWindowBodyFontSize", "正文字体", 16],
                                                ["MainWindowEmphasizedFontSize", "强调字体", 18],
                                                ["MainWindowLargeFontSize", "大号字体", 20],
                                            ] as [keyof ComponentSettingsItem, string, number][]).map(([key, label, def]) => (
                                                <div className="form-group" key={key}>
                                                    <label className="form-label">{label}</label>
                                                    <Input type="number"
                                                        value={String((current[key] as number) ?? def)}
                                                        onChange={(_, d) => updateComp(selectedIdx, key, parseFloat(d.value) || def)}
                                                        style={{ width: "100%" }}
                                                        disabled={!current.IsResourceOverridingEnabled} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 颜色与透明度 */}
                            <div className="settings-section">
                                <SectionHeader id="colors" title="颜色与透明度" />
                                {expandedSections.colors && (
                                    <div style={{ paddingTop: 8 }}>
                                        {/* 前景色 */}
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">自定义前景色</div>
                                            </div>
                                            <Switch checked={!!current.IsCustomForegroundColorEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsCustomForegroundColorEnabled", d.checked)} />
                                        </div>
                                        {current.IsCustomForegroundColorEnabled && (
                                            <div className="form-group" style={{ marginTop: 8 }}>
                                                <label className="form-label">前景色</label>
                                                <div className="flex items-center gap-8">
                                                    <input type="color" value={current.ForegroundColor || "#1E90FF"}
                                                        onChange={(e) => updateComp(selectedIdx, "ForegroundColor", e.target.value)}
                                                        style={{ width: 40, height: 32, border: "1px solid var(--border-color)", borderRadius: 4, cursor: "pointer" }} />
                                                    <Input value={current.ForegroundColor || "#1E90FF"}
                                                        onChange={(_, d) => updateComp(selectedIdx, "ForegroundColor", d.value)}
                                                        style={{ width: 120, fontFamily: "monospace" }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* 背景色 */}
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">自定义背景色</div>
                                            </div>
                                            <Switch checked={!!current.IsCustomBackgroundColorEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsCustomBackgroundColorEnabled", d.checked)} />
                                        </div>
                                        {current.IsCustomBackgroundColorEnabled && (
                                            <div className="form-group" style={{ marginTop: 8 }}>
                                                <label className="form-label">背景色</label>
                                                <div className="flex items-center gap-8">
                                                    <input type="color" value={current.BackgroundColor || "#000000"}
                                                        onChange={(e) => updateComp(selectedIdx, "BackgroundColor", e.target.value)}
                                                        style={{ width: 40, height: 32, border: "1px solid var(--border-color)", borderRadius: 4, cursor: "pointer" }} />
                                                    <Input value={current.BackgroundColor || "#000000"}
                                                        onChange={(_, d) => updateComp(selectedIdx, "BackgroundColor", d.value)}
                                                        style={{ width: 120, fontFamily: "monospace" }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* 背景透明度 */}
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">自定义背景透明度</div>
                                            </div>
                                            <Switch checked={!!current.IsCustomBackgroundOpacityEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsCustomBackgroundOpacityEnabled", d.checked)} />
                                        </div>
                                        {current.IsCustomBackgroundOpacityEnabled && (
                                            <div className="form-group" style={{ marginTop: 8 }}>
                                                <label className="form-label">背景透明度</label>
                                                <Input type="number" value={String(current.BackgroundOpacity ?? 0.5)}
                                                    onChange={(_, d) => updateComp(selectedIdx, "BackgroundOpacity", parseFloat(d.value) || 0.5)}
                                                    min={0} max={1} step={0.05} style={{ width: 120 }} />
                                            </div>
                                        )}

                                        {/* 圆角 */}
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">自定义圆角</div>
                                            </div>
                                            <Switch checked={!!current.IsCustomCornerRadiusEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsCustomCornerRadiusEnabled", d.checked)} />
                                        </div>
                                        {current.IsCustomCornerRadiusEnabled && (
                                            <div className="form-group" style={{ marginTop: 8 }}>
                                                <label className="form-label">圆角半径 (px)</label>
                                                <Input type="number" value={String(current.CustomCornerRadius ?? 8)}
                                                    onChange={(_, d) => updateComp(selectedIdx, "CustomCornerRadius", parseFloat(d.value) || 8)}
                                                    style={{ width: 120 }} />
                                            </div>
                                        )}

                                        {/* 整体透明度 */}
                                        <div className="form-group" style={{ marginTop: 12 }}>
                                            <label className="form-label">整体透明度</label>
                                            <Input type="number" value={String(current.Opacity ?? 1)}
                                                onChange={(_, d) => updateComp(selectedIdx, "Opacity", parseFloat(d.value) || 1)}
                                                min={0} max={1} step={0.05} style={{ width: 120 }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 布局 */}
                            <div className="settings-section">
                                <SectionHeader id="layout" title="布局" />
                                {expandedSections.layout && (
                                    <div style={{ paddingTop: 8 }}>
                                        <div className="form-group">
                                            <label className="form-label">水平对齐</label>
                                            <Select value={String(current.HorizontalAlignment ?? 0)}
                                                onChange={(_, d) => updateComp(selectedIdx, "HorizontalAlignment", parseInt(d.value) as HorizontalAlignmentType)}
                                                style={{ width: "100%" }}>
                                                {([0, 1, 2, 3] as HorizontalAlignmentType[]).map(v => (
                                                    <option key={v} value={v}>{HORIZONTAL_ALIGNMENT_LABELS[v]}</option>
                                                ))}
                                            </Select>
                                        </div>

                                        {/* 宽度控制 */}
                                        {([
                                            ["IsMinWidthEnabled", "MinWidth", "最小宽度", 100],
                                            ["IsMaxWidthEnabled", "MaxWidth", "最大宽度", 300],
                                            ["IsFixedWidthEnabled", "FixedWidth", "固定宽度", 200],
                                        ] as [keyof ComponentSettingsItem, keyof ComponentSettingsItem, string, number][]).map(([enableKey, valueKey, label, def]) => (
                                            <div key={enableKey}>
                                                <div className="settings-item">
                                                    <div className="settings-item-info">
                                                        <div className="settings-item-label">启用{label}</div>
                                                    </div>
                                                    <Switch checked={!!(current[enableKey] as boolean)}
                                                        onChange={(_, d) => updateComp(selectedIdx, enableKey, d.checked)} />
                                                </div>
                                                {!!(current[enableKey] as boolean) && (
                                                    <div className="form-group" style={{ marginTop: 4, paddingLeft: 16 }}>
                                                        <label className="form-label">{label} (px)</label>
                                                        <Input type="number" value={String((current[valueKey] as number) ?? def)}
                                                            onChange={(_, d) => updateComp(selectedIdx, valueKey, parseFloat(d.value) || def)}
                                                            style={{ width: 120 }} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* 自定义间距 */}
                                        <div className="settings-item">
                                            <div className="settings-item-info">
                                                <div className="settings-item-label">启用自定义间距</div>
                                            </div>
                                            <Switch checked={!!current.IsCustomMarginEnabled}
                                                onChange={(_, d) => updateComp(selectedIdx, "IsCustomMarginEnabled", d.checked)} />
                                        </div>
                                        {current.IsCustomMarginEnabled && (
                                            <div className="grid-4" style={{ marginTop: 8 }}>
                                                {([
                                                    ["MarginTop", "上"],
                                                    ["MarginRight", "右"],
                                                    ["MarginBottom", "下"],
                                                    ["MarginLeft", "左"],
                                                ] as [keyof ComponentSettingsItem, string][]).map(([key, label]) => (
                                                    <div className="form-group" key={key}>
                                                        <label className="form-label">{label} (px)</label>
                                                        <Input type="number" value={String((current[key] as number) ?? 0)}
                                                            onChange={(_, d) => updateComp(selectedIdx, key, parseFloat(d.value) || 0)}
                                                            style={{ width: "100%" }} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 高级: Settings 和 HidingRules JSON 原始数据 */}
                            <div className="settings-section">
                                <SectionHeader id="advanced" title="高级设置 (JSON)" />
                                {expandedSections.advanced && (
                                    <div style={{ paddingTop: 8 }}>
                                        <div className="form-group">
                                            <label className="form-label">Settings (组件自定义设置)</label>
                                            <Textarea
                                                value={current.Settings ? JSON.stringify(current.Settings, null, 2) : "{}"}
                                                onChange={(_, d) => {
                                                    try { updateComp(selectedIdx, "Settings", JSON.parse(d.value)); } catch { /* ignore parse errors */ }
                                                }}
                                                style={{
                                                    width: "100%", minHeight: 120,
                                                    fontFamily: "'Cascadia Code', monospace", fontSize: 12,
                                                }}
                                                resize="vertical" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">HidingRules (隐藏规则)</label>
                                            <Textarea
                                                value={current.HidingRules ? JSON.stringify(current.HidingRules, null, 2) : "{}"}
                                                onChange={(_, d) => {
                                                    try { updateComp(selectedIdx, "HidingRules", JSON.parse(d.value)); } catch { /* ignore parse errors */ }
                                                }}
                                                style={{
                                                    width: "100%", minHeight: 120,
                                                    fontFamily: "'Cascadia Code', monospace", fontSize: 12,
                                                }}
                                                resize="vertical" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建组件配置文件</DialogTitle>
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
