"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Heart,
  AlertCircle,
  Loader2,
  Shield,
  BarChart3,
  Users,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const loginSchema = z.object({
  login: z
    .string()
    .min(1, "Email, username or employee code is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  { icon: Shield, label: "Secure Data Protection" },
  { icon: Users, label: "Centralized User Management" },
  { icon: BarChart3, label: "Real-time Analytics & Reports" },
  { icon: MapPin, label: "Island-wide Coverage" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    clearError();
    setIsLoading(true);

    const success = await login(data.login, data.password);

    if (success) {
      router.push("/dashboard");
    } else {
      setError(
        "Invalid credentials. Please check and try again."
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-[#1A1D2E] via-[#252836] to-[#0F1117] lg:flex lg:flex-col lg:items-center lg:justify-center dark:from-[#1A1D2E] dark:via-[#252836] dark:to-[#0F1117]">
        <div className="mx-auto max-w-md px-8 text-center">
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B00] shadow-lg shadow-[#FF6B00]/20">
            <Heart className="h-8 w-8 text-white" />
          </div>

          {/* Brand Name */}
          <h1 className="mb-2 text-3xl font-bold text-white">
            IntraFlow
          </h1>
          <p className="mb-8 text-sm font-medium tracking-wider text-[#FF6B00] uppercase">
            Persons with Disabilities Management System
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF6B00]/10">
                  <feature.icon className="h-4 w-4 text-[#FF6B00]" />
                </div>
                <span className="text-sm text-white/80">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold text-[#FF6B00]">10K+</p>
              <p className="mt-0.5 text-[10px] text-white/40">Registered Users</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold text-[#FF6B00]">25</p>
              <p className="mt-0.5 text-[10px] text-white/40">Districts</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
              <p className="text-xl font-bold text-[#FF6B00]">340+</p>
              <p className="mt-0.5 text-[10px] text-white/40">DS Divisions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[#F5F5F5] px-6 py-12 dark:bg-[#0F1117] lg:w-1/2">
        {/* Theme Toggle - Top Right */}
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        {/* Mobile Header */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B00] shadow-lg shadow-[#FF6B00]/20">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            IntraFlow
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PWD Management System
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || authError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Login Field */}
            <div>
              <label
                htmlFor="login"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email, Username or Employee Code
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="login"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter email, username or code"
                  {...register("login")}
                  className={cn(
                    "block w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 dark:bg-[#1A1D2E] dark:text-white dark:placeholder:text-gray-500",
                    errors.login
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-[#FF6B00] dark:border-white/10"
                  )}
                />
              </div>
              {errors.login && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.login.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={cn(
                    "block w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 dark:bg-[#1A1D2E] dark:text-white dark:placeholder:text-gray-500",
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-[#FF6B00] dark:border-white/10"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]/30 dark:border-white/20"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-[#FF6B00] hover:text-[#E55A00]"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#E55A00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-[#0F1117]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            © 2026 IntraFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
