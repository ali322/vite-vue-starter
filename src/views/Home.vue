<template>
  <div class="container">
    <div class="px-6 py-4">
      <button class="btn" @click="createRoom">创建房间</button>
    </div>
    <h5 class="py-10 px-12 text-gray-600 text-lg">多人会议</h5>
    <div class="grid grid-cols-4 gap-4 px-8">
      <div v-for="r in rooms" class="px-4 py-10 bg-gray-200 rounded-lg shadow-xl">
        <p class="text-center text-gray-500 text-sm leading-10">{{ r.id }}</p>
        <div class="flex justify-center">
          <button class="btn btn-xs" @click="joinRoom(r.id)">进入</button>
          <button class="btn btn-xs btn-secondary ml-2" @click="joinRoomInRelay(r.id)">进入(relay)</button>
          <button class="btn btn-xs btn-secondary ml-2" @click="joinRoomInSelectable(r.id)">进入(selectable)</button>
        </div>
      </div>
    </div>
    <Toast ref="toastRef" />
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, Ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Toast.vue'
import { baseURL } from '@/config/index'
import useUserStore from '@/store/user'

const userStore = useUserStore()
const { id: userID, isLogin } = storeToRefs(userStore)

const toastRef = ref<InstanceType<typeof Toast>>()
const rooms = ref<Array<Record<string, any>>>([])
const router = useRouter()
const createRoom = async () => {
  if (!isLogin.value) {
    toastRef.value?.error('请先登录')
    return
  }
  // const randomID = Math.random().toString().slice(-6)
  let data = {
    "createdBy": userID.value
  }
  const ret = await fetch(`${baseURL}/room`, {method: 'POST', headers: {
      'Content-Type': 'application/json'
    }, body: JSON.stringify(data)})
  if (ret.status === 200) {
    let body = await ret.json()
    rooms.value = rooms.value.concat([body])
  }
}
const joinRoom = (id: string) => {
  if (!isLogin.value) {
    toastRef.value?.error('请先登录')
    return
  }
  router.push(`/meeting?id=${id}&node=${userID.value}`)
}
const joinRoomInRelay = (id: string) => {
  if (!isLogin.value) {
    toastRef.value?.error('请先登录')
    return
  }
  router.push(`/relay?id=${id}&node=${userID.value}`)
}
const joinRoomInSelectable = (id: string) => {
  if (!isLogin.value) {
    toastRef.value?.error('请先登录')
    return
  }
  router.push(`/selectable?id=${id}&node=${userID.value}`)
}
onMounted(async () => {
  const ret = await fetch(`${baseURL}/room`)
  if (ret.status === 200) {
    let body = await ret.json()
    console.log('body', body)
    // rooms.value = rooms.value.concat([body])
    rooms.value = body
  }
})
</script>