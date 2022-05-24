export type EditDrawerProps<T> = {
  groupsRef: React.MutableRefObject<T>,
}

export type EditDrawerHandle<T> = {
  open: (route: Partial<T>) => Promise<T>;
}
