
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const form = event.currentTarget;
    const data = Object.fromEntries(
      new FormData(form)
    );

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          action: "login",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to sign in"
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth card">
      <div className="eyebrow">
        Contractor operations
      </div>

      <h1>1099 Time Track</h1>

      <p className="muted">
        Sign in to access your time tracking
        account.
      </p>

      <form
        onSubmit={submit}
        className="stack"
      >
        <label className="field">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
        </label>

        <label className="field">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </label>

        {error && (
          <div
            className="notice error"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          className="btn"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>

      <p className="muted">
        Need an account? Contact your
        administrator.
      </p>
    </main>
  );
}
