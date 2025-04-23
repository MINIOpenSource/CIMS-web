<template>
  <v-form ref="form" v-if="localConfig">
    <v-row>
      <!-- Organization Name -->
      <v-col cols="12">
        <v-text-field
            v-model="localConfig.organization_name"
            label="组织名称"
            variant="outlined"
            density="compact"
            required
            :rules="[v => !!v || '组织名称不能为空']"
            @update:modelValue="updateConfig"
        ></v-text-field>
      </v-col>

      <!-- gRPC Settings -->
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">gRPC 服务</v-card-title>
          <v-card-text>
            <v-select
                v-model="localConfig.gRPC.prefix"
                :items="['http', 'https']"
                label="协议前缀 (Prefix)"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-select>
            <v-text-field
                v-model="localConfig.gRPC.host"
                label="主机 (Host)"
                placeholder="localhost"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-text-field>
            <v-text-field
                v-model.number="localConfig.gRPC.mp_port"
                label="端口 (Port)"
                type="number"
                placeholder="50051"
                variant="outlined"
                density="compact"
                :rules="[portRule]"
                @update:modelValue="updateConfig"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- API Settings -->
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">客户端 API 服务</v-card-title>
          <v-card-text>
            <v-select
                v-model="localConfig.api.prefix"
                :items="['http', 'https']"
                label="协议前缀 (Prefix)"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-select>
            <v-text-field
                v-model="localConfig.api.host"
                label="主机 (Host)"
                placeholder="localhost"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-text-field>
            <v-text-field
                v-model.number="localConfig.api.mp_port"
                label="端口 (Port)"
                type="number"
                placeholder="50050"
                variant="outlined"
                density="compact"
                :rules="[portRule]"
                @update:modelValue="updateConfig"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Command Settings -->
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">管理命令服务</v-card-title>
          <v-card-text>
            <v-select
                v-model="localConfig.command.prefix"
                :items="['http', 'https']"
                label="协议前缀 (Prefix)"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-select>
            <v-text-field
                v-model="localConfig.command.host"
                label="主机 (Host)"
                placeholder="localhost"
                variant="outlined"
                density="compact"
                class="mb-3"
                @update:modelValue="updateConfig"
            ></v-text-field>
            <v-text-field
                v-model.number="localConfig.command.mp_port"
                label="端口 (Port)"
                type="number"
                placeholder="50052"
                variant="outlined"
                density="compact"
                :rules="[portRule]"
                @update:modelValue="updateConfig"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>
  </v-form>
  <div v-else class="text-center text-disabled pa-5">
    无法加载设置编辑器的数据。
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  configData: {
    type: Object,
    required: true,
    default: () => ({ // 提供默认结构以避免模板错误
      organization_name: '',
      gRPC: { prefix: 'http', host: 'localhost', mp_port: 50051 },
      api: { prefix: 'http', host: 'localhost', mp_port: 50050 },
      command: { prefix: 'http', host: 'localhost', mp_port: 50052 }
    })
  }
});

const emit = defineEmits(['update:config-data']);

const localConfig = ref(null);
const form = ref(null); // 引用 v-form

// 端口校验规则
const portRule = (v) => (v > 0 && v <= 65535) || '端口号必须在 1-65535 之间';

// 当本地配置更新时，触发父组件更新
const updateConfig = () => {
  // 使用 nextTick 确保 DOM 更新后再触发，避免可能的竞态条件
  nextTick(() => {
    emit('update:config-data', localConfig.value);
  });
};

// 监听传入的 configData 变化
watch(() => props.configData, (newVal) => {
  // 深拷贝，并确保所有层级都存在
  localConfig.value = JSON.parse(JSON.stringify({
    organization_name: newVal?.organization_name || '',
    gRPC: { ...(newVal?.gRPC || { prefix: 'http', host: 'localhost', mp_port: 50051 }) },
    api: { ...(newVal?.api || { prefix: 'http', host: 'localhost', mp_port: 50050 }) },
    command: { ...(newVal?.command || { prefix: 'http', host: 'localhost', mp_port: 50052 }) }
  }));
  // 重置表单验证状态 (如果需要)
  // if (form.value) {
  //    form.value.resetValidation();
  // }
}, { immediate: true, deep: true });

</script>

<style scoped>
.v-card {
  height: 100%; /* 让卡片高度一致 */
}
</style>