import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  await connection();

  const supabase = await createClient();

  // =========================================================
  // 1. VERIFY AUTHENTICATION
  // =========================================================
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // =========================================================
  // 2. READ THE USER'S PROFILE AND ROLE
  // =========================================================
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/");
  }

  // =========================================================
  // 3. SERVER-SIDE ADMIN PROTECTION
  // =========================================================
  const isAdmin =
    profile.role === "admin" || profile.role === "super_admin";

  if (!isAdmin) {
    redirect("/");
  }

  const isSuperAdmin = profile.role === "super_admin";

  const fullName =
    profile.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Administrator";

  // =========================================================
  // 4. LOAD ADMIN DASHBOARD COUNTS
  // =========================================================

  const [
    profilesResult,
    projectsResult,
    conversationsResult,
    knowledgeDocumentsResult,
    aiActivityResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("knowledge_documents")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("ai_activity")
      .select("*", { count: "exact", head: true }),
  ]);

  const totalUsers = profilesResult.count ?? 0;
  const totalProjects = projectsResult.count ?? 0;
  const totalConversations = conversationsResult.count ?? 0;
  const totalKnowledgeDocuments = knowledgeDocumentsResult.count ?? 0;
  const totalAIActivity = aiActivityResult.count ?? 0;

  const dashboardCards = [
    {
      label: "Users",
      value: totalUsers,
      description: "Registered Bokhoni accounts",
    },
    {
      label: "Projects",
      value: totalProjects,
      description: "Innovation projects",
    },
    {
      label: "Conversations",
      value: totalConversations,
      description: "AI conversation records",
    },
    {
      label: "Knowledge",
      value: totalKnowledgeDocuments,
      description: "Knowledge documents",
    },
  ];

  const adminAreas = [
    {
      title: "User Management",
      code: "US",
      description:
        "Manage Bokhoni users, account roles, mentors, organisations and administrators.",
    },
    {
      title: "Knowledge Base",
      code: "KB",
      description:
        "Manage trusted sources, documents, domains, chunks and knowledge resources.",
    },
    {
      title: "AI Activity",
      code: "AI",
      description:
        "Review AI usage, conversations and recorded platform intelligence.",
    },
    {
      title: "Projects",
      code: "PR",
      description:
        "Monitor innovation projects and their progress through the Bokhoni journey.",
    },
    {
      title: "Platform Activity",
      code: "PA",
      description:
        "Review important activity occurring across the Bokhoni platform.",
    },
    {
      title: "Audit Logs",
      code: "AL",
      description:
        "Review administrative actions and security-sensitive platform events.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
              B
            </div>

            <div>
              <h1 className="font-semibold text-slate-950">
                Bokhoni AI
              </h1>

              <p className="text-xs text-slate-500">
                Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Back to Workspace
            </Link>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {fullName}
              </p>

              <p className="text-xs text-slate-500">
                {isSuperAdmin ? "Super Admin" : "Administrator"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101827] text-sm font-semibold text-white">
              {fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          ADMIN CONTENT
      ====================================================== */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* PAGE HEADER */}
        <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-slate-500">
                Administration
              </p>

              {isSuperAdmin && (
                <span className="rounded-full bg-[#101827] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Super Admin
                </span>
              )}
            </div>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Bokhoni Control Centre
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor and manage Bokhoni&apos;s users, innovation projects,
              knowledge infrastructure, AI activity and platform operations.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Access level
            </p>

            <p className="mt-1 font-semibold text-slate-950">
              {isSuperAdmin ? "Super Administrator" : "Administrator"}
            </p>
          </div>
        </section>

        {/* ===================================================
            PLATFORM OVERVIEW
        ==================================================== */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-500">
              Platform Overview
            </p>

            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              Bokhoni at a glance
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {card.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================
            AI STATUS
        ==================================================== */}
        <section className="mt-8 rounded-2xl bg-[#101827] p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                <p className="text-sm font-medium text-slate-300">
                  AI Intelligence Layer
                </p>
              </div>

              <h3 className="mt-2 text-xl font-semibold">
                Bokhoni AI Activity
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                AI infrastructure will be connected here for model activity,
                routing, retrieval, validation and intelligence monitoring.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Recorded AI activity
              </p>

              <p className="mt-1 text-2xl font-semibold text-white">
                {totalAIActivity}
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            ADMINISTRATION AREAS
        ==================================================== */}
        <section className="mt-10">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Administration Areas
            </p>

            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              Manage the platform
            </h3>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {adminAreas.map((area) => (
              <div
                key={area.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                  {area.code}
                </div>

                <h4 className="mt-5 text-lg font-semibold text-slate-950">
                  {area.title}
                </h4>

                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-500">
                  {area.description}
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================
            SUPER ADMIN SECURITY AREA
        ==================================================== */}
        {isSuperAdmin && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Super Administrator
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  Security and platform governance
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  High-privilege administrative capabilities are restricted
                  to authorised Super Admin accounts. Sensitive actions will
                  be protected and recorded through Bokhoni&apos;s security
                  and audit infrastructure.
                </p>
              </div>

              <div className="whitespace-nowrap rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                Super Admin verified
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            DATABASE STATUS
        ==================================================== */}
        <section className="mt-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <p className="text-sm font-medium text-slate-500">
                Protected administration session
              </p>
            </div>

            <h3 className="mt-2 text-lg font-semibold text-slate-950">
              Administration access verified.
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              This page checks the authenticated Bokhoni account and its
              database role on the server before administrative content is
              displayed.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}