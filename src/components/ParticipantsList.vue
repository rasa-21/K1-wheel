
<template>
  <div class="participants">
    <div class="participants__chips">
      <span v-for="(s, idx) in sectors" :key="idx" class="participants__chip">
        {{ s || "—" }}
      </span>
    </div>
  </div>
</template>


<script setup>
defineProps({
  sectors: {
    type: Array,
    required: true
  }
})
</script>


