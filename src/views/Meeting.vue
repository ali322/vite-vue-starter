<template>
  <div class="container">
    <h5 class="text-lg text-gray-600 py-4">
      当前房间<span class="ml-4 badge badge-primary">{{ roomID }}</span>
    </h5>
    <div>
      <div class="px-2 flex">
        <div class="w-72">
          <p class="pl-2 leading-10">本地节点</p>
          <video class="h-40 m-0 rounded-xl shadow-xl" autoplay ref="localRef"></video>
          <p class="leading-10 py-4">
            节点 <span class="badge">{{ nodeID }}</span>
          </p>
          <div class="flex items-center">
            <button class="btn btn-sm btn-primary text-sm" @click="start">
              发布
            </button>
            <div class="form-control pl-4">
              <label class="label cursor-pointer">
                <span class="label-text pr-2">视频</span>
                <input type="checkbox" class="toggle toggle-sm" v-model="isVideoEnabled" />
              </label>
            </div>
            <div class="form-control pl-4">
              <label class="label cursor-pointer">
                <span class="label-text pr-2">音频</span>
                <input type="checkbox" class="toggle toggle-sm" v-model="isAudioEnabled" />
              </label>
            </div>
          </div>
        </div>
        <div class="flex-1 flex">
          <div class="px-8 flex flex-col">
            <div class="h-60 overflow-y-auto bg-slate-100 rounded-xl mb-4">
                <div class="px-4 pt-2" v-for="(v, i) in incomeMsgs" :key="i">
                  <div>
                    <span class="badge badge-primary">{{v.node}}</span>
                    <span class="pl-2">{{v.data}}</span>
                  </div>
                </div>
            </div>
            <div class="form-control">
              <div class="input-group input-group-sm">
                <input type="text" placeholder="广播消息" class="input input-bordered" v-model="broadcastMsg" />
                <span class="cursor-pointer" @click="broadcast">发送</span>
              </div>
            </div>
          </div>
          <div class="px-8 flex flex-col">
            <div class="h-60 overflow-y-auto bg-slate-100 rounded-xl mb-4">
              <div class="px-4 pt-2" v-for="(v, i) in incomeDatas" :key="i">
                <div>
                  <span class="badge badge-primary">{{v.node}}</span>
                  <span class="pl-2">{{v.data}}</span>
                </div>
              </div>
            </div>
            <div class="form-control">
              <div class="input-group input-group-sm">
                <input type="text" placeholder="数据频道消息" class="input input-bordered" v-model="datachannelMsg" />
                <span class="cursor-pointer" @click="sendDataChannel">发送</span>
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
            <video :id="i" class="rounded-xl shadow-xl"></video>
            <p class="leding-10 pt-4">
              节点<span class="badge ml-2">{{ n.nodeID }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, Ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Client, LocalStream } from '../sdk'
import { IonSFUJSONRPCSignal } from '../sdk/signal/json-rpc'
import { wsURL } from '../config'
const route = useRoute()
const localRef = ref()
const remoteRef = ref()
const isVideoEnabled = ref(true)
const isAudioEnabled = ref(true)
const broadcastMsg = ref('')
const incomeMsgs:Ref<Array<Record<string, string>>> = ref([])
const datachannelMsg = ref('')
const incomeDatas:Ref<Array<Record<string, string>>> = ref([])

let nodes: Ref<Record<string, Record<string, any>>> = ref({})
let roomID = route.query.id!.toString()
let nodeID = route.query.node!.toString()

const signalLocal = new IonSFUJSONRPCSignal(`${wsURL}/meeting`)
const clientLocal = new Client(signalLocal)
let localDataChannel: RTCDataChannel
signalLocal.onopen = () => {
  clientLocal.join(roomID, nodeID)
  localDataChannel = clientLocal.createDataChannel(`${nodeID}-data`)
}
signalLocal.on_notify('connected', (params: any) => {
  console.log('connected params', params)
})
signalLocal.on_notify('join', (params: any) => {
  console.log('join params', params)
})
signalLocal.on_notify('broadcast', (params: Record<string, any>) => {
  incomeMsgs.value.push({
    node: params.node,
    data: params.message.data
  })
})
const broadcast = () => {
  signalLocal.notify('broadcast', {
    type: 'test',
    data: broadcastMsg.value,
  })
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
  signalLocal.call('publish', { mid: media.id })
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

clientLocal.ontrack = async (track, stream) => {
  console.log('got track', track.id, 'for stream', stream.id)
  const id = stream.id
  let remotes: Record<string, any> = await signalLocal.call('remotes', null)
  if (!nodes.value[id]) {
    nodes.value[id] = { nodeID: remotes[id], streamID: id }
  }
  let el: HTMLVideoElement | null = document.getElementById(
    id
  ) as HTMLVideoElement
  if (el !== null) {
    el.srcObject = stream
    el.autoplay = true
    el.controls = true
  }
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
      if (nodes.value[id]) {
        delete nodes.value[id]
      }
    } catch (err) { }
  }
}

const sendDataChannel = () => {
  localDataChannel.send(JSON.stringify({
    type: 'text',
    node: nodeID,
    data: datachannelMsg.value
  }))
}

clientLocal.ondatachannel = (evt) => {
  let receiveChannel = evt.channel
  console.log('receive datachannel', receiveChannel)
  receiveChannel.onmessage = (evt) => {
      let msg = JSON.parse(evt.data)
      incomeDatas.value.push({
        node: msg.node,
        data: msg.data
      })
  }
  receiveChannel.onopen = (evt) => {
    console.log('receive channel state', receiveChannel.readyState)
  }
  receiveChannel.onclose = (evt) => {
    console.log('receive channel state', receiveChannel.readyState)
  }
}
</script>
