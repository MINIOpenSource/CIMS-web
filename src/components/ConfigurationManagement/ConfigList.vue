<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="3">
        <ConfigTypeMenu @resource-type-selected="selectedResourceType = $event" />
      </v-col>
      <v-col cols="12" md="9">
        <v-card v-if="selectedResourceType">
          <v-card-title>
            {{ selectedResourceType }} 配置管理
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="openCreateDialog">创建配置</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="configList"
              class="elevation-1"
              :loading="loading"
              loading-text="加载配置列表..."
              no-data-text="没有配置"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn icon @click="viewConfig(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon @click="editConfig(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="deleteConfigDialog(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn icon @click="renameConfigDialog(item)">
                  <v-icon>mdi-rename-box</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
        <v-card v-else>
          <v-card-text class="text-center">请在左侧菜单选择配置类型</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 创建配置对话框 -->
    <v-dialog v-model="createDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">创建 {{ selectedResourceType }} 配置</v-card-title>
        <v-card-text>
          <v-text-field v-model="newConfigName" label="配置名称" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="createConfig">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除配置确认对话框 -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">删除 {{ selectedResourceType }} 配置</v-card-title>
        <v-card-text>确定要删除配置 "{{ configToDelete }}" 吗?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="deleteConfirmDialog = false">取消</v-btn>
          <v-btn color="error" text @click="deleteConfig">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 重命名配置对话框 -->
    <v-dialog v-model="renameDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">重命名 {{ selectedResourceType }} 配置</v-card-title>
        <v-card-text>
          <v-text-field v-model="newConfigName" label="新配置名称" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="renameDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="renameConfig">重命名</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 查看/编辑配置对话框 (使用 ConfigEditor 组件) -->
    <ConfigEditor
      v-if="editConfigName"
      :resource-type="selectedResourceType"
      :config-name="editConfigName"
      :dialog="editDialog"
      @close="closeEditDialog"
      @config-updated="refreshConfigList"
    />

  </v-container>
</template>

<script>
import api from '@/services/api';
import ConfigTypeMenu from './ConfigTypeMenu.vue';
import ConfigEditor from './ConfigEditor.vue';

export default {
  name: 'ConfigList',
  components: {
    ConfigTypeMenu,
    ConfigEditor,
  },
  data() {
    return {
      selectedResourceType: null,
      loading: false,
      headers: [
        { text: '名称', value: 'name' },
        // { text: '版本', value: 'version' }, //  如果API返回版本信息，可以添加
        { text: '操作', value: 'actions', sortable: false },
      ],
      configList: [],
      createDialog: false,
      newConfigName: '',
      deleteConfirmDialog: false,
      configToDelete: null,
      renameDialog: false,
      configToRename: null,
      editDialog: false,
      editConfigName: null,
    };
  },
  watch: {
    selectedResourceType(newValue) {
      if (newValue) {
        this.fetchConfigList(newValue);
      } else {
        this.configList = []; // 清空列表
      }
    },
  },
  methods: {
    async fetchConfigList(resourceType) {
      this.loading = true;
      try {
        const response = await api.listConfigFiles(resourceType);
        this.configList = response.data.map(name => ({ name: name })); // 假设返回的是名称数组
      } catch (error) {
        console.error('Failed to fetch config list:', error);
        this.$vToastify.error(`加载 ${resourceType} 配置列表失败!`);
      } finally {
        this.loading = false;
      }
    },
    refreshConfigList() {
      if (this.selectedResourceType) {
        this.fetchConfigList(this.selectedResourceType);
      }
    },
    openCreateDialog() {
      this.newConfigName = '';
      this.createDialog = true;
    },
    async createConfig() {
      if (this.newConfigName) {
        try {
          await api.createConfigFile(this.selectedResourceType, this.newConfigName);
          this.$vToastify.success(`配置 ${this.newConfigName} 创建成功!`);
          this.createDialog = false;
          this.refreshConfigList();
        } catch (error) {
          console.error('Failed to create config:', error);
          this.$vToastify.error(`创建配置 ${this.newConfigName} 失败!`);
        }
      }
    },
    deleteConfigDialog(item) {
      this.configToDelete = item.name;
      this.deleteConfirmDialog = true;
    },
    async deleteConfig() {
      try {
        await api.deleteConfigFile(this.selectedResourceType, this.configToDelete);
        this.$vToastify.success(`配置 ${this.configToDelete} 删除成功!`);
        this.deleteConfirmDialog = false;
        this.refreshConfigList();
      } catch (error) {
        console.error('Failed to delete config:', error);
        this.$vToastify.error(`删除配置 ${this.configToDelete} 失败!`);
      }
    },
    renameConfigDialog(item) {
      this.configToRename = item;
      this.newConfigName = item.name; // 初始值设置为当前名称
      this.renameDialog = true;
    },
    async renameConfig() {
      if (this.newConfigName && this.newConfigName !== this.configToRename.name) {
        try {
          await api.renameConfigFile(this.selectedResourceType, this.configToRename.name, this.newConfigName);
          this.$vToastify.success(`配置 ${this.configToRename.name} 重命名为 ${this.newConfigName} 成功!`);
          this.renameDialog = false;
          this.refreshConfigList();
        } catch (error) {
          console.error('Failed to rename config:', error);
          this.$vToastify.error(`重命名配置 ${this.configToRename.name} 失败!`);
        }
      }
    },
    viewConfig(item) {
      this.editConfigName = item.name;
      this.editDialog = true;
    },
    editConfig(item) {
      this.editConfigName = item.name;
      this.editDialog = true; //  可以考虑使用不同的 dialog 变量来区分查看和编辑模式
    },
    closeEditDialog() {
      this.editDialog = false;
      this.editConfigName = null;
    },
  },
};
</script>