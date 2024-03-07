import { memo } from "react";

import { Popconfirm, PopconfirmProps } from "antd";

export const CleanConfirm = memo(
  ({
    children,
    placement = "topRight",
    ...props
  }: Omit<PopconfirmProps, "title"> & { title?: string }) => (
    <Popconfirm
      placement={placement}
      {...props}
      title={"Are you sure?"}
      okText="OK"
      cancelText="Cancel"
    >
      {children}
    </Popconfirm>
  ),
);
