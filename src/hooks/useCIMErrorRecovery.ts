
import { useState, useCallback } from 'react';

interface CIMError {
  type: 'network' | 'parsing' | 'authentication' | 'validation' | 'timeout' | 'unknown';
  message: string;
  agent?: string;
  retryable: boolean;
  recoveryAction?: string;
}

interface ErrorRecoveryState {
  errors: CIMError[];
  retryCount: number;
  isRecovering: boolean;
  maxRetries: number;
}

export function useCIMErrorRecovery() {
  const [recoveryState, setRecoveryState] = useState<ErrorRecoveryState>({
    errors: [],
    retryCount: 0,
    isRecovering: false,
    maxRetries: 3
  });

  const classifyError = useCallback((error: Error | string, agent?: string): CIMError => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return {
        type: 'network',
        message: errorMessage,
        agent,
        retryable: true,
        recoveryAction: 'Check network connection and retry'
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return {
        type: 'authentication',
        message: errorMessage,
        agent,
        retryable: false,
        recoveryAction: 'Please log in again'
      };
    }
    
    // Parsing errors
    if (errorMessage.includes('parse') || errorMessage.includes('JSON') || errorMessage.includes('syntax')) {
      return {
        type: 'parsing',
        message: errorMessage,
        agent,
        retryable: true,
        recoveryAction: 'Retry with different parsing strategy'
      };
    }
    
    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('format')) {
      return {
        type: 'validation',
        message: errorMessage,
        agent,
        retryable: false,
        recoveryAction: 'Check file format and try again'
      };
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
      return {
        type: 'timeout',
        message: errorMessage,
        agent,
        retryable: true,
        recoveryAction: 'The operation timed out. Please try again.'
      };
    }
    
    // Unknown errors
    return {
      type: 'unknown',
      message: errorMessage,
      agent,
      retryable: true,
      recoveryAction: 'An unexpected error occurred. Please try again.'
    };
  }, []);

  const handleError = useCallback(async (error: Error | string, agent?: string): Promise<CIMError> => {
    const cimError = classifyError(error, agent);
    
    setRecoveryState(prev => ({
      ...prev,
      errors: [...prev.errors, cimError]
    }));
    
    console.error(`CIM Processing Error [${cimError.type}]${agent ? ` in ${agent}` : ''}:`, cimError.message);
    
    return cimError;
  }, [classifyError]);

  const attemptRecovery = useCallback(async (
    retryFunction: () => Promise<void>,
    error: CIMError
  ): Promise<boolean> => {
    if (!error.retryable || recoveryState.retryCount >= recoveryState.maxRetries) {
      console.log('Error not retryable or max retries reached');
      return false;
    }

    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      retryCount: prev.retryCount + 1
    }));

    try {
      console.log(`Attempting recovery (attempt ${recoveryState.retryCount + 1}/${recoveryState.maxRetries})`);
      
      // Add delay for network issues
      if (error.type === 'network' || error.type === 'timeout') {
        await new Promise(resolve => setTimeout(resolve, 2000 * recoveryState.retryCount));
      }
      
      await retryFunction();
      
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false
      }));
      
      console.log('Recovery successful');
      return true;
    } catch (retryError) {
      console.error('Recovery attempt failed:', retryError);
      
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false
      }));
      
      return false;
    }
  }, [recoveryState.retryCount, recoveryState.maxRetries]);

  const resetErrorState = useCallback(() => {
    setRecoveryState({
      errors: [],
      retryCount: 0,
      isRecovering: false,
      maxRetries: 3
    });
  }, []);

  const getLastError = useCallback((): CIMError | null => {
    return recoveryState.errors.length > 0 ? recoveryState.errors[recoveryState.errors.length - 1] : null;
  }, [recoveryState.errors]);

  return {
    recoveryState,
    handleError,
    attemptRecovery,
    resetErrorState,
    getLastError
  };
}
