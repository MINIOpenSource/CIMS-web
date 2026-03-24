"use client";

/**
 * 用户管理页面（当前账户内）。
 * 使用 Admin API 的用户管理功能。
 * 注意：完整用户管理已移至 /admin/users（SuperAdmin 面板）。
 * 此页面保留为当前账户的成员视图。
 */

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@fluentui/react-components";
import { People24Regular, ArrowRight24Regular } from "@fluentui/react-icons";
import Link from "next/link";

export default function UsersPage() {
    const { isSuperAdmin } = useAuth();

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">用户管理</h1>
                    <p className="page-subtitle">管理系统用户（需超管权限）</p>
                </div>
            </div>

            <div className="card">
                <div className="empty-state">
                    <People24Regular />
                    <div className="empty-state-text">
                        用户管理功能已迁移至超管面板
                    </div>
                    {isSuperAdmin ? (
                        <Link href="/admin/users" style={{ marginTop: 16 }}>
                            <Button appearance="primary" icon={<ArrowRight24Regular />}>
                                前往超管面板
                            </Button>
                        </Link>
                    ) : (
                        <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                            请联系超级管理员进行用户管理操作。
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
