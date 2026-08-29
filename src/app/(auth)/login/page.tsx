"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Accessibility,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
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
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    setIsLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = login(data.email, data.password);

    if (success) {
      router.push("/dashboard");
    } else {
      setError(
        "Invalid email or password. Please check your credentials and try again."
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (hidden on small screens) */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-dark lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="mx-auto max-w-md px-8 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Accessibility className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Persons with Disabilities
          </h1>
          <h2 className="mb-6 text-2xl font-semibold text-white/90">
            Management Information System
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            A comprehensive platform for managing registration, services, and
            support for persons with disabilities across the nation.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="mt-1 text-xs text-white/60">Registered</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">25</p>
              <p className="mt-1 text-xs text-white/60">Districts</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">340+</p>
              <p className="mt-1 text-xs text-white/60">DS Divisions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 dark:bg-gray-950 lg:w-1/2">
        {/* Mobile Header */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Accessibility className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white">
            MIS
          </h1>
          <p className="text-xs text-text-muted dark:text-gray-400">
            Persons with Disabilities Management
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-text-muted dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-primary dark:text-gray-300"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-text-muted dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={cn(
                    "block w-full rounded-xl border bg-surface py-2.5 pl-10 pr-3.5 text-sm text-text-primary placeholder:text-text-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                    errors.email
                      ? "border-error focus:border-error"
                      : "border-border focus:border-primary dark:border-gray-700"
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-primary dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-text-muted dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={cn(
                    "block w-full rounded-xl border bg-surface py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
                    errors.password
                      ? "border-error focus:border-error"
                      : "border-border focus:border-primary dark:border-gray-700"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted transition-colors hover:text-text-primary dark:text-gray-500 dark:hover:text-gray-300"
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
                <p className="mt-1.5 text-xs text-error">
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
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 dark:border-gray-600"
                />
                <span className="text-sm text-text-muted dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary-dark"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-xs font-medium text-text-muted dark:text-gray-400">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-text-primary dark:text-gray-300">
              <p>
                <span className="font-medium">Admin:</span>{" "}
                admin@example.com
              </p>
              <p>
                <span className="font-medium">Operator:</span>{" "}
                nirosha@example.com
              </p>
              <p className="text-text-muted dark:text-gray-500">
                Password: any 6+ characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
