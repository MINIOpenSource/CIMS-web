<template>
  <div>
    <v-textarea
      v-model="jsonText"
      label="JSON Editor"
      rows="15"
      @update:model-value="onTextUpdate"
    ></v-textarea>
    <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  configData: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:config-data']);

const jsonText = ref('');
const error = ref('');

const formattedJsonText = computed(() => {
  try {
    return JSON.stringify(props.configData, null, 2); // 格式化 JSON
  } catch (e) {
    return '';
  }
});

watch(formattedJsonText, (val) => {
  jsonText.value = val; // 同步格式化后的 JSON 到 textarea
});

const onTextUpdate = (text) => {
  try {
    const parsed = JSON.parse(text);
    error.value = '';
    emit('update:config-data', parsed);
  } catch (e) {
    error.value = 'JSON 格式错误';
    // 可以选择不 emit，或者 emit 旧的数据，取决于需求
  }
};
</script>

<style scoped>
/* 编辑器样式 */
</style>
