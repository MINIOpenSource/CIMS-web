<template>
  <v-dialog v-model="dialog" persistent max-width="800px" @keydown.esc="$emit('close')">
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>{{ resourceType }} - {{ configName }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text>
        <v-textarea
          v-model="configContent"
          label="配置内容 (JSON)"
          outlined
          :rules="jsonRules"
          :error-messages="jsonErrorMessages"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="$emit('close')">取消</v-btn>
        <v-btn color="primary" text @click="saveConfig">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'ConfigEditor',
  props: {
    resourceType: {
      type: String,
      required: true,
    },
    configName: {
      type: String,
      required: true,
    },
    dialog: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      configContent: '',
      jsonRules: [
        value => !!value || '配置内容不能为空',
        value => {
          try {
            JSON.parse(value);
            return true;
          } catch (e) {
            return '请输入有效的 JSON 格式数据';
          }
        },
      ],
      jsonErrorMessages: [],
    };
  },
  watch: {
    dialog(newValue) {
      if (newValue) {
        this.fetchConfigContent();
      }
    },
  },
  methods: {
    async fetchConfigContent() {
      try {
        const response = await api.getClientResource(this.resourceType, this.configName);
        this.configContent = JSON.stringify(response.data, null, 2); //  格式化 JSON 方便查看和编辑
      } catch (error) {
        console.error('Failed to fetch config content:', error);
        this.$vToastify.error(`加载配置 ${this.configName} 失败!`);
        this.$emit('close'); //  关闭对话框
      }
    },
    async saveConfig() {
      if (this.$refs.form && !this.$refs.form.validate()) { //  Vuetify 3 不需要 $refs.form 了，直接在 template form 上绑定 ref="form" 即可
        return; // 表单验证失败
      }
      try {
        const requestData = JSON.parse(this.configContent);
        await api.writeFileConfig(this.resourceType, this.configName, requestData);
        this.$vToastify.success(`配置 ${this.configName} 保存成功!`);
        this.$emit('config-updated'); //  通知父组件刷新配置列表
        this.$emit('close');
      } catch (error) {
        console.error('Failed to save config:', error);
        if (error.response && error.response.status === 404) {
          this.$vToastify.error(`资源类型 ${this.resourceType} 错误!`);
        } else {
          this.$vToastify.error(`保存配置 ${this.configName} 失败!`);
        }
        // TODO: 更详细的错误处理，例如显示服务器返回的错误信息
      }
    },
  },
};
</script>