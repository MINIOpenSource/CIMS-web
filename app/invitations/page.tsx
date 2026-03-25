"use client";

import React, { useState, useEffect, useCallback } from "react";
import { invitations } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import {
    Button, Spinner,
    MessageBar, MessageBarBody,
} from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";

export default function InvitationsPage() {
    const { accountId } = useAccount();
    const [list, setList] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            setList(await invitations.list(accountId));
        } catch { setList([]); }
        setLoading(false);
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleCreate() {
        try {
            await invitations.create(accountId);
            setMsg({ type: "success", text: "邀请已创建" });
            loadData();
        } catch (err: unknown) {
            setMsg({ type: "error", text: err instanceof Error ? err.message : "创建失败" });
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">邀请管理</h1>
                    <p className="page-subtitle">管理账户邀请</p>
                </div>
                <Button appearance="primary" icon={<Add24Regular />} onClick={handleCreate}>
                    创建邀请
                </Button>
            </div>

            {msg && (
                <MessageBar intent={msg.type} style={{ marginBottom: 16 }}>
                    <MessageBarBody>{msg.text}</MessageBarBody>
                </MessageBar>
            )}

            <div className="card">
                {loading ? (
                    <div className="empty-state"><Spinner size="medium" /></div>
                ) : list.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">暂无邀请</div>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 8 }}>
                            邀请功能正在开发中，敬请期待
                        </p>
                    </div>
                ) : (
                    <div>
                        {list.map((item, idx) => (
                            <div key={idx} className="detail-row" style={{ padding: "12px 0" }}>
                                <pre style={{ fontSize: 12 }}>{JSON.stringify(item, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
