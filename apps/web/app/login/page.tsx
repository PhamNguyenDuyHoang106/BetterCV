"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState } = useForm<LoginForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError || !data.session) {
        setError(authError?.message ?? "Login failed");
        return;
      }

      // Sync user to backend and get profile
      const token = data.session.access_token;
      useAuthStore.setState({ accessToken: token });

      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/me");

      setAuth(token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Login</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            {...register("email", { required: true })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            {...register("password", { required: true })}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {formState.errors.email && (
          <p className="text-sm text-red-600">Email and password are required.</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
