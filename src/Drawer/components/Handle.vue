<script setup lang="ts">
import { inject, ref } from 'vue'
import { DrawerContextKey } from '../types.ts'

export interface HandleProps {
  preventCycle?: boolean
}

const LONG_HANDLE_PRESS_TIMEOUT = 250

const {
  handleOnly,
  isOpen,
  onPress,
  onDrag,
} = inject(DrawerContextKey)!

const closeTimeoutIdRef = ref<number | null>(null)
const shouldCancelInteractionRef = ref(false)

function handleStartCycle() {
  // Stop if this is the second click of a double click
  if (shouldCancelInteractionRef.value) {
    handleCancelInteraction()
  }
}

function handleStartInteraction() {
  closeTimeoutIdRef.value = window.setTimeout(() => {
    // Cancel click interaction on a long press
    shouldCancelInteractionRef.value = true
  }, LONG_HANDLE_PRESS_TIMEOUT)
}

function handleCancelInteraction() {
  if (closeTimeoutIdRef.value) {
    window.clearTimeout(closeTimeoutIdRef.value)
  }
  shouldCancelInteractionRef.value = false
}
</script>

<template>
  <div
    :data-vaul-drawer-visible="isOpen ? 'true' : 'false'"
    data-vaul-handle=""
    aria-hidden="true"
    @click="handleStartCycle"
    @pointercancel="handleCancelInteraction"
    @pointerdown="(e) => {
      if (handleOnly) onPress(e);
      handleStartInteraction();
    }"
    @pointermove="e => {
      if (handleOnly) onDrag(e)
    }"
  >
    <!-- Expand handle's hit area beyond what's visible to ensure a 44x44 tap target for touch devices -->
    <span data-vaul-handle-hitarea="" aria-hidden="true">
      <slot />
    </span>
  </div>
</template>
