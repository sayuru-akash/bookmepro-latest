// app/components/DashboardWrapper.js
"use client";

import { usePaymentStatusCheck } from './usePaymentStatusCheck';
import SubscriptionModal from './SubscriptionModal';

export default function DashboardWrapper({ children }) {
  const { isLocked, paymentStatus, isLoading } = usePaymentStatusCheck();

  // Show loading spinner while checking initial status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SubscriptionModal isOpen={isLocked} paymentStatus={paymentStatus} />
    </>
  );
}