"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { twoFA } from "@/lib/api";
import {
    Button, Input, Label, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import Link from "next/link";

export default function LoginPage() {
    const { login, isAuthenticated, pending2FA, complete2FA, cancel2FA, loading, error, clearError } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState("");
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated) router.push("/");
    }, [isAuthenticated, router]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        await login({ email, password });
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

    if (isAuthenticated) return null;

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-title">CIMS 管理面板</div>
                <div className="login-subtitle">ClassIsland Management Service</div>

                {pending2FA ? (
                    /* 2FA 验证流 */
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
                                {twoFAError && (
                                    <MessageBar intent="error" style={{ marginBottom: 12 }}>
                                        <MessageBarBody>{twoFAError}</MessageBarBody>
                                    </MessageBar>
                                )}
                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={twoFALoading || !totpCode}
                                    style={{ width: "100%" }}
                                >
                                    {twoFALoading ? <Spinner size="tiny" /> : "验证"}
                                </Button>
                                <div className="flex justify-between mt-16">
                                    <Button appearance="subtle" size="small" onClick={() => setRecoveryMode(true)}>
                                        使用恢复码
                                    </Button>
                                    <Button appearance="subtle" size="small" onClick={cancel2FA}>
                                        返回登录
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
                                {twoFAError && (
                                    <MessageBar intent="error" style={{ marginBottom: 12 }}>
                                        <MessageBarBody>{twoFAError}</MessageBarBody>
                                    </MessageBar>
                                )}
                                <Button
                                    appearance="primary"
                                    type="submit"
                                    disabled={twoFALoading || !recoveryCode}
                                    style={{ width: "100%" }}
                                >
                                    {twoFALoading ? <Spinner size="tiny" /> : "恢复"}
                                </Button>
                                <div className="flex justify-between mt-16">
                                    <Button appearance="subtle" size="small" onClick={() => setRecoveryMode(false)}>
                                        使用验证码
                                    </Button>
                                    <Button appearance="subtle" size="small" onClick={cancel2FA}>
                                        返回登录
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    /* 登录表单 */
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <Label htmlFor="email">邮箱</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(_, d) => setEmail(d.value)}
                                placeholder="user@example.com"
                                style={{ width: "100%" }}
                            />
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
                            />
                        </div>
                        {error && (
                            <MessageBar intent="error" style={{ marginBottom: 12 }}>
                                <MessageBarBody>{error}</MessageBarBody>
                            </MessageBar>
                        )}
                        <Button
                            appearance="primary"
                            type="submit"
                            disabled={loading || !email || !password}
                            style={{ width: "100%", marginTop: 8 }}
                        >
                            {loading ? <Spinner size="tiny" /> : "登录"}
                        </Button>
                        <div className="text-center mt-16">
                            <Link href="/register" style={{ fontSize: 13, color: "var(--accent-color)" }}>
                                还没有账号？立即注册
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
