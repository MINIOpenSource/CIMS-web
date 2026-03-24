"use client";

/**
 * 账户上下文管理器（Cloudflare 风格账户切换）。
 *
 * 用户登录后拉取可用账户列表，选择后设为当前账户上下文。
 * 只有一个账户时自动选中。accountId 供 API 层使用。
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { accounts as accountsApi } from "./api";
import type { AccountOut } from "./types";

const STORAGE_KEY = "cims_current_account_id";

interface AccountState {
    /** 所有可用账户 */
    accounts: AccountOut[];
    /** 当前选中的账户 */
    currentAccount: AccountOut | null;
    /** 当前账户 ID 快捷访问 */
    accountId: string;
    /** 是否正在加载 */
    loading: boolean;
    /** 切换到另一个账户 */
    switchAccount: (accountId: string) => void;
    /** 重新拉取账户列表 */
    refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({
    children,
    isAuthenticated,
}: {
    children: ReactNode;
    isAuthenticated: boolean;
}) {
    const [accountList, setAccountList] = useState<AccountOut[]>([]);
    const [currentAccount, setCurrentAccount] = useState<AccountOut | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshAccounts = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const list = await accountsApi.list();
            setAccountList(list);

            // 恢复上次选择或自动选中唯一账户
            const savedId = typeof window !== "undefined"
                ? localStorage.getItem(STORAGE_KEY)
                : null;
            const saved = savedId ? list.find(a => a.id === savedId) : null;
            if (saved) {
                setCurrentAccount(saved);
            } else if (list.length === 1) {
                setCurrentAccount(list[0]);
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, list[0].id);
                }
            } else if (list.length > 0 && !currentAccount) {
                setCurrentAccount(list[0]);
                if (typeof window !== "undefined") {
                    localStorage.setItem(STORAGE_KEY, list[0].id);
                }
            }
        } catch {
            /* 加载失败保持现状 */
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAuthenticated) {
            refreshAccounts();
        } else {
            setAccountList([]);
            setCurrentAccount(null);
        }
    }, [isAuthenticated, refreshAccounts]);

    const switchAccount = useCallback((id: string) => {
        const target = accountList.find(a => a.id === id);
        if (target) {
            setCurrentAccount(target);
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, id);
            }
        }
    }, [accountList]);

    return (
        <AccountContext.Provider value={{
            accounts: accountList,
            currentAccount,
            accountId: currentAccount?.id || "",
            loading,
            switchAccount,
            refreshAccounts,
        }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount(): AccountState {
    const ctx = useContext(AccountContext);
    if (!ctx) throw new Error("useAccount must be used within AccountProvider");
    return ctx;
}
