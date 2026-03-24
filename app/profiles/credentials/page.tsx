"use client";
import JsonResourceEditor from "@/components/JsonResourceEditor";

export default function CredentialsPage() {
    return (
        <JsonResourceEditor
            resourceType="Credentials"
            title="凭据管理"
            subtitle="管理 ClassIsland 凭据设置 (Credentials)"
        />
    );
}
