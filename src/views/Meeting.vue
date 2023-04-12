<template>
  <div class="container">
    <h5 class="text-lg flex text-gray-600 py-4">
        <div>当前房间<span class="ml-4 badge">{{ roomID }}</span></div>
        <div class="pl-4">当前节点<span class="ml-4 badge">{{ nodeID }}</span></div>
    </h5>
    <div>
      <div class="px-2 flex">
                <div class="w-72">
          <div class="flex items-center justify-between">
            <div class="pl-2 leading-10">本地媒体</div>
            <label for="local-media-record" class="btn btn-xs btn-outline text-sm">录制记录</label>
          </div>
          <video class="h-40 m-0 rounded-xl shadow-xl" autoplay ref="localRef"></video>
          <div class="flex items-center justify-center">
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
          <div class="flex items-center justify-center">
            <button class="btn btn-sm btn-secondary text-sm" @click="start">
              发布
            </button>
            <button class="btn btn-sm btn-primary text-sm ml-4" @click="recordMedia"
              :class="{ 'btn-accent': isMediaRecord }">{{
                isMediaRecord ? '停止' : '录制' }}</button>
          </div>
        </div>
        <div class="w-72 pl-4">
          <div class="flex items-center justify-between">
            <div class="pl-2 leading-10">本地屏幕</div>
            <label for="local-screen-record" class="btn btn-xs btn-outline text-sm">录制记录</label>
          </div>
          <video class="h-40 m-0 rounded-xl shadow-xl" autoplay ref="screenRef"></video>
          <div class="flex items-center justify-center">
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text pr-2 text-xs">视频</span>
                <input type="checkbox" class="toggle toggle-sm" v-model="isScreenVideoEnabled" />
              </label>
            </div>
          </div>
          <div class="flex items-center justify-center">
            <label for="my-modal" class="btn btn-sm text-sm ml-4" @click="share">投屏</label>
            <button class="btn btn-sm btn-primary text-sm ml-4" @click="recordScreen"
              :class="{ 'btn-accent': isScreenRecord }">{{
                isScreenRecord ? '停止' : '录制' }}</button>
          </div>
        </div>
        <div class="flex-1 flex">
          <div class="pl-4 flex flex-col">
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
          <div class="pl-4 flex flex-col">
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
          <div class="pl-8 flex flex-col">
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
            <RemoteVideo :streams="n.streams" :id="n.id" @refresh="bindStream"/>
          </div>
        </div>
      </div>
    </div>
        <div>
      <input type="checkbox" id="local-media-record" class="modal-toggle" />
      <label for="local-media-record" class="modal cursor-pointer">
        <label class="modal-box relative" for="">
          <h3 class="text-lg font-bold">本地媒体录制记录</h3>
          <div class="px-4" v-for="(v, i) in mediaRecords" :key="i">
            <div class="text-left">
              <span class="badge badge-secondary text-xs">{{ v.filename.join(',') }}</span>
              <p class="pl-2 text-xs">开始录制: {{ v.startedAt }}</p>
              <p class="pl-2 text-xs">结束录制: {{ v.finishedAt }}</p>
            </div>
          </div>
        </label>
      </label>
    </div>
    <div>
      <input type="checkbox" id="local-screen-record" class="modal-toggle" />
      <label for="local-screen-record" class="modal cursor-pointer">
        <label class="modal-box relative" for="">
          <h3 class="text-lg font-bold">本地屏幕录制记录</h3>
          <div class="px-4" v-for="(v, i) in mediaRecords" :key="i">
            <div class="text-left">
              <span class="badge badge-secondary text-xs">{{ v.filename }}</span>
              <p class="pl-2 text-xs">开始录制: {{ v.startedAt }}</p>
              <p class="pl-2 text-xs">结束录制: {{ v.finishedAt }}</p>
            </div>
          </div>
        </label>
      </label>
    </div>
    <Toast ref="toastRef" />
  </div>
</template>
<script lang="ts" setup>
import { ref, Ref, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import Toast from '@/components/Toast.vue'
import RemoteVideo from '@/components/RemoteVideo.vue'
import { Client, LocalStream, RemoteStream } from '../sdk'
import { IonSFUJSONRPCSignal } from '../sdk/signal/json-rpc'
import { wsURL, baseURL, relayURL } from '../config'

const toastRef = ref<InstanceType<typeof Toast>>()
const route = useRoute()
const localRef = ref()
const screenRef = ref()
const remoteRef = ref()
const isVideoEnabled = ref(true)
const isAudioEnabled = ref(true)
const isScreenVideoEnabled = ref(true)
const isRecord = ref(false)
const broadcastMsg = ref('')
const incomeMsg: Ref<Array<Record<string, string>>> = ref([])
const datachannelMsg = ref('')
const incomeData: Ref<Array<Record<string, string>>> = ref([])
const records: Ref<Array<Record<string, any>>> = ref([])
const isMediaRecord = ref(false)
const mediaRecords: Ref<Array<Record<string, any>>> = ref([])
const isScreenRecord = ref(false)
const screenRecords: Ref<Array<Record<string, any>>> = ref([])

let nodes: Ref<Record<string, Record<string, any>>> = ref({})
let remoteStreams: Record<string, RemoteStream> = {}
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
let recordMediaTask = ref('')
let recordScreenTask = ref('')
recordSig.onmessage = (evt: MessageEvent) => {
  const msg = JSON.parse(evt.data)
  if (!msg) {
    console.log('message parse failed')
    return
  }
  switch (msg.event) {
    case 'record_stoped':
      console.log('record stoped', msg.data)
      if(localMedia != null && msg.data['streamID'] === localMedia.id) {
        mediaRecords.value.push(msg.data)
      } else if(localScreen != null && msg.data['streamID'] === localScreen.id) {
        screenRecords.value.push(msg.data)
      }
      break
    case 'record_started':
      console.log('record started', msg.data)
      if (localMedia != null && msg.data['streamID'] === localMedia.id) {
        recordMediaTask.value = msg.data['taskID']
      } else if (localScreen != null && msg.data['streamID'] === localScreen.id) {
        recordScreenTask.value = msg.data['taskID']
      }
      break
  }
}

const recordMedia = () => {
  if (recordSig.readyState !== WebSocket.OPEN) {
    toastRef.value?.error('记录信令未开启')
    return
  }
  if (isMediaRecord.value) {
    recordSig.send(JSON.stringify({
      'event': 'stop_record', 'data': JSON.stringify({
        streamID: localMedia.id, taskID: recordMediaTask.value
      })
    }))
  } else {
    recordSig.send(JSON.stringify({
      'event': 'start_record', 'data': JSON.stringify({
        isVideoEnabled: true, isAudioEnabled: true,
        streamID: localMedia.id, 
      })
    }))
  }
  isMediaRecord.value = !isMediaRecord.value
}

const recordScreen = () => {
  if (recordSig.readyState !== WebSocket.OPEN) {
    toastRef.value?.error('记录信令未开启')
    return
  }
  if (isScreenRecord.value) {
    recordSig.send(JSON.stringify({
      'event': 'stop_record', 'data': JSON.stringify({
        streamID: localScreen.id, taskID: recordScreenTask.value
      })
    }))
  } else {
    recordSig.send(JSON.stringify({
      'event': 'start_record', 'data': JSON.stringify({
        isVideoEnabled: true, isAudioEnabled: false,
        streamID: localScreen.id, 
      })
    }))
  }
  isScreenRecord.value = !isScreenRecord.value
}

const bindStream = () => {
  Object.keys(remoteStreams).forEach((k: string) => {
    let el: HTMLVideoElement | null = document.getElementById(
      k
    ) as HTMLVideoElement
    if (el !== null) {
      el.srcObject = remoteStreams[k]
      el.autoplay = true
      el.controls = true
    }
  })
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
    let el: HTMLVideoElement | null = document.getElementById(
      id
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
          // if (streams[id]) {
          //   delete streams[id]
          // }
        } catch (err) { }
      }
    } else {
      remoteStreams[id] = stream
    }
  }


  clientLocal.ondatachannel = (evt) => {
    let receiveChannel = evt.channel
    // console.log('receive datachannel', receiveChannel)
    receiveChannel.onmessage = (evt) => {
      // console.log('receive dc message', evt.data)
      let msg = JSON.parse(evt.data)
      incomeData.value.push({
        node: msg.node,
        data: msg.data
      })
    }
    receiveChannel.onopen = (evt) => {
      console.log('receive channel open', receiveChannel.label, receiveChannel.readyState)
    }
    receiveChannel.onclose = (evt) => {
      console.log('receive channel close', receiveChannel.label, receiveChannel.readyState)
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
        nodes.value[node.id] = { id: node.id, streams: node.streams }
        node.streams.forEach((k: string, v: Record<string, any>) => {
          // streams[k] = node.id
        })
      }
      return
    case 'join':
      console.log('join', msg.data)
      nodes.value[msg.data.node] = { id: msg.data.node, streams: [] }
      return
    case 'leave':
      console.log('leave', msg.data)
      let leftNode = msg.data.node
      if (nodes.value[leftNode]) {
        delete nodes.value[leftNode]
      }
      return
    case 'publish':
      let publishNode = msg.data.node
      let streamID = msg.data.stream
      var streamList: any = nodes.value[publishNode].streams
      let index = streamList.findIndex((v: any)=>v.id === streamID)
      if (index === -1) {
        streamList = streamList.concat({id: streamID})
      }
      nodes.value[msg.data.node] = {id: publishNode, streams: streamList}
      return
    case 'broadcast':
      console.log('broadcast', msg.data)
      incomeMsg.value.push({
        node: msg.from,
        data: msg.data
      })
      return
  }
}

let localMedia: LocalStream
const start = async () => {
  const media = await LocalStream.getUserMedia({
    resolution: 'vga',
    codec: 'vp8',
    audio: true,
  })
  localMedia = media
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
    localMedia.unmute('video')
  } else {
    localMedia.mute('video')
  }
})
watch(isAudioEnabled, (isChecked: boolean) => {
  if (isChecked) {
    localMedia.unmute('audio')
  } else {
    localMedia.mute('audio')
  }
})

let localScreen: LocalStream
const share = async () => {
  const media = await LocalStream.getDisplayMedia({
    resolution: 'vga',
    codec: 'vp8',
    audio: true,
  })
  localScreen = media
  screenRef.value.srcObject = media
  screenRef.value.autoplay = true
  screenRef.value.controls = true
  screenRef.value.id = media.id
  screenRef.value.muted = true
  clientLocal.publish(media)
  // signalLocal.call('publish', { mid: media.id })
}

watch(isVideoEnabled, (isChecked: boolean) => {
  if (isChecked) {
    localScreen.unmute('video')
  } else {
    localScreen.mute('video')
  }
})
</script>
