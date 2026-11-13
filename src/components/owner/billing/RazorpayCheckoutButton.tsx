'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CreditCard } from 'lucide-react';
import { createSubscriptionOrder, activateSubscriptionPayment, getSubscriptionStatus } from '@/actions/subscription';

interface RazorpayCheckoutButtonProps {
  restaurantId?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  label?: string;
  onSuccess?: (endDate: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Polls server getSubscriptionStatus for up to 30 seconds (15 attempts * 2s).
 * Strictly confirms activation by comparing the stored subscription end date
 * with the exact end date returned for this activation.
 * Does not accept an arbitrary existing date or active status.
 */
async function pollForSubscriptionActive(
  restaurantId: string,
  expectedEndDate: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await getSubscriptionStatus(restaurantId);
    if (
      statusRes.success &&
      statusRes.data &&
      statusRes.data.subscriptionEndDate === expectedEndDate
    ) {
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

export function RazorpayCheckoutButton({
  restaurantId,
  className = '',
  variant = 'default',
  label = 'Upgrade to Yearly (₹2,999/yr)',
  onSuccess,
}: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmedEndDate, setConfirmedEndDate] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!restaurantId || restaurantId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Please select or create your restaurant first.');
      }

      // 1. Create order on server
      const orderRes = await createSubscriptionOrder(restaurantId);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error || 'Failed to create payment order.');
      }

      const { orderId, amountPaise, keyId, restaurantName, userEmail } = orderRes.data;

      // In local development / test mock mode
      if (keyId === 'placeholder_razorpay_key_id' || orderId.startsWith('order_mock_')) {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSig = `mock_sig_${Date.now()}`;
        const activateRes = await activateSubscriptionPayment({
          restaurantId,
          orderId,
          paymentId: mockPaymentId,
          signature: mockSig,
        });

        if (!activateRes.success) {
          throw new Error(activateRes.error || 'Activation failed');
        }

        if (onSuccess && activateRes.data) {
          onSuccess(activateRes.data.subscriptionEndDate);
        } else {
          window.location.reload();
        }
        return;
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'ZaaykaTech',
        description: `Yearly QR Menu Subscription for ${restaurantName}`,
        order_id: orderId,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#8B4A27',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(true);
          setPollingStatus('Verifying payment signature...');
          try {
            const actRes = await activateSubscriptionPayment({
              restaurantId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (!actRes.success || !actRes.data) {
              throw new Error(actRes.error || 'Subscription activation failed.');
            }

            const targetEndDate = actRes.data.subscriptionEndDate;
            setConfirmedEndDate(targetEndDate);

            // 4. Poll server up to 30s for subscription active confirmation matching exact end date
            setPollingStatus('Activating your yearly subscription...');
            const isConfirmed = await pollForSubscriptionActive(restaurantId, targetEndDate, 15, 2000);

            if (!isConfirmed) {
              setPendingConfirmation(true);
              setError('Payment received, confirming');
              // DO NOT call onSuccess or navigate to /owner on polling timeout
              return;
            }

            setPendingConfirmation(false);
            if (onSuccess && actRes.data) {
              onSuccess(targetEndDate);
            }

            // Always navigate owner directly to management dashboard after successful payment
            router.push('/owner');
            router.refresh();
          } catch (err: any) {
            setError(err.message || 'Payment completed but activation failed. Contact support.');
          } finally {
            setLoading(false);
            setPollingStatus(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPollingStatus(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setError(response.error?.description || 'Payment was declined or failed.');
        setLoading(false);
        setPollingStatus(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not launch payment modal.');
      setLoading(false);
      setPollingStatus(null);
    }
  };

  const handleRetryConfirmation = async () => {
    if (!restaurantId || !confirmedEndDate) return;
    setError(null);
    setLoading(true);
    setPollingStatus('Confirming activation...');
    try {
      const isConfirmed = await pollForSubscriptionActive(restaurantId, confirmedEndDate, 10, 1500);
      if (!isConfirmed) {
        setError('Payment received, confirming');
        return;
      }

      setPendingConfirmation(false);
      if (onSuccess) {
        onSuccess(confirmedEndDate);
      }
      router.push('/owner');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm status.');
    } finally {
      setLoading(false);
      setPollingStatus(null);
    }
  };

  if (pendingConfirmation) {
    return (
      <div className="inline-flex flex-col items-start gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100"
          onClick={handleRetryConfirmation}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>{pollingStatus || 'Checking...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2 text-amber-600" />
              <span>Retry Confirmation</span>
            </>
          )}
        </Button>
        <span className="text-[11px] text-amber-800 font-medium">Payment received, confirming</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>{pollingStatus || 'Processing...'}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            <span>{label}</span>
          </>
        )}
      </Button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}
