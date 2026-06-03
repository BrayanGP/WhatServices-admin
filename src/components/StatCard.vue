<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: String,
})
</script>

<template>
  <div class="bg-white rounded-xl shadow p-5">
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm text-gray-500">{{ title }}</p>
      <span class="text-2xl">{{ icon }}</span>
    </div>
    <p class="text-3xl font-bold text-gray-800">{{ value }}</p>
  </div>
</template>
