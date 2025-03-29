<template>
  <div>
    <p>Subjects Editor Placeholder - Implement form based on Subjects.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>