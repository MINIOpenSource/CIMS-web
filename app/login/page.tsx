"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { auth as authApi, twoFA, ApiError } from "@/lib/api";
import {
    Button, Input, Label, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import Link from "next/link";

type AuthStep = "email" | "login" | "register" | "2fa";

export default function LoginPage() {
    const { login, register, isAuthenticated, pending2FA, complete2FA, cancel2FA, loading: contextLoading, error: contextError, clearError, registerSuccess } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<AuthStep>("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [totpCode, setTotpCode] = useState("");
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState("");

    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);
    const [twoFALoading, setTwoFALoading] = useState(false);

    useEffect(() => {
        if (pending2FA) setStep("2fa");
    }, [pending2FA]);

    useEffect(() => {
        if (isAuthenticated) router.push("/");
    }, [isAuthenticated, router]);

    const loading = contextLoading || localLoading || twoFALoading;
    const error = localError || contextError || twoFAError;

    if (isAuthenticated) return null;

    async function handleEmailCheck(e: React.FormEvent) {
        e.preventDefault();
        setLocalError(null);
        clearError();
        if (!email) return;

        setLocalLoading(true);
        try {
            const res = await authApi.checkMailAvailability(email) as { available?: boolean };
            if (res && res.available === false) {
                setStep("login");
            } else {
                setStep("register");
            }
        } catch (err: unknown) {
            // 如果检查抛出错误（例如网络错误或 422），安全起见由于不可知，默认进入登录
            setStep("login");
        } finally {
            setLocalLoading(false);
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        setLocalError(null);
        await login({ email, password });
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        setLocalError(null);
        await register({ email, password, display_name: displayName || undefined });
    }

    async function handle2FAVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!pending2FA) return;
        setTwoFALoading(true);
        setTwoFAError(null);
        try {
            const result = await twoFA.verify({
                temp_token: pending2FA.temp_token,
                code: totpCode,
            });
            if (result && typeof result === "object" && "token" in result) {
                complete2FA((result as { token: string }).token);
            }
        } catch (err: unknown) {
            setTwoFAError(err instanceof Error ? err.message : "验证失败");
        } finally {
            setTwoFALoading(false);
        }
    }

    async function handle2FARecover(e: React.FormEvent) {
        e.preventDefault();
        if (!pending2FA) return;
        setTwoFALoading(true);
        setTwoFAError(null);
        try {
            const result = await twoFA.recover({
                temp_token: pending2FA.temp_token,
                recovery_code: recoveryCode,
            });
            if (result && typeof result === "object" && "token" in result) {
                complete2FA((result as { token: string }).token);
            }
        } catch (err: unknown) {
            setTwoFAError(err instanceof Error ? err.message : "恢复失败");
        } finally {
            setTwoFALoading(false);
        }
    }

    const resetFlow = () => {
        setStep("email");
        clearError();
        setLocalError(null);
        setTwoFAError(null);
        if (pending2FA) cancel2FA();
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-title">CIMS 管理面板</div>
                <div className="login-subtitle">
                    {step === "email" && "输入您的邮箱以继续"}
                    {step === "login" && "欢迎回来，请登录"}
                    {step === "register" && "创建一个新账户"}
                    {step === "2fa" && "安全验证"}
                </div>

                {error && (
                    <MessageBar intent="error" style={{ marginBottom: 12 }}>
                        <MessageBarBody>{error}</MessageBarBody>
                    </MessageBar>
                )}

                {registerSuccess && step === "register" ? (
                    <div>
                        <MessageBar intent="success" style={{ marginBottom: 16 }}>
                            <MessageBarBody>{registerSuccess}</MessageBarBody>
                        </MessageBar>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                            您的注册申请已提交，请等待管理员审核后再登录。
                        </p>
                        <Button appearance="primary" style={{ width: "100%" }} onClick={resetFlow}>
                            返回
                        </Button>
                    </div>
                ) : (
                    <div>
                        {step === "email" && (
                            <form onSubmit={handleEmailCheck}>
                                <div className="form-group">
                                    <Label htmlFor="email">邮箱</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(_, d) => setEmail(d.value)}
                                        placeholder="user@example.com"
                                        style={{ width: "100%" }}
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={loading || !email}
                                    style={{ width: "100%", marginTop: 8 }}
                                >
                                    {loading ? <Spinner size="tiny" /> : "继续"}
                                </Button>
                            </form>
                        )}

                        {step === "login" && (
                            <form onSubmit={handleLogin}>
                                <div className="form-group">
                                    <Label htmlFor="login-email">邮箱</Label>
                                    <Input id="login-email" type="email" value={email} readOnly disabled style={{ width: "100%" }} />
                                </div>
                                <div className="form-group">
                                    <Label htmlFor="password">密码</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(_, d) => setPassword(d.value)}
                                        placeholder="请输入密码"
                                        style={{ width: "100%" }}
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={loading || !password}
                                    style={{ width: "100%", marginTop: 8 }}
                                >
                                    {loading ? <Spinner size="tiny" /> : "登录"}
                                </Button>
                                <div className="text-center mt-16">
                                    <Button appearance="subtle" size="small" onClick={resetFlow}>
                                        使用其他邮箱
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === "register" && (
                            <form onSubmit={handleRegister}>
                                <div className="form-group">
                                    <Label htmlFor="reg-email">邮箱</Label>
                                    <Input id="reg-email" type="email" value={email} readOnly disabled style={{ width: "100%" }} />
                                </div>
                                <div className="form-group">
                                    <Label htmlFor="displayName">显示名称（可选）</Label>
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(_, d) => setDisplayName(d.value)}
                                        placeholder="显示名称"
                                        style={{ width: "100%" }}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <Label htmlFor="reg-password">密码</Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        value={password}
                                        onChange={(_, d) => setPassword(d.value)}
                                        placeholder="至少 12 个字符"
                                        style={{ width: "100%" }}
                                    />
                                    <div className="form-hint" style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>密码长度至少为 12 个字符，用户名将自动生成</div>
                                </div>
                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={loading || password.length < 12}
                                    style={{ width: "100%", marginTop: 8 }}
                                >
                                    {loading ? <Spinner size="tiny" /> : "完成注册"}
                                </Button>
                                <div className="text-center mt-16">
                                    <Button appearance="subtle" size="small" onClick={resetFlow}>
                                        使用其他邮箱
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === "2fa" && (
                            <div>
                                {!recoveryMode ? (
                                    <form onSubmit={handle2FAVerify}>
                                        <div className="form-group">
                                            <Label htmlFor="totp">两步验证码</Label>
                                            <Input
                                                id="totp"
                                                value={totpCode}
                                                onChange={(_, d) => setTotpCode(d.value)}
                                                placeholder="请输入 6 位验证码"
                                                style={{ width: "100%" }}
                                                autoFocus
                                            />
                                        </div>
                                        <Button
                                            appearance="primary"
                                            type="submit"
                                            disabled={loading || !totpCode}
                                            style={{ width: "100%", marginTop: 8 }}
                                        >
                                            {loading ? <Spinner size="tiny" /> : "验证"}
                                        </Button>
                                        <div className="flex justify-between mt-16">
                                            <Button appearance="subtle" size="small" onClick={() => setRecoveryMode(true)}>
                                                使用恢复码
                                            </Button>
                                            <Button appearance="subtle" size="small" onClick={resetFlow}>
                                                返回
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handle2FARecover}>
                                        <div className="form-group">
                                            <Label htmlFor="recovery">恢复码</Label>
                                            <Input
                                                id="recovery"
                                                value={recoveryCode}
                                                onChange={(_, d) => setRecoveryCode(d.value)}
                                                placeholder="请输入恢复码"
                                                style={{ width: "100%" }}
                                                autoFocus
                                            />
                                        </div>
                                        <Button
                                            appearance="primary"
                                            type="submit"
                                            disabled={loading || !recoveryCode}
                                            style={{ width: "100%", marginTop: 8 }}
                                        >
                                            {loading ? <Spinner size="tiny" /> : "恢复"}
                                        </Button>
                                        <div className="flex justify-between mt-16">
                                            <Button appearance="subtle" size="small" onClick={() => setRecoveryMode(false)}>
                                                使用验证码
                                            </Button>
                                            <Button appearance="subtle" size="small" onClick={resetFlow}>
                                                返回
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
