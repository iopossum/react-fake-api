import { Popconfirm, PopconfirmProps } from "antd";

export interface ICleanConfirmProps extends Omit<PopconfirmProps, "title"> {
  title?: string;
}

export const CleanConfirm = ({
  children,
  placement = "topRight",
  ...props
}: ICleanConfirmProps) => (
  <Popconfirm
    placement={placement}
    {...props}
    title={"Are you sure?"}
    okText="OK"
    cancelText="Cancel"
  >
    {children}
  </Popconfirm>
);
