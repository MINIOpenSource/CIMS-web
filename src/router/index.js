import Vue from 'vue'
import VueRouter from 'vue-router'
import OverviewPage from '../components/OverviewPage.vue'
import RegisteredDevices from '../components/DeviceManagement/RegisteredDevices.vue'
import PreRegisteredDevices from '../components/DeviceManagement/PreRegisteredDevices.vue'
import ConfigurationManagement from '../components/ConfigurationManagement/ConfigList.vue' // 假设 ConfigList 作为配置管理主页
import PluginManagement from '../components/PluginManagement.vue'
import SettingsPage from '../components/SettingsPage.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/overview' // 默认重定向到概览页
  },
  {
    path: '/overview',
    name: 'Overview',
    component: OverviewPage
  },
  {
    path: '/devices/registered',
    name: 'RegisteredDevices',
    component: RegisteredDevices
  },
  {
    path: '/devices/pre-registered',
    name: 'PreRegisteredDevices',
    component: PreRegisteredDevices
  },
  {
    path: '/configs',
    name: 'ConfigurationManagement',
    component: ConfigurationManagement
  },
  {
    path: '/plugins',
    name: 'PluginManagement',
    component: PluginManagement
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage
  }
  // TODO: 添加 集控预设配置下载 和 服务器数据导出 的路由 (如果需要页面)
]

const router = new VueRouter({
  mode: 'history', // 可选，根据部署环境选择 history 或 hash 模式
  base: process.env.BASE_URL,
  routes
})

export default router