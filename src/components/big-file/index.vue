<template>
  <input class="file" type="file" accept="*" :multiple="props.multiple" @change="chooseFileHandler" />
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
          <el-icon :size="24" v-if="!file.uploaded && !file.uploading" @click="uploadFile(file)"
            ><UploadFilled
          /></el-icon>
          <!-- 暂停 -->
          <el-icon :size="24" v-else-if="!file.uploaded && file.uploading" @click="pauseUpload"><VideoPause /></el-icon>
          <template v-else>
            <!-- 上传成功 -->
            <el-icon :size="24"><SuccessFilled /></el-icon>
            <!-- 删除 -->
            <el-icon :size="24" @click="deleteFile"><Delete /></el-icon>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="js" setup>
import { ref, inject } from 'vue';
import { splitFileChunk, calFileHash } from '../../utils/file';

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

// 上传文件
const uploadFile = async file => {
  console.log('start upload file', file);

  // 1.对文件进行切片
  const fileChunkList = splitFileChunk(file);
  console.log(fileChunkList);

  // 2.计算文件hash
  const hash = await calFileHash(fileChunkList);
  console.log(hash);

  // TODO: 3.查询文件是否已经上传

  // TODO: 4.并发上传文件分片

  // TODO: 5.上传结束后通知服务端合并文件
};

// 暂停上传
const pauseUpload = () => {};

// 删除文件
const deleteFile = () => {};
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

.file {
  width: 70px;
}
</style>
