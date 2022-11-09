<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="navbar bg-base-100">
    <div class="flex-1">
      <span class="btn btn-ghost normal-case text-xl">Starter</span>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal p-0">
        <li><RouterLink to="/">Home</RouterLink></li>
        <li><RouterLink to="/login">Login</RouterLink></li>
      </ul>
    </div>
  </div>
  <div class="content px-4">
    <RouterView/>
  </div>
</template>
