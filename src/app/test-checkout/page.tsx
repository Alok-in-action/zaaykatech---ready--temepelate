'use client';

import React, { useState } from 'react';
import { RazorpayCheckoutButton } from '@/components/payment/RazorpayCheckoutButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TestCheckoutPage() {
  const [amountRupees, setAmountRupees] = useState<string>('2999');
  const [customerName, setCustomerName] = useState<string>('Test Restaurant Owner');
  const [customerEmail, setCustomerEmail] = useState<string>('owner@example.com');
  const [lastPayment, setLastPayment] = useState<any>(null);

  const amountPaise = Math.round((parseFloat(amountRupees) || 0) * 100);

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Razorpay Standard Web Checkout
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Checkout Test Bench
          </h1>
          <p className="text-sm text-muted-foreground">
            Test Razorpay order creation (`/api/create-order`), standard payment modal, and signature verification (`/api/verify-payment`).
          </p>
        </div>

        <Card className="shadow-md border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
            <CardDescription className="text-xs">
              Configure amount and customer metadata before opening the Razorpay modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium">
                Amount (₹ INR) — Minimum ₹1 (100 paise)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  className="pl-7"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Equivalent to {amountPaise} paise sent to Razorpay API.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium">
                  Customer Name
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">
                  Customer Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto">
                <div className="text-xs text-muted-foreground">Total Payable</div>
                <div className="text-2xl font-bold text-foreground">
                  ₹{parseFloat(amountRupees || '0').toLocaleString('en-IN')}
                </div>
              </div>

              <RazorpayCheckoutButton
                amount={amountPaise}
                currency="INR"
                name="ZaaykaTech"
                description={`Order payment of ₹${amountRupees}`}
                prefill={{
                  name: customerName,
                  email: customerEmail,
                }}
                buttonText={`Pay ₹${amountRupees} Now`}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold"
                onSuccess={(data) => {
                  setLastPayment(data);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {lastPayment && (
          <Card className="border-green-500/40 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Payment &amp; Signature Verified Successfully!
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs font-mono text-muted-foreground">
              <div>
                <strong className="text-foreground">Payment ID:</strong> {lastPayment.paymentId}
              </div>
              <div>
                <strong className="text-foreground">Order ID:</strong> {lastPayment.orderId}
              </div>
              <div className="truncate">
                <strong className="text-foreground">Signature:</strong> {lastPayment.signature}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <Link href="/owner/billing" className="hover:underline inline-flex items-center gap-1">
            <span>Back to Owner Billing</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
