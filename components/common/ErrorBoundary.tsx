import { COLORS } from "@/constants/Colors";
import { logError } from "@/utility";
import React, { Component, ReactNode } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Error Boundary Hook for functional components
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    logError("React Error Boundary", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Show user-friendly alert
    Alert.alert(
      "Something went wrong",
      "We encountered an unexpected error. Please try restarting the app.",
      [{ text: "OK" }]
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            We encountered an unexpected error. Please try again.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <Text style={styles.errorDetails}>
            Error: {this.state.error?.message || "Unknown error"}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export const useErrorBoundary = () => {
  const { handleError } = useErrorHandler();

  return {
    catchError: (error: Error, errorInfo?: { componentStack?: string }) => {
      handleError({
        type: "REACT_ERROR",
        message: error.message,
        originalError: error,
        context: {
          componentStack: errorInfo?.componentStack,
        },
      });
    },
  };
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorDetails: {
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default ErrorBoundary;
