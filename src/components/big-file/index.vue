<template>
  <input class="file" type="file" accept="*" :multiple="props.multiple" @change="chooseFileHandler" />
  <el-divider />
  <div class="file-container">
    <div class="file-item" v-for="(file, key) in fileList" :key="key">
      <el-icon :size="20">
        <Files />
      </el-icon>
      <div class="file-item-uploaded">
        <div class="file-item-content">
          <p>{{ file.file.name }}</p>
          <el-progress v-if="!file.uploaded && file.uploading" :percentage="file.uploadPercentage" :format="format" />
        </div>
        <div class="file-item-operate">
          <!-- 上传按钮 -->
          <el-icon :size="24" v-if="!file.uploaded && !file.uploading" @click="uploadFile(file)"
            ><UploadFilled
          /></el-icon>
          <!-- 暂停 -->

          <el-icon v-else-if="!file.uploaded && file.uploading" :size="24" @click="pauseUpload"><VideoPause /></el-icon>

          <template v-else>
            <!-- 上传成功 -->
            <el-icon :size="24"><SuccessFilled style="color: #67c23a" /></el-icon>
            <!-- 删除 -->
            <el-icon :size="24" @click="deleteFile(key)"><Delete /></el-icon>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="js" setup>
import { inject, reactive } from 'vue';
import { splitFileChunk, calFileHash, concurrentProcess } from '../../utils/file';
import { findFile, saveChunk, merge } from '@/api';

const format = percentage => (percentage === 100 ? 'Full' : `${percentage}%`);

const $message = inject('$message');

const fileList = reactive([]);

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
  const files = e.target.files;

  if (fileList.length + files.length > props.maxNumber) {
    $message.error('超出上传数量限制');
    return;
  }

  fileList.push(
    ...Array.from(files, file =>
      reactive({
        file: file
      })
    )
  );
};

// 上传文件
const uploadFile = async file => {
  file.uploaded = false;
  file.uploading = true;
  file.uploadPercentage = 0;

  // 1.对文件进行切片
  const fileChunkList = splitFileChunk(file.file);

  // 2.计算文件hash
  const hash = await calFileHash(fileChunkList);

  // 3.查询文件是否已经上传
  const { data: isExist } = await findFile({
    hash
  });

  if (isExist) {
    file.uploaded = true;
    file.uploading = false;
    file.uploadPercentage = 100;

    return;
  }

  // 5.上传结束后通知服务端合并文件
  const doneHandler = async () => {
    await merge({ hash });
    file.uploaded = true;
    file.uploading = false;
    file.uploadPercentage = 100;
  };

  const onProgress = progress => {
    file.uploadPercentage = progress;
  };

  // 4.并发上传文件分片
  await saveChunks(fileChunkList, hash, doneHandler, onProgress);
};

async function saveChunks(pieces, hash, doneHandler, onProgress) {
  const tasks = pieces.map((piece, i) => {
    return async () => {
      const { exists } = await findFile({ hash, index: i });
      if (!exists) {
        const formData = new FormData();
        formData.append('hash', hash);
        formData.append('index', i);
        formData.append('chunk', piece);
        return await saveChunk(formData);
      }
    };
  });
  await concurrentProcess(tasks, 5, doneHandler, onProgress);
}

// 暂停上传
const pauseUpload = () => {};

// 删除文件
const deleteFile = index => {
  fileList.splice(index, 1);
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
  align-items: center;
  width: 100%;
  margin: 0 10px;
}
.file-item-operate {
  width: 80px;
}
.file-item-operate > i {
  margin: 0 5px;
}

.file {
  width: 70px;
}

.file-item-content {
  width: 100%;
}
</style>
