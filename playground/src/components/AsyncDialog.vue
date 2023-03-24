<script setup lang="ts">
import type { DialogResult } from '../wrappers'
import { TemplateWrapper } from '../wrappers'

const asyncFn = () => {
  return new Promise<DialogResult>((resolve) => {
    setTimeout(() => {
      resolve('ok')
    }, 1000)
  })
}

defineExpose({ TemplateWrapper })
</script>

<template>
  <TemplateWrapper v-slot="{ resolve, args, isResolving }">
    <div class="fixed inset-0 bg-black/10 flex items-center">
      <dialog open class="border-gray/10 shadow rounded ma">
        <div>AsyncDialog {{ args[0] }}</div>
        <p>Open console to see logs</p>
        <div class="flex gap-2 justify-end">
          <button class="w-25" @click="resolve('cancel')">
            Cancel
          </button>
          <button class="w-25" :disabled="isResolving" @click="resolve(asyncFn())">
            {{ isResolving ? 'Confirming...' : 'OK' }}
          </button>
        </div>
      </dialog>
    </div>
  </TemplateWrapper>
</template>
