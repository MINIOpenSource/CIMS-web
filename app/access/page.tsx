"use client";

import React, { useState, useEffect, useCallback } from "react";
import { access } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import type { AccessMember } from "@/lib/types";
import { Spinner } from "@fluentui/react-components";
import { ROLE_LABELS } from "@/lib/types";

export default function AccessPage() {
    const { accountId } = useAccount();
    const [members, setMembers] = useState<AccessMember[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            setMembers(await access.list(accountId));
        } catch { setMembers([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">访问控制</h1>
                    <p className="page-subtitle">管理账户下的具权用户</p>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : members.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-text">暂无具权用户</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>用户 ID</th>
                                <th>角色</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.user_id}>
                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{m.user_id}</td>
                                    <td>
                                        <span className="badge badge-info">
                                            {ROLE_LABELS[m.role_code] || m.role_code}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
