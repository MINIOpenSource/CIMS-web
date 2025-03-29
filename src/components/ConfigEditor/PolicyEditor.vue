<template>
  <div>
    <p>Policy Editor Placeholder - Implement form based on Policy.json structure</p>
    <pre>{{ configData }}</pre> <!- 显示数据用于调试 -->
  </div>
</template>

<script setup>
  defineProps({ configData: { type: Object, default: () => ({}) } });
  defineEmits(['update:config-data']);
</script>