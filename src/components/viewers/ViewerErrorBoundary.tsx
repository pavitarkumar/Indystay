'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  title: string;
  onClose: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ViewerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred while rendering the interactive view.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[IndiStay Viewer Error Boundary Caught]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[75] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            {this.props.title}
          </h3>
          <p className="text-slate-300 text-xs max-w-sm mb-6 leading-relaxed">
            Your graphics device or browser encountered an issue rendering this 3D experience. All regular room details, pricing, photos, and reservations remain fully available.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to Room Details</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
