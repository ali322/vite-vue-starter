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
                  <span class="badge badge-primary">{{ v.node }}</span>
                  <span class="pl-2">{{ v.data }}</span>
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
                  <span class="badge badge-primary">{{ v.node }}</span>
                  <span class="pl-2">{{ v.data }}</span>
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
            <video :id="n.nodeID" class="rounded-xl shadow-xl"></video>
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
import { ref, Ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Client, LocalStream } from '../sdk'
import { IonSFUJSONRPCSignal } from '../sdk/signal/json-rpc'
import { wsURL, baseURL } from '../config'
const route = useRoute()
const localRef = ref()
const remoteRef = ref()
const isVideoEnabled = ref(true)
const isAudioEnabled = ref(true)
const broadcastMsg = ref('')
const incomeMsgs: Ref<Array<Record<string, string>>> = ref([])
const datachannelMsg = ref('')
const incomeDatas: Ref<Array<Record<string, string>>> = ref([])

let nodes: Ref<Record<string, Record<string, any>>> = ref({})
let streams: Record<string, any> = {}
let roomID = route.query.id!.toString()
let nodeID = route.query.node!.toString()

let signalLocal: IonSFUJSONRPCSignal
let clientLocal: Client

onUnmounted(() => {
  clientLocal.close()
})
const mc = new WebSocket(`${wsURL}/message?room=${roomID}&node=${nodeID}`)
mc.onopen = () => {
  console.log('mc opend')
  signalLocal = new IonSFUJSONRPCSignal(`${wsURL}/meeting`)
  clientLocal = new Client(signalLocal)
  let localDataChannel: RTCDataChannel
  signalLocal.onopen = () => {
    clientLocal.join(roomID, nodeID)
    localDataChannel = clientLocal.createDataChannel(`${nodeID}-data`)
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

  const sendDataChannel = () => {
    localDataChannel.send(JSON.stringify({
      type: 'text',
      node: nodeID,
      data: datachannelMsg.value
    }))
  }

  clientLocal.ondatachannel = (evt) => {
    let receiveChannel = evt.channel
    // console.log('receive datachannel', receiveChannel)
    receiveChannel.onmessage = (evt) => {
      let msg = JSON.parse(evt.data)
      incomeDatas.value.push({
        node: msg.node,
        data: msg.data
      })
    }
    receiveChannel.onopen = (evt) => {
      // console.log('receive channel state', receiveChannel.readyState)
    }
    receiveChannel.onclose = (evt) => {
      console.log('receive channel state', receiveChannel.readyState)
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
  }
}
// signalLocal.on_notify('connected', (params: any) => {
//   console.log('connected params', params)
// })
// signalLocal.on_notify('join', (params: any) => {
//   console.log('join params', params)
// })
// signalLocal.on_notify('broadcast', (params: Record<string, any>) => {
//   incomeMsgs.value.push({
//     node: params.node,
//     data: params.message.data
//   })
// })
const broadcast = () => {
  // signalLocal.notify('broadcast', {
  //   type: 'test',
  //   data: broadcastMsg.value,
  // })
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
