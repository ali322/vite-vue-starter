<template>
  <div class="container">
    <h5 class="text-lg text-gray-600 py-4">
      当前房间<span class="ml-4 badge badge-secondary">{{ roomID }}</span>
    </h5>
    <div>
      <div class="px-2 flex">
        <div class="w-72">
          <p class="pl-2 leading-10">本地节点</p>
          <video class="h-40 m-0 rounded-xl shadow-xl" autoplay ref="localRef"></video>
          <div class="flex items-center">
            <p class="leading-10 py-4 flex-1">
              节点 <span class="badge">{{ nodeID }}</span>
            </p>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text pr-2 text-xs">视频</span>
                <input type="checkbox" class="toggle toggle-sm" v-model="isVideoEnabled" />
              </label>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text pr-2 text-xs">音频</span>
                <input type="checkbox" class="toggle toggle-sm" v-model="isAudioEnabled" />
              </label>
            </div>
          </div>
          <div class="flex items-center">
            <button class="btn btn-sm btn-secondary text-sm" @click="start">
              发布
            </button>
            <button class="btn btn-sm btn-primary text-sm ml-4" @click="record"
              :class="{ 'btn-accent': isRecord }">{{ isRecord?'停止': '录制' }}</button>
          </div>
        </div>
        <div class="flex-1 flex">
          <div class="pl-8 flex flex-col">
            <div class="h-60 overflow-y-auto bg-slate-100 rounded-xl mb-4">
              <div class="px-4 pt-2" v-for="(v, i) in incomeMsg" :key="i">
                <div>
                  <span class="badge badge-secondary">{{ v.node }}</span>
                  <span class="pl-2">{{ v.data }}</span>
                </div>
              </div>
            </div>
            <div class="form-control">
              <div class="input-group input-group-sm">
                <input type="text" placeholder="广播消息" class="input input-bordered" v-model="broadcastMsg" />
                <span class="cursor-pointer text-sm" @click="broadcast">发消息</span>
              </div>
            </div>
          </div>
          <div class="pl-8 flex flex-col">
            <div class="h-60 overflow-y-auto bg-slate-100 rounded-xl mb-4">
              <div class="px-4 pt-2" v-for="(v, i) in incomeData" :key="i">
                <div>
                  <span class="badge badge-secondary">{{ v.node }}</span>
                  <span class="pl-2">{{ v.data }}</span>
                </div>
              </div>
            </div>
            <div class="form-control">
              <div class="input-group input-group-sm">
                <input type="text" placeholder="数据频道消息" class="input input-bordered" v-model="datachannelMsg" />
                <span class="cursor-pointer text-sm" @click="sendDataChannel">发数据</span>
              </div>
            </div>
          </div>
          <div class="pl-4 flex flex-col">
            <div class="h-80 overflow-y-auto mb-4">
              <div class="px-4 pt-2" v-for="(v, i) in records" :key="i">
                <div>
                  <span class="badge badge-secondary">{{ v.filename }}</span>
                    <p class="pl-2 text-xs">开始录制: {{ v.startedAt }}</p>
                    <p class="pl-2 text-xs">结束录制: {{ v.finishedAt }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="px-2 pb-4">
        <p class="leading-10 pb-2">远程节点</p>
        <div class="grid grid-cols-4 gap-4" ref="remoteRef">
          <div v-for="(n, i) in nodes" :key="i">
            <video :id="n.nodeID" class="rounded-xl shadow-xl"></video>
            <p class="leding-10 pt-4">
              节点<span class="badge ml-2">{{ n.nodeID }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <Toast ref="toastRef" />
  </div>
</template>
<script lang="ts" setup>
import { ref, Ref, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import Toast from '@/components/Toast.vue'
import { Client, LocalStream } from '../sdk'
import { IonSFUJSONRPCSignal } from '../sdk/signal/json-rpc'
import { wsURL, baseURL, relayURL } from '../config'

const toastRef = ref<InstanceType<typeof Toast>>()
const route = useRoute()
const localRef = ref()
const remoteRef = ref()
const isVideoEnabled = ref(true)
const isAudioEnabled = ref(true)
const isRecord = ref(false)
const broadcastMsg = ref('')
const incomeMsg: Ref<Array<Record<string, string>>> = ref([])
const datachannelMsg = ref('')
const incomeData: Ref<Array<Record<string, string>>> = ref([])
const records: Ref<Array<Record<string, any>>> = ref([])

let nodes: Ref<Record<string, Record<string, any>>> = ref({})
let streams: Record<string, any> = {}
let roomID = route.query.id!.toString()
let nodeID = route.query.node!.toString()

let signalLocal: IonSFUJSONRPCSignal
let clientLocal: Client
let localDC: RTCDataChannel

const sendDataChannel = () => {
  localDC.send(JSON.stringify({
    type: 'text',
    node: nodeID,
    data: datachannelMsg.value
  }))
  toastRef.value?.show("发布数据广播成功", () => {
    datachannelMsg.value = ''
  })
}

const broadcast = () => {
  mc.send(JSON.stringify({
    "event": "broadcast",
    "data": broadcastMsg.value
  }))
  toastRef.value?.show("发布消息广播成功", () => {
    broadcastMsg.value = ''
  })
}

let recordSig: WebSocket = new WebSocket(`${relayURL}/record?room=${roomID}&node=${nodeID}`)
recordSig.onmessage = (evt: MessageEvent) => {
  const msg = JSON.parse(evt.data)
  if (!msg) {
    console.log('message parse failed')
    return
  }
  switch(msg.event) {
    case 'record_stoped':
      console.log('record stoped', msg.data)
      records.value.push(msg.data)
  }
}

const record = () => {
  if (recordSig.readyState !== WebSocket.OPEN) {
    toastRef.value?.error('记录信令未开启')
    return
  }
  if (isRecord.value) {
    recordSig.send(JSON.stringify({ 'event': 'stop_record' }))
  } else {
    recordSig.send(JSON.stringify({ 'event': 'record' }))
  }
  isRecord.value = !isRecord.value
}

onUnmounted(() => {
  clientLocal.close()
})
const mc = new WebSocket(`${wsURL}/message?room=${roomID}&node=${nodeID}`)
mc.onopen = () => {
  console.log('mc opend')
  signalLocal = new IonSFUJSONRPCSignal(`${wsURL}/meeting`)
  clientLocal = new Client(signalLocal)
  signalLocal.onopen = () => {
    clientLocal.join(roomID, nodeID)
    localDC = clientLocal.createDataChannel(`${nodeID}-dc`)
  }
  clientLocal.ontrack = async (track, stream) => {
    console.log('got track', track.id, 'for stream', stream.id)
    const id = stream.id
    const nodeID = streams[id]
    // mc.send(JSON.stringify({"event": 'publish'}))
    // let ret = await axios.get(`${baseURL}/room/${roomID}`)
    // if (ret.status === 200) {
    //   console.log('data', ret.data)
    //   // rooms.value = body.data
    // }
    // mc.send(JSON.stringify({"event":"nodes"}))
    // let remotes: Record<string, any> = await signalLocal.call('remotes', null)
    // console.log('remotes', remotes)
    let el: HTMLVideoElement | null = document.getElementById(
      nodeID
    ) as HTMLVideoElement
    if (el !== null) {
      el.srcObject = stream
      el.autoplay = true
      el.controls = true
      track.onunmute = (evt) => {
        console.log('onunmute evt', evt)
        el!.muted = false
        el!.play()
      }
      track.onmute = (evt) => {
        console.log('onmute evt', evt)
        el!.muted = true
        el!.pause()
      }
      stream.onremovetrack = () => {
        try {
          // console.log('remove track', nodeID, id)
          if (nodes.value[nodeID]) {
            delete nodes.value[nodeID]
          }
          if (streams[id]) {
            delete streams[id]
          }
        } catch (err) { }
      }
    }
  }


  clientLocal.ondatachannel = (evt) => {
    let receiveChannel = evt.channel
    console.log('receive datachannel', receiveChannel)
    receiveChannel.onmessage = (evt) => {
      console.log('receive dc message', evt.data)
      let msg = JSON.parse(evt.data)
      incomeData.value.push({
        node: msg.node,
        data: msg.data
      })
    }
    receiveChannel.onopen = (evt) => {
      console.log('receive channel open', receiveChannel.readyState)
    }
    receiveChannel.onclose = (evt) => {
      console.log('receive channel close', receiveChannel.readyState)
    }
  }
}
mc.onclose = () => {
  console.log('mc closed')
}
mc.onerror = (evt: any) => {
  console.error('mc error', evt.data)
}
mc.onmessage = async (evt: MessageEvent) => {
  const msg = JSON.parse(evt.data)
  if (!msg) {
    console.log('message parse failed')
    return
  }
  switch (msg.event) {
    case 'connected':
      console.log('connected', msg.data)
      for (let node of msg.data.nodes) {
        nodes.value[node.id] = { nodeID: node.id }
        streams[node.streamID] = node.id
      }
      return
    case 'join':
      console.log('join', msg.data)
      nodes.value[msg.data.node] = { nodeID: msg.data.node }
      return
    case 'leave':
      console.log('leave', msg.data)
      let leftNode = msg.data.node
      if (nodes.value[leftNode]) {
        delete nodes.value[leftNode]
      }
      return
    case 'publish':
      console.log('publish', msg.data, streams)
      let publishNode = msg.data.node
      let streamID = msg.data.stream
      streams[streamID] = publishNode
      return
    case 'broadcast':
      console.log('broadcast', msg.data)
      incomeMsg.value.push({
        node: msg.from,
        data: msg.data
      })
  }
}

let localStream: LocalStream
const start = async () => {
  const media = await LocalStream.getUserMedia({
    resolution: 'vga',
    codec: 'vp8',
    audio: true,
  })
  localStream = media
  localRef.value.srcObject = media
  localRef.value.autoplay = true
  localRef.value.controls = true
  localRef.value.id = media.id
  localRef.value.muted = true
  clientLocal.publish(media)
  // signalLocal.call('publish', { mid: media.id })
}
watch(isVideoEnabled, (isChecked: boolean) => {
  if (isChecked) {
    localStream.unmute('video')
  } else {
    localStream.mute('video')
  }
})
watch(isAudioEnabled, (isChecked: boolean) => {
  if (isChecked) {
    localStream.unmute('audio')
  } else {
    localStream.mute('audio')
  }
})
</script>
