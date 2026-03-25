"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home24Regular, PlugConnected24Regular, Link24Regular,
    Settings24Regular, Book24Regular, Clock24Regular,
    Board24Regular, ShieldTask24Regular, Apps24Regular,
    Key24Regular, PersonAccounts24Regular,
    Send24Regular, PeopleAdd24Regular, Laptop24Regular,
    DataBarVertical24Regular,
} from "@fluentui/react-icons";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: "概览",
        items: [
            { label: "仪表盘", href: "/dashboard", icon: <Home24Regular /> },
        ],
    },
    {
        title: "档案管理",
        items: [
            { label: "科目管理", href: "/profiles/subjects", icon: <Book24Regular /> },
            { label: "时间表管理", href: "/profiles/timelayout", icon: <Clock24Regular /> },
            { label: "课表管理", href: "/profiles/classplan", icon: <Board24Regular /> },
            { label: "策略管理", href: "/profiles/policy", icon: <ShieldTask24Regular /> },
            { label: "默认设置", href: "/profiles/settings", icon: <Settings24Regular /> },
            { label: "组件设置", href: "/profiles/components", icon: <Apps24Regular /> },
            { label: "凭据管理", href: "/profiles/credentials", icon: <Key24Regular /> },
        ],
    },
    {
        title: "客户端",
        items: [
            { label: "客户端管理", href: "/clients", icon: <PlugConnected24Regular /> },
            { label: "通知推送", href: "/notifications", icon: <Send24Regular /> },
        ],
    },
    {
        title: "接入管理",
        items: [
            { label: "配对码管理", href: "/pairing", icon: <Link24Regular /> },
            { label: "预注册客户端", href: "/pre-registration", icon: <Laptop24Regular /> },
        ],
    },
    {
        title: "账户",
        items: [
            { label: "账户概览", href: "/accounts", icon: <PersonAccounts24Regular /> },
            { label: "访问控制", href: "/access", icon: <PeopleAdd24Regular /> },
            { label: "邀请管理", href: "/invitations", icon: <PeopleAdd24Regular /> },
        ],
    },
    {
        title: "安全",
        items: [
            { label: "安全设置", href: "/security", icon: <DataBarVertical24Regular /> },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <img src="/logo.svg" alt="ClassIsland" className="sidebar-logo" />
                <div className="sidebar-title">CIMS 管理面板</div>
            </div>
            <nav className="sidebar-nav">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="sidebar-section">
                        <div className="sidebar-section-label">{section.title}</div>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${isActive ? "active" : ""}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
