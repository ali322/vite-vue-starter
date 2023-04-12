<template>
  <div class="relative">
    <video class="rounded-xl shadow-xl h-40" v-if="streams.length === 0" />
    <video v-for="(s ,i) in props.streams" :key="i" :id="s.id" class="rounded-xl shadow-xl" :class="{'absolute bottom-0 right-0 w-20 overflow-hidden': i != selected}"></video>
  </div>
  <p class="leding-10 pt-4 flex">
    <div class="flex-1">节点<span class="badge ml-2">{{ props.id }}</span></div>
    <button class="btn btn-xs btn-outline text-sm" @click="switchStream">切换</button>
  </p>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  streams: Array<Record<string, any>>,
  id: string
}>()

const selected = ref(0)
const switchStream = () => {
  if (selected.value === props.streams.length - 1) {
    selected.value = 0
  } else {
    selected.value +=1
  }
}
</script>