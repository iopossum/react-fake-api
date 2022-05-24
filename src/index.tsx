import { hot } from 'react-hot-loader/root';
import React, { useRef, FC } from 'react';
import { MainDrawer } from './components/Drawer';
import { MainDrawerHandle } from './components/Drawer/Main/Main.types';
import Button from './components/Button';
import ErrorBoundary from './components/ErrorBoundary';
import { RFAProps } from "./types/global";

import 'antd/dist/antd.min.css';

export const RFA: FC<RFAProps> = ({ children, buttonClassName, ...rest }) => {

  const mainDrawerRef = useRef<MainDrawerHandle>(null);

  const _showDrawer = (): void => {
    mainDrawerRef.current && mainDrawerRef.current.open();
  };

  return (
    <>
      { children }
      <Button className={buttonClassName} onClick={_showDrawer} />
      <ErrorBoundary>
        <MainDrawer ref={mainDrawerRef} {...rest} />
      </ErrorBoundary>
    </>
  )
};

export default hot(RFA);
