"use client";
import JsonResourceEditor from "@/components/JsonResourceEditor";

export default function SettingsPage() {
    return (
        <JsonResourceEditor
            resourceType="DefaultSettings"
            title="默认设置管理"
            subtitle="管理 ClassIsland 默认设置 (DefaultSettings)"
        />
    );
}
