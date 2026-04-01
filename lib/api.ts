/* ===== API 客户端层 ===== */
/* 统一封装所有后端接口调用，Bearer Token 自动注入 */
/* 双端点架构：Management API / Admin API */

import type {
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserOut, UserUpdateRequest, AccountOut, AccountCreate, SlugUpdate,
    EmailUpdate, UsernameUpdate, PasswordChange,
    TotpEnableResponse, TotpConfirmRequest, TotpDisableRequest,
    TotpVerifyRequest, TotpRecoverRequest,
    PairingCodeOut, PreRegOut, PreRegCreate, AccessMember, AccessRoleUpdate,
    InvitationOut, InvitationCreate,
    NotificationPayload, BatchRequest,
    StatusResponse, MessageResponse, LoginResult,
    ResourceType, SettingsUpdate,
} from "./types";

// ============================================================
// 服务器地址（从环境变量读取）
// Management API (27042) / Admin API (27043)
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

    if (res.status === 401 || res.status === 403) {
        emitAuthExpired();
        throw new ApiError(res.status, "未授权或权限不足，请重新登录");
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
    return `/account/${encodeURIComponent(accountId)}`;
}

// ============================================================
// Token (Management API: /token/*)
// ============================================================

export const token = {
    refresh: () =>
        post<TokenResponse>("/token/refresh"),

    verify: () =>
        post<unknown>("/token/verify"),

    deactivate: () =>
        post<MessageResponse>("/token/deactivate"),
};

// ============================================================
// Auth (Management API: /user/*)
// ============================================================

export const auth = {
    /** 申请注册（Pending 状态，需管理员审核） */
    register: (data: UserRegisterRequest) =>
        post<MessageResponse>("/user/apply", data),

    /** 登录 */
    login: (data: UserLoginRequest) =>
        post<LoginResult>("/user/auth", data),

    /** 登出 */
    logout: () =>
        post<MessageResponse>("/token/deactivate"),

    /** 检查邮箱是否可用 (未被注册) */
    checkMailAvailability: (email: string) =>
        get<unknown>(`/user/availability/mail?value=${encodeURIComponent(email)}`),

    /** 检查用户名是否可用 */
    checkUsernameAvailability: (username: string) =>
        get<unknown>(`/user/availability/username?value=${encodeURIComponent(username)}`),
};

// ============================================================
// User Info (Management API: /user/info/*)
// ============================================================

export const userInfo = {
    /** 获取当前用户信息 */
    get: () =>
        get<UserOut>("/user/info"),

    /** 修改邮箱 */
    changeEmail: (data: EmailUpdate) =>
        post<unknown>("/user/info/email", data),

    /** 修改用户名 */
    changeUsername: (data: UsernameUpdate) =>
        post<unknown>("/user/info/username", data),

    /** 修改密码 */
    changePassword: (data: PasswordChange) =>
        post<unknown>("/user/info/password/change", data),
};

// ============================================================
// 2FA (Management API: /user/2fa/totp/*)
// ============================================================

export const twoFA = {
    enable: () =>
        post<TotpEnableResponse>("/user/2fa/totp/enable"),

    confirm: (data: TotpConfirmRequest) =>
        post<unknown>("/user/2fa/totp/confirm", data),

    disable: (data: TotpDisableRequest) =>
        post<unknown>("/user/2fa/totp/disable", data),

    verify: (data: TotpVerifyRequest) =>
        post<TokenResponse>("/user/2fa/totp/verify", data),

    recover: (data: TotpRecoverRequest) =>
        post<TokenResponse>("/user/2fa/totp/recover", data),
};

// ============================================================
// Accounts (Management API: /account/*)
// ============================================================

export const accounts = {
    /** 列出当前用户有权访问的所有账户 */
    list: () =>
        get<AccountOut[]>("/account/list"),

    /** 搜索账户 */
    search: (q: string) =>
        post<AccountOut[]>(`/account/search?q=${encodeURIComponent(q)}`),

    /** 申请创建新账户 */
    apply: (data: AccountCreate) =>
        post<AccountOut>("/account/apply", data),

    /** 删除/停用账户 */
    delete: (accountId: string) =>
        del<unknown>(`/account/${encodeURIComponent(accountId)}`),

    /** 获取账户信息 */
    info: (accountId: string) =>
        get<AccountOut>(`/account/${encodeURIComponent(accountId)}/info`),

    /** 修改账户 slug */
    changeSlug: (accountId: string, data: SlugUpdate) =>
        post<AccountOut>(`/account/${encodeURIComponent(accountId)}/info/slug`, data),
};

// ============================================================
// Pairing (Management API: /account/{accountId}/pairing/*)
// ============================================================

export const pairing = {
    /** 列出配对码 */
    listCodes: (accountId: string) =>
        get<PairingCodeOut[]>(`${acctPath(accountId)}/pairing/list`),

    /** 搜索配对码 */
    search: (accountId: string, q?: string) =>
        get<PairingCodeOut[]>(`${acctPath(accountId)}/pairing/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 批准配对码 */
    approve: (accountId: string, pairingId: string) =>
        post<unknown>(`${acctPath(accountId)}/pairing/${encodeURIComponent(pairingId)}/approve`),

    /** 拒绝配对码 */
    reject: (accountId: string, pairingId: string) =>
        post<unknown>(`${acctPath(accountId)}/pairing/${encodeURIComponent(pairingId)}/reject`),

    /** 启用配对功能 */
    enable: (accountId: string) =>
        post<unknown>(`${acctPath(accountId)}/pairing/enable`),

    /** 禁用配对功能 */
    disable: (accountId: string) =>
        post<unknown>(`${acctPath(accountId)}/pairing/disable`),
};

// ============================================================
// Pre-Registration (Management API: /account/{accountId}/pre-registration/*)
// ============================================================

export const preRegistration = {
    /** 列出预注册客户端 */
    list: (accountId: string) =>
        get<PreRegOut[]>(`${acctPath(accountId)}/pre-registration/list`),

    /** 搜索预注册客户端 */
    search: (accountId: string, q?: string) =>
        get<PreRegOut[]>(`${acctPath(accountId)}/pre-registration/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 获取预注册客户端详情 */
    get: (accountId: string, preRegId: string) =>
        get<PreRegOut>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}`),

    /** 创建预注册客户端 */
    create: (accountId: string, data: PreRegCreate) =>
        post<PreRegOut>(`${acctPath(accountId)}/pre-registration/create`, data),

    /** 删除预注册客户端 */
    delete: (accountId: string, preRegId: string) =>
        del<void>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}`),

    /** 重命名预注册客户端 */
    rename: (accountId: string, preRegId: string, body: { label: string }) =>
        post<unknown>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}/rename`, body),

    /** 启用预注册客户端 */
    enable: (accountId: string, preRegId: string) =>
        post<unknown>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}/enable`),

    /** 禁用预注册客户端 */
    disable: (accountId: string, preRegId: string) =>
        post<unknown>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}/disable`),

    /** 修改预注册客户端档案组 */
    config: (accountId: string, preRegId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}/config`, body),

    /** 下载引导配置 */
    downloadPreset: (accountId: string, preRegId: string) =>
        get<unknown>(`${acctPath(accountId)}/pre-registration/${encodeURIComponent(preRegId)}/ManagementPreset.json`),
};

// ============================================================
// Access Control (Management API: /account/{accountId}/access/*)
// ============================================================

export const access = {
    /** 列出具权用户 */
    list: (accountId: string) =>
        get<AccessMember[]>(`${acctPath(accountId)}/access/list`),

    /** 搜索具权用户 */
    search: (accountId: string, q?: string) =>
        get<AccessMember[]>(`${acctPath(accountId)}/access/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 获取具权用户信息 */
    get: (accountId: string, userId: string) =>
        get<AccessMember>(`${acctPath(accountId)}/access/${encodeURIComponent(userId)}`),

    /** 修改成员角色 */
    update: (accountId: string, userId: string, data: AccessRoleUpdate) =>
        post<AccessMember>(`${acctPath(accountId)}/access/${encodeURIComponent(userId)}`, data),

    /** 重命名具权用户 */
    rename: (accountId: string, userId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/access/${encodeURIComponent(userId)}/rename`, body),

    /** 移除成员 */
    delete: (accountId: string, userId: string) =>
        del<void>(`${acctPath(accountId)}/access/${encodeURIComponent(userId)}`),
};

// ============================================================
// Invitations (Management API: /account/{accountId}/invitation/*)
// ============================================================

export const invitations = {
    /** 列出邀请 */
    list: (accountId: string) =>
        get<InvitationOut[]>(`${acctPath(accountId)}/invitation/list`),

    /** 搜索邀请 */
    search: (accountId: string, q?: string) =>
        get<InvitationOut[]>(`${acctPath(accountId)}/invitation/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 获取邀请详情 */
    get: (accountId: string, invitationId: string) =>
        get<InvitationOut>(`${acctPath(accountId)}/invitation/${encodeURIComponent(invitationId)}`),

    /** 创建邀请 */
    create: (accountId: string, data?: InvitationCreate) =>
        post<InvitationOut>(`${acctPath(accountId)}/invitation/create`, data || {}),

    /** 重命名邀请 */
    rename: (accountId: string, invitationId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/invitation/${encodeURIComponent(invitationId)}/rename`, body),

    /** 删除邀请 */
    delete: (accountId: string, invitationId: string) =>
        del<void>(`${acctPath(accountId)}/invitation/${encodeURIComponent(invitationId)}`),
};

// ============================================================
// Data（资源 CRUD, Management API: /account/{accountId}/{resource_type}/...)
// ============================================================

export const data = {
    /** 创建资源 */
    create: (accountId: string, type: ResourceType, body?: unknown) =>
        post<StatusResponse>(`${acctPath(accountId)}/${type}/create`, body),

    /** 列出资源 */
    list: (accountId: string, type: ResourceType) =>
        get<string[]>(`${acctPath(accountId)}/${type}/list`),

    /** 搜索资源 */
    search: (accountId: string, type: ResourceType, q?: string) =>
        post<unknown>(`${acctPath(accountId)}/${type}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 上传资源 */
    upload: (accountId: string, type: ResourceType, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/${type}/upload`, body),

    /** 删除资源 */
    deleteData: (accountId: string, type: ResourceType, resourceId: string) =>
        del<StatusResponse>(`${acctPath(accountId)}/${type}/${encodeURIComponent(resourceId)}`),

    /** 重命名资源 */
    rename: (accountId: string, type: ResourceType, resourceId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/${type}/${encodeURIComponent(resourceId)}/rename`, body),

    /** 覆盖写入资源 */
    write: (accountId: string, type: ResourceType, resourceId: string, payload: unknown) =>
        post<StatusResponse>(`${acctPath(accountId)}/${type}/${encodeURIComponent(resourceId)}`, payload),

    /** 读取资源（直接 GET） */
    read: (accountId: string, type: ResourceType, resourceId: string) =>
        get<unknown>(`${acctPath(accountId)}/${type}/${encodeURIComponent(resourceId)}`),

    /** 批量操作 */
    batch: (accountId: string, ops: BatchRequest) =>
        post<unknown>(`${acctPath(accountId)}/batch`, ops),
};

// ============================================================
// Clients (Management API: /account/{accountId}/client/*)
// ============================================================

export const clients = {
    /** 列出已注册客户端 */
    list: (accountId: string) =>
        get<string[]>(`${acctPath(accountId)}/client/list`),

    /** 搜索客户端 */
    search: (accountId: string, q?: string) =>
        get<unknown>(`${acctPath(accountId)}/client/search${q ? `?q=${encodeURIComponent(q)}` : ""}`),

    /** 客户端详情 */
    details: (accountId: string, clientId: string) =>
        get<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}`),

    /** 删除客户端 */
    delete: (accountId: string, clientId: string) =>
        del<void>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}`),

    /** 重命名客户端 */
    rename: (accountId: string, clientId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/rename`, body),

    /** 获取客户端在线状态 */
    status: (accountId: string, clientId: string) =>
        get<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/status`),

    /** 断开客户端连接 */
    disconnect: (accountId: string, clientId: string) =>
        post<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/disconnect`),

    /** 禁用客户端 */
    disable: (accountId: string, clientId: string) =>
        post<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/disable`),

    /** 启用客户端 */
    enable: (accountId: string, clientId: string) =>
        post<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/enable`),

    /** 修改客户端档案组 */
    config: (accountId: string, clientId: string, body: unknown) =>
        post<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/config`, body),

    /** 重启客户端 */
    restart: (accountId: string, clientId: string) =>
        post<StatusResponse>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/command/restart`),

    /** 强制同步数据 */
    forceSync: (accountId: string, clientId: string) =>
        post<StatusResponse>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/command/update-data`),

    /** 发送通知 */
    sendNotification: (accountId: string, clientId: string, payload: NotificationPayload) =>
        post<StatusResponse>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/command/send-notification`, payload),

    /** 请求客户端上报配置 */
    getConfig: (accountId: string, clientId: string, configType: number) =>
        get<unknown>(`${acctPath(accountId)}/client/${encodeURIComponent(clientId)}/command/get-config?config_type=${configType}`),
};

// ============================================================
// Bulk (Management API: /account/bulk)
// ============================================================

export const bulk = {
    execute: (ops: BatchRequest) =>
        post<unknown>("/account/bulk", ops),
};

// ============================================================
// Admin API（超管专用，使用 Admin 端点）
// ============================================================

const adminBase = () => getAdminUrl();

export const adminApi = {
    /** 列出所有账户 */
    listAccounts: () =>
        get<AccountOut[]>("/account", adminBase()),

    /** 列出所有用户（分页） */
    listUsers: (offset = 0, limit = 20) =>
        get<UserOut[]>(`/user/list?offset=${offset}&limit=${limit}`, adminBase()),

    /** 搜索用户 */
    searchUsers: (q: string) =>
        get<UserOut[]>(`/user/search?q=${encodeURIComponent(q)}`, adminBase()),

    /** 直接创建用户（跳过审核） */
    createUser: (data: UserRegisterRequest) =>
        post<UserOut>("/user/create", data, adminBase()),

    /** 查询单个用户 */
    getUser: (userId: string) =>
        get<UserOut>(`/user/${encodeURIComponent(userId)}`, adminBase()),

    /** 更新用户 */
    updateUser: (userId: string, data: UserUpdateRequest) =>
        post<UserOut>(`/user/${encodeURIComponent(userId)}`, data, adminBase()),

    /** 删除用户 */
    deleteUser: (userId: string) =>
        del<unknown>(`/user/${encodeURIComponent(userId)}`, adminBase()),

    /** 重命名用户 */
    renameUser: (userId: string, data: { name: string }) =>
        post<unknown>(`/user/${encodeURIComponent(userId)}/rename`, data, adminBase()),

    /** 重置用户密码（无需旧密码） */
    resetPassword: (userId: string, data: { new_password: string }) =>
        post<unknown>(`/user/${encodeURIComponent(userId)}/password/reset`, data, adminBase()),

    /** 修改用户密码（需旧密码） */
    changePassword: (userId: string, data: PasswordChange) =>
        post<unknown>(`/user/${encodeURIComponent(userId)}/password/change`, data, adminBase()),

    /** 待审核用户列表 */
    listPendingUsers: (offset = 0, limit = 50) =>
        get<UserOut[]>(`/user/pending/list?offset=${offset}&limit=${limit}`, adminBase()),

    /** 批准用户 */
    approveUser: (userId: string) =>
        post<unknown>(`/user/pending/approve/${encodeURIComponent(userId)}`, undefined, adminBase()),

    /** 拒绝用户 */
    rejectUser: (userId: string) =>
        post<unknown>(`/user/pending/reject/${encodeURIComponent(userId)}`, undefined, adminBase()),

    /** 系统设置 */
    getSettings: () =>
        get<Record<string, unknown>>("/settings", adminBase()),

    updateSettings: (data: Record<string, unknown>) =>
        post<unknown>("/settings", data, adminBase()),

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
