
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Compatible with Next.js 16 Cache Components.
// Do not add "dynamic = force-dynamic" here.
export const instant = false;

const infrastructure = [
  {
    title: "Document Processing",
    description:
      "Extract readable content from PDF, Word and text documents.",
  },
  {
    title: "Knowledge Organization",
    description:
      "Organize information by domain, topic, language and source.",
  },
  {
    title: "AI Knowledge Retrieval",
    description:
      "Retrieve relevant information to support evidence-based AI responses.",
  },
  {
    title: "Source Verification",
    description:
      "Track information sources and support reliable AI answers.",
  },
];

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
              B
            </div>

            <p className="text-lg font-semibold">
              Loading Knowledge Management...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Checking your Bokhoni AI administrator access.
            </p>
          </div>
        </main>
      }
    >
      <KnowledgeContent />
    </Suspense>
  );
}

async function KnowledgeContent() {
  // Wait for the actual request before accessing
  // authentication cookies and database information.
  await connection();

  const supabase = await createClient();

  // STEP 1: Verify the authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // STEP 2: Verify Super Administrator access.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, account_status")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "super_admin" ||
    profile.account_status !== "active"
  ) {
    redirect("/");
  }

  // DIAGNOSTIC ONLY: Check whether the server has an authenticated session.
  // Do not log or expose the access token itself.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  console.log("BOKHONI AUTH CHECK:", {
    hasSession: Boolean(sessionData.session),
    hasAccessToken: Boolean(sessionData.session?.access_token),
    sessionError: sessionError?.message ?? null,
  });

  // DIAGNOSTIC: Check a second authenticated database query.
  // Only log whether it succeeded, never user details or tokens.
  const { data: testData, error: testError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  console.log("SUPABASE PROFILE TEST:", {
    success: Boolean(testData),
    error: testError,
  });

  // STEP 3: Retrieve the knowledge document count.
  // Existing Supabase RLS policies remain enabled.
  const { count, error: countError } = await supabase
    .from("knowledge_documents")
    .select("id", {
      count: "exact",
      head: true,
    });

  // STEP 4: Report the actual database error.
  // Diagnostics are logged on the development server.
  if (countError) {
    console.error("KNOWLEDGE FULL ERROR:", countError);
    console.log("KNOWLEDGE DATABASE ERROR:", {
      message: countError.message,
      code: countError.code,
      details: countError.details,
      hint: countError.hint,
    });
  }

  const databaseError = countError !== null;

  // Never report zero if the query failed.
  const documentCount =
    databaseError || count === null ? null : count;

  const databaseConnected =
    !databaseError && documentCount !== null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
              B
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Bokhoni AI
              </h1>

              <p className="text-sm text-slate-500">
                Knowledge Administration
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Back to Control Centre
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/admin"
            className="hover:text-slate-900"
          >
            Administration
          </Link>

          <span>/</span>
          <span>Knowledge</span>
        </div>

        {/* INTRODUCTION */}
        <div className="mt-5">
          <h2 className="text-3xl font-bold tracking-tight">
            Knowledge Management
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage trusted information that supports Bokhoni AI
            research, innovation guidance, entrepreneurship,
            problem solving and intelligent responses.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* DOCUMENT COUNT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Knowledge Documents
            </p>

            <p className="mt-3 text-4xl font-bold">
              {documentCount === null ? "—" : documentCount}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {databaseConnected
                ? "Visible records in Supabase"
                : "Document count unavailable"}
            </p>
          </div>

          {/* ACCESS LEVEL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Access Level
            </p>

            <p className="mt-3 text-xl font-bold">
              Super Administrator
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Authorized management account
            </p>
          </div>

          {/* IMPORT STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Import Status
            </p>

            <p className="mt-3 text-xl font-bold">
              Preparing
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Document upload is the next development step
            </p>
          </div>
        </div>

        {/* KNOWLEDGE IMPORT */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-xl font-semibold">
            Import Knowledge
          </h3>

          <p className="mt-3 leading-7 text-slate-600">
            Build Bokhoni AI&apos;s trusted knowledge base by
            importing reliable documents, organizing information
            sources and preparing content for AI-powered retrieval.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              📄
            </div>

            <h4 className="mt-4 text-lg font-semibold">
              Document Import
            </h4>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              PDF, Word and text document uploads will be enabled
              after the database access checks are completed.
            </p>

            <p className="mt-4 text-xs text-slate-400">
              Only the authorized Bokhoni Super Administrator
              can import and manage platform knowledge.
            </p>
          </div>
        </section>

        {/* DATABASE STATUS */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">
            Knowledge Database Status
          </h3>

          {databaseConnected ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-900">
                Knowledge database query successful
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Bokhoni AI successfully retrieved the knowledge
                document count from Supabase.
              </p>

              <p className="mt-3 text-sm font-medium text-emerald-900">
                Visible documents: {documentCount}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">
                Knowledge document count is currently unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                Bokhoni AI could not retrieve the document count
                from Supabase. The count is not displayed as zero
                because the query did not succeed.
              </p>

              <p className="mt-3 text-sm leading-6 text-amber-800">
                The actual database error has been logged in
                the VS Code development terminal.
              </p>

              <p className="mt-3 text-sm leading-6 text-amber-800">
                Database security policies have not been changed.
              </p>
            </div>
          )}
        </section>

        {/* KNOWLEDGE INFRASTRUCTURE */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-xl font-semibold">
            Knowledge Infrastructure
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Planned capabilities for Bokhoni AI.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {infrastructure.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <h4 className="font-semibold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <p className="mt-3 text-xs font-medium text-slate-500">
                  Planned
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Bokhoni AI — From Ideas to Impact
        </footer>
      </div>
    </main>
  );
}
