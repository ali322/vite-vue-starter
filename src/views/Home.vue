<template>
  <div class="container">
    <div class="px-6 py-4">
      <button class="btn" @click="createRoom">创建房间</button>
    </div>
    <h5 class="py-10 px-12 text-gray-600 text-lg">多人会议</h5>
    <div class="grid grid-cols-6 gap-4 px-8">
      <div v-for="r in rooms" class="px-4 py-10 bg-gray-200 rounded-lg shadow-xl">
        <p class="text-center text-gray-500 text-sm leading-10">{{r}}</p>
        <div class="flex justify-center">
          <button class="btn btn-xs" @click="joinRoom(r)">进入</button>
          <button class="btn btn-xs btn-secondary ml-2" @click="joinRoomInRelay(r)">进入(relay)</button>
        </div>
      </div>
    </div>
    <Toast ref="toastRef" />
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, Ref } from 'vue'
import Toast from '@/components/Toast.vue'
import { baseURL } from '@/config/index'
import { useRouter } from 'vue-router'
import { generateUUID } from '@/util/index'
import axios from 'axios'
const toastRef = ref<InstanceType<typeof Toast>>()
const rooms = ref<Array<string>>([])
const router = useRouter()
const createRoom = async () => {
  const randomID = Math.random().toString().slice(-6)
  const nodeID = generateUUID()
  let data = {
    "createdBy": 'aa'
  }
  let ret = await axios.post(`${baseURL}/room`, JSON.stringify(data))
  // const ret = await fetch(`${baseURL}/room`, {method: 'POST', headers: {
  //     'Content-Type': 'application/json'
  //   }, body: JSON.stringify(data)})
  if (ret.status === 200) {
    let body = await ret.data
    rooms.value = rooms.value.concat([body.id])
  }
}
const joinRoom = (id: string) => {
  const nodeID = generateUUID()
  router.push(`/meeting?id=${id}&node=${nodeID}`)
}
const joinRoomInRelay = (id: string) => {
  const nodeID = generateUUID()
  router.push(`/relay?id=${id}&node=${nodeID}`)
}
onMounted(async () => {
  const ret = await fetch(`${baseURL}/room`)
  if (ret.status === 200) {
    let body = await ret.json()
    rooms.value = body.data
  }
})
</script>