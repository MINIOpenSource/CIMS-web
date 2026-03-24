"use client";

import React, { useState, useEffect, useCallback } from "react";
import { data } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { ClassPlan, ClassInfo, TimeLayout, Subject, TimeRule, TimeType } from "@/lib/types";
import { TIME_TYPE_LABELS, WEEKDAY_LABELS } from "@/lib/types";
import {
    Button, Input, Select, Switch, Spinner,
    MessageBar, MessageBarBody,
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
} from "@fluentui/react-components";
import { Add24Regular, Delete24Regular, Save24Regular, ArrowSync24Regular } from "@fluentui/react-icons";

type ClassPlansData = Record<string, ClassPlan>;
type TimeLayoutsData = Record<string, TimeLayout>;
type SubjectsData = Record<string, Subject>;

function formatTime(ts: string): string {
    if (!ts) return "00:00";
    const parts = ts.split(":");
    return `${(parts[0] || "00").padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}`;
}

export default function ClassPlanPage() {
    const { accountId } = useAccount();
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [plans, setPlans] = useState<ClassPlansData>({});
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [timeLayouts, setTimeLayouts] = useState<TimeLayoutsData>({});
    const [subjects, setSubjects] = useState<SubjectsData>({});
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const loadFiles = useCallback(async () => {
        setLoading(true);
        if (!accountId) return;
        try { setFileList(await data.list(accountId, "ClassPlan")); } catch { setFileList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    // 同时加载 TimeLayout 和 Subjects 数据
    const loadRelatedData = useCallback(async () => {
        if (!accountId) return;
        try {
            const [tlFiles, subFiles] = await Promise.all([
                data.list(accountId, "TimeLayout"),
                data.list(accountId, "Subjects"),
            ]);
            if (tlFiles.length > 0) {
                const tlData = await data.read(accountId, "TimeLayout", tlFiles[0]);
                setTimeLayouts((tlData as TimeLayoutsData) || {});
            }
            if (subFiles.length > 0) {
                const subData = await data.read(accountId, "Subjects", subFiles[0]);
                setSubjects((subData as SubjectsData) || {});
            }
        } catch { /* ignore */ }
    }, [accountId]);

    useEffect(() => { loadRelatedData(); }, [loadRelatedData]);

    async function selectFile(name: string) {
        setSelectedFile(name);
        setSelectedPlanId(null);
        setDataLoading(true);
        try {
            const content = await data.read(accountId, "ClassPlan", name);
            setPlans((content as ClassPlansData) || {});
        } catch { setPlans({}); }
        setDataLoading(false);
    }

    async function handleSave() {
        if (!selectedFile) return;
        setSaving(true);
        setMsg(null);
        try {
            await data.write(accountId, "ClassPlan", selectedFile, plans);
            setMsg({ type: "success", text: "课表数据已保存" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
        }
        setSaving(false);
    }

    async function handleCreateFile(e: React.FormEvent) {
        e.preventDefault();
        if (!newFileName.trim()) return;
        try {
            await data.create(accountId, "ClassPlan", newFileName.trim());
            setShowCreate(false); setNewFileName(""); loadFiles();
            setMsg({ type: "success", text: "文件已创建" });
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    async function handleDeleteFile(name: string) {
        if (!confirm(`确定删除 "${name}"？`)) return;
        try {
            await data.deleteData(accountId, "ClassPlan", name);
            if (selectedFile === name) { setSelectedFile(null); setPlans({}); }
            loadFiles();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "删除失败" });
        }
    }

    function addPlan() {
        const id = crypto.randomUUID();
        const firstTlId = Object.keys(timeLayouts)[0] || "";
        setPlans({
            ...plans,
            [id]: {
                Name: "新课表",
                TimeLayoutId: firstTlId,
                Classes: [],
                TimeRule: { WeekDay: 1, WeekCountDiv: 0, WeekCountDivTotal: 2 },
                IsEnabled: true,
            },
        });
        setSelectedPlanId(id);
    }

    function deletePlan(id: string) {
        const copy = { ...plans };
        delete copy[id];
        setPlans(copy);
        if (selectedPlanId === id) setSelectedPlanId(null);
    }

    function updatePlan(id: string, field: string, value: unknown) {
        const copy = { ...plans };
        copy[id] = { ...copy[id], [field]: value };
        // 切换时间表时重置课程列表
        if (field === "TimeLayoutId") {
            const tl = timeLayouts[value as string];
            if (tl) {
                const classSlots = tl.Layouts.filter(item => item.TimeType === 0);
                copy[id].Classes = classSlots.map(() => ({ SubjectId: "", IsEnabled: true }));
            }
        }
        setPlans(copy);
    }

    function updateTimeRule(id: string, field: keyof TimeRule, value: number) {
        const copy = { ...plans };
        copy[id] = { ...copy[id], TimeRule: { ...copy[id].TimeRule, [field]: value } };
        setPlans(copy);
    }

    function updateClass(planId: string, idx: number, field: keyof ClassInfo, value: unknown) {
        const copy = { ...plans };
        const classes = [...copy[planId].Classes];
        classes[idx] = { ...classes[idx], [field]: value };
        copy[planId] = { ...copy[planId], Classes: classes };
        setPlans(copy);
    }

    const currentPlan = selectedPlanId ? plans[selectedPlanId] : null;
    const currentTimeLayout = currentPlan ? timeLayouts[currentPlan.TimeLayoutId] : null;
    const classSlots = currentTimeLayout ? currentTimeLayout.Layouts.filter(item => item.TimeType === 0) : [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">课表管理</h1>
                    <p className="page-subtitle">管理 ClassIsland 课表档案 (ClassPlan)</p>
                </div>
                <div className="flex gap-8">
                    <Button appearance="primary" icon={<Add24Regular />} onClick={() => setShowCreate(true)}>新建文件</Button>
                    <Button appearance="secondary" icon={<ArrowSync24Regular />} onClick={loadFiles}>刷新</Button>
                </div>
            </div>

            {msg && <MessageBar intent={msg.type} style={{ marginBottom: 16 }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

            <div className="flex gap-24">
                <div style={{ width: 260, flexShrink: 0 }}>
                    <div className="card mb-16">
                        <div className="card-title">课表文件</div>
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
                                <div className="card-title" style={{ margin: 0 }}>课表列表</div>
                                <Button appearance="subtle" size="small" icon={<Add24Regular />} onClick={addPlan} />
                            </div>
                            {Object.entries(plans).map(([id, cp]) => (
                                <div key={id} className={`sidebar-link ${selectedPlanId === id ? "active" : ""}`} onClick={() => setSelectedPlanId(id)}>
                                    <span style={{ flex: 1 }}>{cp.Name}</span>
                                    {!cp.IsEnabled && <span className="badge badge-danger" style={{ fontSize: 10 }}>禁用</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    {!selectedFile ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择课表文件</div></div></div>
                    ) : dataLoading ? (
                        <div className="card"><div className="empty-state"><Spinner size="medium" /></div></div>
                    ) : !currentPlan ? (
                        <div className="card"><div className="empty-state"><div className="empty-state-text">请选择或添加课表</div></div></div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-16">
                                <Input value={currentPlan.Name}
                                    onChange={(_, d) => updatePlan(selectedPlanId!, "Name", d.value)}
                                    style={{ fontWeight: 600, fontSize: 16 }} />
                                <div className="flex gap-8">
                                    <Button appearance="primary" icon={<Save24Regular />} onClick={handleSave} disabled={saving}>
                                        {saving ? <Spinner size="tiny" /> : "保存"}
                                    </Button>
                                    <Button appearance="subtle" icon={<Delete24Regular />} onClick={() => deletePlan(selectedPlanId!)}
                                        style={{ color: "var(--danger-color)" }} />
                                </div>
                            </div>

                            {/* 课表属性 */}
                            <div className="grid-2 mb-16">
                                <div className="form-group">
                                    <label className="form-label">关联时间表</label>
                                    <Select value={currentPlan.TimeLayoutId}
                                        onChange={(_, d) => updatePlan(selectedPlanId!, "TimeLayoutId", d.value)} style={{ width: "100%" }}>
                                        <option value="">-- 选择时间表 --</option>
                                        {Object.entries(timeLayouts).map(([id, tl]) => (
                                            <option key={id} value={id}>{tl.Name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">启用状态</label>
                                    <Switch checked={currentPlan.IsEnabled}
                                        onChange={(_, d) => updatePlan(selectedPlanId!, "IsEnabled", d.checked)}
                                        label={currentPlan.IsEnabled ? "已启用" : "已禁用"} />
                                </div>
                            </div>

                            {/* 触发规则 */}
                            <div className="settings-section">
                                <div className="settings-section-title">触发规则 (TimeRule)</div>
                                <div className="grid-3">
                                    <div className="form-group">
                                        <label className="form-label">星期</label>
                                        <Select value={String(currentPlan.TimeRule.WeekDay)}
                                            onChange={(_, d) => updateTimeRule(selectedPlanId!, "WeekDay", parseInt(d.value))} style={{ width: "100%" }}>
                                            {WEEKDAY_LABELS.map((label, idx) => (
                                                <option key={idx} value={idx}>{label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">多周轮换周次</label>
                                        <Input type="number" value={String(currentPlan.TimeRule.WeekCountDiv)}
                                            onChange={(_, d) => updateTimeRule(selectedPlanId!, "WeekCountDiv", parseInt(d.value) || 0)}
                                            style={{ width: "100%" }} />
                                        <div className="form-hint">0 = 不轮换</div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">轮换总周数</label>
                                        <Input type="number" value={String(currentPlan.TimeRule.WeekCountDivTotal)}
                                            onChange={(_, d) => updateTimeRule(selectedPlanId!, "WeekCountDivTotal", parseInt(d.value) || 2)}
                                            style={{ width: "100%" }} />
                                    </div>
                                </div>
                            </div>

                            {/* 课程列表 */}
                            <div className="settings-section">
                                <div className="settings-section-title">课程安排</div>
                                {!currentTimeLayout ? (
                                    <div className="empty-state"><div className="empty-state-text">请先选择关联的时间表</div></div>
                                ) : (
                                    <div className="classplan-grid">
                                        {currentTimeLayout.Layouts.map((timeItem, idx) => {
                                            const isClassSlot = timeItem.TimeType === 0;
                                            const classIdx = isClassSlot
                                                ? currentTimeLayout.Layouts.slice(0, idx).filter(i => i.TimeType === 0).length
                                                : -1;
                                            const classInfo = isClassSlot && classIdx < currentPlan.Classes.length
                                                ? currentPlan.Classes[classIdx]
                                                : null;

                                            return (
                                                <div key={idx} className={`classplan-row ${timeItem.TimeType === 1 ? "is-break" : ""} ${timeItem.TimeType === 2 ? "is-divider" : ""}`}>
                                                    <div className="classplan-row-time">
                                                        {formatTime(timeItem.StartTime)} - {formatTime(timeItem.EndTime)}
                                                    </div>
                                                    <span className="timeline-type-badge" style={{
                                                        background: timeItem.TimeType === 0 ? "#e1efff" : timeItem.TimeType === 1 ? "#dff6dd" : "#f0f0f0",
                                                        color: timeItem.TimeType === 0 ? "#0078d4" : timeItem.TimeType === 1 ? "#107c10" : "#666",
                                                    }}>
                                                        {TIME_TYPE_LABELS[timeItem.TimeType as keyof typeof TIME_TYPE_LABELS] || "未知"}
                                                    </span>
                                                    <div className="classplan-row-content">
                                                        {isClassSlot && classInfo ? (
                                                            <Select value={classInfo.SubjectId}
                                                                onChange={(_, d) => updateClass(selectedPlanId!, classIdx, "SubjectId", d.value)}
                                                                style={{ minWidth: 160 }}>
                                                                <option value="">-- 空闲 --</option>
                                                                {Object.entries(subjects).map(([subId, sub]) => (
                                                                    <option key={subId} value={subId}>{sub.Name}{sub.TeacherName ? ` (${sub.TeacherName})` : ""}</option>
                                                                ))}
                                                            </Select>
                                                        ) : timeItem.TimeType === 1 ? (
                                                            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                                                {timeItem.BreakName || "课间休息"}
                                                            </span>
                                                        ) : timeItem.TimeType === 2 ? (
                                                            <hr style={{ border: "none", borderTop: "1px dashed var(--border-color)", width: "100%" }} />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 12, fontFamily: "monospace" }}>
                                ID: {selectedPlanId}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <Dialog open onOpenChange={() => setShowCreate(false)}>
                    <DialogSurface><DialogBody>
                        <DialogTitle>新建课表文件</DialogTitle>
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
