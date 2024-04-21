import SparkMD5 from 'spark-md5';
import { CHUNK_SIZE } from '@/const/file';

export const splitFileChunk = (file, chunkSize = CHUNK_SIZE) => {
  const fileChunkList = [];
  let cur = 0;

  while (cur < file.size) {
    const fileChunk = file.slice(cur, cur + chunkSize);
    fileChunkList.push(fileChunk);
    cur += chunkSize;
  }

  return fileChunkList;
};

const readFile = async fileChunk => {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = function (event) {
      // 获取文件的ArrayBuffer
      const arrayBuffer = event.target?.result;
      if (arrayBuffer) {
        resolve(arrayBuffer);
      }
    };

    // 读取文件并将其转换为ArrayBuffer
    reader.readAsArrayBuffer(fileChunk);
  });
};

export const calFileHash = async fileChunkList => {
  const spark = new SparkMD5.ArrayBuffer();

  for (const chunk of fileChunkList) {
    const res = await readFile(chunk);
    spark.append(res);
  }

  return spark.end();
};

// 并发任务
export const concurrentProcess = async (tasks, parallelSize = 3, doneHandler) => {
  const taskLen = tasks.length;

  if (tasks.length === 0) {
    doneHandler();
    return;
  }

  const failList = []; // 失败任务队列
  let finish = 0; // 已完成任务数量
  let running = 0; // 正在处理的任务数量

  // eslint-disable-next-line no-unused-vars
  const runNext = async () => {
    if (finish === taskLen && running === 0) {
      if (failList.length > 0) {
        await concurrentProcess(failList, parallelSize, doneHandler);
      } else {
        doneHandler();
        return;
      }
    }

    while (running < parallelSize && tasks.length > 0) {
      const task = tasks.shift();
      running++;

      try {
        await task();
        finish++;
      } catch (error) {
        failList.push(task);
      } finally {
        running--;
        runNext();
      }
    }
  };

  runNext();
};
