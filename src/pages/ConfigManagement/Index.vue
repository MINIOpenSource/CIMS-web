<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="2">
          <v-toolbar density="compact" color="surface">
            <v-toolbar-title>{{ currentResourceTypeTitle }}列表</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="fetchConfigList" :loading="loadingList"><v-icon>mdi-refresh</v-icon></v-btn>
            <v-btn icon @click="openCreateDialog"><v-icon>mdi-plus-box-outline</v-icon></v-btn>
          </v-toolbar>
          <v-list density="compact" nav v-model:selected="selectedConfigNameInternal">
            <v-list-subheader v-if="!configList.length && !loadingList">无可用配置</v-list-subheader>
            <v-list-item v-for="configName in configList" :key="configName" :value="configName" @click="selectConfig(configName)">
              <v-list-item-title>{{ configName }}</v-list-item-title>
              <template v-slot:append>
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click.stop="openRenameDialog(configName)" class="mr-1"></v-btn>
                <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click.stop="confirmDelete(configName)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card elevation="2" :loading="loadingConfig">
          <v-toolbar density="compact" color="surface">
            <v-toolbar-title>编辑: {{ selectedConfigName || '请选择配置' }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="saveConfig" :disabled="!selectedConfigName || loadingConfig || !isDirty" :loading="savingConfig">保存更改</v-btn>
          </v-toolbar>
          <v-card-text style="min-height: 400px;">
            <div v-if="!selectedConfigName && !loadingConfig" class="text-center text-disabled pa-10">请从左侧选择一个配置文件进行编辑。</div>
            <div v-if="loadingConfig" class="d-flex justify-center align-center" style="height: 400px;"><v-progress-circular indeterminate color="primary"></v-progress-circular></div>
            <component v-if="selectedConfigName && !loadingConfig" :is="currentEditorComponent" :config-data="currentConfigData" @update:config-data="handleEditorUpdate" />
            <v-alert v-if="configError" type="error" class="mt-4">{{ configError }}</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="createDialog" persistent max-width="400px">
      <v-card>
        <v-card-title>新建 {{ currentResourceTypeTitle }}</v-card-title>
        <v-card-text><v-text-field label="名称" v-model="newConfigName" required :rules="[v => !!v || '名称不能为空']"></v-text-field></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" @click="createConfig" :disabled="!newConfigName">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="renameDialog" persistent max-width="400px">
      <v-card>
        <v-card-title>重命名 {{ currentRenameTarget }}</v-card-title>
        <v-card-text><v-text-field label="新名称" v-model="newConfigName" required :rules="[v => !!v || '名称不能为空']"></v-text-field></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="renameDialog = false">取消</v-btn>
          <v-btn color="primary" @click="renameConfig" :disabled="!newConfigName || newConfigName === currentRenameTarget">重命名</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <ConfirmDialog ref="confirmDeleteDialog" title="确认删除" message="确定要删除这个配置文件吗？此操作不可撤销。" @confirm="deleteConfirmedConfig" />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listConfigFiles, getConfigResource, createConfigFile, deleteConfigFile, renameConfigFile, writeConfigFile } from '@/api';
import { useAppStore } from '@/store/app';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const editorComponents = { ClassPlan: defineAsyncComponent(() => import('@/components/ConfigEditor/ClassPlanEditor.vue')), TimeLayout: defineAsyncComponent(() => import('@/components/ConfigEditor/TimeLayoutEditor.vue')), Subjects: defineAsyncComponent(() => import('@/components/ConfigEditor/SubjectsEditor.vue')), DefaultSettings: defineAsyncComponent(() => import('@/components/ConfigEditor/DefaultSettingsEditor.vue')), Policy: defineAsyncComponent(() => import('@/components/ConfigEditor/PolicyEditor.vue')), Fallback: defineAsyncComponent(() => import('@/components/ConfigEditor/JsonEditor.vue')) };

const props = defineProps({ resourceType: String });
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const configList = ref([]); const loadingList = ref(false); const selectedConfigName = ref(null); const selectedConfigNameInternal = ref([]); const currentConfigData = ref(null); const originalConfigData = ref(null); const loadingConfig = ref(false); const savingConfig = ref(false); const configError = ref(null); const isDirty = ref(false); const createDialog = ref(false); const renameDialog = ref(false); const newConfigName = ref(''); const currentRenameTarget = ref(''); const confirmDeleteDialog = ref(null); const configToDelete = ref('');

const currentResourceType = computed(() => props.resourceType || route.params.resourceType || 'ClassPlan');
const currentResourceTypeTitle = computed(() => { const titles = { ClassPlan: '课表', TimeLayout: '时间表', Subjects: '科目', DefaultSettings: '默认设置', Policy: '策略' }; return titles[currentResourceType.value] || '配置'; });
const currentEditorComponent = computed(() => editorComponents[currentResourceType.value] || editorComponents.Fallback);

const fetchConfigList = async () => { loadingList.value = true; configError.value = null; try { const response = await listConfigFiles(currentResourceType.value); configList.value = response.data || []; if (selectedConfigName.value && !configList.value.includes(selectedConfigName.value)) { clearSelection(); } } catch (error) { console.error('获取配置列表失败:', error); configError.value = `获取列表失败: ${error.message}`; } finally { loadingList.value = false; } };
const fetchConfigContent = async (name) => { if (!name) return; loadingConfig.value = true; currentConfigData.value = null; originalConfigData.value = null; configError.value = null; isDirty.value = false; try { const response = await getConfigResource(currentResourceType.value, name); currentConfigData.value = JSON.parse(JSON.stringify(response.data || {})); originalConfigData.value = JSON.parse(JSON.stringify(response.data || {})); } catch (error) { console.error(`获取配置 ${name} 内容失败:`, error); configError.value = `加载配置 '${name}' 失败: ${error.response?.data?.detail || error.message}`; } finally { loadingConfig.value = false; } };
const selectConfig = (name) => { if (selectedConfigName.value === name) return; if (isDirty.value && !confirm('您有未保存的更改，确定要切换吗？')) { selectedConfigNameInternal.value = [selectedConfigName.value]; return; } selectedConfigName.value = name; fetchConfigContent(name); };
const clearSelection = () => { selectedConfigName.value = null; selectedConfigNameInternal.value = []; currentConfigData.value = null; originalConfigData.value = null; isDirty.value = false; configError.value = null; };
const handleEditorUpdate = (newData) => { currentConfigData.value = newData; isDirty.value = JSON.stringify(currentConfigData.value) !== JSON.stringify(originalConfigData.value); };
const saveConfig = async () => { if (!selectedConfigName.value || !currentConfigData.value || !isDirty.value) return; savingConfig.value = true; configError.value = null; try { const dataString = JSON.stringify(currentConfigData.value); await writeConfigFile(currentResourceType.value, selectedConfigName.value, dataString); originalConfigData.value = JSON.parse(dataString); isDirty.value = false; appStore.showSnackbar(`配置 '${selectedConfigName.value}' 已保存`, 'success'); } catch (error) { console.error(`保存配置 ${selectedConfigName.value} 失败:`, error); configError.value = `保存失败: ${error.response?.data?.detail || error.message}`; appStore.showSnackbar(`保存配置 '${selectedConfigName.value}' 失败`, 'error'); } finally { savingConfig.value = false; } };

const openCreateDialog = () => { newConfigName.value = ''; createDialog.value = true; };
const createConfig = async () => { if (!newConfigName.value) return; try { await createConfigFile(currentResourceType.value, newConfigName.value); appStore.showSnackbar(`配置 '${newConfigName.value}' 已创建`, 'success'); createDialog.value = false; await fetchConfigList(); } catch (error) { appStore.showSnackbar(`创建失败: ${error.response?.data?.detail || error.message}`, 'error'); } };
const openRenameDialog = (name) => { currentRenameTarget.value = name; newConfigName.value = name; renameDialog.value = true; };
const renameConfig = async () => { if (!newConfigName.value || newConfigName.value === currentRenameTarget.value) return; try { await renameConfigFile(currentResourceType.value, currentRenameTarget.value, newConfigName.value); appStore.showSnackbar(`已重命名为 '${newConfigName.value}'`, 'success'); renameDialog.value = false; const oldSelected = selectedConfigName.value === currentRenameTarget.value; await fetchConfigList(); if (oldSelected) { clearSelection(); selectConfig(newConfigName.value); selectedConfigNameInternal.value = [newConfigName.value]; } } catch (error) { appStore.showSnackbar(`重命名失败: ${error.response?.data?.detail || error.message}`, 'error'); } };
const confirmDelete = (name) => { configToDelete.value = name; confirmDeleteDialog.value.open(); };
const deleteConfirmedConfig = async () => { if (!configToDelete.value) return; try { await deleteConfigFile(currentResourceType.value, configToDelete.value); appStore.showSnackbar(`配置 '${configToDelete.value}' 已删除`, 'success'); if (selectedConfigName.value === configToDelete.value) { clearSelection(); } await fetchConfigList(); configToDelete.value = ''; } catch (error) { appStore.showSnackbar(`删除失败: ${error.response?.data?.detail || error.message}`, 'error'); } };

watch(() => props.resourceType, (newType, oldType) => { if (newType && newType !== oldType) { clearSelection(); fetchConfigList(); } });
onMounted(() => { fetchConfigList(); });
watch(selectedConfigNameInternal, (newVal) => { if (newVal && newVal.length > 0 && newVal[0] !== selectedConfigName.value) { selectConfig(newVal[0]); } });
watch(selectedConfigName, (newName) => { if (newName && selectedConfigNameInternal.value[0] !== newName) { selectedConfigNameInternal.value = [newName]; } });
</script>
