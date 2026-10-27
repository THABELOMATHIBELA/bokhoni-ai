"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT SIDE */}
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
            <h2 className="text-4xl font-semibold leading-tight">
              Build ideas.
              <br />
              Validate solutions.
              <br />
              Create impact.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              An intelligent innovation and enterprise platform designed to
              support research, problem solving, entrepreneurship and practical
              innovation.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Bokhoni AI
          </p>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
                B
              </div>

              <h1 className="mt-4 text-2xl font-semibold text-slate-950">
                Bokhoni AI
              </h1>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Sign in to Bokhoni
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Continue to your projects, conversations and innovation
                workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-slate-600 hover:text-slate-950"
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#101827] px-4 font-medium text-white transition hover:bg-[#1c2738] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                New to Bokhoni?{" "}
                <span className="font-medium text-slate-900">
                  Create an account
                </span>
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-400">
              <span>English</span>
              <span>•</span>
              <span>Sesotho</span>
              <span>•</span>
              <span>More languages</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}