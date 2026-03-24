"use client";

/**
 * 认证上下文 + SuperAdmin 检测 + 401 内联登录支持。
 *
 * - 登录后探测 Admin API 判断是否超管。
 * - 监听 cims:auth-expired 事件触发内联登录卡片。
 * - 重新登录后自动关闭卡片，页面无需再次跳转。
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { auth as authApi, adminApi, getToken, setToken, clearToken } from "./api";
import type { UserLoginRequest, UserRegisterRequest, LoginResult, TokenResponse, TwoFARequired } from "./types";

interface AuthState {
    /** 是否已登录 */
    isAuthenticated: boolean;
    /** 当前 token */
    token: string | null;
    /** 是否超级管理员 */
    isSuperAdmin: boolean;
    /** 是否正在 2FA 验证流程中 */
    pending2FA: TwoFARequired | null;
    /** 需要重新认证（token 失效） */
    requireReAuth: boolean;
    /** 正在加载 */
    loading: boolean;
    /** 错误消息 */
    error: string | null;
    /** 登录 */
    login: (data: UserLoginRequest) => Promise<void>;
    /** 注册 */
    register: (data: UserRegisterRequest) => Promise<void>;
    /** 登出 */
    logout: () => Promise<void>;
    /** 完成 2FA 后设置 token */
    complete2FA: (token: string) => void;
    /** 清除 2FA 状态 */
    cancel2FA: () => void;
    /** 清除错误 */
    clearError: () => void;
    /** 重新认证（内联登录完成后） */
    handleReAuth: (data: UserLoginRequest) => Promise<void>;
    /** 关闭重新认证对话框 */
    dismissReAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [pending2FA, setPending2FA] = useState<TwoFARequired | null>(null);
    const [requireReAuth, setRequireReAuth] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化：从 localStorage 读取 token
    useEffect(() => {
        setTokenState(getToken());
    }, []);

    const isAuthenticated = !!token;

    // 探测超管权限
    const checkSuperAdmin = useCallback(async () => {
        try {
            const result = await adminApi.probeSuperAdmin();
            setIsSuperAdmin(result);
        } catch {
            setIsSuperAdmin(false);
        }
    }, []);

    // token 变化时探测超管
    useEffect(() => {
        if (token) {
            checkSuperAdmin();
        } else {
            setIsSuperAdmin(false);
        }
    }, [token, checkSuperAdmin]);

    // 监听 401 事件
    useEffect(() => {
        function onAuthExpired() {
            setRequireReAuth(true);
        }
        window.addEventListener("cims:auth-expired", onAuthExpired);
        return () => window.removeEventListener("cims:auth-expired", onAuthExpired);
    }, []);

    const login = useCallback(async (data: UserLoginRequest) => {
        setLoading(true);
        setError(null);
        try {
            const result: LoginResult = await authApi.login(data);
            if ("requires_2fa" in result && result.requires_2fa) {
                setPending2FA(result as TwoFARequired);
            } else {
                const tr = result as TokenResponse;
                setToken(tr.token);
                setTokenState(tr.token);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "登录失败";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (data: UserRegisterRequest) => {
        setLoading(true);
        setError(null);
        try {
            const result = await authApi.register(data);
            setToken(result.token);
            setTokenState(result.token);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "注册失败";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch { /* 忽略登出错误 */ }
        clearToken();
        setTokenState(null);
        setPending2FA(null);
        setIsSuperAdmin(false);
        setRequireReAuth(false);
    }, []);

    const complete2FA = useCallback((t: string) => {
        setToken(t);
        setTokenState(t);
        setPending2FA(null);
    }, []);

    const cancel2FA = useCallback(() => {
        setPending2FA(null);
    }, []);

    const clearErrorCb = useCallback(() => setError(null), []);

    // 内联重新认证
    const handleReAuth = useCallback(async (data: UserLoginRequest) => {
        setLoading(true);
        setError(null);
        try {
            const result: LoginResult = await authApi.login(data);
            if ("requires_2fa" in result && result.requires_2fa) {
                setPending2FA(result as TwoFARequired);
            } else {
                const tr = result as TokenResponse;
                setToken(tr.token);
                setTokenState(tr.token);
                setRequireReAuth(false);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "重新登录失败";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const dismissReAuth = useCallback(() => {
        setRequireReAuth(false);
        clearToken();
        setTokenState(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            token,
            isSuperAdmin,
            pending2FA,
            requireReAuth,
            loading,
            error,
            login,
            register,
            logout,
            complete2FA,
            cancel2FA,
            clearError: clearErrorCb,
            handleReAuth,
            dismissReAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
