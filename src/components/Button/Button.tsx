import React, { memo, ForwardRefExoticComponent } from 'react';
import { Button as AntdButton } from 'antd';
import styles from './Button.module.scss';
import { SettingOutlined } from '@ant-design/icons';
import { ButtonProps } from './Button.types';
import cn from 'classnames';

const Button: ForwardRefExoticComponent<ButtonProps> = memo(({ className, ...props }) => (
  <AntdButton type="primary" icon={<SettingOutlined />} className={cn(styles.button, {[className as string]: !!className})} {...props} />
));

export default Button;
