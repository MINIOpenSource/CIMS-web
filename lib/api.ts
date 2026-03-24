/* ===== API 客户端层 ===== */
/* 统一封装所有后端接口调用，Bearer Token 自动注入 */

import type {
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserOut, UserUpdateRequest, RoleOut, RoleCreateRequest,
    AccountOut, QuotaOut, QuotaSetRequest,
    PermissionDefOut, PermissionGrantRequest, PermissionRevokeRequest,
    TotpEnableResponse, TotpConfirmRequest, TotpDisableRequest,
    TotpVerifyRequest, TotpRecoverRequest,
    PairingListResponse, PairingCodeDetail, PairingToggle,
    NotificationPayload, BatchRequest,
    StatusResponse, MessageResponse, LoginResult,
    ResourceType,
} from "./types";

// ============================================================
// 服务器地址（从环境变量读取，写死在 .env 中）
// Admin API (50051) 和 Client API (50050) 是分离的
// ============================================================

const STORAGE_KEY_TOKEN = "cims_auth_token";

/** Admin API 地址（管理端点、command 端点） */
export function getServerUrl(): string {
    const url = process.env.NEXT_PUBLIC_CIMS_ENDPOINT || "";
    return url.replace(/\/+$/, "");
}

/** Client API 地址（/get?token= 资源获取端点） */
export function getClientUrl(): string {
    const url = process.env.NEXT_PUBLIC_CIMS_CLIENT_ENDPOINT || "";
    return url.replace(/\/+$/, "");
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function clearToken(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
}

// ============================================================
// 通用请求
// ============================================================

export class ApiError extends Error {
    status: number;
    detail: unknown;
    constructor(status: number, detail: unknown) {
        super(typeof detail === "string" ? detail : JSON.stringify(detail));
        this.status = status;
        this.detail = detail;
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    baseOverride?: string,
): Promise<T> {
    const base = baseOverride || getServerUrl();
    if (!base) throw new Error("未配置服务器地址");

    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (options.body && typeof options.body === "string") {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${base}${path}`, { ...options, headers });

    if (res.status === 401) {
        clearToken();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw new ApiError(401, "未授权，请重新登录");
    }

    if (!res.ok) {
        let detail: unknown;
        try { detail = await res.json(); } catch { detail = await res.text(); }
        throw new ApiError(res.status, detail);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

function get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
}

function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    });
}

function put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
    });
}

function patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
    });
}

function del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
}

// ============================================================
// Auth
// ============================================================

export const auth = {
    register: (data: UserRegisterRequest) =>
        post<TokenResponse>("/admin/auth/register", data),

    login: (data: UserLoginRequest) =>
        post<LoginResult>("/admin/auth/login", data),

    logout: () =>
        post<MessageResponse>("/admin/auth/logout"),
};

// ============================================================
// 2FA
// ============================================================

export const twoFA = {
    enable: () =>
        post<TotpEnableResponse>("/admin/admin/auth/2fa/enable"),

    confirm: (data: TotpConfirmRequest) =>
        post<unknown>("/admin/admin/auth/2fa/confirm", data),

    disable: (data: TotpDisableRequest) =>
        post<unknown>("/admin/admin/auth/2fa/disable", data),

    verify: (data: TotpVerifyRequest) =>
        post<TokenResponse>("/admin/admin/auth/2fa/verify", data),

    recover: (data: TotpRecoverRequest) =>
        post<TokenResponse>("/admin/admin/auth/2fa/recover", data),
};

// ============================================================
// Users
// ============================================================

export const users = {
    list: (offset = 0, limit = 20) =>
        get<UserOut[]>(`/admin/users?offset=${offset}&limit=${limit}`),

    getById: (userId: string) =>
        get<UserOut>(`/admin/users/${encodeURIComponent(userId)}`),

    update: (userId: string, data: UserUpdateRequest) =>
        patch<UserOut>(`/admin/users/${encodeURIComponent(userId)}`, data),
};

// ============================================================
// Roles
// ============================================================

export const roles = {
    list: () =>
        get<RoleOut[]>("/admin/roles"),

    create: (data: RoleCreateRequest) =>
        post<RoleOut>("/admin/roles", data),

    delete: (code: string) =>
        del<unknown>(`/admin/roles/${encodeURIComponent(code)}`),
};

// ============================================================
// Accounts
// ============================================================

export const accounts = {
    list: () =>
        get<AccountOut[]>("/admin/accounts"),

    getById: (accountId: string) =>
        get<AccountOut>(`/admin/accounts/${encodeURIComponent(accountId)}`),
};

// ============================================================
// Quotas
// ============================================================

export const quotas = {
    list: (accountId: string) =>
        get<QuotaOut[]>(`/admin/quotas/${encodeURIComponent(accountId)}`),

    update: (accountId: string, data: QuotaSetRequest) =>
        put<QuotaOut>(`/admin/quotas/${encodeURIComponent(accountId)}`, data),
};

// ============================================================
// Permissions
// ============================================================

export const permissions = {
    listDefs: () =>
        get<PermissionDefOut[]>("/admin/permissions/defs"),

    grant: (data: PermissionGrantRequest) =>
        post<unknown>("/admin/permissions/grant", data),

    revoke: (data: PermissionRevokeRequest) =>
        post<unknown>("/admin/permissions/revoke", data),
};

// ============================================================
// Pairing
// ============================================================

export const pairing = {
    listCodes: () =>
        get<PairingListResponse>("/admin/pairing/codes"),

    getCode: (code: string) =>
        get<PairingCodeDetail>(`/admin/pairing/codes/${encodeURIComponent(code)}`),

    deleteCode: (code: string) =>
        del<unknown>(`/admin/pairing/codes/${encodeURIComponent(code)}`),

    approve: (code: string) =>
        post<unknown>(`/admin/pairing/approve/${encodeURIComponent(code)}`),

    toggle: (data: PairingToggle) =>
        put<unknown>("/admin/pairing/toggle", data),
};

// ============================================================
// Data（资源 CRUD）
// ============================================================

export const data = {
    create: (type: ResourceType, name: string) =>
        get<StatusResponse>(`/command/datas/${type}/create?name=${encodeURIComponent(name)}`),

    list: (type: ResourceType) =>
        get<string[]>(`/command/datas/${type}/list`),

    deleteData: (type: ResourceType, name: string) =>
        get<StatusResponse>(`/command/datas/${type}/delete?name=${encodeURIComponent(name)}`),

    getToken: (type: ResourceType, name: string) =>
        get<{ token: string }>(`/command/datas/${type}/token?name=${encodeURIComponent(name)}`),

    write: (type: ResourceType, name: string, payload: unknown, version?: number) => {
        let url = `/command/datas/${type}/write?name=${encodeURIComponent(name)}`;
        if (version !== undefined) url += `&version=${version}`;
        return put<StatusResponse>(url, payload);
    },

    update: (type: ResourceType, name: string, payload: unknown, version?: number) => {
        let url = `/command/datas/${type}/update?name=${encodeURIComponent(name)}`;
        if (version !== undefined) url += `&version=${version}`;
        return patch<StatusResponse>(url, payload);
    },

    batch: (ops: BatchRequest) =>
        post<unknown>("/command/datas/batch", ops),

    /** 获取资源内容：先获取 token，再请求 Client API /get?token=xxx */
    async read(type: ResourceType, name: string): Promise<unknown> {
        const { token } = await this.getToken(type, name);
        const clientBase = getClientUrl();
        if (!clientBase) throw new Error("未配置 Client API 地址");
        const res = await fetch(`${clientBase}/get?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new ApiError(res.status, "资源加载失败");
        const text = await res.text();
        if (!text) return {};
        return JSON.parse(text);
    },
};

// ============================================================
// Clients
// ============================================================

export const clients = {
    list: () =>
        get<string[]>("/command/clients/list"),

    status: () =>
        get<unknown>("/command/clients/status"),

    details: (uid: string) =>
        get<unknown>(`/command/client/${encodeURIComponent(uid)}/details`),

    restart: (uid: string) =>
        get<StatusResponse>(`/command/client/${encodeURIComponent(uid)}/restart`),

    forceSync: (uid: string) =>
        get<StatusResponse>(`/command/client/${encodeURIComponent(uid)}/update_data`),

    sendNotification: (uid: string, payload: NotificationPayload) =>
        post<StatusResponse>(`/command/client/${encodeURIComponent(uid)}/send_notification`, payload),

    getConfig: (uid: string, configType: number) =>
        get<unknown>(`/command/client/${encodeURIComponent(uid)}/get_config?config_type=${configType}`),
};
