import { logError } from "@/utility";
import { useCallback } from "react";
import { Alert } from "react-native";

export type ErrorType =
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "LOCATION_ERROR"
  | "REACT_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage?: string;
  originalError?: Error | any;
  context?: Record<string, any>;
  timestamp?: Date;
  recoverable?: boolean;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: AppError) => void;
  clearError: (type?: ErrorType) => void;
  clearAllErrors: () => void;
  hasErrors: (type?: ErrorType) => boolean;
}

// Mock context for now - we'll create the full context next
const ErrorContext = {
  errors: [] as AppError[],
  addError: (error: AppError) => {
    console.warn("ErrorContext not yet implemented:", error);
  },
  clearError: () => {},
  clearAllErrors: () => {},
  hasErrors: () => false,
} as ErrorContextType;

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  API_ERROR: "There was an issue connecting to our servers. Please try again.",
  NETWORK_ERROR: "Please check your internet connection and try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  AUTH_ERROR: "Please sign in again to continue.",
  LOCATION_ERROR: "We couldn't access your location. Please check your location settings.",
  REACT_ERROR: "Something unexpected happened. Please try restarting the app.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

export const useErrorHandler = () => {
  const handleError = useCallback((error: AppError) => {
    const fullError: AppError = {
      timestamp: new Date(),
      recoverable: true,
      userMessage: ERROR_MESSAGES[error.type] || error.message,
      ...error,
    };

    // Log error for debugging
    logError(`${error.type}: ${error.message}`, {
      context: error.context,
      originalError: error.originalError,
      timestamp: fullError.timestamp,
    });

    // Add to error context
    ErrorContext.addError(fullError);

    // Show user-friendly message for critical errors
    if (!error.recoverable || error.type === "REACT_ERROR" || error.type === "UNKNOWN_ERROR") {
      Alert.alert(
        "Error",
        fullError.userMessage,
        [{ text: "OK" }]
      );
    }

    return fullError;
  }, []);

  const handleApiError = useCallback((error: any, context?: Record<string, any>) => {
    let errorType: ErrorType = "API_ERROR";
    let message = "API request failed";

    if (error?.message) {
      message = error.message;

      // Categorize API errors
      if (message.includes("Network Error") || message.includes("Failed to fetch")) {
        errorType = "NETWORK_ERROR";
      } else if (message.includes("401") || message.includes("Unauthorized")) {
        errorType = "AUTH_ERROR";
      } else if (message.includes("REQUEST_DENIED")) {
        message = "Google Maps API key issue. Please check your configuration.";
      } else if (message.includes("OVER_QUERY_LIMIT")) {
        message = "Too many requests. Please try again later.";
      }
    }

    return handleError({
      type: errorType,
      message,
      originalError: error,
      context,
    });
  }, [handleError]);

  const handleLocationError = useCallback((error: any, context?: Record<string, any>) => {
    return handleError({
      type: "LOCATION_ERROR",
      message: error?.message || "Location service error",
      originalError: error,
      context,
      recoverable: true,
    });
  }, [handleError]);

  const handleValidationError = useCallback((message: string, context?: Record<string, any>) => {
    return handleError({
      type: "VALIDATION_ERROR",
      message,
      context,
      recoverable: true,
    });
  }, [handleError]);

  const clearError = useCallback((type?: ErrorType) => {
    ErrorContext.clearError(type);
  }, []);

  const clearAllErrors = useCallback(() => {
    ErrorContext.clearAllErrors();
  }, []);

  const hasErrors = useCallback((type?: ErrorType) => {
    return ErrorContext.hasErrors(type);
  }, []);

  return {
    handleError,
    handleApiError,
    handleLocationError,
    handleValidationError,
    clearError,
    clearAllErrors,
    hasErrors,
    errors: ErrorContext.errors,
  };
};
