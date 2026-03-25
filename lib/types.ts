/* ===== TypeScript 类型定义 ===== */
/* 对应后端 OpenAPI Schema + ClassIsland 上游数据模型 */

// ============================================================
// 认证相关
// ============================================================

export interface UserRegisterRequest {
    email: string;
    password: string;
    username?: string;
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
// 用户、账户
// ============================================================

export interface UserOut {
    id: string;
    username: string;
    email: string;
    display_name: string;
    role_code: string;
    is_active: boolean;
    can_create_account?: boolean;
    created_at: string;
}

export interface UserUpdateRequest {
    display_name?: string | null;
    role_code?: string | null;
    is_active?: boolean | null;
    can_create_account?: boolean | null;
}

export interface EmailUpdate {
    email: string;
}

export interface UsernameUpdate {
    username: string;
}

export interface PasswordChange {
    old_password: string;
    new_password: string;
}

export interface AccountOut {
    id: string;
    name: string;
    slug: string;
    api_key: string;
    is_active: boolean;
    created_at: string;
}

export interface AccountCreate {
    name: string;
    slug?: string;
}

export interface SlugUpdate {
    slug: string;
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

export interface PairingCodeOut {
    id: string;
    code: string;
    client_uid?: string;
    approved?: boolean;
    used?: boolean;
    created_at?: string;
}

// ============================================================
// 预注册客户端
// ============================================================

export interface PreRegOut {
    id: string;
    account_id: string;
    label: string;
    class_identity: string;
    created_at: string;
}

// ============================================================
// 访问控制
// ============================================================

export interface AccessMember {
    id: string;
    user_id: string;
    account_id: string;
    role_in_account: string;
    joined_at: string;
}

export interface AccessRoleUpdate {
    role_in_account: string;
}

/** 账户内角色 */
export const ACCOUNT_ROLE_LABELS: Record<string, string> = {
    owner: "所有者",
    admin: "管理员",
    member: "成员",
    viewer: "观察者",
};

// ============================================================
// 邀请管理
// ============================================================

export interface InvitationOut {
    id: string;
    account_id: string;
    inviter_user_id: string;
    code: string;
    role_in_account: string;
    max_uses: number;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

export interface InvitationCreate {
    role_in_account?: string;
    max_uses?: number;
    expires_at?: string | null;
}

// ============================================================
// 预注册创建
// ============================================================

export interface PreRegCreate {
    label: string;
    class_identity: string;
}

// ============================================================
// 系统设置
// ============================================================

/** Admin 设置白名单键 */
export const SETTINGS_ALLOWED_KEYS = [
    "registration_open",
    "require_approval",
    "max_accounts_per_user",
    "default_role",
    "motd",
] as const;

export interface SettingsUpdate {
    items: Record<string, string>;
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

/** 管理服务器类型: 0=无服务器, 1=集控服务器 */
export type ManagementServerKind = 0 | 1;

export const MANAGEMENT_SERVER_KIND_LABELS: Record<ManagementServerKind, string> = {
    0: "无服务器 (Serverless)",
    1: "集控服务器 (ManagementServer)",
};

/** 默认设置 (ManagementSettings) */
export interface ManagementSettings {
    IsManagementEnabled?: boolean;
    ManagementServerKind?: ManagementServerKind;
    ManagementServer?: string;
    ManagementServerGrpc?: string;
    ManifestUrlTemplate?: string;
    ClassIdentity?: string;
}

/** 授权等级: 0=无, 1=用户认证, 2=管理员认证 */
export type AuthorizeLevel = 0 | 1 | 2;

export const AUTHORIZE_LEVEL_LABELS: Record<AuthorizeLevel, string> = {
    0: "无需认证",
    1: "用户认证",
    2: "管理员认证",
};

/** 凭据配置 (ManagementCredentialConfig) */
export interface ManagementCredentialConfig {
    UserCredential?: string;
    AdminCredential?: string;
    EditAuthorizeSettingsAuthorizeLevel?: AuthorizeLevel;
    EditPolicyAuthorizeLevel?: AuthorizeLevel;
    ExitManagementAuthorizeLevel?: AuthorizeLevel;
    EditProfileAuthorizeLevel?: AuthorizeLevel;
    EditSettingsAuthorizeLevel?: AuthorizeLevel;
    ExitApplicationAuthorizeLevel?: AuthorizeLevel;
    ChangeLessonsAuthorizeLevel?: AuthorizeLevel;
}

/** 水平对齐方式: 0=Stretch, 1=Left, 2=Center, 3=Right */
export type HorizontalAlignmentType = 0 | 1 | 2 | 3;

export const HORIZONTAL_ALIGNMENT_LABELS: Record<HorizontalAlignmentType, string> = {
    0: "拉伸 (Stretch)",
    1: "左对齐 (Left)",
    2: "居中 (Center)",
    3: "右对齐 (Right)",
};

/** 组件设置项 (ComponentSettings) */
export interface ComponentSettingsItem {
    Id?: string;
    NameCache?: string;
    Settings?: unknown;
    HideOnRule?: boolean;
    HidingRules?: unknown;
    /* 字体大小 */
    IsResourceOverridingEnabled?: boolean;
    MainWindowSecondaryFontSize?: number;
    MainWindowBodyFontSize?: number;
    MainWindowEmphasizedFontSize?: number;
    MainWindowLargeFontSize?: number;
    /* 颜色 */
    IsCustomForegroundColorEnabled?: boolean;
    ForegroundColor?: string;
    IsCustomBackgroundColorEnabled?: boolean;
    BackgroundColor?: string;
    IsCustomBackgroundOpacityEnabled?: boolean;
    BackgroundOpacity?: number;
    IsCustomCornerRadiusEnabled?: boolean;
    CustomCornerRadius?: number;
    Opacity?: number;
    /* 布局 */
    RelativeLineNumber?: number;
    HorizontalAlignment?: HorizontalAlignmentType;
    IsMinWidthEnabled?: boolean;
    MinWidth?: number;
    IsMaxWidthEnabled?: boolean;
    MaxWidth?: number;
    IsFixedWidthEnabled?: boolean;
    FixedWidth?: number;
    IsCustomMarginEnabled?: boolean;
    MarginLeft?: number;
    MarginTop?: number;
    MarginRight?: number;
    MarginBottom?: number;
    LastWidthCache?: number;
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
