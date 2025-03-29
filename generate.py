import os
import json

def generate_webui_files(output_dir="cims-webui"):
    """
    自动生成 ClassIsland WebUI 的文件结构和基础代码。

    Args:
        output_dir (str): 输出目录的名称，默认为 "cims-webui"。
    """

    file_structure = {
        output_dir: {
            "public": {
                "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CIMS 集控控制台</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
""",
                "logo.png": "# 替换为你的 Logo 文件，或者留空"  # Placeholder - you should put your logo file here
            },
            "src": {
                "api": {
                    "index.js": """// src/api/index.js
import axios from 'axios';
import { API_BASE_URL, CMD_BASE_URL } from './config';
import { useAppStore } from '@/store/app';

const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });
const cmdClient = axios.create({ baseURL: CMD_BASE_URL, timeout: 10000 });

const requestInterceptor = (config) => { const appStore = useAppStore(); appStore.setLoading(true); return config; };
const responseInterceptor = (response) => { const appStore = useAppStore(); appStore.setLoading(false); return response; };
const errorInterceptor = (error) => { const appStore = useAppStore(); appStore.setLoading(false); appStore.setError(error.response?.data?.detail || error.message || 'API Error'); return Promise.reject(error); };

apiClient.interceptors.request.use(requestInterceptor); apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);
cmdClient.interceptors.request.use(requestInterceptor); cmdClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export const getManifest = (clientUid) => apiClient.get(`/api/v1/client/${clientUid}/manifest`);
export const getConfigResource = (resourceType, name) => apiClient.get(`/api/v1/client/${resourceType}`, { params: { name } });
export const getServerVersion = () => apiClient.get('/api/v1/server/version');
export const downloadPresetUrl = `${API_BASE_URL}/api/v1/download/preset`;
export const exportDataUrl = `${API_BASE_URL}/api/v1/export/data`;

export const listConfigFiles = (resourceType) => cmdClient.get(`/command/datas/${resourceType}/list`);
export const createConfigFile = (resourceType, name) => cmdClient.get(`/command/datas/${resourceType}/create`, { params: { name } });
export const deleteConfigFile = (resourceType, name) => cmdClient.delete(`/command/datas/${resourceType}/delete`, { params: { name } });
export const renameConfigFile = (resourceType, name, target) => cmdClient.put(`/command/datas/${resourceType}/rename`, null, { params: { name, target } });
export const writeConfigFile = (resourceType, name, data) => cmdClient.put(`/command/datas/${resourceType}/write?name=${name}`, data, { headers: { 'Content-Type': 'application/json' } });
export const getServerSettings = () => cmdClient.get('/command/server/settings');
export const updateServerSettings = (settings) => cmdClient.put('/command/server/settings', settings);
export const listClients = () => cmdClient.get('/command/clients/list');
export const listClientStatus = () => cmdClient.get('/command/clients/status');
export const getClientDetails = (clientUid) => cmdClient.get(`/command/client/${clientUid}/details`);
export const preRegisterClient = (id, config) => cmdClient.post('/command/clients/pre_register', { id, config });
export const listPreRegisteredClients = () => cmdClient.get('/command/clients/pre_registered/list');
export const deletePreRegisteredClient = (uid) => cmdClient.delete('/command/clients/pre_registered/delete', { params: { uid } });
export const updatePreRegisteredClient = (uid, config) => cmdClient.put('/command/clients/pre_registered/update', { uid, config });
export const batchClientAction = (action, client_uids, payload) => cmdClient.post('/command/clients/batch_action', { action, client_uids, payload });
export const restartClient = (clientUid) => cmdClient.post(`/command/client/${clientUid}/restart`);
export const sendNotification = (clientUid, params) => cmdClient.post(`/command/client/${clientUid}/send_notification`, null, { params });
export const triggerClientUpdate = (clientUid) => cmdClient.post(`/command/client/${clientUid}/update_data`);
""",
                    "config.js": """// src/api/config.js
const API_BASE_URL = import.meta.env.VITE_CIMS_API_BASE || 'http://localhost:50050';
const CMD_BASE_URL = import.meta.env.VITE_CIMS_CMD_BASE || 'http://localhost:50052';

export { API_BASE_URL, CMD_BASE_URL };
"""
                },
                "assets": {
                    "main.css": """/* src/assets/main.css */
/* 全局 CSS 样式，如果需要 */
"""
                },
                "components": {
                    "AppSidebar.vue": """<template>
  <v-navigation-drawer app class="elevation-2" v-model="drawerModel">
    <v-list-item class="pa-4">
      <template v-slot:prepend>
        <v-avatar image="/logo.png" size="32" class="mr-3"></v-avatar>
      </template>
      <v-list-item-title class="text-h6 font-weight-bold">ClassIsland<br>集控控制台</v-list-item-title>
    </v-list-item>
    <v-divider></v-divider>
    <v-list density="compact" nav>
      <v-list-item v-for="item in mainNavItems" :key="item.title" :prepend-icon="item.icon" :title="item.title" :to="item.to" exact link></v-list-item>
    </v-list>
    <v-spacer></v-spacer>
    <v-list density="compact" nav>
      <v-divider></v-divider>
      <v-list-subheader>附加功能</v-list-subheader>
      <v-list-item v-for="item in bottomNavItems" :key="item.title" :prepend-icon="item.icon" :title="item.title" :to="item.to" link exact></v-list-item>
      <v-divider class="my-2"></v-divider>
      <v-list-item lines="two" density="compact" class="text-caption">
        <v-list-item-title>后端版本: {{ appStore.backendVersion || '加载中...' }}</v-list-item-title>
        <v-list-item-subtitle>WebUI 版本: {{ webuiVersion }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAppStore } from '@/store/app';

const drawerModel = ref(true);
const appStore = useAppStore();
const webuiVersion = import.meta.env.VITE_WEBUI_VERSION || 'N/A';

const mainNavItems = ref([
  { title: '概览', icon: 'mdi-view-dashboard-outline', to: { name: 'Overview' } },
  { title: '设备管理', icon: 'mdi-devices', to: { name: 'DeviceManagement' } },
  { title: '配置管理', icon: 'mdi-cog-outline', to: { name: 'ConfigManagement' } },
  { title: '插件管理', icon: 'mdi-puzzle-outline', to: { name: 'PluginManagement' } },
  { title: '服务器设置', icon: 'mdi-cogs', to: { name: 'Settings' } },
]);

const bottomNavItems = ref([
  { title: '集控预设配置下载', icon: 'mdi-download-box-outline', to: { name: 'DownloadPreset' } },
  { title: '服务器数据导出', icon: 'mdi-database-export-outline', to: { name: 'ExportData' } },
]);

onMounted(async () => { await appStore.fetchBackendVersion(); });
</script>

<style scoped>
.v-list-item-title { white-space: normal; line-height: 1.2; }
.text-caption { color: rgba(0, 0, 0, 0.6); }
.v-theme--dark .text-caption { color: rgba(255, 255, 255, 0.7); }
</style>
""",
                    "ClientCardDialog.vue": """<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title>客户端详情 - {{ clientUid }}</v-card-title>
      <v-card-text>
        <!-- 客户端详细信息展示区域 -->
        <p>UID: {{ clientDetails.uid }}</p>
        <p>名称: {{ clientDetails.name || 'N/A' }}</p>
        <p>状态: {{ clientDetails.status }}</p>
        <!-- ... 更多信息 ... -->
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="dialog = false">关闭</v-btn>
        <v-btn color="warning" text @click="restartClientAction">重启客户端</v-btn>
        <v-btn color="info" text @click="openNotificationDialog">发送通知</v-btn>
        <v-btn color="success" text @click="updateDataAction">更新数据</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 通知对话框 (可以作为子组件) -->
  <v-dialog v-model="notificationDialog" max-width="500">
    <v-card>
      <v-card-title>发送通知至 {{ clientUid }}</v-card-title>
      <v-card-text>
        <v-text-field v-model="notificationPayload.message_mask" label="通知标题"></v-text-field>
        <v-textarea v-model="notificationPayload.message_content" label="通知内容"></v-textarea>
        <!-- ... 通知参数 ... -->
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="notificationDialog = false">取消</v-btn>
        <v-btn color="primary" @click="sendNotificationAction">发送通知</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { restartClient, sendNotification, triggerClientUpdate } from '@/api';
import { useAppStore } from '@/store/app';

const props = defineProps({
  modelValue: Boolean,
  clientDetails: { type: Object, default: () => ({}) }, // 客户端详细信息
});
const emit = defineEmits(['update:modelValue']);

const dialog = ref(props.modelValue);
watch(() => props.modelValue, (val) => { dialog.value = val; });
watch(dialog, (val) => { emit('update:modelValue', val); });

const clientUid = computed(() => props.clientDetails.uid);
const appStore = useAppStore();

// 通知对话框和 payload
const notificationDialog = ref(false);
const notificationPayload = ref({
  message_mask: '',
  message_content: '',
  // ... 其他通知参数 ...
});

const openNotificationDialog = () => { notificationDialog.value = true; };
const sendNotificationAction = async () => {
  try {
    await sendNotification(clientUid.value, notificationPayload.value);
    appStore.showSnackbar('通知已发送', 'success');
    notificationDialog.value = false;
    dialog.value = false; // 关闭主对话框
  } catch (error) { appStore.setError('发送通知失败'); }
};

const restartClientAction = async () => {
  try {
    await restartClient(clientUid.value);
    appStore.showSnackbar('重启指令已发送', 'success');
    dialog.value = false;
  } catch (error) { appStore.setError('重启指令发送失败'); }
};

const updateDataAction = async () => {
  try {
    await triggerClientUpdate(clientUid.value);
    appStore.showSnackbar('数据更新指令已发送', 'success');
    dialog.value = false;
  } catch (error) { appStore.setError('数据更新指令发送失败'); }
};
</script>

<style scoped>
/* 组件样式 */
</style>
""",
                    "ConfigEditor": {
                        "JsonEditor.vue": """<template>
  <div>
    <v-textarea
      v-model="jsonText"
      label="JSON Editor"
      rows="15"
      @update:model-value="onTextUpdate"
    ></v-textarea>
    <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  configData: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:config-data']);

const jsonText = ref('');
const error = ref('');

const formattedJsonText = computed(() => {
  try {
    return JSON.stringify(props.configData, null, 2); // 格式化 JSON
  } catch (e) {
    return '';
  }
});

watch(formattedJsonText, (val) => {
  jsonText.value = val; // 同步格式化后的 JSON 到 textarea
});

const onTextUpdate = (text) => {
  try {
    const parsed = JSON.parse(text);
    error.value = '';
    emit('update:config-data', parsed);
  } catch (e) {
    error.value = 'JSON 格式错误';
    // 可以选择不 emit，或者 emit 旧的数据，取决于需求
  }
};
</script>

<style scoped>
/* 编辑器样式 */
</style>
""",
                        "SettingsEditor.vue": """<template>
  <div>
    <p>Settings Editor Placeholder - Implement form based on Settings.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                        "SubjectsEditor.vue": """<template>
  <div>
    <p>Subjects Editor Placeholder - Implement form based on Subjects.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                        "TimeLayoutEditor.vue": """<template>
  <div>
    <p>TimeLayout Editor Placeholder - Implement form based on TimeLayouts.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                        "ClassPlanEditor.vue": """<template>
  <div>
    <p>ClassPlan Editor Placeholder - Implement form based on ClassPlans.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                        "PolicyEditor.vue": """<template>
  <div>
    <p>Policy Editor Placeholder - Implement form based on Policy.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                        "DefaultSettingsEditor.vue": """<template>
  <div>
    <p>DefaultSettings Editor Placeholder - Implement form based on DefaultSettings.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>""",
                    },
                    "ConfirmDialog.vue": """<template>
  <v-dialog v-model="dialog" max-width="400" persistent>
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">取消</v-btn>
        <v-btn color="error" @click="confirmAction">确认</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: { type: String, default: '确认' },
  message: { type: String, default: '确定要执行此操作吗?' },
});
const emit = defineEmits(['confirm', 'cancel']);

const dialog = ref(false);

const open = () => { dialog.value = true; };
const close = () => { dialog.value = false; };
const confirmAction = () => { emit('confirm'); close(); };
const cancel = () => { emit('cancel'); close(); };

defineExpose({ open, close }); // 暴露 open 方法供父组件调用
</script>
""",
                    "LoadingIndicator.vue": """<template>
  <v-overlay :model-value="isLoading" z-index="1000">
    <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
  </v-overlay>
</template>

<script setup>
  defineProps({ isLoading: Boolean });
</script>
"""
                },
                "layouts": {
                    "DefaultLayout.vue": """<template>
  <v-app>
    <AppSidebar v-model="drawer" />
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-progress-linear :active="appStore.isLoading" indeterminate absolute bottom color="white"></v-progress-linear>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-alert v-if="appStore.error" type="error" dismissible @click:close="appStore.clearError()" class="mb-4">
          {{ appStore.error }}
        </v-alert>
        <router-view v-slot="{ Component }">
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-container>
    </v-main>
    <v-footer app>
      <span>© {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/AppSidebar.vue';
import { useAppStore } from '@/store/app';

const drawer = ref(true);
const route = useRoute();
const appStore = useAppStore();
const currentPageTitle = computed(() => route.meta.title || 'CIMS 控制台');
</script>
"""
                },
                "pages": {
                    "Overview.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">概览</h1>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-icon size="x-large" color="primary" class="mr-4">mdi-monitor-multiple</v-icon>
            <div>
              <div class="text-h5">{{ registeredCount }}</div>
              <div class="text-subtitle-1">已注册设备</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-icon size="x-large" color="success" class="mr-4">mdi-access-point-network</v-icon>
            <div>
              <div class="text-h5">{{ onlineCount }}</div>
              <div class="text-subtitle-1">在线设备</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <v-divider class="my-6"></v-divider>
    <h2 class="text-h5 mb-4">快速操作</h2>
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-btn block color="secondary" prepend-icon="mdi-refresh" @click="refreshStatus" :loading="loading">刷新状态</v-btn>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-btn block color="warning" prepend-icon="mdi-bell-ring-outline" @click="openBroadcastDialog">发送广播通知</v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="broadcastDialog" persistent max-width="600px">
      <v-card>
        <v-card-title><span class="text-h5">发送广播通知</span></v-card-title>
        <v-card-text>
          <v-text-field label="通知标题 (Mask)" v-model="notification.message_mask" required></v-text-field>
          <v-textarea label="通知内容" v-model="notification.message_content" required></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="broadcastDialog = false">取消</v-btn>
          <v-btn color="blue darken-1" text @click="sendBroadcastNotification" :loading="sendingBroadcast">发送</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDataStore } from '@/store/data';
import { useAppStore } from '@/store/app';
import { batchClientAction } from '@/api';

const dataStore = useDataStore();
const appStore = useAppStore();
const loading = ref(false);
const broadcastDialog = ref(false);
const sendingBroadcast = ref(false);

const notification = ref({ message_mask: '', message_content: '', is_emergency: false, duration_seconds: 5, is_speech_enabled: true, is_effect_enabled: true, is_sound_enabled: true, is_topmost: true, repeat_counts: 1, overlay_icon_left: 0, overlay_icon_right: 0 });

const registeredCount = computed(() => dataStore.clients.length);
const onlineCount = computed(() => dataStore.clients.filter(c => c.status === 'online').length);

const refreshStatus = async () => { loading.value = true; await dataStore.fetchClientStatus(); loading.value = false; };
const openBroadcastDialog = () => { notification.value = { message_mask: '', message_content: '', is_emergency: false, duration_seconds: 5, is_speech_enabled: true, is_effect_enabled: true, is_sound_enabled: true, is_topmost: true, repeat_counts: 1, overlay_icon_left: 0, overlay_icon_right: 0 }; broadcastDialog.value = true; };
const sendBroadcastNotification = async () => {
  if (!notification.value.message_mask || !notification.value.message_content) { appStore.setError('通知标题和内容不能为空'); return; }
  sendingBroadcast.value = true;
  try {
    const onlineClientUids = dataStore.clients.filter(c => c.status === 'online').map(c => c.uid);
    if (onlineClientUids.length === 0) { appStore.setError('没有在线的客户端可以接收通知'); broadcastDialog.value = false; sendingBroadcast.value = false; return; }
    await batchClientAction('send_notification', onlineClientUids, notification.value);
    appStore.showSnackbar('广播通知已发送', 'success');
    broadcastDialog.value = false;
  } catch (error) { console.error('发送广播失败:', error); } finally { sendingBroadcast.value = false; }
};

onMounted(async () => { await dataStore.fetchClientStatus(); });
</script>
""",
                    "DeviceManagement": {
                        "RegisteredDevices.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">已注册设备管理</h1>
    <v-data-table
      :headers="headers"
      :items="clients"
      :loading="loading"
      class="elevation-2"
    >
      <template v-slot:top>
        <v-toolbar flat color="white">
          <v-toolbar-title>已注册客户端</v-toolbar-title>
          <v-spacer></v-spacer>
          <!-- 批量操作按钮 -->
          <v-btn color="primary" @click="refreshClients" :loading="loading">
            <v-icon left>mdi-refresh</v-icon> 刷新列表
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon @click="openClientDetails(item.raw)">
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <!-- 其他操作按钮 -->
      </template>
    </v-data-table>

    <ClientCardDialog v-model="clientDetailsDialog" :client-details="selectedClientDetails" />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDataStore } from '@/store/data';
import ClientCardDialog from '@/components/ClientCardDialog.vue';

const dataStore = useDataStore();
const loading = ref(false);
const clients = computed(() => dataStore.clientsStatus); // 使用客户端状态列表
const clientDetailsDialog = ref(false);
const selectedClientDetails = ref({});

const headers = ref([
  { title: 'UID', key: 'uid' },
  { title: '名称', key: 'name' },
  { title: '状态', key: 'status' },
  { title: '上次在线', key: 'last_seen' },
  { title: '操作', key: 'actions', sortable: false },
]);

const refreshClients = async () => { loading.value = true; await dataStore.fetchClientStatus(); loading.value = false; };
const openClientDetails = (client) => { selectedClientDetails.value = client; clientDetailsDialog.value = true; };

onMounted(async () => { await refreshClients(); });
</script>
""",
                        "PreRegisteredDevices.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">预注册设备管理</h1>
    <v-card class="elevation-2 pa-4">
      <p>预注册设备列表和管理功能 - 待实现</p>
    </v-card>
  </v-container>
</template>

<script setup>
// 预注册设备页面的逻辑
</script>
"""
                    },
                    "ConfigManagement": {
                        "Index.vue": """<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="2">
          <v-toolbar density="compact" color="surface">
            <v-toolbar-title>{{ currentResourceTypeTitle }}列表</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="fetchConfigList" :loading="loadingList"><v-icon>mdi-refresh</v-icon></v-btn>
            <v-btn icon @click="openCreateDialog"><v-icon>mdi-plus-box-outline</v-icon></v-btn>
          </v-toolbar>
          <v-list density="compact" nav v-model:selected="selectedConfigNameInternal">
            <v-list-subheader v-if="!configList.length && !loadingList">无可用配置</v-list-subheader>
            <v-list-item v-for="configName in configList" :key="configName" :value="configName" @click="selectConfig(configName)">
              <v-list-item-title>{{ configName }}</v-list-item-title>
              <template v-slot:append>
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click.stop="openRenameDialog(configName)" class="mr-1"></v-btn>
                <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click.stop="confirmDelete(configName)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card elevation="2" :loading="loadingConfig">
          <v-toolbar density="compact" color="surface">
            <v-toolbar-title>编辑: {{ selectedConfigName || '请选择配置' }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="saveConfig" :disabled="!selectedConfigName || loadingConfig || !isDirty" :loading="savingConfig">保存更改</v-btn>
          </v-toolbar>
          <v-card-text style="min-height: 400px;">
            <div v-if="!selectedConfigName && !loadingConfig" class="text-center text-disabled pa-10">请从左侧选择一个配置文件进行编辑。</div>
            <div v-if="loadingConfig" class="d-flex justify-center align-center" style="height: 400px;"><v-progress-circular indeterminate color="primary"></v-progress-circular></div>
            <component v-if="selectedConfigName && !loadingConfig" :is="currentEditorComponent" :config-data="currentConfigData" @update:config-data="handleEditorUpdate" />
            <v-alert v-if="configError" type="error" class="mt-4">{{ configError }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="createDialog" persistent max-width="400px">
      <v-card>
        <v-card-title>新建 {{ currentResourceTypeTitle }}</v-card-title>
        <v-card-text><v-text-field label="名称" v-model="newConfigName" required :rules="[v => !!v || '名称不能为空']"></v-text-field></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" @click="createConfig" :disabled="!newConfigName">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="renameDialog" persistent max-width="400px">
      <v-card>
        <v-card-title>重命名 {{ currentRenameTarget }}</v-card-title>
        <v-card-text><v-text-field label="新名称" v-model="newConfigName" required :rules="[v => !!v || '名称不能为空']"></v-text-field></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="renameDialog = false">取消</v-btn>
          <v-btn color="primary" @click="renameConfig" :disabled="!newConfigName || newConfigName === currentRenameTarget">重命名</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <ConfirmDialog ref="confirmDeleteDialog" title="确认删除" message="确定要删除这个配置文件吗？此操作不可撤销。" @confirm="deleteConfirmedConfig" />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listConfigFiles, getConfigResource, createConfigFile, deleteConfigFile, renameConfigFile, writeConfigFile } from '@/api';
import { useAppStore } from '@/store/app';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const editorComponents = { ClassPlan: defineAsyncComponent(() => import('@/components/ConfigEditor/ClassPlanEditor.vue')), TimeLayout: defineAsyncComponent(() => import('@/components/ConfigEditor/TimeLayoutEditor.vue')), Subjects: defineAsyncComponent(() => import('@/components/ConfigEditor/SubjectsEditor.vue')), DefaultSettings: defineAsyncComponent(() => import('@/components/ConfigEditor/DefaultSettingsEditor.vue')), Policy: defineAsyncComponent(() => import('@/components/ConfigEditor/PolicyEditor.vue')), Fallback: defineAsyncComponent(() => import('@/components/ConfigEditor/JsonEditor.vue')) };

const props = defineProps({ resourceType: String });
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const configList = ref([]); const loadingList = ref(false); const selectedConfigName = ref(null); const selectedConfigNameInternal = ref([]); const currentConfigData = ref(null); const originalConfigData = ref(null); const loadingConfig = ref(false); const savingConfig = ref(false); const configError = ref(null); const isDirty = ref(false); const createDialog = ref(false); const renameDialog = ref(false); const newConfigName = ref(''); const currentRenameTarget = ref(''); const confirmDeleteDialog = ref(null); const configToDelete = ref('');

const currentResourceType = computed(() => props.resourceType || route.params.resourceType || 'ClassPlan');
const currentResourceTypeTitle = computed(() => { const titles = { ClassPlan: '课表', TimeLayout: '时间表', Subjects: '科目', DefaultSettings: '默认设置', Policy: '策略' }; return titles[currentResourceType.value] || '配置'; });
const currentEditorComponent = computed(() => editorComponents[currentResourceType.value] || editorComponents.Fallback);

const fetchConfigList = async () => { loadingList.value = true; configError.value = null; try { const response = await listConfigFiles(currentResourceType.value); configList.value = response.data || []; if (selectedConfigName.value && !configList.value.includes(selectedConfigName.value)) { clearSelection(); } } catch (error) { console.error('获取配置列表失败:', error); configError.value = `获取列表失败: ${error.message}`; } finally { loadingList.value = false; } };
const fetchConfigContent = async (name) => { if (!name) return; loadingConfig.value = true; currentConfigData.value = null; originalConfigData.value = null; configError.value = null; isDirty.value = false; try { const response = await getConfigResource(currentResourceType.value, name); currentConfigData.value = JSON.parse(JSON.stringify(response.data || {})); originalConfigData.value = JSON.parse(JSON.stringify(response.data || {})); } catch (error) { console.error(`获取配置 ${name} 内容失败:`, error); configError.value = `加载配置 '${name}' 失败: ${error.response?.data?.detail || error.message}`; } finally { loadingConfig.value = false; } };
const selectConfig = (name) => { if (selectedConfigName.value === name) return; if (isDirty.value && !confirm('您有未保存的更改，确定要切换吗？')) { selectedConfigNameInternal.value = [selectedConfigName.value]; return; } selectedConfigName.value = name; fetchConfigContent(name); };
const clearSelection = () => { selectedConfigName.value = null; selectedConfigNameInternal.value = []; currentConfigData.value = null; originalConfigData.value = null; isDirty.value = false; configError.value = null; };
const handleEditorUpdate = (newData) => { currentConfigData.value = newData; isDirty.value = JSON.stringify(currentConfigData.value) !== JSON.stringify(originalConfigData.value); };
const saveConfig = async () => { if (!selectedConfigName.value || !currentConfigData.value || !isDirty.value) return; savingConfig.value = true; configError.value = null; try { const dataString = JSON.stringify(currentConfigData.value); await writeConfigFile(currentResourceType.value, selectedConfigName.value, dataString); originalConfigData.value = JSON.parse(dataString); isDirty.value = false; appStore.showSnackbar(`配置 '${selectedConfigName.value}' 已保存`, 'success'); } catch (error) { console.error(`保存配置 ${selectedConfigName.value} 失败:`, error); configError.value = `保存失败: ${error.response?.data?.detail || error.message}`; appStore.showSnackbar(`保存配置 '${selectedConfigName.value}' 失败`, 'error'); } finally { savingConfig.value = false; } };

const openCreateDialog = () => { newConfigName.value = ''; createDialog.value = true; };
const createConfig = async () => { if (!newConfigName.value) return; try { await createConfigFile(currentResourceType.value, newConfigName.value); appStore.showSnackbar(`配置 '${newConfigName.value}' 已创建`, 'success'); createDialog.value = false; await fetchConfigList(); } catch (error) { appStore.showSnackbar(`创建失败: ${error.response?.data?.detail || error.message}`, 'error'); } };
const openRenameDialog = (name) => { currentRenameTarget.value = name; newConfigName.value = name; renameDialog.value = true; };
const renameConfig = async () => { if (!newConfigName.value || newConfigName.value === currentRenameTarget.value) return; try { await renameConfigFile(currentResourceType.value, currentRenameTarget.value, newConfigName.value); appStore.showSnackbar(`已重命名为 '${newConfigName.value}'`, 'success'); renameDialog.value = false; const oldSelected = selectedConfigName.value === currentRenameTarget.value; await fetchConfigList(); if (oldSelected) { clearSelection(); selectConfig(newConfigName.value); selectedConfigNameInternal.value = [newConfigName.value]; } } catch (error) { appStore.showSnackbar(`重命名失败: ${error.response?.data?.detail || error.message}`, 'error'); } };
const confirmDelete = (name) => { configToDelete.value = name; confirmDeleteDialog.value.open(); };
const deleteConfirmedConfig = async () => { if (!configToDelete.value) return; try { await deleteConfigFile(currentResourceType.value, configToDelete.value); appStore.showSnackbar(`配置 '${configToDelete.value}' 已删除`, 'success'); if (selectedConfigName.value === configToDelete.value) { clearSelection(); } await fetchConfigList(); configToDelete.value = ''; } catch (error) { appStore.showSnackbar(`删除失败: ${error.response?.data?.detail || error.message}`, 'error'); } };

watch(() => props.resourceType, (newType, oldType) => { if (newType && newType !== oldType) { clearSelection(); fetchConfigList(); } });
onMounted(() => { fetchConfigList(); });
watch(selectedConfigNameInternal, (newVal) => { if (newVal && newVal.length > 0 && newVal[0] !== selectedConfigName.value) { selectConfig(newVal[0]); } });
watch(selectedConfigName, (newName) => { if (newName && selectedConfigNameInternal.value[0] !== newName) { selectedConfigNameInternal.value = [newName]; } });
</script>
""",
                        "ConfigTypeView.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">{{ resourceType }} 配置管理</h1>
    <p>Specific config type view - to be implemented if needed separately</p>
  </v-container>
</template>

<script setup>
  defineProps({ resourceType: String });
</script>
"""
                    },
                    "PluginManagement.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">插件管理</h1>
    <v-card class="elevation-2 pa-4">
      <p>插件管理页面 - 待实现</p>
    </v-card>
  </v-container>
</template>

<script setup>
// 插件管理页面的逻辑
</script>
""",
                    "Settings.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">服务器设置</h1>
    <v-card class="elevation-2 pa-4" :loading="loadingSettings">
      <v-card-title>服务器配置</v-card-title>
      <v-card-text>
        <!-- 使用 SettingsEditor 组件或自定义表单 -->
        <SettingsEditor
          v-if="serverSettings"
          :config-data="serverSettings"
          @update:config-data="handleSettingsUpdate"
        />
        <v-alert v-if="settingsError" type="error" class="mt-4">{{ settingsError }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveSettings" :loading="savingSettings" :disabled="!isSettingsDirty">
          保存设置
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getServerSettings, updateServerSettings } from '@/api';
import { useAppStore } from '@/store/app';
import SettingsEditor from '@/components/ConfigEditor/SettingsEditor.vue'; // 假设有 SettingsEditor 组件

const serverSettings = ref(null);
const loadingSettings = ref(false);
const savingSettings = ref(false);
const settingsError = ref('');
const originalSettings = ref(null); // 用于比较是否更改
const isSettingsDirty = ref(false); // 标记设置是否已更改
const appStore = useAppStore();

const fetchSettings = async () => {
  loadingSettings.value = true;
  settingsError.value = '';
  try {
    const response = await getServerSettings();
    serverSettings.value = response.data;
    originalSettings.value = JSON.parse(JSON.stringify(response.data)); // 深拷贝用于比较
    isSettingsDirty.value = false;
  } catch (error) {
    console.error('获取服务器设置失败:', error);
    settingsError.value = `获取设置失败: ${error.message}`;
  } finally {
    loadingSettings.value = false;
  }
};

const saveSettings = async () => {
  if (!serverSettings.value || !isSettingsDirty.value) return;
  savingSettings.value = true;
  settingsError.value = '';
  try {
    await updateServerSettings(serverSettings.value);
    appStore.showSnackbar('服务器设置已保存', 'success');
    originalSettings.value = JSON.parse(JSON.stringify(serverSettings.value)); // 更新原始数据
    isSettingsDirty.value = false; // 清除 dirty 标记
  } catch (error) {
    console.error('保存服务器设置失败:', error);
    settingsError.value = `保存设置失败: ${error.message}`;
    appStore.showSnackbar('保存服务器设置失败', 'error');
  } finally {
    savingSettings.value = false;
  }
};

const handleSettingsUpdate = (updatedSettings) => {
  serverSettings.value = updatedSettings;
  isSettingsDirty.value = JSON.stringify(serverSettings.value) !== JSON.stringify(originalSettings.value);
};


onMounted(() => { fetchSettings(); });
</script>
""",
                    "DownloadPreset.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">集控预设配置下载</h1>
    <v-card class="elevation-2 pa-4">
      <v-card-text>
        <p>点击按钮下载集控预设配置文件。</p>
        <v-btn color="primary" @click="downloadPreset" :href="downloadUrl" download="cims_preset_config.zip" target="_blank">
          下载预设配置
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { downloadPresetUrl } from '@/api';

const downloadUrl = ref(downloadPresetUrl);

const downloadPreset = () => {
  // 触发下载或使用 window.open
  console.log('开始下载预设配置...');
  // window.open(downloadPresetUrl.value, '_blank'); // 另一种下载方式
};
</script>
""",
                    "ExportData.vue": """<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">服务器数据导出</h1>
    <v-card class="elevation-2 pa-4">
      <v-card-text>
        <p>点击按钮导出服务器所有配置数据。</p>
        <v-btn color="primary" @click="exportData" :href="exportUrl" download="cims_server_data_export.zip" target="_blank">
          导出服务器数据
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { exportDataUrl } from '@/api';

const exportUrl = ref(exportDataUrl);

const exportData = () => {
  // 触发导出下载
  console.log('开始导出服务器数据...');
  // window.open(exportDataUrl.value, '_blank'); // 另一种下载方式
};
</script>
"""
                },
                "router": {
                    "index.js": """// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Overview', component: () => import('@/pages/Overview.vue'), meta: { title: '概览' } },
      {
        path: 'devices', name: 'DeviceManagement', component: { template: '<router-view />' }, redirect: { name: 'RegisteredDevices' },
        children: [
          { path: 'registered', name: 'RegisteredDevices', component: () => import('@/pages/DeviceManagement/RegisteredDevices.vue'), meta: { title: '已注册设备' } },
          { path: 'pre-registered', name: 'PreRegisteredDevices', component: () => import('@/pages/DeviceManagement/PreRegisteredDevices.vue'), meta: { title: '预注册设备' } }
        ]
      },
      { path: 'configs/:resourceType?', name: 'ConfigManagement', component: () => import('@/pages/ConfigManagement/Index.vue'), props: true, meta: { title: '配置管理' } },
      { path: 'plugins', name: 'PluginManagement', component: () => import('@/pages/PluginManagement.vue'), meta: { title: '插件管理' } },
      { path: 'settings', name: 'Settings', component: () => import('@/pages/Settings.vue'), meta: { title: '服务器设置' } },
      { path: 'download-preset', name: 'DownloadPreset', component: () => import('@/pages/DownloadPreset.vue'), meta: { title: '下载预设' } },
      { path: 'export-data', name: 'ExportData', component: () => import('@/pages/ExportData.vue'), meta: { title: '导出数据' } },
    ],
  },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });
router.beforeEach((to, from, next) => { document.title = `${to.meta.title} - CIMS 控制台` || 'CIMS 控制台'; next(); });

export default router;
"""
                },
                "store": {
                    "index.js": """// src/store/index.js
import { createPinia } from 'pinia';
import { useAppStore } from './app';
import { useDataStore } from './data';

const pinia = createPinia();

export { useAppStore, useDataStore };
export default pinia;
""",
                    "app.js": """// src/store/app.js
import { defineStore } from 'pinia';
import { getServerVersion } from '@/api';

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    error: '',
    backendVersion: '',
    snackbar: { active: false, message: '', color: 'success' },
  }),
  actions: {
    setLoading(loading) { this.isLoading = loading; },
    setError(error) { this.error = error; },
    clearError() { this.error = ''; },
    showSnackbar(message, color = 'success') {
      this.snackbar = { active: true, message, color };
    },
    closeSnackbar() { this.snackbar.active = false; },
    async fetchBackendVersion() {
      try {
        const response = await getServerVersion();
        this.backendVersion = response.data.backend_version;
      } catch (error) {
        console.error('获取后端版本失败', error);
        this.backendVersion = 'N/A';
      }
    },
  },
});
""",
                    "data.js": """// src/store/data.js
import { defineStore } from 'pinia';
import { listClientStatus } from '@/api';

export const useDataStore = defineStore('data', {
  state: () => ({
    clientsStatus: [], // 客户端状态列表
    clients: [], // 客户端详细信息列表 (如果需要)
  }),
  getters: {
    onlineClientsCount: (state) => state.clientsStatus.filter(client => client.status === 'online').length,
  },
  actions: {
    async fetchClientStatus() {
      try {
        const response = await listClientStatus();
        this.clientsStatus = response.data || [];
      } catch (error) {
        console.error('获取客户端状态失败', error);
        this.clientsStatus = [];
      }
    },
    async fetchClientList() {
      // 如果需要客户端详细列表，实现 fetchClientList action
      // ...
    },
  },
});
"""
                },
                "plugins": {
                    "vuetify.js": """// src/plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const lightTheme = { dark: false, colors: { primary: '#1976D2', secondary: '#424242', accent: '#82B1FF', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' } };
const darkTheme = { dark: true, colors: { primary: '#2196F3', secondary: '#B0BEC5' } };

export default createVuetify({ components, directives, theme: { defaultTheme: 'light', themes: { light: lightTheme, dark: darkTheme } } });
"""
                },
                "App.vue": """<template>
  <router-view />
</template>

<script setup>
// App.vue 根组件
</script>
""",
                "main.js": """// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import './assets/main.css';

loadFonts();

createApp(App).use(pinia).use(router).use(vuetify).mount('#app');
"""
            },
            ".env": """# .env
VITE_CIMS_API_BASE=http://localhost:50050
VITE_CIMS_CMD_BASE=http://localhost:50052
VITE_WEBUI_VERSION=0.1.0
""",
            ".env.production": """# .env.production
VITE_CIMS_API_BASE=/api
VITE_CIMS_CMD_BASE=/command
VITE_WEBUI_VERSION=0.1.0
""",
            "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
""",
            "package.json": """{
  "name": "cims-webui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.7",
    "pinia": "^2.1.7",
    "vue": "^3.4.15",
    "vue-router": "^4.2.5",
    "vuetify": "^3.5.6"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.3",
    "vite": "^5.0.11",
    "webfontloader": "^1.6.28"
  }
}
""",
            "vite.config.js": """import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
"""
        }
    }

    def create_files(structure, base_path="."):
        for name, content in structure.items():
            current_path = os.path.join(base_path, name)
            if isinstance(content, dict):
                os.makedirs(current_path, exist_ok=True)
                create_files(content, current_path)
            else:
                filepath = current_path
                os.makedirs(os.path.dirname(filepath), exist_ok=True) # 确保父目录存在
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"File created: {filepath}")

    print(f"Generating WebUI files in directory: {output_dir}")
    create_files(file_structure[output_dir], ".")
    print("WebUI file generation complete.")

if __name__ == "__main__":
    generate_webui_files()