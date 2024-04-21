import qs from 'qs';
import { ElMessage } from 'element-plus';

export function responseSuccessFunc(response) {
  const { data: resData } = response;

  let { code } = resData;

  if (code === 0) {
    return resData;
  } else {
    return Promise.reject(resData);
  }
}

export function responseFailFunc(responseError) {
  ElMessage({ type: 'error', message: responseError });
  return Promise.reject(responseError);
}

export function requestSuccessFunc(config) {
  const splitUrl = config.url.split('?');

  const configUrlParams = qs.parse(splitUrl.length && splitUrl[1]);

  config.url = `${splitUrl[0]}?${qs.stringify(configUrlParams)}`;

  return config;
}

export function requestFailFunc(requestError) {
  ElMessage({ type: 'error', message: requestError });
  return Promise.reject(requestError);
}
