<template>
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
