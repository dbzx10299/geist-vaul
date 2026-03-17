<script setup lang="ts">
import { DialogOverlay } from 'reka-ui'
import { inject, nextTick, watch } from 'vue'
import { useRemoveScroll } from 'vue-remove-scroll'
import { DrawerContextKey } from '../types'

const {
  drawerRef,
  overlayRef,
  onRelease,
  isOpen,
  modal,
  shouldAnimate,
} = inject(DrawerContextKey)!

const onMouseUp = (event: PointerEvent) => onRelease(event)

let _disableScroll: () => void

watch(isOpen, async (open) => {
  // if there is no modal, don't lock the scroll
  if (!modal)
    return

  if (open) {
    await nextTick()

    const { enableScroll, disableScroll } = useRemoveScroll({
      excludedElements: [drawerRef.value?.$el],
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
    ref="overlayRef"
    data-vaul-overlay=""
    data-vaul-snap-points="false"
    :data-vaul-animate="shouldAnimate ? 'true' : 'false'"
    @mouseup="onMouseUp"
  />
</template>
