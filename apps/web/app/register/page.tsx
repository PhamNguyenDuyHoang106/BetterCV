"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { register, handleSubmit, formState } = useForm<RegisterForm>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
        },
      });

      if (authError || !data.session) {
        setError(authError?.message ?? "Registration failed. Check your email for confirmation.");
        return;
      }

      // Sync user to backend
      const token = data.session.access_token;
      useAuthStore.setState({ accessToken: token });

      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/sync", {
        method: "POST",
        body: JSON.stringify({ fullName: values.fullName }),
      });

      setAuth(token, profile);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input
            type="text"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            {...register("fullName", { required: true })}
          />
        </div>
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
            {...register("password", { required: true, minLength: 6 })}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {formState.errors.fullName && (
          <p className="text-sm text-red-600">All fields are required.</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}
