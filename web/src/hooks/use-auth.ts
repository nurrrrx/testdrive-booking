'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import type { User } from '@/types';

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
    onSuccess: () => {
      toast.success('OTP sent to your phone');
    },
    onError: () => {
      toast.error('Failed to send OTP. Please try again.');
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      authApi.verifyOtp(phone, otp),
    onSuccess: (response) => {
      const { accessToken, user } = response.data;
      setAuth(user as User, accessToken);
      toast.success('Login successful!');
      router.push('/');
    },
    onError: () => {
      toast.error('Invalid OTP. Please try again.');
    },
  });
}

export function useStaffLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.staffLogin(email, password),
    onSuccess: (response) => {
      const { accessToken, user } = response.data;
      setAuth(user as User, accessToken);
      toast.success('Login successful!');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };
}