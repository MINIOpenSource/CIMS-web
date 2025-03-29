<template>
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
