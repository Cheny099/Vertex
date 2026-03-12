import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import i18next from 'i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class OrderStatsErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('OrderStats Error:', error, errorInfo);
    this.setState({ errorInfo: errorInfo?.componentStack || error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 space-y-4">
          <Card className="border-destructive bg-destructive/10 border-dashed shadow-lg">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2 text-xl">
                <AlertTriangle className="h-6 w-6" />
                {i18next.t('admin:render_error_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-destructive/80 leading-relaxed">
                {i18next.t('admin:render_error_desc')}
              </p>
              <div className="relative group">
                <pre className="bg-slate-950 text-slate-100 p-4 rounded-md text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap border border-slate-800 shadow-inner">
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo}
                </pre>
              </div>
              <Button variant="destructive" onClick={() => window.location.reload()} className="w-full sm:w-auto shadow-md">
                <RefreshCw className="h-4 w-4 mr-2" />
                {i18next.t('admin:refresh_page')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
