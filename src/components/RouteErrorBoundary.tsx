import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  /** Changing this discards the error state - the boundary is remounted. */
  resetKey: string;
  message: string;
  retryLabel: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundaryInner extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[Route] Failed to render route', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">{this.props.message}</p>
        <Button onClick={this.handleReload} variant="outline">
          {this.props.retryLabel}
        </Button>
      </div>
    );
  }
}

/**
 * Catches render-time throws from the lazily loaded routes.
 *
 * The common case is not a bug in a page but a stale chunk: a deploy rewrites the hashed filenames,
 * and a tab open across it fails its next dynamic import. Without a boundary that rejection unmounts
 * the whole tree, leaving a blank page, so the reload offered here is the actual fix for that case.
 *
 * The boundary sits inside the persistent layout and React never clears error state on its own, so
 * it is keyed on the pathname: navigating elsewhere remounts it and the user gets a working page
 * back instead of being stuck on the error panel for the rest of the session.
 */
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useTranslation('common');

  return (
    <RouteErrorBoundaryInner
      resetKey={location.pathname}
      key={location.pathname}
      message={t('common:error_loading')}
      retryLabel={t('common:retry')}
    >
      {children}
    </RouteErrorBoundaryInner>
  );
}

export default RouteErrorBoundary;
