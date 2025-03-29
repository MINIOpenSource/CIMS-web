<template>
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
