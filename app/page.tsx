"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccount } from "@/lib/account-context";
import { useRouter } from "next/navigation";
import {
  Button, Spinner,
} from "@fluentui/react-components";
import {
  PersonAccounts24Regular,
  Add24Regular,
  ArrowRight16Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
} from "@fluentui/react-icons";
import type { AccountOut } from "@/lib/types";

function AccountCard({ account, onSelect }: { account: AccountOut; onSelect: () => void }) {
  return (
    <button
      className="account-card"
      onClick={onSelect}
      type="button"
    >
      <div className="account-card-icon">
        <PersonAccounts24Regular />
      </div>
      <div className="account-card-info">
        <div className="account-card-name">{account.name}</div>
        <div className="account-card-meta">
          <code className="account-card-slug">{account.slug}</code>
          <span className={`badge ${account.is_active ? "badge-success" : "badge-danger"}`} style={{ fontSize: 11, padding: "1px 6px" }}>
            {account.is_active ? (
              <><CheckmarkCircle16Regular style={{ fontSize: 12, marginRight: 2 }} /> 活跃</>
            ) : (
              <><DismissCircle16Regular style={{ fontSize: 12, marginRight: 2 }} /> 停用</>
            )}
          </span>
        </div>
        <div className="account-card-id">ID: {account.id}</div>
      </div>
      <div className="account-card-arrow">
        <ArrowRight16Regular />
      </div>
    </button>
  );
}

export default function AccountListPage() {
  const { isAuthenticated, logout } = useAuth();
  const { accounts, loading, switchAccount, accountId } = useAccount();
  const router = useRouter();

  function handleSelect(account: AccountOut) {
    switchAccount(account.id);
    router.push("/dashboard");
  }

  if (!isAuthenticated) return null;

  return (
    <div className="login-container fade-in">
      <div className="login-card" style={{ padding: "32px 24px" }}>
        <div className="login-title">选择账户</div>
        <div className="login-subtitle">
          选择一个账户以进入管理面板
        </div>

        {loading ? (
          <div className="accounts-list-loading">
            <Spinner size="large" />
            <p>正在加载账户列表…</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="accounts-list-empty">
            <PersonAccounts24Regular style={{ fontSize: 48, color: "var(--text-tertiary)" }} />
            <p className="accounts-list-empty-text">暂无可用账户</p>
            <p className="accounts-list-empty-hint">您还没有加入任何账户，请联系管理员或创建新账户。</p>
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={() => router.push("/accounts/new")}
            >
              创建账户
            </Button>
          </div>
        ) : (
          <div className="accounts-list-grid">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onSelect={() => handleSelect(account)}
              />
            ))}
          </div>
        )}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button appearance="subtle" onClick={() => logout()}>退出登录</Button>
        </div>
      </div>
    </div>
  );
}
