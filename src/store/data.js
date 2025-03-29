// src/store/data.js
import { defineStore } from 'pinia';
import { listClientStatus } from '@/api';

export const useDataStore = defineStore('data', {
  state: () => ({
    clientsStatus: [], // 客户端状态列表
    clients: [], // 客户端详细信息列表 (如果需要)
  }),
  getters: {
    onlineClientsCount: (state) => state.clientsStatus.filter(client => client.status === 'online').length,
  },
  actions: {
    async fetchClientStatus() {
      try {
        const response = await listClientStatus();
        this.clientsStatus = response.data || [];
      } catch (error) {
        console.error('获取客户端状态失败', error);
        this.clientsStatus = [];
      }
    },
    async fetchClientList() {
      // 如果需要客户端详细列表，实现 fetchClientList action
      // ...
    },
  },
});
