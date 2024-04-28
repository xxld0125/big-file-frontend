import { $GET, $POST } from '../config/axios';

export const findFile = params => {
  return $GET('file-piece/check', params);
};

export const saveChunk = (params, config) => {
  return $POST('file-piece/save-chunk', params, config);
};

export const mergeChunk = params => {
  return $GET('file-piece/merge', params);
};

export const deleteChunk = params => {
  return $GET('file-piece/delete', params);
};
