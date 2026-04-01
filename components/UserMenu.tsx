"use client";

/**
 * 右上角用户菜单（Cloudflare 风格）。
 *
 * 弹出卡片包含：用户头像/角色、当前账户信息、
 * 账户切换器、SuperAdmin 面板入口（条件显示）、安全设置和登出。
 */

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccount } from "@/lib/account-context";
import { ROLE_LABELS, SYSTEM_ROLES } from "@/lib/types";
import {
    Person24Regular, ShieldKeyhole24Regular,
    Settings24Regular, SignOut24Regular,
    ChevronDown16Regular, Checkmark16Regular,
    ArrowSwap20Regular,
} from "@fluentui/react-icons";

export default function UserMenu() {
    const { isSuperAdmin, logout, token } = useAuth();
    const { accounts, currentAccount, switchAccount } = useAccount();
    const [open, setOpen] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭
    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setShowSwitcher(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const roleLabel = currentAccount
        ? (isSuperAdmin ? ROLE_LABELS[SYSTEM_ROLES.SUPERADMIN] : ROLE_LABELS[SYSTEM_ROLES.NORMAL])
        : "";

    return (
        <div className="user-menu-wrapper" ref={menuRef}>
            {/* 触发按钮 */}
            <button
                className="user-menu-trigger"
                onClick={() => { setOpen(!open); setShowSwitcher(false); }}
                aria-label="用户菜单"
            >
                <div className="user-menu-avatar">
                    <Person24Regular />
                </div>
                {currentAccount && (
                    <span className="user-menu-account-name">
                        {currentAccount.name}
                    </span>
                )}
                <ChevronDown16Regular />
            </button>

            {/* 弹出面板 */}
            {open && (
                <div className="user-menu-popover">
                    {!showSwitcher ? (
                        <>
                            {/* 用户信息区 */}
                            <div className="user-menu-header">
                                <div className="user-menu-avatar-lg">
                                    <Person24Regular />
                                </div>
                                <div className="user-menu-info">
                                    <div className="user-menu-name">
                                        {currentAccount?.name || "未选择账户"}
                                    </div>
                                    <div className="user-menu-role">
                                        {roleLabel}
                                    </div>
                                </div>
                            </div>

                            <div className="user-menu-divider" />

                            {/* 当前账户 */}
                            {currentAccount && (
                                <div className="user-menu-section">
                                    <div className="user-menu-section-label">当前账户</div>
                                    <div className="user-menu-current-account">
                                        <span>{currentAccount.name}</span>
                                        <span className="user-menu-slug">{currentAccount.slug}</span>
                                    </div>
                                </div>
                            )}

                            {/* 账户切换 */}
                            {accounts.length > 1 && (
                                <button
                                    className="user-menu-item"
                                    onClick={() => setShowSwitcher(true)}
                                >
                                    <ArrowSwap20Regular />
                                    <span>切换账户</span>
                                </button>
                            )}

                            <div className="user-menu-divider" />

                            {/* SuperAdmin 入口 */}
                            {isSuperAdmin && (
                                <button
                                    className="user-menu-item user-menu-item-admin"
                                    onClick={() => {
                                        setOpen(false);
                                        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_SITE_URL;
                                        if (adminUrl && token) {
                                            window.location.href = `${adminUrl}/auth?token=${encodeURIComponent(token)}`;
                                        } else {
                                            window.location.href = "/admin";
                                        }
                                    }}
                                >
                                    <ShieldKeyhole24Regular />
                                    <span>管理员面板</span>
                                </button>
                            )}

                            {/* 安全设置 */}
                            <a
                                className="user-menu-item"
                                href="/security"
                                onClick={() => setOpen(false)}
                            >
                                <Settings24Regular />
                                <span>安全设置</span>
                            </a>

                            <div className="user-menu-divider" />

                            {/* 登出 */}
                            <button
                                className="user-menu-item user-menu-item-danger"
                                onClick={() => { logout(); setOpen(false); }}
                            >
                                <SignOut24Regular />
                                <span>登出</span>
                            </button>
                        </>
                    ) : (
                        /* 账户切换列表 */
                        <>
                            <div className="user-menu-header">
                                <button
                                    className="user-menu-back"
                                    onClick={() => setShowSwitcher(false)}
                                >
                                    ← 返回
                                </button>
                                <span className="user-menu-section-label">选择账户</span>
                            </div>
                            <div className="user-menu-divider" />
                            <div className="user-menu-account-list">
                                {accounts.map(acct => (
                                    <button
                                        key={acct.id}
                                        className={`user-menu-account-item ${currentAccount?.id === acct.id ? "active" : ""
                                            }`}
                                        onClick={() => {
                                            switchAccount(acct.id);
                                            setShowSwitcher(false);
                                            setOpen(false);
                                        }}
                                    >
                                        <div>
                                            <div className="user-menu-account-item-name">{acct.name}</div>
                                            <div className="user-menu-account-item-slug">{acct.slug}</div>
                                        </div>
                                        {currentAccount?.id === acct.id && (
                                            <Checkmark16Regular />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
