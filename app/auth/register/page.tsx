"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setSuccessMessage(
          "Your Bokhoni account has been created successfully. You can now continue to your account."
        );
      } else {
        setSuccessMessage(
          "Your Bokhoni account has been created. Please check your email and confirm your email address before signing in."
        );
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(
        "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT PANEL */}
        <section className="hidden bg-[#101827] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#101827]">
              B
            </div>

            <h1 className="mt-8 text-3xl font-semibold tracking-tight">
              Bokhoni AI
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              From Ideas to Impact
            </p>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Innovation • Knowledge • Enterprise
            </p>

            <h2 className="text-4xl font-semibold leading-tight">
              Turn problems into possibilities.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Research problems, validate ideas, develop projects and build
              practical solutions through one intelligent innovation
              workspace.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">
                  Develop Projects
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Move from an early idea toward validation, prototyping and
                  implementation.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">
                  Explore Knowledge
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Access knowledge and guidance across different fields and
                  innovation challenges.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Bokhoni AI
          </p>
        </section>

        {/* REGISTRATION PANEL */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="mb-8 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
                B
              </div>

              <h1 className="mt-4 text-2xl font-semibold text-slate-950">
                Bokhoni AI
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                From Ideas to Impact
              </p>
            </div>

            {/* PAGE TITLE */}
            <div>
              <p className="text-sm font-medium text-slate-500">
                Get started
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Create your Bokhoni account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create an account to start conversations, develop projects,
                explore knowledge and manage your innovation journey.
              </p>
            </div>

            {/* REGISTRATION FORM */}
            <form onSubmit={handleRegister} className="mt-8 space-y-5">

              {/* FULL NAME */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Use at least 8 characters.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter your password again"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* ERROR MESSAGE */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              {/* SUCCESS MESSAGE */}
              {successMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
                >
                  {successMessage}

                  <div className="mt-3">
                    <Link
                      href="/auth/login"
                      className="font-semibold text-green-800 underline underline-offset-4"
                    >
                      Go to sign in
                    </Link>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#101827] px-4 font-medium text-white transition hover:bg-[#1c2738] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* LOGIN LINK */}
            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have a Bokhoni account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-slate-950 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* LANGUAGE PREVIEW */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              <span>English</span>
              <span>•</span>
              <span>Sesotho</span>
              <span>•</span>
              <span>More languages</span>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              By creating an account, you agree to use Bokhoni responsibly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}