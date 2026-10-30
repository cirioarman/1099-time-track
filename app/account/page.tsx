
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError(
        "Your new password must contain at least 12 characters."
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        "/api/account/password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Your password has been changed successfully."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="card"
      style={{
        maxWidth: 650,
        margin: "30px auto",
        padding: 30,
      }}
    >
      <div className="eyebrow">
        Account Security
      </div>

      <h1>Account Settings</h1>

      <p className="muted">
        Update your account password to keep
        your information secure.
      </p>

      <form
        onSubmit={handleSubmit}
        className="stack"
      >
        <label className="field">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
            required
          />
        </label>

        <label className="field">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            minLength={12}
            maxLength={128}
            required
          />
        </label>

        <label className="field">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            minLength={12}
            maxLength={128}
            required
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

        {success && (
          <div
            className="notice"
            role="status"
          >
            {success}
          </div>
        )}

        <button
          className="btn"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Updating password..."
            : "Change password"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your password was changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to change password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="card"
      style={{
        maxWidth: 650,
        margin: "30px auto",
        padding: 30,
      }}
    >
      <div className="eyebrow">Account Security</div>
      <h1>Account Settings</h1>

      <p className="muted">
        Change your password to keep your account secure.
      </p>

      <form onSubmit={handleSubmit} className="stack">
        <label className="field">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>

        <label className="field">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={12}
            maxLength={128}
            required
          />
        </label>

        <label className="field">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={12}
            maxLength={128}
            required
          />
        </label>

        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="notice" role="status">
            {success}
          </div>
        )}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Updating password..." : "Change password"}
        </button>
      </form>
    </main>
  );
}
