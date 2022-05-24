export type MainDrawerProps<T> = {
  defaultHost?: string,
  storageName?: string,
  routes?: T[],
  showNotification?: boolean,
  saveHandled?: boolean
}

export type MainDrawerHandle = {
  open: () => void;
}
