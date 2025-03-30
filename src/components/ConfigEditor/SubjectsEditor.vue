<template>
  <v-container fluid>
    <v-toolbar density="compact" flat color="transparent">
      <v-toolbar-title>科目管理</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="addSubject">添加科目</v-btn>
    </v-toolbar>

    <v-data-table
        :headers="headers"
        :items="subjectList"
        item-value="id"
        class="elevation-1"
        density="compact"
        items-per-page="-1" hide-default-footer
    >
      <template v-slot:item.name="{ item }">
        <v-text-field
            v-model="item.raw.Name"
            variant="underlined"
            density="compact"
            hide-details=""
            @update:modelValue="markDirty"
        ></v-text-field>
      </template>
      <template v-slot:item.initial="{ item }">
        <v-text-field
            v-model="item.raw.Initial"
            variant="underlined"
            density="compact"
            hide-details=""
            maxlength="1"
            style="width: 50px;"
            @update:modelValue="markDirty"
        ></v-text-field>
      </template>
      <template v-slot:item.teacherName="{ item }">
        <v-text-field
            v-model="item.raw.TeacherName"
            variant="underlined"
            density="compact"
            hide-details=""
            @update:modelValue="markDirty"
        ></v-text-field>
      </template>
      <template v-slot:item.isOutDoor="{ item }">
        <v-checkbox-btn
            v-model="item.raw.IsOutDoor"
            density="compact"
            hide-details
            @update:modelValue="markDirty"
        ></v-checkbox-btn>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click="removeSubject(item.raw.id)"></v-btn>
      </template>

      <template #bottom></template> <!-- 隐藏默认分页 -->
    </v-data-table>
    <!-- 提示 AttachedObjects 无法编辑 -->
    <v-alert type="info" density="compact" class="mt-4">
      注意：附加对象 (AttachedObjects) 当前无法在此编辑器中修改。
    </v-alert>

  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { VDataTable } from 'vuetify/components/VDataTable'; // 如果使用 labs
import { v4 as uuidv4 } from 'uuid'; // 用于生成 UUID

const props = defineProps({
  configData: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const emit = defineEmits(['update:config-data']);

const subjects = ref({});

// 将传入的 configData (字典) 转换为适合 v-data-table 的列表
const subjectList = computed(() => {
  return Object.entries(subjects.value).map(([id, data]) => ({ id, ...data }));
});

const headers = ref([
  { title: '名称', key: 'name', sortable: false, width: '30%' },
  { title: '简称', key: 'initial', sortable: false, width: '10%' },
  { title: '教师', key: 'teacherName', sortable: false, width: '25%' },
  { title: '室外课', key: 'isOutDoor', sortable: false, width: '15%' },
  { title: '操作', key: 'actions', sortable: false, align: 'end', width: '10%' },
]);

// 标记数据已更改并触发事件
const markDirty = () => {
  // 直接修改 subjects ref，然后触发 update
  emit('update:config-data', subjects.value);
};

// 添加新科目
const addSubject = () => {
  const newId = uuidv4(); // 生成唯一 ID
  subjects.value[newId] = {
    Name: "新科目",
    Initial: "新",
    TeacherName: "",
    IsOutDoor: false,
    AttachedObjects: {}, // 保留结构，但不可编辑
    IsActive: false // 默认非激活？根据实际情况定
  };
  markDirty();
};

// 删除科目
const removeSubject = (id) => {
  if (subjects.value[id]) {
    delete subjects.value[id];
    markDirty();
  }
};

// 监听传入的 configData 变化，更新本地 subjects ref
watch(() => props.configData, (newVal) => {
  // 深拷贝以避免直接修改 prop
  subjects.value = JSON.parse(JSON.stringify(newVal || {}));
}, { immediate: true, deep: true }); // 立即执行并深度监听

</script>