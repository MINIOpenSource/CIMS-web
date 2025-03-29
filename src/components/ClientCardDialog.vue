<template>
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
