import { Component, type ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import i18next from 'i18next';
import { AlertTriangle } from 'lucide-react';

import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
};

export class AuditErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('TurboFlowAudit Error:', error, errorInfo);
    this.setState({ errorInfo: errorInfo?.componentStack || error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-4">
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {i18next.t('admin:render_error_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{i18next.t('admin:render_error_desc')}</p>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo}
              </pre>
              <Button onClick={() => window.location.reload()}>{i18next.t('admin:refresh_page')}</Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
