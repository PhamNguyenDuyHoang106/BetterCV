import { useAuthStore } from "./store/auth";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const buildHeaders = (token?: string | null) => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  };

  const requestWithToken = async (token?: string | null) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      headers: buildHeaders(token),
    });

  try {
    const token = useAuthStore.getState().accessToken;
    let response = await requestWithToken(token);

    // Attempt silent token refresh once on 401.
    if (response.status === 401 && typeof window !== "undefined") {
      try {
        const { createSupabaseClient } = await import("./supabase");
        const supabase = createSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const refreshedToken = session?.access_token || null;

        if (refreshedToken) {
          useAuthStore.setState({ accessToken: refreshedToken });
          response = await requestWithToken(refreshedToken);
        } else {
          useAuthStore.getState().clear();
        }
      } catch {
        useAuthStore.getState().clear();
      }
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        (body as { error?: { message?: string } }).error?.message ||
        (body as { message?: string }).message ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  } catch (err) {
    if (err instanceof Error && (err.name === "TypeError" || err.message.toLowerCase().includes("fetch"))) {
      throw new Error("Không thể kết nối đến máy chủ backend (NestJS). Vui lòng kiểm tra xem bạn đã khởi động NestJS API bằng lệnh 'npm run dev:api' chưa.");
    }
    throw err;
  }
};
