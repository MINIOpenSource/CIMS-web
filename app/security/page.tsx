"use client";

import React, { useState } from "react";
import { twoFA } from "@/lib/api";
import type { TotpEnableResponse } from "@/lib/types";
import {
    Button, Input, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { ShieldKeyhole24Regular } from "@fluentui/react-icons";

export default function SecurityPage() {
    const [step, setStep] = useState<"idle" | "setup" | "confirm" | "disable">("idle");
    const [setupData, setSetupData] = useState<TotpEnableResponse | null>(null);
    const [confirmCode, setConfirmCode] = useState("");
    const [disablePassword, setDisablePassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleEnable() {
        setLoading(true);
        setMsg(null);
        try {
            const res = await twoFA.enable();
            setSetupData(res);
            setStep("setup");
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "启用失败" });
        }
        setLoading(false);
    }

    async function handleConfirm() {
        setLoading(true);
        setMsg(null);
        try {
            await twoFA.confirm({ code: confirmCode });
            setMsg({ type: "success", text: "两步验证已成功启用！请妥善保管恢复码。" });
            setStep("idle");
            setSetupData(null);
            setConfirmCode("");
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "确认失败" });
        }
        setLoading(false);
    }

    async function handleDisable() {
        setLoading(true);
        setMsg(null);
        try {
            await twoFA.disable({ password: disablePassword });
            setMsg({ type: "success", text: "两步验证已禁用" });
            setStep("idle");
            setDisablePassword("");
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "禁用失败" });
        }
        setLoading(false);
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">安全设置</h1>
                    <p className="page-subtitle">管理两步验证 (2FA) 和账户安全</p>
                </div>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card">
                <div className="card-title flex items-center gap-8">
                    <ShieldKeyhole24Regular />
                    两步验证 (TOTP)
                </div>

                {step === "idle" && (
                    <div className="flex gap-12">
                        <Button appearance="primary" onClick={handleEnable} disabled={loading}>
                            {loading ? <Spinner size="tiny" /> : "启用两步验证"}
                        </Button>
                        <Button appearance="secondary" onClick={() => setStep("disable")}>
                            禁用两步验证
                        </Button>
                    </div>
                )}

                {step === "setup" && setupData && (
                    <div>
                        <div className="settings-section">
                            <div className="settings-section-title">1. 扫描二维码或手动输入密钥</div>
                            <div className="form-group">
                                <label className="form-label">TOTP URI</label>
                                <Input value={setupData.uri} readOnly style={{ width: "100%", fontFamily: "monospace", fontSize: 11 }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">密钥 (Secret)</label>
                                <Input value={setupData.secret} readOnly style={{ width: "100%", fontFamily: "monospace", letterSpacing: 2 }} />
                                <div className="form-hint">请将此密钥添加到您的身份验证器应用（如 Google Authenticator、Authy）</div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-title">2. 备份恢复码</div>
                            <div className="card" style={{ background: "#fff4ce", border: "1px solid #ffd700" }}>
                                <p style={{ fontWeight: 500, marginBottom: 8, color: "#975700" }}>
                                    ⚠️ 请妥善保管以下恢复码，每个恢复码只能使用一次
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, fontFamily: "monospace", fontSize: 14 }}>
                                    {setupData.recovery_codes.map((code, i) => (
                                        <div key={i} style={{ padding: "4px 8px", background: "white", borderRadius: 4 }}>{code}</div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-title">3. 输入验证码确认</div>
                            <div className="flex items-center gap-12">
                                <Input value={confirmCode} onChange={(_, d) => setConfirmCode(d.value)} placeholder="6 位验证码" style={{ width: 200 }} />
                                <Button appearance="primary" onClick={handleConfirm} disabled={loading || confirmCode.length < 6}>
                                    {loading ? <Spinner size="tiny" /> : "确认启用"}
                                </Button>
                                <Button appearance="secondary" onClick={() => { setStep("idle"); setSetupData(null); }}>取消</Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === "disable" && (
                    <div>
                        <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
                            禁用两步验证需要验证当前账户密码。
                        </p>
                        <div className="flex items-center gap-12">
                            <Input type="password" value={disablePassword} onChange={(_, d) => setDisablePassword(d.value)}
                                placeholder="请输入当前密码" style={{ width: 300 }} />
                            <Button appearance="primary" onClick={handleDisable} disabled={loading || !disablePassword}
                                style={{ background: "var(--danger-color)" }}>
                                {loading ? <Spinner size="tiny" /> : "禁用 2FA"}
                            </Button>
                            <Button appearance="secondary" onClick={() => setStep("idle")}>取消</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
