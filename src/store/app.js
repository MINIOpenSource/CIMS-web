// src/store/app.js
import { defineStore } from 'pinia';
import { getServerVersion } from '@/api';

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    error: '',
    backendVersion: '',
    snackbar: { active: false, message: '', color: 'success' },
  }),
  actions: {
    setLoading(loading) { this.isLoading = loading; },
    setError(error) { this.error = error; },
    clearError() { this.error = ''; },
    showSnackbar(message, color = 'success') {
      this.snackbar = { active: true, message, color };
    },
    closeSnackbar() { this.snackbar.active = false; },
    async fetchBackendVersion() {
      try {
        const response = await getServerVersion();
        this.backendVersion = response.data.backend_version;
      } catch (error) {
        console.error('获取后端版本失败', error);
        this.backendVersion = 'N/A';
      }
    },
  },
});
