<template>
  <div class="container">
    <h5 class="text-lg text-gray-600 py-4">
      当前房间<span class="ml-4 badge badge-secondary">{{ roomID }}</span> (Relay)
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
            <button class="btn btn-sm btn-secondary text-sm" @click="publish">
              发布
            </button>
            <button class="btn btn-sm btn-primary text-sm ml-4" @click="record" :class="{'btn-accent': isRecord}">{{isRecord?'停止':'录制'}}</button>
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
                <span class="cursor-pointer" @click="broadcast">发送消息</span>
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
                <span class="cursor-pointer" @click="sendDataChannel">发送数据</span>
              </div>
            </div>
          </div>
          <div class="pl-4 flex flex-col">
            <div class="form-control">
              <div class="input-group input-group-sm">
                <input type="text" placeholder="流id" class="input input-bordered" v-model="focus" />
                <span class="cursor-pointer" @click="setFocus">关注</span>
              </div>
            </div>
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
        <div class="flex items-center">
          <p class="leading-10 pb-2">远程节点</p>
          <div id="remote-audio"></div>
        </div>
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
import { ref, onUnmounted, Ref, watch } from 'vue'
import Toast from '../components/Toast.vue'
import { useRoute } from 'vue-router'
import { relayURL, wsURL } from '../config'

const remoteRef = ref()
const localRef = ref()
const toastRef = ref<InstanceType<typeof Toast>>()
const route = useRoute()
let err: Ref<string> = ref('')
let nodes: Ref<Record<string, Record<string, any>>> = ref({})
let streams: Record<string, any> = {}
const isVideoEnabled = ref(true)
const isAudioEnabled = ref(true)
const isRecord = ref(false)
const focus = ref('')
const broadcastMsg = ref('')
const incomeMsg: Ref<Array<Record<string, string>>> = ref([])
const datachannelMsg = ref('')
const incomeData: Ref<Array<Record<string, string>>> = ref([])
const records: Ref<Array<Record<string, any>>> = ref([])

let roomID = route.query.id!.toString()
let nodeID = route.query.node!.toString()
let ws: WebSocket
let mc: WebSocket
let localDC: RTCDataChannel
let pc: RTCPeerConnection
let localStream: MediaStream

watch(isVideoEnabled, (isChecked: boolean) => {
  if (isChecked) {
    // localStream.unmute('video')
  } else {
    // localStream.mute('video')
  }
})
watch(isAudioEnabled, (isChecked: boolean) => {
  if (isChecked) {
    // localStream.unmute('audio')
  } else {
    // localStream.mute('audio')
  }
})

const broadcast = () => {
  mc.send(JSON.stringify({
    "event": "broadcast",
    "data": broadcastMsg.value
  }))
  toastRef.value?.show("发布消息广播成功", () => {
    broadcastMsg.value = ''
  })
}

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

const setFocus = () => {
  ws.send(JSON.stringify({ method: 'switch', params: focus.value }))
}

onUnmounted(() => {
  ws.close()
  pc.close()
})

const publish = async () => {
  if (navigator.mediaDevices === undefined) {
    err.value = '请使用chrome浏览器,并打开 chrome://flags/#unsafely-treat-insecure-origin-as-secure 将 Insecure origins treated as secure 选项设置为 Enabled, 在输入框内填入 http://10.19.14.155:8084'
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true, audio: true
  })
  localRef.value.srcObject = stream
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream)
  })
}

let config: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
  ],
}
mc = new WebSocket(`${wsURL}/message?room=${roomID}&node=${nodeID}`)
mc.onopen = () => {
  ws = new WebSocket(`${relayURL}/p2p?room=${roomID}&node=${nodeID}`)
  ws.onopen = async () => {
    pc = new RTCPeerConnection(config)
    localDC = pc.createDataChannel(`${nodeID}-dc`)
    const d = await pc.createOffer()
    pc.setLocalDescription(d)
    ws.send(JSON.stringify({ method: 'offer', params: JSON.stringify(d) }))
    pc.ontrack = (evt) => {
      if (evt.track.kind === 'audio') {
        let el = document.createElement('audio')
        el.srcObject = evt.streams[0]
        el.autoplay = true
        el.controls = true
        document.getElementById('remote-audio')?.appendChild(el)
        return
      }
      console.log('evt', evt)
      const id = evt.streams[0].id
      const nodeID = streams[id]
      let el: HTMLVideoElement | null = document.getElementById(
        nodeID
      ) as HTMLVideoElement
      if (el !== null) {
        el.srcObject = evt.streams[0]
        el.autoplay = true
        el.controls = true
        evt.track.onunmute = (evt) => {
          console.log('onunmute evt', evt)
          el!.muted = false
          el!.play()
        }
        evt.track.onmute = (evt) => {
          console.log('onmute evt', evt)
          el!.muted = true
          el!.pause()
        }
        evt.streams[0].onremovetrack = () => {
          try {
            if (streams[id]) {
              delete streams[id]
            }
          } catch (err) { }
        }
      }
      pc.ondatachannel = (evt) => {
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
    pc.onnegotiationneeded = async (evt) => {
      const offer = await pc.createOffer({ iceRestart: false })
      await pc.setLocalDescription(offer)
      ws.send(JSON.stringify({ method: 'offer', params: JSON.stringify(offer) }))
    }
    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        ws.send(JSON.stringify({ method: 'candidate', params: JSON.stringify(evt.candidate) }))
      }
    }
    pc.onconnectionstatechange = (evt) => {
      if (pc.connectionState == 'connected') {
        console.log('peer connection connected')
      }
      if (pc.connectionState == 'disconnected' || pc.connectionState == 'failed') {
        pc.restartIce()
      }
    }
  }
  ws.onclose = () => {
    toastRef.value?.show('ws is closed')
  }
  ws.onerror = (evt: any) => {
    toastRef.value?.error(evt.data)
  }
  let candidatesOnQueue: Array<RTCIceCandidate> = []
  ws.onmessage = async (evt: any) => {
    const msg = JSON.parse(evt.data)
    if (!msg) {
      toastRef.value?.error('message parse failed')
      return
    }
    let { method, params } = msg
    if (method === 'ping') {
      return
    }
    let data = JSON.parse(params)
    if (!data) {
      toastRef.value?.error('data parse failed')
      return
    }
    switch (msg.method) {
      case 'candidate':
        candidatesOnQueue.push(new RTCIceCandidate(data))
        if (candidatesOnQueue.length > 0) {
          candidatesOnQueue.forEach((c) => {
            console.log('ice candidate', data)
          })
        }
        pc.addIceCandidate(data).catch((e) => console.log(e))
        return
      case 'offer':
        await pc.setRemoteDescription(data)
        let answer = await pc.createAnswer()
        pc.setLocalDescription(answer)
        ws.send(JSON.stringify({ method: 'answer', params: JSON.stringify(answer) }))
        return
      case 'answer':
        await pc.setRemoteDescription(data)
        return
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
</script>