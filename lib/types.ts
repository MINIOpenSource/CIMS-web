/* ===== TypeScript 类型定义 ===== */
/* 对应后端 OpenAPI Schema + ClassIsland 上游数据模型 */

// ============================================================
// 认证相关
// ============================================================

export interface UserRegisterRequest {
    username: string;
    email: string;
    password: string;
    display_name?: string;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    token: string;
    expires_in?: number;
    token_type?: string;
}

export interface MessageResponse {
    status: string;
    message: string;
}

export interface StatusResponse {
    status: string;
    message: string;
}

// ============================================================
// 用户、角色、账户
// ============================================================

export interface UserOut {
    id: string;
    username: string;
    email: string;
    display_name: string;
    role_code: string;
    is_active: boolean;
    created_at: string;
}

export interface UserUpdateRequest {
    display_name?: string | null;
    role_code?: string | null;
    is_active?: boolean | null;
}

export interface RoleOut {
    id: string;
    code: string;
    label: string;
    priority: number;
    is_system: boolean;
}

export interface RoleCreateRequest {
    code: string;
    label: string;
    priority: number;
}

export interface AccountOut {
    id: string;
    name: string;
    slug: string;
    api_key: string;
    is_active: boolean;
    created_at: string;
}

// ============================================================
// 限额
// ============================================================

export interface QuotaOut {
    id: string;
    account_id: string;
    quota_key: string;
    max_value: number;
    current_value: number;
}

export interface QuotaSetRequest {
    quota_key: string;
    max_value: number;
}

// ============================================================
// 权限
// ============================================================

export interface PermissionDefOut {
    code: string;
    label: string;
    category: string;
}

export interface PermissionGrantRequest {
    member_id: string;
    permission_code: string;
    granted?: boolean;
}

export interface PermissionRevokeRequest {
    member_id: string;
    permission_code: string;
}

// ============================================================
// 2FA
// ============================================================

export interface TotpEnableResponse {
    secret: string;
    uri: string;
    recovery_codes: string[];
}

export interface TotpConfirmRequest {
    code: string;
}

export interface TotpDisableRequest {
    password: string;
}

export interface TotpVerifyRequest {
    temp_token: string;
    code: string;
}

export interface TotpRecoverRequest {
    temp_token: string;
    recovery_code: string;
}

// ============================================================
// 配对码
// ============================================================

export interface PairingCodeDetail {
    code: string;
    client_uid?: string;
    client_id?: string;
    client_mac?: string;
    client_ip?: string;
    created_at?: string;
    approved?: boolean;
    used?: boolean;
}

export interface PairingListResponse {
    codes: PairingCodeDetail[];
}

export interface PairingToggle {
    enabled: boolean;
}

// ============================================================
// 通知
// ============================================================

export interface NotificationPayload {
    MessageMask?: string;
    MessageContent?: string;
    OverlayIconLeft?: number;
    OverlayIconRight?: number;
    IsEmergency?: boolean;
    IsSpeechEnabled?: boolean;
    IsEffectEnabled?: boolean;
    IsSoundEnabled?: boolean;
    IsTopmost?: boolean;
    DurationSeconds?: number;
    RepeatCounts?: number;
}

// ============================================================
// 批量操作
// ============================================================

export type BatchOpType = "create" | "write" | "update" | "delete";

export interface BatchOperation {
    action: BatchOpType;
    resource_type: string;
    name: string;
    payload?: Record<string, unknown> | null;
}

export interface BatchRequest {
    operations: BatchOperation[];
}

// ============================================================
// 资源类型
// ============================================================

export type ResourceType =
    | "ClassPlan"
    | "TimeLayout"
    | "Subjects"
    | "Policy"
    | "DefaultSettings"
    | "Components"
    | "Credentials";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
    ClassPlan: "课表",
    TimeLayout: "时间表",
    Subjects: "科目",
    Policy: "策略",
    DefaultSettings: "默认设置",
    Components: "组件设置",
    Credentials: "凭据",
};

// ============================================================
// 系统角色
// ============================================================

export const SYSTEM_ROLES = {
    BANNED: "banned",
    PENDING: "pending",
    NORMAL: "normal",
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
} as const;

export const ROLE_LABELS: Record<string, string> = {
    banned: "已封禁",
    pending: "待激活",
    normal: "普通用户",
    admin: "管理员",
    superadmin: "超级管理员",
};

// ============================================================
// ClassIsland 上游数据模型
// ============================================================

/** 科目 */
export interface Subject {
    Name: string;
    Initial: string;
    TeacherName: string;
    IsOutDoor: boolean;
    AttachableSettings?: Record<string, unknown>;
}

/** 时间点类型: 0=上课, 1=课间, 2=分割线, 3=行动 */
export type TimeType = 0 | 1 | 2 | 3;

export const TIME_TYPE_LABELS: Record<TimeType, string> = {
    0: "上课",
    1: "课间休息",
    2: "分割线",
    3: "行动",
};

/** 时间表项 */
export interface TimeLayoutItem {
    StartTime: string; // TimeSpan 格式，如 "08:00:00"
    EndTime: string;
    TimeType: TimeType;
    IsHideDefault?: boolean;
    DefaultClassId?: string;
    BreakName?: string;
    AttachableSettings?: Record<string, unknown>;
}

/** 时间表 */
export interface TimeLayout {
    Name: string;
    Layouts: TimeLayoutItem[];
    AttachableSettings?: Record<string, unknown>;
}

/** 课程信息 */
export interface ClassInfo {
    SubjectId: string;
    IsChangedClass?: boolean;
    IsEnabled?: boolean;
    AttachableSettings?: Record<string, unknown>;
}

/** 课表触发规则 */
export interface TimeRule {
    WeekDay: number;
    WeekCountDiv: number;
    WeekCountDivTotal: number;
}

/** 课表 */
export interface ClassPlan {
    Name: string;
    TimeLayoutId: string;
    Classes: ClassInfo[];
    TimeRule: TimeRule;
    IsEnabled: boolean;
    IsOverlay?: boolean;
    OverlaySourceId?: string | null;
    AssociatedGroup?: string;
    AttachableSettings?: Record<string, unknown>;
}

/** 课表群 */
export interface ClassPlanGroup {
    Name: string;
    IsGlobal?: boolean;
}

/** 档案 */
export interface Profile {
    Name: string;
    TimeLayouts: Record<string, TimeLayout>;
    ClassPlans: Record<string, ClassPlan>;
    Subjects: Record<string, Subject>;
    ClassPlanGroups?: Record<string, ClassPlanGroup>;
    IsOverlayClassPlanEnabled?: boolean;
    OverlayClassPlanId?: string | null;
    SelectedClassPlanGroupId?: string;
}

/** 管理策略 */
export interface ManagementPolicy {
    DisableProfileClassPlanEditing?: boolean;
    DisableProfileTimeLayoutEditing?: boolean;
    DisableProfileSubjectsEditing?: boolean;
    DisableProfileEditing?: boolean;
    DisableSettingsEditing?: boolean;
    DisableSplashCustomize?: boolean;
    DisableDebugMenu?: boolean;
    AllowExitManagement?: boolean;
    DisableEasterEggs?: boolean;
}

// ============================================================
// 客户端
// ============================================================

export interface ClientInfo {
    uid: string;
    client_id?: string;
    class_identity?: string;
    registered_at?: string;
    last_seen?: string;
    is_online?: boolean;
    [key: string]: unknown;
}

// ============================================================
// 2FA 登录流中间态
// ============================================================

export interface TwoFARequired {
    requires_2fa: true;
    temp_token: string;
}

export type LoginResult = TokenResponse | TwoFARequired;

// ============================================================
// 周几名称
// ============================================================

export const WEEKDAY_LABELS = [
    "周日", "周一", "周二", "周三", "周四", "周五", "周六"
];
