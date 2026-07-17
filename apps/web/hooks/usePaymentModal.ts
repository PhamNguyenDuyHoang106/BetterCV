"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { syncSessionWithRetry } from "../lib/auth-session";
import { useEntitlementStore } from "../lib/store/entitlement";
import { useAuthStore } from "../lib/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentTier = "PRO" | "PREMIUM";

export type PaymentStatus =
  | "idle"
  | "creating"
  | "pending"
  | "polling"
  | "success"
  | "expired"
  | "error";

export interface PaymentSession {
  orderCode: number;
  checkoutUrl: string;
  paymentLinkId?: string | null;
  qrCode?: string | null;
  expireAt?: number | null;
  tier: PaymentTier;
  createdAt: number; // Date.now() when we created it locally
  bin?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  amount?: number | null;
  description?: string | null;
}

export interface UsePaymentModalReturn {
  isOpen: boolean;
  status: PaymentStatus;
  session: PaymentSession | null;
  errorMessage: string | null;
  /** Seconds remaining until QR expires. null if no expiry info. */
  secondsLeft: number | null;
  open: (tier: PaymentTier) => Promise<void>;
  close: () => void;
  regenerate: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Poll interval in milliseconds */
const POLL_INTERVAL_MS = 3000;

/** Maximum time (ms) to allow a payment session to be reused (15 minutes) */
const SESSION_REUSE_TTL_MS = 15 * 60 * 1000;

/** Default QR expiry in seconds if PayOS doesn't return one (15 minutes) */
const DEFAULT_EXPIRE_SECONDS = 15 * 60;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePaymentModal(): UsePaymentModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Refs to track polling and countdown without triggering re-renders
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);
  const currentSessionRef = useRef<PaymentSession | null>(null);

  const { accessToken } = useAuthStore();

  // ── Cleanup helpers ──────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, [stopPolling, stopCountdown]);

  // ── Countdown timer ──────────────────────────────────────────────────────

  const startCountdown = useCallback(
    (expireAt: number) => {
      stopCountdown();
      const tick = () => {
        const remaining = Math.max(0, Math.floor(expireAt - Date.now() / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          stopCountdown();
          stopPolling();
          setStatus("expired");
        }
      };
      tick();
      countdownTimerRef.current = setInterval(tick, 1000);
    },
    [stopCountdown, stopPolling],
  );

  // ── Post-payment success sync ────────────────────────────────────────────

  const handlePaymentSuccess = useCallback(async () => {
    setStatus("success");
    stopPolling();
    stopCountdown();

    try {
      // Retry syncing session until role changes from FREE (handles webhook delay)
      const profile = await syncSessionWithRetry(8, 2000);
      if (profile && accessToken) {
        // Refresh full entitlements: plan, features, quotas
        await useEntitlementStore.getState().fetchEntitlements(accessToken);
      }
    } catch (err) {
      console.error("[PaymentModal] Session sync after payment failed:", err);
    }

    // Close modal after brief success display
    setTimeout(() => {
      setIsOpen(false);
      setStatus("idle");
      setSession(null);
      currentSessionRef.current = null;
      setSecondsLeft(null);
    }, 2500);
  }, [stopPolling, stopCountdown, accessToken]);

  // ── Polling ──────────────────────────────────────────────────────────────

  const schedulePoll = useCallback(
    (orderCode: number) => {
      if (!isPollingRef.current) return;

      pollTimerRef.current = setTimeout(async () => {
        if (!isPollingRef.current) return;

        try {
          const res = await apiFetch<any>(
            `/billing/payos/confirm/${orderCode}`,
            { method: "POST" },
          );
          const data = res?.data ?? res;
          const payStatus: string = (data?.status ?? "").toLowerCase();

          if (payStatus === "paid") {
            await handlePaymentSuccess();
            return;
          }

          if (
            payStatus === "cancelled" ||
            payStatus === "canceled" ||
            payStatus === "expired"
          ) {
            setStatus("expired");
            stopPolling();
            stopCountdown();
            return;
          }

          // Still PENDING — schedule next poll
          if (isPollingRef.current) {
            schedulePoll(orderCode);
          }
        } catch (err) {
          console.warn("[PaymentModal] Poll error (will retry):", err);
          // Don't stop polling on network errors — just retry
          if (isPollingRef.current) {
            schedulePoll(orderCode);
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [handlePaymentSuccess, stopPolling, stopCountdown],
  );

  const startPolling = useCallback(
    (orderCode: number) => {
      stopPolling();
      isPollingRef.current = true;
      setStatus("polling");
      schedulePoll(orderCode);
    },
    [stopPolling, schedulePoll],
  );

  // ── Payment creation ─────────────────────────────────────────────────────

  const createPayment = useCallback(
    async (tier: PaymentTier): Promise<PaymentSession> => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = `${origin}/dashboard?paid=1`;
      const cancelUrl = `${origin}/dashboard`;

      const mode = tier === "PREMIUM" ? "payment" : "subscription";

      const res = await apiFetch<any>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ tier, mode, successUrl, cancelUrl }),
      });

      const payload = res?.data ?? res;
      console.log("[PaymentModal] createPayment payload:", payload);
      const checkoutUrl: string = payload?.checkoutUrl ?? payload?.url ?? "";
      if (!checkoutUrl) {
        throw new Error("PayOS did not return a checkout URL.");
      }

      // PayOS may return expireAt as unix seconds; fall back to 15 minutes from now
      const expireAt: number =
        payload?.expireAt ??
        payload?.expiredAt ??
        Math.floor(Date.now() / 1000) + DEFAULT_EXPIRE_SECONDS;

      const newSession: PaymentSession = {
        orderCode: payload.orderCode,
        checkoutUrl,
        paymentLinkId: payload.paymentLinkId ?? null,
        qrCode: payload.qrCode ?? null,
        expireAt,
        tier,
        createdAt: Date.now(),
        bin: payload.bin ?? null,
        accountNumber: payload.accountNumber ?? null,
        accountName: payload.accountName ?? null,
        amount: payload.amount ?? null,
        description: payload.description ?? null,
      };

      return newSession;
    },
    [],
  );

  // ── Reuse logic ──────────────────────────────────────────────────────────

  const isSessionReusable = useCallback(
    (s: PaymentSession, tier: PaymentTier): boolean => {
      if (s.tier !== tier) return false;
      if (status === "success" || status === "expired" || status === "error") return false;
      if (!s.accountNumber || !s.description || !s.qrCode) return false;
      const ageMs = Date.now() - s.createdAt;
      if (ageMs > SESSION_REUSE_TTL_MS) return false;
      // Check expireAt if available
      if (s.expireAt) {
        const remaining = s.expireAt - Date.now() / 1000;
        if (remaining <= 30) return false; // Less than 30s left → not worth reusing
      }
      return true;
    },
    [status],
  );

  // ── Public API ───────────────────────────────────────────────────────────

  const open = useCallback(
    async (tier: PaymentTier) => {
      // If modal already open with a valid session for same tier, just show it
      if (
        isOpen &&
        currentSessionRef.current &&
        isSessionReusable(currentSessionRef.current, tier)
      ) {
        return;
      }

      setIsOpen(true);
      setErrorMessage(null);

      // Reuse existing session if valid
      const existingSession = currentSessionRef.current;
      if (existingSession && isSessionReusable(existingSession, tier)) {
        setStatus("polling");
        if (existingSession.expireAt) {
          startCountdown(existingSession.expireAt);
        }
        startPolling(existingSession.orderCode);
        return;
      }

      // Create a new payment
      setStatus("creating");
      setSession(null);
      setSecondsLeft(null);
      stopPolling();
      stopCountdown();

      try {
        const newSession = await createPayment(tier);
        setSession(newSession);
        currentSessionRef.current = newSession;
        setStatus("pending");

        if (newSession.expireAt) {
          startCountdown(newSession.expireAt);
        }

        startPolling(newSession.orderCode);
      } catch (err: any) {
        console.error("[PaymentModal] Create payment failed:", err);
        setErrorMessage(err?.message ?? "Failed to create payment link.");
        setStatus("error");
      }
    },
    [
      isOpen,
      isSessionReusable,
      createPayment,
      startCountdown,
      startPolling,
      stopPolling,
      stopCountdown,
    ],
  );

  const close = useCallback(() => {
    // Do NOT cancel the payment — just close the modal.
    // The webhook will still fire and the backend will process it.
    // Polling stops to avoid background noise, but the session is kept so
    // if the user reopens, we can reuse the same link.
    stopPolling();
    stopCountdown();
    setIsOpen(false);
    // Keep session alive in currentSessionRef for potential reuse
    // but reset visual status to idle
    setStatus("idle");
    setSecondsLeft(null);
  }, [stopPolling, stopCountdown]);

  const regenerate = useCallback(async () => {
    if (!currentSessionRef.current) return;
    const tier = currentSessionRef.current.tier;

    // Clear old session so we force a new payment creation
    currentSessionRef.current = null;
    setSession(null);
    setSecondsLeft(null);
    setErrorMessage(null);

    await open(tier);
  }, [open]);

  return {
    isOpen,
    status,
    session,
    errorMessage,
    secondsLeft,
    open,
    close,
    regenerate,
  };
}
