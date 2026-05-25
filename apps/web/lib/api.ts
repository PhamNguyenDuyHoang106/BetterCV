import { useAuthStore } from "./store/auth";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(options.headers);

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(body.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (err) {
    if (err instanceof Error && (err.name === "TypeError" || err.message.toLowerCase().includes("fetch"))) {
      throw new Error("Không thể kết nối đến máy chủ backend (NestJS). Vui lòng kiểm tra xem bạn đã khởi động NestJS API bằng lệnh 'npm run dev:api' chưa.");
    }
    throw err;
  }
};
