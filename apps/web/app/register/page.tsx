"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store/auth";

type RegisterForm = {
  fullName: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const { register, handleSubmit, formState } = useForm<RegisterForm>();

  const onSubmit = async (values: RegisterForm) => {
    const result = await apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(values)
      }
    );
    setTokens(result.accessToken, result.refreshToken);
    router.push("/dashboard");
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
        {formState.errors.email && (
          <p className="text-sm text-red-600">All fields are required.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Create account
        </button>
      </form>
    </main>
  );
}
