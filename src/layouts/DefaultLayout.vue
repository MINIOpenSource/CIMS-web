<template>
  <v-app>
    <AppSidebar v-model="drawer" />
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-progress-linear :active="appStore.isLoading" indeterminate absolute bottom color="white"></v-progress-linear>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-alert v-if="appStore.error" type="error" dismissible @click:close="appStore.clearError()" class="mb-4">
          {{ appStore.error }}
        </v-alert>
        <router-view v-slot="{ Component }">
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </router-view>
      </v-container>
    </v-main>
    <v-footer app>
      <span>© {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '@/components/AppSidebar.vue';
import { useAppStore } from '@/store/app';

const drawer = ref(true);
const route = useRoute();
const appStore = useAppStore();
const currentPageTitle = computed(() => route.meta.title || 'CIMS 控制台');
</script>
