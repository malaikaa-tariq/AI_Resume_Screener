"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { createAccount, signIn } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(
    () =>
      [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password),
      ].filter(Boolean).length,
    [password],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (signup && name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError("Use at least 8 characters, uppercase, lowercase, and a number.");
      return;
    }
    if (signup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (signup && !accepted) {
      setError("Accept the terms and privacy notice.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (signup) {
        await createAccount(name, email, password);
      } else {
        await signIn(email, password);
      }
      router.push("/analyze");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="auth-form">
      <div className="auth-heading">
        <span className="auth-icon">
          <Icon name={signup ? "user" : "login"} size={25} />
        </span>
        <h1>{signup ? "Create your account" : "Welcome back"}</h1>
        <p>
          {signup
            ? "Save your profile, drafts, and analysis history."
            : "Continue managing your resumes and saved results."}
        </p>
      </div>

      {signup && (
        <label>
          Full name
          <span className="input-with-icon">
            <Icon name="user" size={18} />
            <input
              value={name}
              autoComplete="name"
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Your full name"
            />
          </span>
        </label>
      )}

      <label>
        Email address
        <span className="input-with-icon">
          <Icon name="mail" size={18} />
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="you@example.com"
          />
        </span>
      </label>

      <label>
        Password
        <span className="input-with-icon">
          <Icon name="login" size={18} />
          <input
            type={show ? "text" : "password"}
            value={password}
            autoComplete={signup ? "new-password" : "current-password"}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter password"
          />
          <button type="button" onClick={() => setShow((value) => !value)}>
            {show ? "Hide" : "Show"}
          </button>
        </span>

        {signup && password && (
          <span className="password-strength">
            {Array.from({ length: 5 }, (_, index) => (
              <i key={index} className={index < strength ? "active" : ""} />
            ))}
          </span>
        )}
      </label>

      {signup && (
        <label>
          Confirm password
          <span className="input-with-icon">
            <Icon name="check" size={18} />
            <input
              type={show ? "text" : "password"}
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => {
                setConfirm(event.target.value);
                setError("");
              }}
              placeholder="Repeat password"
            />
          </span>
        </label>
      )}

      {signup && (
        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>I agree to the Terms of Use and Privacy Policy.</span>
        </label>
      )}

      {error && <div className="error-banner">{error}</div>}

      <button
        type="submit"
        className="primary-button auth-submit"
        disabled={submitting}
      >
        {submitting ? "Please wait..." : signup ? "Create account" : "Log in"}
        <Icon name="arrow" size={18} />
      </button>

      <p className="auth-switch">
        {signup ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
