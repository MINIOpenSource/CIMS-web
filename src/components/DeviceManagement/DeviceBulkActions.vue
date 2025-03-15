<template>
  <span>
    <v-btn color="primary" :disabled="selectedClients.length === 0" @click="restartBulkClients">批量重启</v-btn>
    <v-btn color="primary" :disabled="selectedClients.length === 0" @click="openBulkNotificationDialog">批量发送通知</v-btn>

    <!-- 批量发送通知对话框 -->
    <v-dialog v-model="bulkNotificationDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">批量发送通知给 {{ selectedClients.length }} 个客户端</v-card-title>
        <v-card-text>
          <v-text-field v-model="bulkMessageMask" label="消息掩码" required></v-text-field>
          <v-textarea v-model="bulkMessageContent" label="消息内容" required></v-textarea>
          <!-- 可以添加更多通知选项 -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="bulkNotificationDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="sendBulkNotification">发送</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'DeviceBulkActions',
  props: {
    selectedClients: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      bulkNotificationDialog: false,
      bulkMessageMask: '',
      bulkMessageContent: '',
    };
  },
  methods: {
    async restartBulkClients() {
      if (this.selectedClients.length > 0) {
        for (const clientUid of this.selectedClients) {
          try {
            await api.restartClient(clientUid);
            this.$vToastify.success(`客户端 ${clientUid} 重启指令已发送!`, { duration: 2000 }); // 短暂提示
          } catch (error) {
            console.error(`Failed to restart client ${clientUid}:`, error);
            this.$vToastify.error(`重启客户端 ${clientUid} 失败!`, { duration: 3000 });
          }
        }
        this.$emit('clients-restarted'); // 触发事件，通知父组件刷新列表
        this.$vToastify.success('批量重启指令发送完成!');
      }
    },
    openBulkNotificationDialog() {
      this.bulkNotificationDialog = true;
      this.bulkMessageMask = '';
      this.bulkMessageContent = '';
    },
    async sendBulkNotification() {
      if (this.selectedClients.length > 0) {
        for (const clientUid of this.selectedClients) {
          try {
            await api.sendClientNotification(this.clientUid, this.bulkMessageMask, this.bulkMessageContent);
            this.$vToastify.success(`通知已发送给客户端 ${clientUid}!`, { duration: 2000 });
          } catch (error) {
            console.error(`Failed to send notification to client ${clientUid}:`, error);
            this.$vToastify.error(`发送通知给客户端 ${clientUid} 失败!`, { duration: 3000 });
          }
        }
        this.$emit('notifications-sent'); // 触发事件，通知父组件刷新列表 (或者更新状态)
        this.$vToastify.success('批量通知发送完成!');
        this.bulkNotificationDialog = false;
      }
    },
  },
};
</script>