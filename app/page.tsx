"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAccount } from "@/lib/account-context";
import { useRouter } from "next/navigation";
import { clients, data, pairing } from "@/lib/api";
import type { ResourceType } from "@/lib/types";
import {
  PlugConnected24Regular, People24Regular,
  Link24Regular, Document24Regular,
} from "@fluentui/react-icons";

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-8" style={{ color: color || "var(--accent-color)" }}>
        {icon}
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { accountId } = useAccount();
  const router = useRouter();
  const [stats, setStats] = useState({
    clientCount: "-",
    pairingCount: "-",
    resourceCount: "-",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (accountId) loadStats();
  }, [isAuthenticated, accountId, router]);

  async function loadStats() {
    if (!accountId) return;
    try {
      const [cl, pr] = await Promise.allSettled([
        clients.list(accountId),
        pairing.listCodes(accountId),
      ]);
      const resourceTypes: ResourceType[] = [
        "ClassPlan", "TimeLayout", "Subjects", "Policy",
        "DefaultSettings", "Components", "Credentials",
      ];
      const resourceResults = await Promise.allSettled(
        resourceTypes.map(t => data.list(accountId, t))
      );
      let totalRes = 0;
      resourceResults.forEach(r => {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          totalRes += r.value.length;
        }
      });

      setStats({
        clientCount: cl.status === "fulfilled" && Array.isArray(cl.value) ? String(cl.value.length) : "0",
        pairingCount: pr.status === "fulfilled" && Array.isArray(pr.value) ? String(pr.value.length) : "0",
        resourceCount: String(totalRes),
      });
    } catch {
      /* 加载失败保持默认值 */
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表盘</h1>
          <p className="page-subtitle">ClassIsland Management Service 概览</p>
        </div>
      </div>

      <div className="grid-4">
        <StatCard
          icon={<PlugConnected24Regular />}
          label="已注册客户端"
          value={stats.clientCount}
        />
        <StatCard
          icon={<Link24Regular />}
          label="待处理配对码"
          value={stats.pairingCount}
          color="var(--warning-color)"
        />
        <StatCard
          icon={<Document24Regular />}
          label="资源文件数"
          value={stats.resourceCount}
          color="#8764b8"
        />
      </div>

      <div className="card mt-16">
        <div className="card-title">快速开始</div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          从左侧导航栏选择功能模块开始管理。您可以管理科目、时间表、课表等档案数据，
          也可以远程控制客户端、管理用户权限和配对码。
        </p>
      </div>
    </div>
  );
}
