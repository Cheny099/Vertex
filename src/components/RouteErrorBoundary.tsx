import React from 'react';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time throws from the lazily loaded routes.
 *
 * The common case is not a bug in a page but a stale chunk: a deploy rewrites the hashed filenames,
 * and a tab that has been open across it fails its next dynamic import. Without a boundary that
 * rejection escapes the Suspense boundary and unmounts the whole tree, leaving a blank page with no
 * way back, so the reload offered here is the actual fix for that case.
 */
export class RouteErrorBoundary extends React.Component<
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
        <p className="text-sm text-muted-foreground">
          This page failed to load. It may have been updated since you opened the app.
        </p>
        <Button onClick={this.handleReload} variant="outline">
          Reload
        </Button>
      </div>
    );
  }
}

export default RouteErrorBoundary;
