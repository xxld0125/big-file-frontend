import { createRouter, createWebHashHistory } from 'vue-router';
import bigFile from '../views/bigFile/index.vue';

const routes = [{ path: '/big-file', component: bigFile }];

export default createRouter({
  history: createWebHashHistory(),
  routes // `routes: routes` 的缩写
});
