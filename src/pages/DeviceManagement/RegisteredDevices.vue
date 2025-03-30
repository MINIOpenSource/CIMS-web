<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">已注册设备</h1>

    <v-card elevation="2">
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi-lan-connect" class="mr-2"></v-icon>
        设备列表
        <v-spacer></v-spacer>
        <v-text-field
            v-model="search"
            density="compact"
            label="搜索 (名称或 UID)"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            hide-details=""
            single-line
            class="mr-2"
            style="max-width: 300px;"
        ></v-text-field>
        <v-btn icon="mdi-refresh" @click="fetchData" :loading="loading"></v-btn>
        <!-- 批量操作按钮 (仅当有选中项时显示) -->
        <v-menu v-if="selectedClients.length > 0">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" class="ml-2" v-bind="props">
              批量操作 ({{ selectedClients.length }})
              <v-icon right>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="batchAction('restart')">
              <v-list-item-title><v-icon left small>mdi-restart</v-icon> 重启</v-list-item-title>
            </v-list-item>
            <v-list-item @click="batchAction('update_data')">
              <v-list-item-title><v-icon left small>mdi-database-sync-outline</v-icon> 更新数据</v-list-item-title>
            </v-list-item>
            <!-- 添加其他批量操作 -->
          </v-list>
        </v-menu>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table
          v-model="selectedClients"
          :headers="headers"
          :items="filteredClients"
          :loading="loading"
          :search="search"
          item-value="uid"
          show-select
          class="elevation-0"
          items-per-page-text="每页项目数"
      >
        <!-- 自定义状态列显示 -->
        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.raw.status)" dark small>
            <v-icon left small class="mr-1">{{ getStatusIcon(item.raw.status) }}</v-icon>
            {{ item.raw.status === 'online' ? '在线' : item.raw.status === 'offline' ? '离线' : '未知' }}
          </v-chip>
        </template>

        <!-- 自定义最后在线时间列 -->
        <template v-slot:item.last_seen="{ item }">
          {{ item.raw.last_seen || '从未' }}
        </template>

        <!-- 自定义操作列 -->
        <template v-slot:item.actions="{ item }">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-information-outline" variant="text" size="small" @click="showDetails(item.raw)" v-bind="props"></v-btn>
            </template>
            <span>详情</span>
          </v-tooltip>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-restart" variant="text" size="small" @click="confirmRestart(item.raw)" :disabled="item.raw.status !== 'online'" v-bind="props"></v-btn>
            </template>
            <span>重启</span>
          </v-tooltip>
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-bell-outline" variant="text" size="small" @click="openNotifyDialog(item.raw)" :disabled="item.raw.status !== 'online'" v-bind="props"></v-btn>
            </template>
            <span>发送通知</span>
          </v-tooltip>
          <!-- 添加删除注册等操作？ -->
        </template>

        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>
        <template v-slot:no-data>
          没有找到已注册的设备。
        </template>
        <template v-slot:no-results>
          没有找到匹配 "{{ search }}" 的设备。
        </template>
      </v-data-table>
    </v-card>

    <!-- 客户端详情对话框 -->
    <ClientCardDialog ref="detailsDialog" :client-data="selectedClientDetails" />
    <!-- 发送通知对话框 (可复用概览页的或单独创建) -->
    <!-- ... notifyDialog ... -->
    <!-- 确认重启对话框 -->
    <ConfirmDialog ref="confirmRestartDialog" title="确认重启" message="确定要重启选中的客户端吗？" @confirm="executeRestart" />
    <!-- 确认批量操作对话框 -->
    <ConfirmDialog ref="confirmBatchDialog" title="确认批量操作" :message="batchConfirmMessage" @confirm="executeBatchAction" />

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { listClientStatus, getClientDetails, restartClient, batchClientAction as apiBatchAction } from '@/api'; // 引入 API
import { useAppStore } from '@/store/app';
import ClientCardDialog from '@/components/ClientCardDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const appStore = useAppStore();
const clients = ref([]);
const loading = ref(false);
const search = ref('');
const selectedClients = ref([]); // 用于 v-data-table 的 v-model
const detailsDialog = ref(null); // 引用详情对话框组件
const selectedClientDetails = ref(null); // 传递给详情对话框的数据
const confirmRestartDialog = ref(null); // 引用确认重启对话框
const clientToRestart = ref(null); // 待重启的客户端
const confirmBatchDialog = ref(null); // 引用批量确认对话框
const batchActionType = ref(''); // 待执行的批量操作类型
const batchConfirmMessage = ref(''); // 批量操作确认信息


const headers = ref([
  { title: '名称', key: 'name', sortable: true },
  { title: 'UID', key: 'uid', sortable: true },
  { title: '状态', key: 'status', sortable: true },
  { title: '最后在线时间', key: 'last_seen', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
]);

// 获取数据
const fetchData = async () => {
  loading.value = true;
  selectedClients.value = []; // 清空选择
  try {
    const response = await listClientStatus();
    clients.value = response.data || [];
  } catch (error) {
    console.error("获取客户端状态失败:", error);
    // appStore.setError(...) 已经在拦截器处理
  } finally {
    loading.value = false;
  }
};

// 计算属性用于过滤 (如果不用 v-data-table 的 search)
const filteredClients = computed(() => {
  // v-data-table 自带搜索，这里可以返回原始列表
  return clients.value;
  /*
  if (!search.value) {
      return clients.value;
  }
  const lowerSearch = search.value.toLowerCase();
  return clients.value.filter(client =>
      client.name.toLowerCase().includes(lowerSearch) ||
      client.uid.toLowerCase().includes(lowerSearch)
  );
  */
});

// 获取状态颜色
const getStatusColor = (status) => {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'grey';
  return 'warning'; // unknown
};
// 获取状态图标
const getStatusIcon = (status) => {
  if (status === 'online') return 'mdi-check-circle-outline';
  if (status === 'offline') return 'mdi-close-circle-outline';
  return 'mdi-help-circle-outline';
}

// 显示详情
const showDetails = async (client) => {
  // 可以先显示基本信息，再异步加载完整详情
  selectedClientDetails.value = client; // 先填充已知信息
  detailsDialog.value.open(); // 打开对话框
  try {
    // 异步加载完整信息
    const response = await getClientDetails(client.uid);
    selectedClientDetails.value = response.data; // 更新详情数据
  } catch (error) {
    console.error("获取客户端详情失败:", error);
    appStore.showSnackbar(`加载 ${client.name} 详情失败`, 'error');
  }
};

// 确认重启
const confirmRestart = (client) => {
  clientToRestart.value = client;
  confirmRestartDialog.value.open();
}

// 执行重启
const executeRestart = async () => {
  if (!clientToRestart.value) return;
  try {
    await restartClient(clientToRestart.value.uid);
    appStore.showSnackbar(`已向 ${clientToRestart.value.name} 发送重启指令`, 'success');
  } catch (error) {
    appStore.showSnackbar(`重启 ${clientToRestart.value.name} 失败`, 'error');
  } finally {
    clientToRestart.value = null;
  }
}

// 打开通知对话框
const openNotifyDialog = (client) => {
  // 实现发送通知的逻辑，可能需要一个新的对话框或复用
  console.log("发送通知给:", client);
  appStore.showSnackbar("发送通知功能待实现", "info");
}

// 触发批量操作确认
const batchAction = (actionType) => {
  batchActionType.value = actionType;
  let actionName = '';
  if (actionType === 'restart') actionName = '重启';
  else if (actionType === 'update_data') actionName = '更新数据';
  else actionName = actionType; // 其他操作
  batchConfirmMessage.value = `确定要对选中的 ${selectedClients.value.length} 个客户端执行 "${actionName}" 操作吗？`;
  confirmBatchDialog.value.open();
}

// 执行批量操作
const executeBatchAction = async () => {
  if (!batchActionType.value || selectedClients.value.length === 0) return;
  try {
    const uids = selectedClients.value; // v-data-table 的 v-model 直接是 item-value (uid) 的数组
    await apiBatchAction(batchActionType.value, uids);
    appStore.showSnackbar(`批量操作 "${batchActionType.value}" 指令已发送`, 'success');
    selectedClients.value = []; // 清空选择
    // 可以考虑刷新列表
    await fetchData();
  } catch (error) {
    appStore.showSnackbar(`批量操作 "${batchActionType.value}" 失败`, 'error');
  } finally {
    batchActionType.value = '';
  }
}

// 组件挂载时获取数据
onMounted(fetchData);
</script>

<style scoped>
/* 微调表格样式 */
.v-data-table :deep(tbody tr:hover) {
  cursor: pointer; /* 可选：给行添加手型光标 */
}
</style>