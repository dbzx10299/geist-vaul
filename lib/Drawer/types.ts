import type { Ref, ComponentPublicInstance } from 'vue'

export type AnyFunction = (...args: any) => any;

export interface DrawerContext {
  drawerRef: Ref<ComponentPublicInstance | null>;
  overlayRef: Ref<ComponentPublicInstance | null>;
  onPress: (event: PointerEvent) => void;
  onRelease: (event: PointerEvent | null) => void;
  onDrag: (event: PointerEvent) => void;
  dismissible: boolean;
  isOpen: Ref<boolean>;
  isDragging: Ref<boolean>;
  keyboardIsOpen: Ref<boolean>;
  modal: boolean;
  shouldFade: Ref<boolean>;
  closeDrawer: () => void;
  openProp?: boolean;
  onOpenChange?: (o: boolean) => void;
  setBackgroundColorOnScale: boolean;
  handleOnly?: boolean;
  autoFocus?: boolean;
  shouldAnimate?: Ref<boolean>;
}