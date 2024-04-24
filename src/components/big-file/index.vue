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
          <p>{{ getFileName(file) }}</p>
          <el-progress
            v-if="!file.uploaded && (file.uploading || (!file.uploading && file.isPause))"
            :percentage="file.uploadPercentage"
            :format="format"
          />
        </div>
        <div class="file-item-operate">
          <!-- 上传按钮 -->
          <el-icon :size="24" v-if="!file.uploaded && !file.uploading && !file.isPause" @click="uploadFile(file)"
            ><UploadFilled
          /></el-icon>
          <!-- 继续上传 -->
          <el-icon v-else-if="!file.uploaded && !file.uploading && file.isPause" size="24" @click="continueUpload(file)"
            ><VideoPlay
          /></el-icon>
          <!-- 暂停上传 -->
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
import { inject, reactive, onMounted } from 'vue';
import { splitFileChunk, calFileHash, concurrentProcess } from '../../utils/file';
import { findFile, saveChunk, merge } from '@/api';
import IndexedDBService from '@/service/IndexedDBService';

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

// 上传进度格式化
const format = percentage => (percentage === 100 ? 'Full' : `${percentage}%`);

const STORE_NAME = 'filePieceStore';
const HASH_INDEX = 'hashIndex';

let bigFileIndexedDB;

// 初始化indexedDB
onMounted(async () => {
  // 初始化indexedDB
  bigFileIndexedDB = new IndexedDBService('bigFileDatabase', 1);

  // 初始化indexedDB 存储
  await bigFileIndexedDB.openDB({
    [STORE_NAME]: {
      indexList: [HASH_INDEX]
    }
  });

  // 渲染所有上传中的上传任务

  // 获取所有本地存储分片
  const res = await bigFileIndexedDB.getAllItems(STORE_NAME);

  // 将分片信息进行分组
  const fileGroup = res.reduce((groups, item) => {
    const hash = item.hash;
    if (!groups[hash]) {
      groups[hash] = [];
    }
    groups[hash].push(item);
    return groups;
  }, {});

  // 渲染上传中文件
  Object.keys(fileGroup).forEach(hash => {
    const pieceList = fileGroup[hash];
    const uploadedCount = pieceList.filter(p => p.uploaded).length;
    const uploadPercentage = (uploadedCount / pieceList.length).toFixed(2) * 100;
    fileList.push({
      file: pieceList.map(p => p.chunk),
      hash,
      uploaded: false,
      uploading: false,
      isPause: true,
      uploadPercentage,
      name: pieceList.find(v => v.name).name || ''
    });
  });
});

const getFileName = file => {
  return file.file instanceof File ? file.file.name : file.name;
};

const chooseFileHandler = e => {
  const files = e.target.files;

  if (fileList.length + files.length > props.maxNumber) {
    $message.error('超出上传数量限制');
    return;
  }

  fileList.push(
    ...Array.from(files, file =>
      reactive({
        file: file,
        uploaded: false,
        uploading: false,
        isPause: false,
        uploadPercentage: 0
      })
    )
  );
};

const doneHandler = async (file, hash) => {
  // 切换上传状态
  file.uploaded = true;
  file.uploading = false;
  file.uploadPercentage = 100;

  // 通知服务端合并文件
  await merge({ hash });

  // 删除本地储存
  bigFileIndexedDB.batchDelItem(STORE_NAME, 'hash', hash);
};

const continueUpload = async file => {
  file.uploading = true;
  file.isPause = false;

  const fileChunkList = file.file;
  const hash = file.hash;

  const onProgress = progress => {
    file.uploadPercentage = progress;
  };

  const doneHandlerFn = () => {
    doneHandler(file, hash);
  };

  // 4.并发上传文件分片
  await saveChunks(fileChunkList, hash, doneHandlerFn, onProgress);
};

// 上传文件
const uploadFile = async file => {
  file.uploaded = false;
  file.uploading = true;
  file.isPause = false;
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

  // 4.本地存储文件的所有切片
  const { name, size, type } = file.file;
  const storeFileChunkList = fileChunkList.map((chunk, i) => ({
    chunk: chunk,
    hash,
    index: i,
    [HASH_INDEX]: `${hash}_${i}`,
    name: name,
    size: size,
    type: type
  }));
  await bigFileIndexedDB.batchUpdateItem(STORE_NAME, storeFileChunkList);

  // 5.上传结束后通知服务端合并文件
  const doneHandlerFn = () => {
    doneHandler(file, hash);
  };

  const onProgress = progress => {
    file.uploadPercentage = progress;
  };

  // 4.并发上传文件分片
  await saveChunks(fileChunkList, hash, doneHandlerFn, onProgress);
};

// 保存文件
async function saveChunks(pieces, hash, doneHandler, onProgress) {
  const tasks = pieces.map((piece, i) => {
    return async () => {
      const { data: isExist } = await findFile({ hash, index: i });
      if (!isExist) {
        const formData = new FormData();
        formData.append('hash', hash);
        formData.append('index', i);
        formData.append('chunk', piece);
        await saveChunk(formData);

        // 上传完切片后, 本地存储记录该切片已完成上传
        const pieceStorageObj = await bigFileIndexedDB.getItemByIndex(STORE_NAME, HASH_INDEX, `${hash}_${i}`);
        await bigFileIndexedDB.updateItem(STORE_NAME, { ...pieceStorageObj, uploaded: true });
      }
    };
  });
  try {
    await concurrentProcess(tasks, 5, doneHandler, onProgress);
  } catch (error) {
    console.error(error);
  }
}

// TODO:暂停上传
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
