"use client";

/**
 * 401 内联登录对话框。
 *
 * Token 失效时覆盖在当前页面上方，保留用户上下文。
 * 重新登录成功后自动关闭，页面数据可通过 retry 自动刷新。
 */

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { twoFA } from "@/lib/api";
import {
    Button, Input, Label, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";

export default function LoginDialog() {
    const { requireReAuth, handleReAuth, dismissReAuth, pending2FA, complete2FA, loading, error, clearError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState<string | null>(null);

    if (!requireReAuth) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        await handleReAuth({ email, password });
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

    return (
        <div className="login-dialog-overlay">
            <div className="login-dialog-card">
                <div className="login-dialog-header">
                    <div className="login-dialog-title">会话已过期或权限不足</div>
                    <div className="login-dialog-subtitle">请重新登录以继续操作</div>
                </div>

                {pending2FA ? (
                    <form onSubmit={handle2FAVerify}>
                        <div className="form-group">
                            <Label htmlFor="reauth-totp">两步验证码</Label>
                            <Input
                                id="reauth-totp"
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
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <Label htmlFor="reauth-email">邮箱</Label>
                            <Input
                                id="reauth-email"
                                type="email"
                                value={email}
                                onChange={(_, d) => setEmail(d.value)}
                                placeholder="user@example.com"
                                style={{ width: "100%" }}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="reauth-password">密码</Label>
                            <Input
                                id="reauth-password"
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
                        <div className="login-dialog-actions">
                            <Button
                                appearance="primary"
                                type="submit"
                                disabled={loading || !email || !password}
                                style={{ flex: 1 }}
                            >
                                {loading ? <Spinner size="tiny" /> : "重新登录"}
                            </Button>
                            <Button
                                appearance="subtle"
                                onClick={dismissReAuth}
                            >
                                退出
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
