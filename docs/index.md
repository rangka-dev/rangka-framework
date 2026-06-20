---
layout: page
description: Landing page and entry point for Rangka framework documentation
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

onMounted(() => {
  const router = useRouter()
  router.go('/introduction')
})
</script>

<meta http-equiv="refresh" content="0;url=/introduction">
