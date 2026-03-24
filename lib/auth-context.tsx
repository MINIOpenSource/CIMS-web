"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { auth as authApi, getToken, setToken, clearToken } from "./api";
import type { UserLoginRequest, UserRegisterRequest, LoginResult, TokenResponse, TwoFARequired } from "./types";

interface AuthState {
    /** 是否已登录 */
    isAuthenticated: boolean;
    /** 当前 token */
    token: string | null;
    /** 是否正在 2FA 验证流程中 */
    pending2FA: TwoFARequired | null;
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
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(null);
    const [pending2FA, setPending2FA] = useState<TwoFARequired | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTokenState(getToken());
    }, []);

    const isAuthenticated = !!token;

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

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            token,
            pending2FA,
            loading,
            error,
            login,
            register,
            logout,
            complete2FA,
            cancel2FA,
            clearError: clearErrorCb,
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
