<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>预注册设备管理</v-card-title>
          <v-card-text>
            <v-form ref="preRegisterForm" v-model="valid" lazy-validation>
              <v-textarea
                v-model="preRegisterData"
                label="预注册信息 (JSON 格式)"
                hint="请输入客户端预注册信息 JSON"
                persistent-hint
                :rules="jsonRules"
                required
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!valid" @click="submitPreRegister">预注册</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'PreRegisteredDevices',
  data() {
    return {
      valid: false,
      preRegisterData: '', //  初始值可以为空字符串
      jsonRules: [
        value => !!value || '预注册信息不能为空',
        value => {
          try {
            JSON.parse(value);
            return true;
          } catch (e) {
            return '请输入有效的 JSON 格式数据';
          }
        },
      ],
    };
  },
  methods: {
    async submitPreRegister() {
      if (this.$refs.preRegisterForm.validate()) {
        try {
          const requestData = JSON.parse(this.preRegisterData);
          await api.preRegisterClient(requestData);
          this.$vToastify.success('客户端预注册信息提交成功!');
          this.preRegisterData = ''; // 清空输入框
          this.$refs.preRegisterForm.resetValidation(); // 重置表单验证状态
        } catch (error) {
          console.error('Failed to pre-register client:', error);
          this.$vToastify.error('客户端预注册信息提交失败!');
          // TODO: 更详细的错误处理，例如显示服务器返回的错误信息
        }
      }
    },
  },
};
</script>