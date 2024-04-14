import SparkMD5 from 'spark-md5';
import { CHUNK_SIZE } from '@/CONST/file';

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
