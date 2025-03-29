<template>
  <v-overlay :model-value="isLoading" z-index="1000">
    <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
  </v-overlay>
</template>

<script setup>
  defineProps({ isLoading: Boolean });
</script>
