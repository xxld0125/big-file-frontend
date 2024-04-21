import Axios from 'axios';
import { requestSuccessFunc, requestFailFunc, responseSuccessFunc, responseFailFunc } from './requestResponse';

const axiosInstance = Axios.create({
  timeout: 30000
});

axiosInstance.interceptors.request.use(requestSuccessFunc, requestFailFunc);

axiosInstance.interceptors.response.use(responseSuccessFunc, responseFailFunc);

const domain = 'http://localhost:3000';

export function $GET(url, params = {}, config = {}) {
  let promise = Promise.resolve();
  return promise.then(() => {
    url = `${domain}/${url}`;
    return axiosInstance.get(url, { params, config });
  });
}

export function $POST(url, data = {}, config = {}) {
  let promise = Promise.resolve();

  url = `${domain}/${url}`;

  return promise.then(() => {
    return axiosInstance.post(url, data, config);
  });
}
