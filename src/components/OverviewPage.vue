<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>客户端总数</v-card-title>
          <v-card-text class="display-2">{{ totalClients }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>在线客户端数</v-card-title>
          <v-card-text class="display-2">{{ onlineClients }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!-- 可以添加更多概览信息，例如图表、最近活动等 -->
  </v-container>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'OverviewPage',
  data() {
    return {
      totalClients: 0,
      onlineClients: 0,
    };
  },
  mounted() {
    this.fetchClientData();
  },
  methods: {
    async fetchClientData() {
      try {
        const clientsList = await api.listClients();
        const clientStatuses = await api.getClientStatuses();

        this.totalClients = clientsList.data.length;
        this.onlineClients = clientStatuses.data.filter(client => client.status === 'online').length;

      } catch (error) {
        console.error('Failed to fetch client data:', error);
        // TODO:  显示错误提示
      }
    },
  },
};
</script>