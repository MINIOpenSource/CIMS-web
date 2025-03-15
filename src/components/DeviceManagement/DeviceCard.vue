<template>
  <v-card>
    <v-card-title>{{ clientUid }}</v-card-title>
    <v-card-subtitle>状态: <v-chip :color="statusColor" dark>{{ clientStatus }}</v-chip></v-card-subtitle>
    <v-card-actions>
      <v-btn text @click="restartClient">重启客户端</v-btn>
      <v-btn text @click="sendNotificationDialog">发送通知</v-btn>
      <!-- 可以添加更多操作按钮 -->
    </v-card-actions>

    <!-- 发送通知对话框 (组件内部的对话框) -->
    <v-dialog v-model="notificationDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">发送通知给客户端 {{ clientUid }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="messageMask" label="消息掩码" required></v-text-field>
          <v-textarea v-model="messageContent" label="消息内容" required></v-textarea>
          <!-- 可以添加更多通知选项 -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="notificationDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="sendNotification">发送</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'DeviceCard',
  props: {
    clientUid: {
      type: String,
      required: true,
    },
    clientStatus: {
      type: String,
      default: 'unknown',
    },
  },
  data() {
    return {
      notificationDialog: false,
      messageMask: '',
      messageContent: '',
    };
  },
  computed: {
    statusColor() {
      return this.clientStatus === 'online' ? 'success' : 'error';
    },
  },
  methods: {
    async restartClient() {
      try {
        await api.restartClient(this.clientUid);
        this.$vToastify.success(`客户端 ${this.clientUid} 重启指令已发送!`);
        // 可以考虑在重启后更新父组件的客户端状态
      } catch (error) {
        console.error('Failed to restart client:', error);
        this.$vToastify.error(`重启客户端 ${this.clientUid} 失败!`);
      }
    },
    sendNotificationDialog() {
      this.notificationDialog = true;
      this.messageMask = '';
      this.messageContent = '';
    },
    async sendNotification() {
      try {
        await api.sendClientNotification(this.clientUid, this.messageMask, this.messageContent);
        this.$vToastify.success(`通知已发送给客户端 ${this.clientUid}!`);
        this.notificationDialog = false;
      } catch (error) {
        console.error('Failed to send notification:', error);
        this.$vToastify.error(`发送通知给客户端 ${this.clientUid} 失败!`);
      }
    },
  },
};
</script>