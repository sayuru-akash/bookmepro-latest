// app/components/usePaymentStatusCheck.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// 10 minutes = 600,000 ms
const CHECK_INTERVAL = 10 * 60 * 1000; 

export function usePaymentStatusCheck() {
  const [isLocked, setIsLocked] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  const checkStatus = useCallback(async () => {
    // Don't check if user is not authenticated
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setIsLocked(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/cron/check-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsLocked(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      const { paymentStatus: currentStatus, isAllowed } = data;
      
      setPaymentStatus(currentStatus);
      setIsLocked(!isAllowed);
      setIsLoading(false);

      // Log status for debugging
      console.log(`Payment status check: ${currentStatus}, Allowed: ${isAllowed}`);

    } catch (error) {
      console.error("Payment status check failed:", error);
      // On error, lock the UI for security
      setIsLocked(true);
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    // Initial check when component mounts or session changes
    checkStatus();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkStatus, CHECK_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [checkStatus]);

  // Also check when the window becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkStatus]);

  return { 
    isLocked, 
    paymentStatus, 
    isLoading,
    recheckStatus: checkStatus 
  };
}