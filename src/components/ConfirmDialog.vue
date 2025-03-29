<template>
  <v-dialog v-model="dialog" max-width="400" persistent>
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">取消</v-btn>
        <v-btn color="error" @click="confirmAction">确认</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: { type: String, default: '确认' },
  message: { type: String, default: '确定要执行此操作吗?' },
});
const emit = defineEmits(['confirm', 'cancel']);

const dialog = ref(false);

const open = () => { dialog.value = true; };
const close = () => { dialog.value = false; };
const confirmAction = () => { emit('confirm'); close(); };
const cancel = () => { emit('cancel'); close(); };

defineExpose({ open, close }); // 暴露 open 方法供父组件调用
</script>
