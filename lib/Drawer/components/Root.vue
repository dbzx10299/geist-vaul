<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

import {
  ref,
  computed,
  onMounted,
  watchEffect,
  provide,
} from 'vue'

import type { ComponentPublicInstance } from 'vue';

import '../style.css';
import { set, getTranslate, dampenValue, reset } from '../helpers.ts';
import {
  TRANSITIONS,
  VELOCITY_THRESHOLD,
  CLOSE_THRESHOLD,
  SCROLL_LOCK_TIMEOUT,
  DRAG_CLASS,
} from '../constants.ts';

import { isIOS } from '../browser.ts';

export type DialogProps = {
  open?: boolean;
  /**
   * Number between 0 and 1 that determines when the drawer should be closed.
   * Example: threshold of 0.5 would close the drawer if the user swiped for 50% of the height of the drawer or more.
   * @default 0.25
   */
  closeThreshold?: number;
  onOpenChange?: (open: boolean) => void;
  /**
   * Duration for which the drawer is not draggable after scrolling content inside of the drawer.
   * @default 500ms
   */
  scrollLockTimeout?: number;
  /**
   * When `true` only allows the drawer to be dragged by the `<Drawer.Handle />` component.
   * @default false
   */
  handleOnly?: boolean;
  /**
   * When `false` dragging, clicking outside, pressing esc, etc. will not close the drawer.
   * Use this in comination with the `open` prop, otherwise you won't be able to open/close the drawer.
   * @default true
   */
  dismissible?: boolean;
  onDrag?: (event: PointerEvent, percentageDragged: number) => void;
  onRelease?: (event: PointerEvent, open: boolean) => void;
  /**
   * When `false` it allows to interact with elements outside of the drawer without closing it.
   * @default true
   */
  modal?: boolean;
  onClose?: () => void;
  /**
   * Opened by default, skips initial enter animation. Still reacts to `open` state changes
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Gets triggered after the open or close animation ends, it receives an `open` argument with the `open` state of the drawer by the time the function was triggered.
   * Useful to revert any state changes for example.
   */
  onAnimationEnd?: (open: boolean) => void;
  autoFocus?: boolean;
}


const {
  open: openProp = undefined,
  onOpenChange,
  // @ts-ignore
  onDrag: onDragProp,
  onRelease: onReleaseProp,
  closeThreshold = CLOSE_THRESHOLD,
  scrollLockTimeout = SCROLL_LOCK_TIMEOUT,
  dismissible = true,
  handleOnly = false,
  modal = true,
  onClose,
  defaultOpen = false,
  onAnimationEnd,
  autoFocus = false,
} = defineProps<DialogProps>()

onMounted(() => {
  window.requestAnimationFrame(() => {
    shouldAnimate.value = true;
  });

  if (!modal) {
    // Need to do this manually unfortunately
    window.requestAnimationFrame(() => {
      document.body.style.pointerEvents = 'auto';
    });
  }

  watchEffect((onCleanup) => {
    // Trigger enter animation without using CSS animation
    if (isOpen.value) {
      set(document.documentElement, {
        scrollBehavior: 'auto',
      });

      openTime.value = new Date();
    }

    onCleanup(() => {
      reset(document.documentElement, 'scrollBehavior');
    })
  })

})

const _open = ref(openProp ?? false)

const isOpen = computed({
  get() {
    return (openProp !== undefined) ? openProp : _open.value
  },
  set(o: boolean) {
    _open.value = o

    onOpenChange?.(o);

    setTimeout(() => {
      onAnimationEnd?.(o);
    }, TRANSITIONS.DURATION * 1000);

    if (o && !modal) {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          document.body.style.pointerEvents = 'auto';
        });
      }
    }

    if (!o) {
      // This will be removed when the exit animation ends (`500ms`)
      document.body.style.pointerEvents = 'auto';
    }

  }
})

const hasBeenOpened = ref<boolean>(false);
const isDragging = ref<boolean>(false);
const justReleased = ref<boolean>(false);
const overlayRef = ref<ComponentPublicInstance | null>(null);
const openTime = ref<Date | null>(null);
const dragStartTime = ref<Date | null>(null);
const dragEndTime = ref<Date | null>(null);
const lastTimeDragPrevented = ref<Date | null>(null);
const isAllowedToDrag = ref<boolean>(false);
const pointerStart = ref(0);
const keyboardIsOpen = ref(false);
const shouldAnimate = ref(!defaultOpen);
const drawerRef = ref<ComponentPublicInstance | null>(null);
const drawerHeightRef = ref(drawerRef.value?.$el.getBoundingClientRect().height || 0);
const drawerWidthRef = ref(drawerRef.value?.$el.getBoundingClientRect().width || 0);

provide('drawerContext', {
  drawerRef,
  overlayRef,
  onOpenChange,
  onPress,
  onRelease,
  onDrag,
  dismissible,
  shouldAnimate,
  handleOnly,
  isOpen,
  isDragging,
  closeDrawer,
  keyboardIsOpen,
  modal,
  autoFocus,
})

function onPress(event: PointerEvent) {
  if (!dismissible) return;
  if (drawerRef.value?.$el && !drawerRef.value.$el.contains(event.target as Node)) return;
  drawerHeightRef.value = drawerRef.value?.$el.getBoundingClientRect().height || 0;
  drawerWidthRef.value = drawerRef.value?.$el.getBoundingClientRect().width || 0;
  isDragging.value = true
  dragStartTime.value = new Date();

  // iOS doesn't trigger mouseUp after scrolling so we need to listen to touched in order to disallow dragging
  if (isIOS()) {
    window.addEventListener('touchend', () => (isAllowedToDrag.value = false), { once: true });
  }
  // Ensure we maintain correct pointer capture even when going outside of the drawer
  (event.target as HTMLElement).setPointerCapture(event.pointerId);

  pointerStart.value = event.pageY;
}

function shouldDrag(el: EventTarget, isDraggingInDirection: boolean) {
  let element = el as HTMLElement;
  const highlightedText = window.getSelection()?.toString();
  const swipeAmount = drawerRef.value ? getTranslate(drawerRef.value.$el) : null;
  const date = new Date();

  // Fixes https://github.com/emilkowalski/vaul/issues/483
  if (element.tagName === 'SELECT') {
    return false;
  }

  if (element.hasAttribute('data-vaul-no-drag') || element.closest('[data-vaul-no-drag]')) {
    return false;
  }

  // Allow scrolling when animating
  if (openTime.value && date.getTime() - openTime.value.getTime() < 500) {
    return false;
  }

  if (swipeAmount !== null) {
    if (swipeAmount > 0) {
      return true;
    }
  }

  // Don't drag if there's highlighted text
  if (highlightedText && highlightedText.length > 0) {
    return false;
  }

  // Disallow dragging if drawer was scrolled within `scrollLockTimeout`
  if (
    lastTimeDragPrevented.value &&
    date.getTime() - lastTimeDragPrevented.value.getTime() < scrollLockTimeout &&
    swipeAmount === 0
  ) {
    lastTimeDragPrevented.value = date;
    return false;
  }

  if (isDraggingInDirection) {
    lastTimeDragPrevented.value = date;

    // We are dragging down so we should allow scrolling
    return false;
  }

  // Keep climbing up the DOM tree as long as there's a parent
  while (element) {
    // Check if the element is scrollable
    if (element.scrollHeight > element.clientHeight) {
      if (element.scrollTop !== 0) {
        lastTimeDragPrevented.value = new Date();

        // The element is scrollable and not scrolled to the top, so don't drag
        return false;
      }

      if (element.getAttribute('role') === 'dialog') {
        return true;
      }
    }

    // Move up to the parent element
    element = element.parentNode as HTMLElement;
  }

  // No scrollable parents not scrolled to the top found, so drag
  return true;
}

function onDrag(event: PointerEvent) {
  if (!drawerRef.value) {
    return;
  }

  // We need to know how much of the drawer has been dragged in percentages so that we can transform background accordingly
  if (isDragging.value) {
    const draggedDistance = (pointerStart.value - event.pageY);
    const isDraggingInDirection = draggedDistance > 0;

    // We need to capture last time when drag with scroll was triggered and have a timeout between
    const absDraggedDistance = Math.abs(draggedDistance);

    if (!isAllowedToDrag.value && !shouldDrag(event.target!, isDraggingInDirection)) return;

    drawerRef.value.$el.classList.add(DRAG_CLASS);
    // If shouldDrag gave true once after pressing down on the drawer, we set isAllowedToDrag to true and it will remain true until we let go, there's no reason to disable dragging mid way, ever, and that's the solution to it
    isAllowedToDrag.value = true;
    set(drawerRef.value.$el, {
      transition: 'none',
    });

    set(overlayRef.value?.$el, {
      transition: 'none',
    });

    if (isDraggingInDirection) {
      const dampenedDraggedDistance = dampenValue(draggedDistance);

      const translateValue = Math.min(dampenedDraggedDistance * -1, 0);

      set(drawerRef.value.$el, {
        transform: `translate3d(0, ${translateValue}px, 0)`
      });
      return;
    }

    const translateValue = absDraggedDistance;

    set(drawerRef.value.$el, {
      transform: `translate3d(0, ${translateValue}px, 0)`
    });
  }
}

function closeDrawer(fromWithin?: boolean) {
  cancelDrag();
  onClose?.();

  if (!fromWithin) {
    isOpen.value = false
  }
}


function resetDrawer() {
  if (!drawerRef.value) return;

  set(drawerRef.value.$el, {
    transform: 'translate3d(0, 0, 0)',
    transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
  });

  set(overlayRef.value?.$el, {
    transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
    opacity: '1',
  });
}

function cancelDrag() {
  if (!isDragging.value || !drawerRef.value) return;

  drawerRef.value.$el.classList.remove(DRAG_CLASS);
  isAllowedToDrag.value = false;
  isDragging.value = false
  dragEndTime.value = new Date();
}

function onRelease(event: PointerEvent | null) {
  if (!isDragging.value || !drawerRef.value) return;

  drawerRef.value.$el.classList.remove(DRAG_CLASS);
  isAllowedToDrag.value = false;
  isDragging.value = false
  dragEndTime.value = new Date();
  const swipeAmount = getTranslate(drawerRef.value.$el);

  if (!event || !shouldDrag(event.target!, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;

  if (dragStartTime.value === null) return;

  const timeTaken = dragEndTime.value.getTime() - dragStartTime.value.getTime();
  const distMoved = pointerStart.value - event.pageY;
  const velocity = Math.abs(distMoved) / timeTaken;

  if (velocity > 0.05) {
    // `justReleased` is needed to prevent the drawer from focusing on an input when the drag ends, as it's not the intent most of the time.
    justReleased.value = true

    setTimeout(() => {
      justReleased.value = false
    }, 200);
  }

  // Moved upwards, don't do anything
  if (distMoved > 0) {
    resetDrawer();
    onReleaseProp?.(event, true);
    return;
  }

  if (velocity > VELOCITY_THRESHOLD) {
    closeDrawer();
    onReleaseProp?.(event, false);
    return;
  }

  const visibleDrawerHeight = Math.min(drawerRef.value.$el.getBoundingClientRect().height ?? 0, window.innerHeight);

  if (Math.abs(swipeAmount) >= visibleDrawerHeight * closeThreshold) {
    closeDrawer();
    onReleaseProp?.(event, false);
    return;
  }

  onReleaseProp?.(event, true);
  resetDrawer();
}
</script>

<template>
  <DialogRoot
    :defaultOpen
    @update:open="open => {
      if (!dismissible && !open) return;
      if (open) {
        hasBeenOpened = true
      } else {
        closeDrawer(true);
      }

      isOpen = open
    }"
    :open="isOpen"
  >
    <slot/>
  </DialogRoot>
</template>