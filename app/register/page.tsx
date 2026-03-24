"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import Link from "next/link";

export default function RegisterPage() {
    const { register, isAuthenticated, loading, error, clearError } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        if (isAuthenticated) router.push("/");
    }, [isAuthenticated, router]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        clearError();
        await register({ username, email, password, display_name: displayName || undefined });
    }

    if (isAuthenticated) return null;

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-title">创建账户</div>
                <div className="login-subtitle">注册 CIMS 管理账号</div>

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <Label htmlFor="username">用户名</Label>
                        <Input id="username" value={username} onChange={(_, d) => setUsername(d.value)}
                            placeholder="3-64 个字符" style={{ width: "100%" }} />
                    </div>
                    <div className="form-group">
                        <Label htmlFor="email">邮箱</Label>
                        <Input id="email" type="email" value={email} onChange={(_, d) => setEmail(d.value)}
                            placeholder="user@example.com" style={{ width: "100%" }} />
                    </div>
                    <div className="form-group">
                        <Label htmlFor="displayName">显示名称（可选）</Label>
                        <Input id="displayName" value={displayName} onChange={(_, d) => setDisplayName(d.value)}
                            placeholder="显示名称" style={{ width: "100%" }} />
                    </div>
                    <div className="form-group">
                        <Label htmlFor="password">密码</Label>
                        <Input id="password" type="password" value={password} onChange={(_, d) => setPassword(d.value)}
                            placeholder="至少 12 个字符" style={{ width: "100%" }} />
                        <div className="form-hint">密码长度至少为 12 个字符</div>
                    </div>
                    {error && (
                        <MessageBar intent="error" style={{ marginBottom: 12 }}>
                            <MessageBarBody>{error}</MessageBarBody>
                        </MessageBar>
                    )}
                    <Button appearance="primary" type="submit"
                        disabled={loading || !username || !email || !password || password.length < 12}
                        style={{ width: "100%", marginTop: 8 }}>
                        {loading ? <Spinner size="tiny" /> : "注册"}
                    </Button>
                    <div className="text-center mt-16">
                        <Link href="/login" style={{ fontSize: 13, color: "var(--accent-color)" }}>
                            已有账号？返回登录
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
