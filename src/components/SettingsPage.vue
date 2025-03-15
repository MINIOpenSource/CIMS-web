<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>服务器设置</v-card-title>
          <v-card-text>
            <v-form ref="settingsForm" v-model="valid" lazy-validation>
              <v-text-field
                v-model="settings.organization_name"
                label="组织名称"
                :rules="[rules.required]"
                required
              ></v-text-field>
              <v-text-field
                v-model="settings.host"
                label="Host"
                :rules="[rules.required]"
                required
              ></v-text-field>
              <v-subheader>端口设置</v-subheader>
              <v-text-field v-model="settings.ports.api" label="API 端口" type="number" :rules="[rules.required, rules.port]"></v-text-field>
              <v-text-field v-model="settings.ports.command" label="Command 端口" type="number" :rules="[rules.required, rules.port]"></v-text-field>
              <v-text-field v-model="settings.ports.gRPC" label="gRPC 端口" type="number" :rules="[rules.required, rules.port]"></v-text-field>
              <v-text-field v-model="settings.ports.webui" label="WebUI 端口" type="number" :rules="[rules.required, rules.port]"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!valid" @click="saveSettings">保存设置</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'SettingsPage',
  data() {
    return {
      valid: false,
      settings: {
        ports: {
          gRPC: 0,
          command: 0,
          api: 0,
          webui: 0,
        },
        organization_name: '',
        host: '',
      },
      rules: {
        required: value => !!value || '此项为必填项',
        port: value => {
          const port = parseInt(value, 10);
          return (port > 0 && port <= 65535) || '请输入有效的端口号 (1-65535)';
        },
      },
    };
  },
  mounted() {
    this.fetchSettings();
  },
  methods: {
    async fetchSettings() {
      try {
        const response = await api.getServerSettings();
        this.settings = response.data;
      } catch (error) {
        console.error('Failed to fetch server settings:', error);
        this.$vToastify.error('加载服务器设置失败!');
      }
    },
    async saveSettings() {
      if (this.$refs.settingsForm.validate()) {
        try {
          await api.updateServerSettings(this.settings);
          this.$vToastify.success('服务器设置保存成功!');
        } catch (error) {
          console.error('Failed to save server settings:', error);
          this.$vToastify.error('保存服务器设置失败!');
        }
      }
    },
  },
};
</script>