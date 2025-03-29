<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">{{ resourceType }} 配置管理</h1>
    <p>Specific config type view - to be implemented if needed separately</p>
  </v-container>
</template>

<script setup>
  defineProps({ resourceType: String });
</script>
