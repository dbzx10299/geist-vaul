<script setup lang="ts">
import { inject, watch, nextTick } from 'vue'
import { DialogOverlay } from 'reka-ui'
import { useRemoveScroll } from 'vue-remove-scroll'
import type { DrawerContext } from '../types'

const {
  drawerRef,
  overlayRef,
  onRelease,
  isOpen,
  modal,
  shouldAnimate
} = inject('drawerContext') as DrawerContext;

const onMouseUp = (event: PointerEvent) => onRelease(event)


let _disableScroll: () => void

watch(isOpen, async open => {
  // if there is no modal, don't lock the scroll
  if (!modal) return

  if (open) {
    await nextTick()

    const { enableScroll, disableScroll } = useRemoveScroll({
      excludedElements: [drawerRef.value?.$el]
    })
    
    enableScroll()

    _disableScroll = disableScroll
  }
  else {
    _disableScroll()
  }
})
</script>

<template>
  <DialogOverlay
    v-if="modal"
    @mouseup="onMouseUp"
    ref="overlayRef"
    data-vaul-overlay=""
    data-vaul-snap-points="false"
    :data-vaul-animate="shouldAnimate ? 'true' : 'false'"
  />
</template>