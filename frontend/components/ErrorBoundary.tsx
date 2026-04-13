'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="font-syne text-2xl font-bold text-dark mb-4">
              Something went wrong
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-dark text-white font-syne rounded-full hover:bg-periwinkle hover:text-dark transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}