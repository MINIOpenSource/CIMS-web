<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">预注册设备</h1>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi-playlist-plus" class="mr-2"></v-icon>
        预注册列表
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus-box-outline" @click="openCreateDialog">
          新建预注册
        </v-btn>
        <v-btn icon="mdi-refresh" @click="fetchData" :loading="loading" class="ml-2"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-list lines="two" v-if="!loading && preRegisteredClients.length > 0">
        <template v-for="(item, index) in preRegisteredClients" :key="item.id">
          <v-list-item>
            <v-list-item-title class="font-weight-bold">{{ item.id }}</v-list-item-title>
            <v-list-item-subtitle>
              <!-- 显示配置摘要 -->
              配置: {{ formatConfigSummary(item.config) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEditDialog(item)" class="mr-1"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="confirmDelete(item.id)"></v-btn>
            </template>
          </v-list-item>
          <v-divider v-if="index < preRegisteredClients.length - 1"></v-divider>
        </template>
      </v-list>

      <v-skeleton-loader v-if="loading" type="list-item-two-line@5"></v-skeleton-loader>

      <v-card-text v-if="!loading && preRegisteredClients.length === 0" class="text-center text-disabled">
        没有预注册的设备。
      </v-card-text>

    </v-card>

    <!-- 新建/编辑对话框 -->
    <v-dialog v-model="editDialog" persistent max-width="600px">
      <v-card :loading="saving">
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '编辑' : '新建' }}预注册</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
              v-model="editedItem.id"
              label="客户端 ID"
              required
              :rules="[v => !!v || 'ID 不能为空']"
              :disabled="isEditing"
          ></v-text-field>
          <v-label class="mb-2">配置文件选择</v-label>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="editedItem.config.ClassPlan"
                  :items="availableConfigs.ClassPlan"
                  label="课表 (ClassPlan)"
                  density="compact"
                  :loading="loadingConfigs.ClassPlan"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="editedItem.config.TimeLayout"
                  :items="availableConfigs.TimeLayout"
                  label="时间表 (TimeLayout)"
                  density="compact"
                  :loading="loadingConfigs.TimeLayout"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="editedItem.config.Subjects"
                  :items="availableConfigs.Subjects"
                  label="科目 (Subjects)"
                  density="compact"
                  :loading="loadingConfigs.Subjects"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="editedItem.config.Settings"
                  :items="availableConfigs.DefaultSettings"
                  label="默认设置 (Settings)"
                  density="compact"
                  :loading="loadingConfigs.DefaultSettings"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="editedItem.config.Policy"
                  :items="availableConfigs.Policy"
                  label="策略 (Policy)"
                  density="compact"
                  :loading="loadingConfigs.Policy"
              ></v-select>
            </v-col>
          </v-row>
          <v-btn @click="loadAvailableConfigs" :loading="Object.values(loadingConfigs).some(l=>l)" class="mt-2">
            加载可用配置列表
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="saveItem" :disabled="!editedItem.id || saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <ConfirmDialog ref="confirmDeleteDialog" title="确认删除" message="确定要删除这个预注册条目吗？" @confirm="deleteConfirmed" />

  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { listPreRegisteredClients, preRegisterClient, deletePreRegisteredClient, updatePreRegisteredClient, listConfigFiles } from '@/api';
import { useAppStore } from '@/store/app';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const appStore = useAppStore();
const preRegisteredClients = ref([]);
const loading = ref(false);
const editDialog = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const confirmDeleteDialog = ref(null);
const idToDelete = ref('');

// 用于编辑/新建的对象
const editedItem = ref({
  id: '',
  config: {
    ClassPlan: 'default',
    TimeLayout: 'default',
    Subjects: 'default',
    Settings: 'default', // 注意API返回的是Settings
    Policy: 'default'
  }
});

// 存储可用的配置文件列表
const availableConfigs = reactive({
  ClassPlan: ['default'],
  TimeLayout: ['default'],
  Subjects: ['default'],
  DefaultSettings: ['default'], // 对应 API 的 Settings key
  Policy: ['default']
});
const loadingConfigs = reactive({
  ClassPlan: false, TimeLayout: false, Subjects: false, DefaultSettings: false, Policy: false
});


// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await listPreRegisteredClients();
    preRegisteredClients.value = response.data || [];
  } catch (error) {
    console.error("获取预注册列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 加载所有可用配置列表
const loadAvailableConfigs = async () => {
  const types = Object.keys(availableConfigs);
  const promises = types.map(async type => {
    loadingConfigs[type] = true;
    try {
      // 注意：DefaultSettings 对应 API 的 Settings key
      const apiKey = type === 'DefaultSettings' ? 'Settings' : type;
      const response = await listConfigFiles(apiKey); // 使用正确的 API key
      availableConfigs[type] = ['default', ...(response.data || []).filter(name => name !== 'default')];
    } catch (error) {
      console.error(`加载 ${type} 配置列表失败:`, error);
      availableConfigs[type] = ['default']; // 出错时保留 default
    } finally {
      loadingConfigs[type] = false;
    }
  });
  await Promise.all(promises);
};


// 格式化配置摘要显示
const formatConfigSummary = (config) => {
  if (!config) return '无';
  return Object.entries(config)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
};

// 打开新建对话框
const openCreateDialog = () => {
  isEditing.value = false;
  editedItem.value = { // 重置
    id: '',
    config: { ClassPlan: 'default', TimeLayout: 'default', Subjects: 'default', Settings: 'default', Policy: 'default' }
  };
  if (Object.values(availableConfigs).every(list => list.length <= 1)) {
    loadAvailableConfigs(); // 如果没加载过配置列表，加载一下
  }
  editDialog.value = true;
};

// 打开编辑对话框
const openEditDialog = (item) => {
  isEditing.value = true;
  // 深拷贝编辑项，避免直接修改列表中的数据
  editedItem.value = JSON.parse(JSON.stringify(item));
  if (Object.values(availableConfigs).every(list => list.length <= 1)) {
    loadAvailableConfigs();
  }
  editDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  editDialog.value = false;
};

// 保存项目
const saveItem = async () => {
  saving.value = true;
  try {
    const dataToSend = {
      id: editedItem.value.id,
      config: editedItem.value.config
    };
    if (isEditing.value) {
      await updatePreRegisteredClient(dataToSend);
      appStore.showSnackbar('预注册配置已更新', 'success');
    } else {
      await preRegisterClient(dataToSend);
      appStore.showSnackbar('预注册条目已创建', 'success');
    }
    closeDialog();
    await fetchData(); // 刷新列表
  } catch (error) {
    appStore.showSnackbar(`保存失败: ${error.response?.data?.detail || error.message}`, 'error');
  } finally {
    saving.value = false;
  }
};


// 确认删除
const confirmDelete = (id) => {
  idToDelete.value = id;
  confirmDeleteDialog.value.open();
}

// 执行删除
const deleteConfirmed = async () => {
  if (!idToDelete.value) return;
  try {
    await deletePreRegisteredClient(idToDelete.value);
    appStore.showSnackbar('预注册条目已删除', 'success');
    await fetchData(); // 刷新列表
  } catch (error) {
    appStore.showSnackbar(`删除失败: ${error.response?.data?.detail || error.message}`, 'error');
  } finally {
    idToDelete.value = '';
  }
}

// 组件挂载时获取数据
onMounted(fetchData);
</script>