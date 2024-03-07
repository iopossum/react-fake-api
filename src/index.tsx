import { useRef, PropsWithChildren, memo, FC } from "react";

import { Button, IButtonProps } from "@src/components/button";
import {
  MainDrawer,
  IMainDrawerProps,
  IMainDrawerHandle,
} from "@src/components/drawer/main";
import { ErrorBoundary } from "@src/components/error-boundary";

export interface IRFAProps extends IMainDrawerProps, PropsWithChildren {
  buttonProps?: Omit<IButtonProps, "onClick">;
}

export const RFA: FC<IRFAProps> = memo(({ children, buttonProps, ...rest }) => {
  const mainDrawerRef = useRef<IMainDrawerHandle>(null);

  const handleShowDrawer = () => {
    mainDrawerRef.current?.open();
  };

  return (
    <>
      {children}
      <Button {...buttonProps} onClick={handleShowDrawer} />
      <ErrorBoundary>
        <MainDrawer ref={mainDrawerRef} {...rest} />
      </ErrorBoundary>
    </>
  );
});

export default RFA;

export { IRoute } from "@src/types";
