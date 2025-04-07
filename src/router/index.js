// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', name: 'Overview', component: () => import('@/pages/Overview.vue'), meta: { title: '概览' } },
      { path: 'registered', name: 'RegisteredDevices', component: () => import('@/pages/RegisteredDevices.vue'), meta: { title: '已注册设备' } },
      { path: 'pre-registered', name: 'PreRegisteredDevices', component: () => import('@/pages/PreRegisteredDevices.vue'), meta: { title: '预注册设备' } },
      { path: 'configs/:resourceType?', name: 'ConfigManagement', component: () => import('@/pages/ConfigManagement/Index.vue'), props: true, meta: { title: '配置管理' } },
      { path: 'plugins', name: 'PluginManagement', component: () => import('@/pages/PluginManagement.vue'), meta: { title: '插件管理' } },
      { path: 'settings', name: 'Settings', component: () => import('@/pages/Settings.vue'), meta: { title: '服务器设置' } },
      { path: 'download-preset', name: 'DownloadPreset', component: () => import('@/pages/DownloadPreset.vue'), meta: { title: '下载预设' } },
      { path: 'export-data', name: 'ExportData', component: () => import('@/pages/ExportData.vue'), meta: { title: '导出数据' } },
    ],
  },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });
router.beforeEach((to, from, next) => { document.title = `${to.meta.title} - CIMS 控制台` || 'CIMS 控制台'; next(); });

export default router;
