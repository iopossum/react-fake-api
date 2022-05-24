import { ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryProps = {
  children: ReactNode;
};
export type ErrorBoundaryState = {
  error: Error | null,
  errorInfo: ErrorInfo | null
};
