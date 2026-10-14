import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Mail, Phone } from 'lucide-react';
import { MANAGEMENT_DEMO_ATTRIBUTION } from '../types/business.ts';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error locally in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { creator } = MANAGEMENT_DEMO_ATTRIBUTION;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] flex items-center justify-center p-4 font-sans"
        >
          <div className="max-w-md w-full bg-[#131B26] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                {this.props.fallbackTitle || 'Application Error Encountered'}
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                An unexpected runtime error occurred. You can reload the page or reset the application state to continue.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-rose-300 text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <p className="text-slate-300 font-medium">Concept Platform by {creator.name}</p>
              <div className="flex items-center justify-center gap-4 text-[11px]">
                <a href={creator.phoneHref} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  {creator.phone}
                </a>
                <a href={creator.emailHref} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  {creator.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
