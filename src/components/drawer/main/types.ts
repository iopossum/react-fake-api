import { MenuProps } from "antd";

import { IRoute } from "@src/types";

export type TMenuItem = Required<MenuProps>["items"][number];

export interface IRouteExtended extends IRoute {
  index: number;
}
