<script setup lang="ts">
import { ref, inject } from 'vue'
import { DialogContent } from 'reka-ui'
import type { DrawerContext } from '../types';

type ContentProps = {
  onPointerDownOutside?: (event: PointerEvent) => void;
  onOpenAutoFocus?: (event: PointerEvent) => void;
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerOut?: (event: PointerEvent) => void;
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
} = inject('drawerContext') as DrawerContext;
// Needed to use transition instead of animations
const pointerStartRef = ref<{ x: number; y: number } | null>(null);
const lastKnownPointerEventRef = ref<PointerEvent | null>(null);
const wasBeyondThePointRef = ref(false);

const isDeltaInDirection = (delta: { x: number; y: number }, threshold = 0) => {
  if (wasBeyondThePointRef.value) return true;

  const deltaY = Math.abs(delta.y);
  const deltaX = Math.abs(delta.x);
  const isDeltaX = deltaX > deltaY;

  const isReverseDirection = delta.y < 0;
  if (!isReverseDirection && deltaY >= 0 && deltaY <= threshold) {
    return !isDeltaX;
  }

  wasBeyondThePointRef.value = true;
  return true;
};

function handleOnPointerUp(event: PointerEvent | null) {
  pointerStartRef.value = null;
  wasBeyondThePointRef.value = false;
  onRelease(event);
}
</script>

<template>
  <DialogContent
    data-vaul-drawer=""
    data-vaul-snap-points="false"
    :data-vaul-animate="shouldAnimate ? 'true' : 'false'"
    ref="drawerRef"
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
    @openAutoFocus="e => {
      onOpenAutoFocus?.(e as any);

      if (!autoFocus) {
        e.preventDefault();
      }
    }"
    @pointerDownOutside="(e) => {
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
    @focusOutside="(e) => {
      if (!modal) {
        e.preventDefault();
        return;
      }
    }"
  >
    <slot/>
  </DialogContent>
</template>