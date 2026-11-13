'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface RazorpayCheckoutButtonProps {
  amount?: number; // In paise (e.g. 299900 for ₹2,999)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  onSuccess?: (data: { paymentId: string; orderId: string; signature: string }) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function RazorpayCheckoutButton({
  amount = 299900, // ₹2,999 default
  currency = 'INR',
  name = 'ZaaykaTech',
  description = 'Yearly QR Menu Subscription',
  receipt,
  notes,
  prefill,
  buttonText = 'Pay with Razorpay',
  className = '',
  variant = 'default',
  onSuccess,
  onError,
  onDismiss,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamically load Razorpay checkout script if not present
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Call Backend to Create Order (POST /api/create-order)
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          receipt,
          notes,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        throw new Error(orderData.error || `Order creation failed (${createOrderRes.status})`);
      }

      const orderId = orderData.order_id || orderData.id;
      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!orderId) {
        throw new Error('No order_id returned by order creation endpoint');
      }

      // 2. Ensure Razorpay Checkout SDK is loaded
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your network connection.');
      }

      // 3. Configure Razorpay Standard Modal Options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name,
        description,
        order_id: orderId,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#8B4A27', // Brand amber/cinnamon
        },
        // Handler on payment success
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setLoading(true);
          try {
            // 4. Send all three values to verify signature (POST /api/verify-payment)
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                notes,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }

            setSuccessMessage(`Payment verified! ID: ${response.razorpay_payment_id}`);
            if (onSuccess) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
            }
          } catch (verifyErr: any) {
            const msg = verifyErr.message || 'Payment verification failed.';
            setErrorMessage(msg);
            if (onError) onError(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage('Payment cancelled by user.');
            if (onDismiss) onDismiss();
          },
        },
      };

      // 4. Open Razorpay Checkout Modal
      const rzpInstance = new window.Razorpay(options);

      // Handle payment.failed event
      rzpInstance.on('payment.failed', function (resp: any) {
        setLoading(false);
        const desc = resp.error?.description || resp.error?.reason || 'Payment failed or declined.';
        setErrorMessage(desc);
        if (onError) onError(desc);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Razorpay Checkout error:', err);
      const msg = err.message || 'Could not initiate Razorpay payment.';
      setErrorMessage(msg);
      if (onError) onError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1.5 items-start">
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Opening Checkout...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            <span>{buttonText}</span>
          </>
        )}
      </Button>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
