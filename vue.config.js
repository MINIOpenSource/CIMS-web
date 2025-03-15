const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_CIMS_API_BASE, // 从环境变量获取 API Base URL
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api' //  保持路径不变，只修改 target
        }
      },
      '/command': {
        target: process.env.VUE_APP_CIMS_CMD_BASE, // 从环境变量获取 Command Base URL
        changeOrigin: true,
        pathRewrite: {
          '^/command': '/command' // 保持路径不变，只修改 target
        }
      }
    }
  }
})