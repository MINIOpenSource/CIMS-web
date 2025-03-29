<template>
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
