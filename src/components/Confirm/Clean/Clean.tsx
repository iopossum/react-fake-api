import React, { memo, ForwardRefExoticComponent } from 'react';
import { Popconfirm } from 'antd';
import { PopconfirmProps } from './Clean.types';

const CleanConfirm: ForwardRefExoticComponent<Partial<PopconfirmProps>> = memo(({ children, placement = 'topRight', ...props }) => (
  <Popconfirm placement={placement} title={'Clear it?'} okText="OK" cancelText="Cancel" {...props}>
    { children }
  </Popconfirm>
));

export default CleanConfirm;
