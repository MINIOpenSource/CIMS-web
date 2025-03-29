<template>
  <v-container fluid>
    <v-toolbar density="compact" flat color="transparent">
      <v-toolbar-title>时间点管理</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="addTimePoint">添加时间点</v-btn>
    </v-toolbar>

    <v-expansion-panels variant="accordion" v-model="panel">
      <v-expansion-panel
          v-for="(timepoint, index) in timePoints"
          :key="timepoint.internalId"
          :value="timepoint.internalId"
      >
        <v-expansion-panel-title>
          <v-chip small :color="timepoint.TimeType === 0 ? 'blue' : timepoint.TimeType === 1 ? 'green' : 'grey'" class="mr-2">
            {{ timepoint.TimeType === 0 ? '上课' : timepoint.TimeType === 1 ? '下课' : '其他' }}
          </v-chip>
          {{ timepoint.StartTime || '未设置' }} - {{ timepoint.EndTime || '未设置' }}
          <v-chip v-if="timepoint.IsHidden" small color="orange" class="ml-2">隐藏</v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                  v-model="timepoint.StartTime"
                  label="开始时间 (HH:mm:ss)"
                  placeholder="08:00:00"
                  density="compact"
                  variant="outlined"
                  :rules="[timeFormatRule]"
                  @update:modelValue="markDirty"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                  v-model="timepoint.EndTime"
                  label="结束时间 (HH:mm:ss)"
                  placeholder="08:45:00"
                  density="compact"
                  variant="outlined"
                  :rules="[timeFormatRule]"
                  @update:modelValue="markDirty"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                  v-model="timepoint.TimeType"
                  :items="timeTypeOptions"
                  item-title="text"
                  item-value="value"
                  label="时间点类型"
                  density="compact"
                  variant="outlined"
                  @update:modelValue="markDirty"
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                  v-model="timepoint.Alias"
                  label="别名 (可选)"
                  density="compact"
                  variant="outlined"
                  @update:modelValue="markDirty"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                  v-model="timepoint.Desc"
                  label="描述 (可选)"
                  density="compact"
                  variant="outlined"
                  @update:modelValue="markDirty"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-checkbox-btn
                  v-model="timepoint.IsHidden"
                  label="隐藏此时间点"
                  density="compact"
                  @update:modelValue="markDirty"
                  class="mr-4"
              ></v-checkbox-btn>
              <v-btn icon="mdi-delete-outline" variant="text" color="error" @click="removeTimePoint(index)"></v-btn>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <div v-if="!timePoints.length" class="text-center text-disabled pa-5">
      点击 "添加时间点" 来创建第一个时间点。
    </div>

  </v-container>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  configData: { // 期望是 TimeLayouts 对象 { "LayoutId1": [TimePoint1, TimePoint2], ... }
    type: Object,
    required: true,
    default: () => ({})
  }
});
const emit = defineEmits(['update:config-data']);

const timeLayouts = ref({});
const panel = ref([]); // 控制展开的面板

// 时间点类型选项
const timeTypeOptions = ref([
  { text: '上课时间', value: 0 },
  { text: '下课时间', value: 1 },
  { text: '其他时间', value: 2 },
]);

// 时间格式校验规则 (简单示例)
const timeFormatRule = (v) => /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(v) || '格式应为 HH:mm:ss';

// --- 重要：此编辑器假设只编辑第一个 TimeLayout ---
// 如果一个配置文件可能包含多个时间表布局，需要添加选择或切换布局的逻辑
const firstLayoutId = computed(() => Object.keys(timeLayouts.value)[0]);

// 将第一个时间表布局的 TimePoint 数组用于编辑
// 添加 internalId 用于 v-expansion-panels 的 key 和 v-model
const timePoints = computed({
  get: () => {
    if (!firstLayoutId.value) return [];
    return (timeLayouts.value[firstLayoutId.value] || []).map((tp, index) => ({
      ...tp,
      internalId: `${firstLayoutId.value}-${index}` // 创建唯一 ID
    }));
  },
  set: (newTimePoints) => {
    if (firstLayoutId.value) {
      // 移除 internalId 并更新回 ref
      timeLayouts.value[firstLayoutId.value] = newTimePoints.map(({ internalId, ...rest }) => rest);
      markDirty();
    }
  }
});


const markDirty = () => {
  // 当 timePoints 变化时（通过 set），触发更新
  emit('update:config-data', timeLayouts.value);
};

const addTimePoint = () => {
  if (!firstLayoutId.value) {
    // 如果还没有布局，创建一个默认的
    const newLayoutId = 'default_layout'; // 或者提示用户输入 ID
    timeLayouts.value[newLayoutId] = [];
    // 强制 Vue 更新计算属性依赖
    timeLayouts.value = {...timeLayouts.value};
    // 延迟一下再添加时间点，确保 firstLayoutId 更新
    setTimeout(() => {
      if(firstLayoutId.value){
        const newIndex = timeLayouts.value[firstLayoutId.value].length;
        timeLayouts.value[firstLayoutId.value].push({
          StartTime: "00:00:00", EndTime: "00:00:00", TimeType: 0, Alias: "", Desc: "", IsHidden: false
        });
        // 展开新添加的面板
        panel.value = [`${firstLayoutId.value}-${newIndex}`];
        markDirty();
      }
    }, 50);
    return;
  }

  const newIndex = timeLayouts.value[firstLayoutId.value].length;
  timeLayouts.value[firstLayoutId.value].push({
    StartTime: "00:00:00", EndTime: "00:00:00", TimeType: 0, Alias: "", Desc: "", IsHidden: false
  });
  // 展开新添加的面板
  panel.value = [`${firstLayoutId.value}-${newIndex}`];
  markDirty();
};

const removeTimePoint = (index) => {
  if (firstLayoutId.value && timeLayouts.value[firstLayoutId.value][index]) {
    timeLayouts.value[firstLayoutId.value].splice(index, 1);
    markDirty();
  }
};

watch(() => props.configData, (newVal) => {
  timeLayouts.value = JSON.parse(JSON.stringify(newVal || {}));
  // 如果加载了新数据，折叠所有面板
  panel.value = [];
}, { immediate: true, deep: true });

</script>