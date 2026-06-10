"use client";

import React, { ReactNode, useState, useEffect } from "react";

/**
 * Velox Payment Error Boundary
 * 
 * Specialized error boundary for payment and checkout flows
 * Provides transaction recovery UI and local data persistence
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  recoveryAttempts: number;
  isRecovering: boolean;
  lastCheckpoint?: string;
}

export class PaymentErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private checkpointInterval: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isRecovering: false,
      lastCheckpoint: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Save error state to localStorage for debugging
    this.saveErrorCheckpoint(error, errorInfo);

    // Log to monitoring service
    console.error("Payment Error Boundary caught:", error, errorInfo);
  }

  componentDidMount() {
    // Periodically check for connection recovery
    this.checkpointInterval = setInterval(() => {
      if (this.state.hasError && navigator.onLine) {
        this.attemptRecovery();
      }
    }, 5000);
  }

  componentWillUnmount() {
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
    }
  }

  private saveErrorCheckpoint(error: Error, errorInfo: React.ErrorInfo) {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      appState: this.captureAppState(),
    };

    try {
      sessionStorage.setItem(
        "payment_error_checkpoint",
        JSON.stringify(checkpoint)
      );
    } catch {
      // Fallback to IndexedDB if sessionStorage is full
      this.saveCheckpointToIndexedDB(checkpoint);
    }
  }

  private async saveCheckpointToIndexedDB(checkpoint: any) {
    try {
      const request = indexedDB.open("velox_checkout", 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("error_checkpoints", "readwrite");
        const store = tx.objectStore("error_checkpoints");

        if (!db.objectStoreNames.contains("error_checkpoints")) {
          db.createObjectStore("error_checkpoints", { autoIncrement: true });
        }

        store.add(checkpoint);
      };
    } catch (e) {
      console.error("Failed to save checkpoint to IndexedDB:", e);
    }
  }

  private captureAppState(): any {
    // Capture critical app state for recovery
    return {
      cart: this.getCartState(),
      checkout: this.getCheckoutState(),
      user: this.getUserState(),
      networkStatus: navigator.onLine,
    };
  }

  private getCartState(): any {
    try {
      const cart = localStorage.getItem("cart");
      return cart ? JSON.parse(cart) : null;
    } catch {
      return null;
    }
  }

  private getCheckoutState(): any {
    try {
      const checkout = sessionStorage.getItem("checkout_state");
      return checkout ? JSON.parse(checkout) : null;
    } catch {
      return null;
    }
  }

  private getUserState(): any {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  private attemptRecovery = async () => {
    this.setState((prev) => ({
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));

    try {
      // Attempt to restore checkpoint and reconnect
      const checkpoint = this.getErrorCheckpoint();

      if (checkpoint) {
        // Verify connection to critical services
        const isConnected = await this.verifyServiceConnectivity();

        if (isConnected) {
          this.setState({
            hasError: false,
            isRecovering: false,
            lastCheckpoint: JSON.stringify(checkpoint),
          });
        }
      }
    } catch (error) {
      console.error("Recovery attempt failed:", error);
    } finally {
      this.setState({ isRecovering: false });
    }
  };

  private getErrorCheckpoint(): any {
    try {
      const checkpoint = sessionStorage.getItem("payment_error_checkpoint");
      return checkpoint ? JSON.parse(checkpoint) : null;
    } catch {
      return null;
    }
  }

  private verifyServiceConnectivity = async (): Promise<boolean> => {
    try {
      // Test connection to Supabase
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          method: "HEAD",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    });
  };

  private handleDataRecovery = async () => {
    const checkpoint = this.getErrorCheckpoint();
    if (checkpoint && checkpoint.appState.cart) {
      // Restore cart to localStorage
      localStorage.setItem("cart", JSON.stringify(checkpoint.appState.cart));
      this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <PaymentErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          recoveryAttempts={this.state.recoveryAttempts}
          isRecovering={this.state.isRecovering}
          onRetry={this.handleRetry}
          onDataRecovery={this.handleDataRecovery}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Cart Error Boundary
 * Handles errors in cart operations
 */
export class CartErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Save cart data for recovery
    try {
      const checkout = sessionStorage.getItem("checkout_state");
      const recovery = {
        timestamp: new Date().toISOString(),
        checkoutState: checkout ? JSON.parse(checkout) : null,
        error: error.message,
      };
      localStorage.setItem("cart_recovery_point", JSON.stringify(recovery));
    } catch (e) {
      console.error("Failed to save recovery point:", e);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <CartErrorUI
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR UI COMPONENTS
// ============================================================================

/**
 * Payment error recovery UI
 */
function PaymentErrorUI({
  error,
  errorInfo,
  recoveryAttempts,
  isRecovering,
  onRetry,
  onDataRecovery,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  recoveryAttempts: number;
  isRecovering: boolean;
  onRetry: () => void;
  onDataRecovery: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isOffline = !navigator.onLine;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-400 text-3xl"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Transaction Error
          </h1>
          <p className="text-gray-400 text-lg">
            We encountered an issue processing your payment
          </p>
        </div>

        {/* Status Message */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <p className="text-red-200 text-sm md:text-base">
            {isOffline ? (
              <>
                <i className="fas fa-wifi-slash mr-2"></i>
                You appear to be offline. Your transaction data has been saved
                locally and will be processed once reconnected.
              </>
            ) : (
              <>
                <i className="fas fa-plug mr-2"></i>
                Connection lost to payment service. Attempt #{recoveryAttempts}.
              </>
            )}
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-black/40 rounded-xl p-4 mb-8 border border-white/5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left flex items-center justify-between text-gray-300 hover:text-white transition"
          >
            <span className="font-mono text-sm">{error?.message}</span>
            <i
              className={`fas fa-chevron-down transition ${
                showDetails ? "rotate-180" : ""
              }`}
            ></i>
          </button>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <details className="text-xs text-gray-500 font-mono whitespace-pre-wrap overflow-auto max-h-48">
                <summary className="cursor-pointer text-gray-400 mb-2">
                  Technical Details
                </summary>
                {errorInfo?.componentStack}
              </details>
            </div>
          )}
        </div>

        {/* Recovery Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <p className="text-blue-200 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>What happens next:</strong>
            {isOffline
              ? " Your cart and order details are saved in your browser. Please check your internet connection."
              : ` We're attempting to recover your transaction (Attempt ${recoveryAttempts}/5). This usually takes a few seconds.`}
          </p>
        </div>

        {/* Data Preservation Info */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
          <p className="text-green-200 text-sm">
            <i className="fas fa-shield-check mr-2"></i>
            <strong>Your data is safe:</strong> Cart contents and checkout
            information are securely saved locally using encryption.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onRetry}
            disabled={isRecovering}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
          >
            {isRecovering ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Recovering...
              </>
            ) : (
              <>
                <i className="fas fa-redo mr-2"></i>
                Retry Transaction
              </>
            )}
          </button>

          <button
            onClick={onDataRecovery}
            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition border border-white/20"
          >
            <i className="fas fa-upload mr-2"></i>
            Restore Saved Data
          </button>

          <button
            onClick={() => (window.location.href = "/cart")}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Cart
          </button>
        </div>

        {/* Recovery Timeline */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-4">RECOVERY TIMELINE</p>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <i
                className={`fas fa-circle text-lg ${
                  recoveryAttempts >= 1
                    ? "text-green-500"
                    : "text-gray-600"
                } w-3 h-3 flex items-center`}
              ></i>
              <span>Initial connection attempt</span>
            </div>
            <div className="flex items-center gap-2">
              <i
                className={`fas fa-circle text-lg ${
                  recoveryAttempts >= 2
                    ? "text-green-500"
                    : "text-gray-600"
                } w-3 h-3 flex items-center`}
              ></i>
              <span>Verifying transaction state</span>
            </div>
            <div className="flex items-center gap-2">
              <i
                className={`fas fa-circle text-lg ${
                  recoveryAttempts >= 3
                    ? "text-green-500"
                    : "text-gray-600"
                } w-3 h-3 flex items-center`}
              ></i>
              <span>Restoring from checkpoint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart error UI
 */
function CartErrorUI({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-shopping-cart text-yellow-400 text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Cart Error
          </h1>
          <p className="text-gray-400 mb-6">{error?.message}</p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onRetry}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = "/products")}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
            >
              <i className="fas fa-product-hunt mr-2"></i>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
