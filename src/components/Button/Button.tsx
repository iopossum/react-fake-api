import { SettingOutlined } from "@ant-design/icons";
import { Button as AntdButton, ButtonProps } from "antd";
import cn from "classnames";

import styles from "./button.module.scss";

export interface IButtonProps extends ButtonProps {}

export const Button = ({ className, ...props }: IButtonProps) => (
  <AntdButton
    type="primary"
    icon={<SettingOutlined />}
    className={cn(styles.button, { [className as string]: !!className })}
    {...props}
  />
);
