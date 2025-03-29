<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">服务器设置</h1>

    <v-card elevation="2" :loading="loadingSettings || savingSettings">
      <v-toolbar density="compact" color="surface">
        <v-toolbar-title>编辑设置</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveSettings" :disabled="!isDirty || savingSettings" :loading="savingSettings">
          保存更改
        </v-btn>
      </v-toolbar>

      <v-card-text>
        <div v-if="loadingSettings" class="text-center pa-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">正在加载设置...</p>
        </div>
        <div v-else-if="loadingError" class="pa-5">
          <v-alert type="error">加载设置失败: {{ loadingError }}</v-alert>
          <v-btn @click="fetchSettings" class="mt-4">重试</v-btn>
        </div>
        <SettingsEditor
            v-else
            :config-data="currentSettings"
            @update:config-data="handleEditorUpdate"
        />
        <v-alert v-if="saveError" type="error" class="mt-4">保存失败: {{ saveError }}</v-alert>
      </v-card-text>
    </v-card>

  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import SettingsEditor from '@/components/ConfigEditor/SettingsEditor.vue'; // 引入编辑器组件
import { getServerSettings, updateServerSettings } from '@/api'; // 引入 API
import { useAppStore } from '@/store/app';

const appStore = useAppStore();
const currentSettings = ref(null); // 当前编辑的设置
const originalSettings = ref(null); // 用于比较是否更改
const loadingSettings = ref(false);
const savingSettings = ref(false);
const isDirty = ref(false); // 是否有未保存的更改
const loadingError = ref(null);
const saveError = ref(null);

// 获取当前设置
const fetchSettings = async () => {
  loadingSettings.value = true;
  loadingError.value = null;
  isDirty.value = false; // 重置更改状态
  try {
    const response = await getServerSettings();
    // 深拷贝数据
    currentSettings.value = JSON.parse(JSON.stringify(response.data || {}));
    originalSettings.value = JSON.parse(JSON.stringify(response.data || {}));
  } catch (error) {
    console.error("加载服务器设置失败:", error);
    loadingError.value = error.response?.data?.detail || error.message || '未知错误';
    currentSettings.value = null; // 加载失败则清空
    originalSettings.value = null;
  } finally {
    loadingSettings.value = false;
  }
};

// 处理编辑器更新
const handleEditorUpdate = (newSettings) => {
  currentSettings.value = newSettings;
  checkIfDirty();
};

// 检查是否有更改
const checkIfDirty = () => {
  // 简单的 JSON 字符串比较
  isDirty.value = JSON.stringify(currentSettings.value) !== JSON.stringify(originalSettings.value);
}

// 保存设置
const saveSettings = async () => {
  if (!currentSettings.value || !isDirty.value) return;
  savingSettings.value = true;
  saveError.value = null;
  try {
    await updateServerSettings(currentSettings.value); // 发送整个对象
    // 更新原始数据
    originalSettings.value = JSON.parse(JSON.stringify(currentSettings.value));
    isDirty.value = false; // 标记为未更改
    appStore.showSnackbar('服务器设置已保存', 'success');
    // 可能需要通知后端其他部分配置已更改（如果需要）
  } catch (error) {
    console.error("保存服务器设置失败:", error);
    saveError.value = error.response?.data?.detail || error.message || '未知错误';
    appStore.showSnackbar('保存服务器设置失败', 'error');
  } finally {
    savingSettings.value = false;
  }
};

// 组件挂载时加载设置
onMounted(fetchSettings);

// 如果需要，可以监听 currentSettings 的深度变化来自动检测 isDirty
// watch(currentSettings, checkIfDirty, { deep: true });
</script>