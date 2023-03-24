<!-- eslint-disable no-console -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { TemplatePromiseStart } from '../../src/index'
import { useTemplatePromise } from '../../src/index'
import MyDialog from './components/MyDialog.vue'
import type { DialogResult } from './wrappers'

type MyDialogType = InstanceType<typeof MyDialog>
const MyDialogPromise = useTemplatePromise<MyDialogType>(MyDialog, {
  transition: {
    name: 'fade',
    appear: true,
  },
})

const AsyncDialog = defineAsyncComponent(() => import('./components/AsyncDialog.vue'))
type AsyncDialogType = InstanceType<typeof AsyncDialog>
const AsyncDialogPromise = useTemplatePromise<AsyncDialogType>(AsyncDialog, {
  transition: {
    name: 'fade',
    appear: true,
  },
})

const TemplatePromise = useTemplatePromise<DialogResult, [string]>({
  transition: {
    name: 'fade',
    appear: true,
  },
})

async function open(promise: TemplatePromiseStart<any, any>, idx: number) {
  console.log(idx, 'Before')
  const result = await promise.start(`Hello ${idx}`)
  console.log(idx, 'After', result)
}

const asyncFn = () => {
  return new Promise<DialogResult>((resolve) => {
    setTimeout(() => {
      resolve('ok')
    }, 1000)
  })
}

const group = [
  { promise: TemplatePromise, label: 'From current template: ' },
  { promise: MyDialogPromise, label: 'From component: ' },
  { promise: AsyncDialogPromise, label: 'From async component: ' },
]
</script>

<template>
  <div v-for="item in group" :key="item.label" class="flex gap-2 items-center mb-2">
    <div>{{ item.label }}</div>
    <button @click="open(item.promise, 1)">
      Open 1
    </button>
    <button @click="open(item.promise, 2)">
      Open 2
    </button>
    <button @click="open(item.promise, 1); open(item.promise, 2)">
      Open 1 & 2
    </button>
  </div>

  <TemplatePromise v-slot="{ resolve, args, isResolving }">
    <div class="fixed inset-0 bg-black/10 flex items-center">
      <dialog open class="border-gray/10 shadow rounded ma">
        <div>Dialog {{ args[0] }}</div>
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
  </TemplatePromise>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
