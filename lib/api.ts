/* ===== API 客户端层 ===== */
/* 统一封装所有后端接口调用，Bearer Token 自动注入 */
/* 三端点架构：Management API / Admin API / Client API */

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
// 服务器地址（从环境变量读取）
// Management API (27042) / Admin API (27043) / Client API (27041)
// ============================================================

const STORAGE_KEY_TOKEN = "cims_auth_token";

/** Management API 地址（认证、账户内操作） */
export function getServerUrl(): string {
    const url = process.env.NEXT_PUBLIC_CIMS_ENDPOINT || "";
    return url.replace(/\/+$/, "");
}

/** Admin API 地址（超管端点） */
export function getAdminUrl(): string {
    const url = process.env.NEXT_PUBLIC_CIMS_ADMIN_ENDPOINT || "";
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

/**
 * 401 时触发全局事件，供 AuthProvider 拦截并显示内联登录卡片。
 * 不再硬跳转 /login，保留用户上下文。
 */
function emitAuthExpired(): void {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cims:auth-expired"));
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
        emitAuthExpired();
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

function get<T>(path: string, base?: string): Promise<T> {
    return request<T>(path, { method: "GET" }, base);
}

function post<T>(path: string, body?: unknown, base?: string): Promise<T> {
    return request<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    }, base);
}

function put<T>(path: string, body?: unknown, base?: string): Promise<T> {
    return request<T>(path, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
    }, base);
}

function patch<T>(path: string, body?: unknown, base?: string): Promise<T> {
    return request<T>(path, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
    }, base);
}

function del<T>(path: string, base?: string): Promise<T> {
    return request<T>(path, { method: "DELETE" }, base);
}

/** 编码账户内路径前缀 */
function acctPath(accountId: string): string {
    return `/accounts/${encodeURIComponent(accountId)}`;
}

// ============================================================
// Auth (Management API: /auth/*)
// ============================================================

export const auth = {
    register: (data: UserRegisterRequest) =>
        post<TokenResponse>("/auth/register", data),

    login: (data: UserLoginRequest) =>
        post<LoginResult>("/auth/login", data),

    logout: () =>
        post<MessageResponse>("/auth/logout"),
};

// ============================================================
// 2FA (Management API: /auth/2fa/*)
// ============================================================

export const twoFA = {
    enable: () =>
        post<TotpEnableResponse>("/auth/2fa/enable"),

    confirm: (data: TotpConfirmRequest) =>
        post<unknown>("/auth/2fa/confirm", data),

    disable: (data: TotpDisableRequest) =>
        post<unknown>("/auth/2fa/disable", data),

    verify: (data: TotpVerifyRequest) =>
        post<TokenResponse>("/auth/2fa/verify", data),

    recover: (data: TotpRecoverRequest) =>
        post<TokenResponse>("/auth/2fa/recover", data),
};

// ============================================================
// Accounts (Management API: /accounts)
// ============================================================

export const accounts = {
    /** 列出当前用户有权访问的所有账户 */
    list: () =>
        get<AccountOut[]>("/accounts"),

    /** 下载 ManagementPreset.json */
    downloadPreset: (accountId: string, classIdentity?: string) => {
        let url = `${acctPath(accountId)}/preset`;
        if (classIdentity) url += `?class_identity=${encodeURIComponent(classIdentity)}`;
        return get<unknown>(url);
    },
};

// ============================================================
// Roles (Management API: /accounts/{accountId}/roles)
// ============================================================

export const roles = {
    list: (accountId: string) =>
        get<RoleOut[]>(`${acctPath(accountId)}/roles`),

    create: (accountId: string, data: RoleCreateRequest) =>
        post<RoleOut>(`${acctPath(accountId)}/roles`, data),

    delete: (accountId: string, code: string) =>
        del<unknown>(`${acctPath(accountId)}/roles/${encodeURIComponent(code)}`),
};

// ============================================================
// Quotas (Management API: /accounts/{accountId}/quotas)
// ============================================================

export const quotas = {
    list: (accountId: string) =>
        get<QuotaOut[]>(`${acctPath(accountId)}/quotas`),

    update: (accountId: string, data: QuotaSetRequest) =>
        put<QuotaOut>(`${acctPath(accountId)}/quotas`, data),
};

// ============================================================
// Permissions (Management API: /accounts/{accountId}/permissions)
// ============================================================

export const permissions = {
    listDefs: (accountId: string) =>
        get<PermissionDefOut[]>(`${acctPath(accountId)}/permissions/defs`),

    grant: (accountId: string, data: PermissionGrantRequest) =>
        post<unknown>(`${acctPath(accountId)}/permissions/grant`, data),

    revoke: (accountId: string, data: PermissionRevokeRequest) =>
        post<unknown>(`${acctPath(accountId)}/permissions/revoke`, data),
};

// ============================================================
// Pairing (Management API: /accounts/{accountId}/pairing)
// ============================================================

export const pairing = {
    listCodes: (accountId: string) =>
        get<PairingListResponse>(`${acctPath(accountId)}/pairing/codes`),

    getCode: (accountId: string, code: string) =>
        get<PairingCodeDetail>(`${acctPath(accountId)}/pairing/codes/${encodeURIComponent(code)}`),

    deleteCode: (accountId: string, code: string) =>
        del<unknown>(`${acctPath(accountId)}/pairing/codes/${encodeURIComponent(code)}`),

    approve: (accountId: string, code: string) =>
        post<unknown>(`${acctPath(accountId)}/pairing/approve/${encodeURIComponent(code)}`),

    toggle: (accountId: string, data: PairingToggle) =>
        put<unknown>(`${acctPath(accountId)}/pairing/toggle`, data),
};

// ============================================================
// Data（资源 CRUD, Management API: /accounts/{accountId}/command/datas/*)
// ============================================================

export const data = {
    create: (accountId: string, type: ResourceType, name: string) =>
        get<StatusResponse>(`${acctPath(accountId)}/command/datas/${type}/create?name=${encodeURIComponent(name)}`),

    list: (accountId: string, type: ResourceType) =>
        get<string[]>(`${acctPath(accountId)}/command/datas/${type}/list`),

    deleteData: (accountId: string, type: ResourceType, name: string) =>
        get<StatusResponse>(`${acctPath(accountId)}/command/datas/${type}/delete?name=${encodeURIComponent(name)}`),

    getToken: (accountId: string, type: ResourceType, name: string) =>
        get<{ token: string }>(`${acctPath(accountId)}/command/datas/${type}/token?name=${encodeURIComponent(name)}`),

    write: (accountId: string, type: ResourceType, name: string, payload: unknown, version?: number) => {
        let url = `${acctPath(accountId)}/command/datas/${type}/write?name=${encodeURIComponent(name)}`;
        if (version !== undefined) url += `&version=${version}`;
        return put<StatusResponse>(url, payload);
    },

    update: (accountId: string, type: ResourceType, name: string, payload: unknown, version?: number) => {
        let url = `${acctPath(accountId)}/command/datas/${type}/update?name=${encodeURIComponent(name)}`;
        if (version !== undefined) url += `&version=${version}`;
        return patch<StatusResponse>(url, payload);
    },

    batch: (accountId: string, ops: BatchRequest) =>
        post<unknown>(`${acctPath(accountId)}/command/datas/batch`, ops),

    /** 获取资源内容：先获取 token，再请求 Client API /get?token=xxx */
    async read(accountId: string, type: ResourceType, name: string): Promise<unknown> {
        const { token } = await this.getToken(accountId, type, name);
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
// Clients (Management API: /accounts/{accountId}/command/clients/*)
// ============================================================

export const clients = {
    list: (accountId: string) =>
        get<string[]>(`${acctPath(accountId)}/command/clients/list`),

    status: (accountId: string) =>
        get<unknown>(`${acctPath(accountId)}/command/clients/status`),

    details: (accountId: string, uid: string) =>
        get<unknown>(`${acctPath(accountId)}/command/client/${encodeURIComponent(uid)}/details`),

    restart: (accountId: string, uid: string) =>
        get<StatusResponse>(`${acctPath(accountId)}/command/client/${encodeURIComponent(uid)}/restart`),

    forceSync: (accountId: string, uid: string) =>
        get<StatusResponse>(`${acctPath(accountId)}/command/client/${encodeURIComponent(uid)}/update_data`),

    sendNotification: (accountId: string, uid: string, payload: NotificationPayload) =>
        post<StatusResponse>(`${acctPath(accountId)}/command/client/${encodeURIComponent(uid)}/send_notification`, payload),

    getConfig: (accountId: string, uid: string, configType: number) =>
        get<unknown>(`${acctPath(accountId)}/command/client/${encodeURIComponent(uid)}/get_config?config_type=${configType}`),
};

// ============================================================
// Admin API（超管专用，使用 Admin 端点）
// ============================================================

const adminBase = () => getAdminUrl();

export const adminApi = {
    /** 列出所有账户 */
    listAccounts: () =>
        get<AccountOut[]>("/admin/accounts", adminBase()),

    /** 查询单个账户 */
    getAccount: (accountId: string) =>
        get<AccountOut>(`/admin/accounts/${encodeURIComponent(accountId)}`, adminBase()),

    /** 列出所有用户（分页） */
    listUsers: (offset = 0, limit = 20) =>
        get<UserOut[]>(`/admin/users?offset=${offset}&limit=${limit}`, adminBase()),

    /** 查询单个用户 */
    getUser: (userId: string) =>
        get<UserOut>(`/admin/users/${encodeURIComponent(userId)}`, adminBase()),

    /** 更新用户 */
    updateUser: (userId: string, data: UserUpdateRequest) =>
        patch<UserOut>(`/admin/users/${encodeURIComponent(userId)}`, data, adminBase()),

    /**
     * 探测当前 token 是否有超管权限。
     * 成功返回 true, 403 返回 false, 其它错误抛出。
     */
    async probeSuperAdmin(): Promise<boolean> {
        try {
            await get<unknown>("/", adminBase());
            return true;
        } catch (e) {
            if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
                return false;
            }
            return false;
        }
    },
};
