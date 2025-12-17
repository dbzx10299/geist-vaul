<script setup lang="ts">
import { DialogContent } from 'reka-ui'
import { inject, ref } from 'vue'
import { DrawerContextKey } from '../types.ts'

interface ContentProps {
  onPointerDownOutside?: (event: PointerEvent) => void
  onOpenAutoFocus?: (event: PointerEvent) => void
  onPointerDown?: (event: PointerEvent) => void
  onPointerMove?: (event: PointerEvent) => void
  onPointerUp?: (event: PointerEvent) => void
  onPointerOut?: (event: PointerEvent) => void
}

const { onPointerDownOutside, onOpenAutoFocus, ...rest } = defineProps<ContentProps>()

const {
  drawerRef,
  onPress,
  onRelease,
  onDrag,
  keyboardIsOpen,
  modal,
  handleOnly,
  shouldAnimate,
  autoFocus,
} = inject(DrawerContextKey)!
// Needed to use transition instead of animations
const pointerStartRef = ref<{ x: number, y: number } | null>(null)
const lastKnownPointerEventRef = ref<PointerEvent | null>(null)
const wasBeyondThePointRef = ref(false)

function isDeltaInDirection(delta: { x: number, y: number }, threshold = 0) {
  if (wasBeyondThePointRef.value)
    return true

  const deltaY = Math.abs(delta.y)
  const deltaX = Math.abs(delta.x)
  const isDeltaX = deltaX > deltaY

  const isReverseDirection = delta.y < 0
  if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) {
    return !isDeltaX
  }

  wasBeyondThePointRef.value = true
  return true
}

function handleOnPointerUp(event: PointerEvent | null) {
  pointerStartRef.value = null
  wasBeyondThePointRef.value = false
  onRelease(event)
}
</script>

<template>
  <DialogContent
    ref="drawerRef"
    data-vaul-drawer=""
    data-vaul-snap-points="false"
    :data-vaul-animate="shouldAnimate ? 'true' : 'false'"
    @pointerdown="(event: PointerEvent) => {
      if (handleOnly) return;
      rest.onPointerDown?.(event);
      pointerStartRef = { x: event.pageX, y: event.pageY };
      onPress(event);
    }"
    @pointermove="(event: PointerEvent) => {
      lastKnownPointerEventRef = event;
      if (handleOnly) return;
      rest.onPointerMove?.(event);
      if (!pointerStartRef) return;
      const yPosition = event.pageY - pointerStartRef.y;
      const xPosition = event.pageX - pointerStartRef.x;

      const swipeStartThreshold = event.pointerType === 'touch' ? 10 : 2;
      const delta = { x: xPosition, y: yPosition };

      const isAllowedToSwipe = isDeltaInDirection(delta, swipeStartThreshold);
      if (isAllowedToSwipe) onDrag(event);
      else if (Math.abs(xPosition) > swipeStartThreshold || Math.abs(yPosition) > swipeStartThreshold) {
        pointerStartRef = null;
      }
    }"
    @open-auto-focus="e => {
      onOpenAutoFocus?.(e as any);

      if (!autoFocus) {
        e.preventDefault();
      }
    }"
    @pointer-down-outside="(e) => {
      onPointerDownOutside?.(e as any);

      if (!modal || e.defaultPrevented) {
        e.preventDefault();
        return;
      }

      if (keyboardIsOpen) {
        keyboardIsOpen = false;
      }
    }"
    @pointerup="(event: PointerEvent) => {
      rest.onPointerUp?.(event);
      pointerStartRef = null;
      wasBeyondThePointRef = false;
      onRelease(event);
    }"
    @pointerout="(event: PointerEvent) => {
      rest.onPointerOut?.(event);
      handleOnPointerUp(lastKnownPointerEventRef);
    }"
    @focus-outside="(e) => {
      if (!modal) {
        e.preventDefault();
        return;
      }
    }"
  >
    <slot />
  </DialogContent>
</template>
