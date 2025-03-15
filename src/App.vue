<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      clipped
      fixed
      app
    >
      <v-img
        class="mx-auto mt-4"
        max-width="100"
        src="@/assets/logo.png"
      ></v-img>
      <v-list nav dense>
        <v-subheader>ClassIsland 集控控制台</v-subheader>
        <v-list-item link to="/overview">
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-title>概览</v-list-item-title>
        </v-list-item>

        <v-list-group prepend-icon="mdi-devices">
          <template v-slot:activator>
            <v-list-item-title>设备管理</v-list-item-title>
          </template>

          <v-list-item link to="/devices/registered">
            <v-list-item-title>已注册设备管理</v-list-item-title>
          </v-list-item>

          <v-list-item link to="/devices/pre-registered">
            <v-list-item-title>预注册设备管理</v-list-item-title>
          </v-list-item>
        </v-list-group>

        <v-list-item link to="/configs">
          <v-list-item-icon>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-title>配置管理</v-list-item-title>
        </v-list-item>

        <v-list-item link to="/plugins">
          <v-list-item-icon>
            <v-icon>mdi-puzzle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title>插件管理</v-list-item-title>
        </v-list-item>

        <v-list-item link to="/settings">
          <v-list-item-icon>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-icon>
          <v-list-item-title>设置</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="my-2"></v-divider>

      <v-list nav dense>
        <v-subheader>版本信息</v-subheader>
        <v-list-item>
          <v-list-item-title class="caption">后端版本: 1.0.0 (Placeholder)</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-list-item-title class="caption">WebUI 版本: 1.0.0 (Placeholder)</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="my-2"></v-divider>

      <v-list nav dense>
        <v-list-item href="/download-presets" target="_blank">  <!--  TODO: 替换为实际链接 -->
          <v-list-item-icon>
            <v-icon>mdi-download</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="caption">集控预设配置下载</v-list-item-title>
        </v-list-item>
        <v-list-item href="/export-data" target="_blank">  <!-- TODO: 替换为实际链接 -->
          <v-list-item-icon>
            <v-icon>mdi-export</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="caption">服务器数据导出</v-list-item-title>
        </v-list-item>
      </v-list>

    </v-navigation-drawer>

    <v-app-bar app color="primary" dark clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>ClassIsland 集控控制台</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    drawer: null,
  }),
};
</script>