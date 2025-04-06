<template>
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

const registeredCount = computed(() => dataStore.clientsStatus.length);
const onlineCount = computed(() => dataStore.clientsStatus.filter(c => c.status === 'online').length);

const refreshStatus = async () => { loading.value = true; await dataStore.fetchClientStatus(); loading.value = false; };
const openBroadcastDialog = () => { notification.value = { message_mask: '', message_content: '', is_emergency: false, duration_seconds: 5, is_speech_enabled: true, is_effect_enabled: true, is_sound_enabled: true, is_topmost: true, repeat_counts: 1, overlay_icon_left: 0, overlay_icon_right: 0 }; broadcastDialog.value = true; };
const sendBroadcastNotification = async () => {
  if (!notification.value.message_mask || !notification.value.message_content) { appStore.setError('通知标题和内容不能为空'); return; }
  sendingBroadcast.value = true;
  try {
    const onlineClientUids = dataStore.clientsStatus.filter(c => c.status === 'online').map(c => c.uid);
    if (onlineClientUids.length === 0) { appStore.setError('没有在线的客户端可以接收通知'); broadcastDialog.value = false; sendingBroadcast.value = false; return; }
    await batchClientAction('send_notification', onlineClientUids, notification.value);
    appStore.showSnackbar('广播通知已发送', 'success');
    broadcastDialog.value = false;
  } catch (error) { console.error('发送广播失败:', error); } finally { sendingBroadcast.value = false; }
};

onMounted(async () => { await dataStore.fetchClientStatus(); });
</script>
