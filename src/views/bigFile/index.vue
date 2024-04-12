<template>
  <div class="container">
    <div class="container-title">文件上传组件</div>
    <BigFile></BigFile>
  </div>
</template>

<script setup>
import BigFile from '../../components/big-file/index.vue';
</script>

<style lang="css">
.container {
  width: 800px;
}
.container-title {
  padding: 20px;
  font-weight: bold;
}
</style>
