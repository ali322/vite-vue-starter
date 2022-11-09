<template>
  <div class="text-center py-12">{{count}}</div>
  <div class="text-center">
    <button class="btn btn-sm btn-primary" @click="store.increment">increment</button>
  </div>
</template>
<script lang="ts" setup>
import { useCounterStore } from '@/store/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

const { count } = storeToRefs(store)
</script>