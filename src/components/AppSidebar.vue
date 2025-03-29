<template>
  <v-navigation-drawer app class="elevation-2" v-model="drawerModel">
    <v-list-item class="pa-4">
      <template v-slot:prepend>
        <v-avatar image="/logo.png" size="32" class="mr-3"></v-avatar>
      </template>
      <v-list-item-title class="text-h6 font-weight-bold">ClassIsland<br>集控控制台</v-list-item-title>
    </v-list-item>
    <v-divider></v-divider>
    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-view-dashboard-outline" title="概览" :to="{ name: 'Overview' }" link exact></v-list-item>

      <!-- 设备管理 - 使用 v-list-group -->
      <v-list-group value="DeviceManagement">
        <template v-slot:activator="{ props }">
          <v-list-item
              v-bind="props"
              prepend-icon="mdi-devices"
              title="设备管理"
          ></v-list-item>
        </template>
        <!-- 子菜单项 -->
        <v-list-item prepend-icon="mdi-lan-connect" title="已注册设备" :to="{ name: 'RegisteredDevices' }" link exact></v-list-item>
        <v-list-item prepend-icon="mdi-playlist-plus" title="预注册设备" :to="{ name: 'PreRegisteredDevices' }" link exact></v-list-item>
      </v-list-group>

      <v-list-item prepend-icon="mdi-cog-outline" title="配置管理" :to="{ name: 'ConfigManagement' }" link></v-list-item>
      <v-list-item prepend-icon="mdi-puzzle-outline" title="插件管理" :to="{ name: 'PluginManagement' }" link exact></v-list-item>
      <v-list-item prepend-icon="mdi-cogs" title="服务器设置" :to="{ name: 'Settings' }" link exact></v-list-item>
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
const webuiVersion = import.meta.env.VITE_WEBUI_VERSION || '1.0v1beta1';

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
