import { IStorageCfg } from "@src/types";

import { TMenuItem } from "./types";

export const DEFAULT_CONFIG: IStorageCfg = {
  autoHandle: false,
  routes: [],
} as const;

export const GROUP_SETTING_MENU: TMenuItem[] = [
  { label: "Rename", key: "edit" },
  { label: "Select all", key: "selectAll" },
  { label: "Unselect all", key: "unselectAll" },
] as const;
