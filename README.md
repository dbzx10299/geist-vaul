# Geist Vaul

Geist Vaul is the same drawer as [Vue Vaul](https://www.npmjs.com/package/vue-vaul) but more lightweight and with less options. Compared with Vue Vaul, Geist Vaul does not have the option to nest drawers, does not support snap points, and does not support different directions.

## Install

```bash
npm i geist-vaul
```

## Usage

```vue
<script setup>
import { Drawer } from 'geist-vaul'
</script>

<template>
  <Drawer.Root>
    <Drawer.Trigger>Open</Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Content>
        <Drawer.Title>Title</Drawer.Title>
      </Drawer.Content>
      <Drawer.Overlay />
    </Drawer.Portal>
  </Drawer.Root>
</template>
```

## Credits

This project also partially contains code derived or copied from the following projects:

- [Vaul](https://github.com/emilkowalski/vaul)

## Licenses

This project is licensed under the [MIT License](LICENSE).