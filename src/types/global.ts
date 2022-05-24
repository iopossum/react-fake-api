import * as React from 'react';
import {Route, FakeServerProps, ServerConfig} from '../utils/server.types';
import { MainDrawerProps } from '../components/Drawer/Main/Main.types';

export type StorageCfg = {
  autoHandle: boolean,
  routes: Route[]
}

export type GroupsObj = Record<string, Route[]>

export type Resolve<T> = (value: PromiseLike<void | T> | T) => void
export type Reject = (reason?: any) => void

export type PromiseRef<T> = {
  resolve: null | Resolve<T>,
  reject: null | Reject
}

export type LabelValue = {
  label: string,
  value: string
}

export type RFAProps = MainDrawerProps<Route> & Omit<FakeServerProps, "passthrough"> & {
  buttonClassName?: string,
  children?: React.ReactNode
}
