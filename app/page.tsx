import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // =========================================================
  // 1. CHECK AUTHENTICATED USER
  // =========================================================
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // =========================================================
  // 2. LOAD BOKHONI PROFILE
  // =========================================================
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, role")
    .eq("id", user.id)
    .single();

  // =========================================================
  // 3. USER INFORMATION
  // =========================================================
  const metadataFullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  const profileFullName =
    typeof profile?.full_name === "string"
      ? profile.full_name.trim()
      : "";

  const fullName =
    profileFullName ||
    metadataFullName ||
    user.email ||
    "Bokhoni User";

  const firstName =
    fullName.split(" ")[0] || "Innovator";

  const role = profile?.role ?? "user";

  // =========================================================
  // 4. ROLE PERMISSIONS
  // =========================================================
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || isSuperAdmin;

  // =========================================================
  // 5. HUMAN-READABLE ROLE NAME
  // =========================================================
  const roleLabels: Record<string, string> = {
    user: "User",
    mentor: "Mentor",
    organisation: "Organisation",
    admin: "Administrator",
    super_admin: "Super Admin",
  };

  const roleLabel = roleLabels[role] ?? "User";

  // =========================================================
  // 6. INNOVATION JOURNEY
  // =========================================================
  const innovationStages = [
    "Problem",
    "Research",
    "Idea",
    "Validation",
    "Solution",
    "Design",
    "Prototype",
    "Testing",
    "Business Model",
    "Market",
    "Growth",
    "Impact",
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">

      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* BRAND */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
              B
            </div>

            <div>
              <h1 className="font-semibold text-slate-950">
                Bokhoni AI
              </h1>

              <p className="text-xs text-slate-500">
                From Ideas to Impact
              </p>
            </div>
          </Link>

          {/* USER INFORMATION */}
          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <div className="flex items-center justify-end gap-2">

                <p className="text-sm font-medium text-slate-900">
                  {fullName}
                </p>

                {isSuperAdmin && (
                  <span className="rounded-full bg-[#101827] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Super Admin
                  </span>
                )}

                {!isSuperAdmin && role === "admin" && (
                  <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Admin
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {user.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {firstName.charAt(0).toUpperCase()}
            </div>

          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            PROFILE ERROR
        ==================================================== */}
        {profileError && (
          <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <p className="text-sm font-semibold text-amber-900">
              Profile information could not be fully loaded.
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              Your authentication session is active, but Bokhoni could not
              retrieve all profile information.
            </p>

          </section>
        )}

        {/* ===================================================
            WELCOME
        ==================================================== */}
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Bokhoni Workspace
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Welcome, {firstName}.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Explore ideas, investigate problems, develop projects and move
              your innovations from early thinking toward practical impact.
            </p>
          </div>

          {/* ROLE STATUS */}
          <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Account role
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {roleLabel}
            </p>

          </div>

        </section>

        {/* ===================================================
            MAIN ACTIONS
        ==================================================== */}
        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {/* AI ASSISTANT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101827] text-lg font-semibold text-white">
              AI
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-950">
              Bokhoni Assistant
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Research, think through challenges and get intelligent guidance
              for your innovation journey.
            </p>

            <Link
  href="/assistant"
  className="mt-6 inline-flex rounded-xl bg-[#101827] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c2738]"
>
  Start conversation
</Link>

          </div>

          {/* PROJECTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700">
              P
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-950">
              Projects
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Develop projects from problem discovery through validation,
              prototyping, testing and implementation.
            </p>

            <button
              type="button"
              className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              View projects
            </button>

          </div>

          {/* KNOWLEDGE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700">
              K
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-950">
              Knowledge
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Explore trusted knowledge, resources and guidance across
              innovation, technology and enterprise.
            </p>

            <button
              type="button"
              className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Explore knowledge
            </button>

          </div>

        </section>

        {/* ===================================================
            INNOVATION JOURNEY
        ==================================================== */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Innovation Journey
              </p>

              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Move from a problem to measurable impact.
              </h3>
            </div>

            <Link
              href="#"
              className="text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              Learn how Bokhoni works
            </Link>

          </div>

          <div className="mt-6 flex flex-wrap gap-2">

            {innovationStages.map((stage, index) => (
              <div
                key={stage}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600"
              >
                {index + 1}. {stage}
              </div>
            ))}

          </div>

        </section>

        {/* ===================================================
            ADMINISTRATION
            ONLY ADMIN AND SUPER ADMIN CAN SEE THIS
        ==================================================== */}
        {isAdmin && (
          <section className="mt-10">

            <div className="rounded-2xl bg-[#101827] p-6 text-white shadow-sm">

              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                {/* ADMIN DESCRIPTION */}
                <div>

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                      AD
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        Administration
                      </p>

                      <h3 className="mt-1 text-xl font-semibold">
                        Bokhoni Control Centre
                      </h3>
                    </div>

                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                    Manage Bokhoni users, knowledge, platform activity,
                    projects and administrative operations from a protected
                    workspace.
                  </p>

                  {isSuperAdmin && (
                    <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                      Super Admin access enabled
                    </div>
                  )}

                </div>

                {/* ADMIN FEATURES */}
                <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">

                    <p className="text-sm font-semibold text-white">
                      Users
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Manage accounts and platform roles.
                    </p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">

                    <p className="text-sm font-semibold text-white">
                      Knowledge
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Manage trusted knowledge resources.
                    </p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">

                    <p className="text-sm font-semibold text-white">
                      AI Activity
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Review AI and platform activity.
                    </p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">

                    <p className="text-sm font-semibold text-white">
                      System
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Monitor Bokhoni platform operations.
                    </p>

                  </div>

                </div>

              </div>

              {/* ADMIN PAGE LINK */}
              <div className="mt-6 border-t border-white/10 pt-5">

                <Link
                  href="/admin"
                  className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#101827] transition hover:bg-slate-100"
                >
                  Open Administration
                </Link>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            ACCOUNT STATUS
        ==================================================== */}
        <section className="mt-10 pb-10">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <div className="flex items-center gap-2">

                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <p className="text-sm font-medium text-slate-500">
                    Account connected
                  </p>

                </div>

                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  Your Bokhoni account is active.
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your authenticated account is connected to Bokhoni&apos;s
                  Supabase infrastructure and your platform role has been
                  verified.
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 px-5 py-4">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Current access
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {roleLabel}
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}