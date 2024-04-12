<template>
  <input type="file" accept="*" :multiple="props.multiple" @change="chooseFileHandler" />
  <el-divider />
  <div class="file-container">
    <div class="file-item" v-for="(file, key) in fileList" :key="key">
      <el-icon :size="20">
        <Files />
      </el-icon>
      <div class="file-item-uploaded">
        <div>
          <p>{{ file.name }}</p>
        </div>
        <div class="file-item-operate">
          <!-- 上传按钮 -->
          <el-icon :size="24" v-if="!file.uploaded && !file.uploading"><UploadFilled /></el-icon>
          <!-- 暂停 -->
          <el-icon :size="24" v-else-if="!file.uploaded && file.uploading"><VideoPause /></el-icon>
          <template v-else>
            <!-- 上传成功 -->
            <el-icon :size="24"><SuccessFilled /></el-icon>
            <!-- 删除 -->
            <el-icon :size="24"><Delete /></el-icon>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="js" setup>
import { ref, inject } from 'vue';

const $message = inject('$message');

const fileList = ref([]);

const props = defineProps({
  maxNumber: {
    type: Number,
    default: 5
  },
  multiple: {
    type: Boolean,
    default: false
  }
});

const chooseFileHandler = e => {
  const fileValue = fileList.value || [];

  const files = e.target.files;

  if (fileValue.length + files.length > props.maxNumber) {
    $message.error('超出上传数量限制');
    return;
  }

  fileValue.push(...files);
  console.error('==fileValue', fileValue);
};
</script>
<style lang="css">
.ml-3 {
  margin-left: 0.75rem;
}
.file-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
}
.file-item:hover {
  background: #f9fafd;
}
.file-item-uploaded {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 0 10px;
}
.file-item-operate > i {
  margin: 0 5px;
}
</style>
