'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useSendOtp, useVerifyOtp } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export function CustomerLoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setPhone(values.phone);
    await sendOtp.mutateAsync(values.phone);
    setStep('otp');
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    await verifyOtp.mutateAsync({ phone, otp: values.otp });
  };

  if (step === 'otp') {
    return (
      <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">Enter OTP</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to {phone}
            </p>
          </div>

          <FormField
            control={otpForm.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
            {verifyOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify OTP
          </Button>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('phone')}
            >
              Change number
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => sendOtp.mutate(phone)}
              disabled={sendOtp.isPending}
            >
              Resend OTP
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...phoneForm}>
      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
        <FormField
          control={phoneForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+971 50 123 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={sendOtp.isPending}>
          {sendOtp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send OTP
        </Button>
      </form>
    </Form>
  );
}