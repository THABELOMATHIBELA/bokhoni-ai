import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient } from "@/utils/supabase/server";

type BokhoniUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
  preferred_language?: string | null;
  created_at?: string | null;
};

function formatRole(role: string) {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInitials(name: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
    0
  )}`.toUpperCase();
}

function getRoleStyles(role: string) {
  switch (role) {
    case "super_admin":
      return "bg-slate-950 text-white";

    case "admin":
      return "bg-slate-800 text-white";

    case "mentor":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";

    case "organisation":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export default async function AdminUsersPage() {
  /*
   * This administration page depends on:
   * - the currently authenticated user
   * - Supabase session information
   * - live profile/database information
   *
   * connection() tells Next.js to render this page when
   * an actual request arrives instead of attempting to
   * prerender the authenticated page ahead of time.
   *
   * This addresses the Next.js Date.now() blocking
   * prerender warning being reported for AdminUsersPage.
   */
  await connection();

  const supabase = await createClient();

  /*
   * STEP 1:
   * Confirm that somebody is authenticated.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /*
   * STEP 2:
   * Read the authenticated user's Bokhoni profile.
   */
  const { data: currentProfile, error: currentProfileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .single();

  if (currentProfileError || !currentProfile) {
    redirect("/");
  }

  /*
   * STEP 3:
   * Only administrators may enter User Management.
   */
  const allowedRoles = ["admin", "super_admin"];

  if (!allowedRoles.includes(currentProfile.role)) {
    redirect("/");
  }

  /*
   * STEP 4:
   * Retrieve Bokhoni profiles.
   *
   * RLS remains responsible for deciding whether this
   * authenticated administrator is allowed to read them.
   */
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, role, preferred_language, created_at"
    )
    .order("created_at", { ascending: false });

  const users = (data ?? []) as BokhoniUser[];

  /*
   * Dashboard statistics.
   */
  const totalUsers = users.length;

  const totalAdmins = users.filter(
    (profile) =>
      profile.role === "admin" || profile.role === "super_admin"
  ).length;

  const totalMentors = users.filter(
    (profile) => profile.role === "mentor"
  ).length;

  const totalOrganisations = users.filter(
    (profile) => profile.role === "organisation"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101827] font-bold text-white"
            >
              B
            </Link>

            <div>
              <Link
                href="/"
                className="font-semibold text-slate-950 hover:text-slate-700"
              >
                Bokhoni AI
              </Link>

              <p className="text-xs text-slate-500">
                Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {currentProfile.full_name || user.email}
              </p>

              <p className="text-xs text-slate-500">
                {formatRole(currentProfile.role)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {getInitials(currentProfile.full_name)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* BREADCRUMB */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/admin"
            className="font-medium hover:text-slate-950"
          >
            Administration
          </Link>

          <span>/</span>

          <span className="text-slate-900">
            Users
          </span>
        </div>

        {/* PAGE TITLE */}
        <section className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">
              User Administration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              User Management
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Review registered Bokhoni accounts and monitor platform roles
              across users, mentors, organisations and administrators.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Back to Control Centre
          </Link>
        </section>

        {/* STATISTICS */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalUsers}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Registered Bokhoni profiles
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Administrators
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalAdmins}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Admin and Super Admin
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Mentors
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalMentors}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Innovation mentors
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Organisations
            </p>

            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalOrganisations}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Organisation accounts
            </p>
          </div>
        </section>

        {/* DATABASE ERROR */}
        {error && (
          <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              User information could not be loaded.
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error.message}
            </p>
          </section>
        )}

        {/* USERS TABLE */}
        {!error && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Registered Users
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Accounts currently registered in Bokhoni.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                {totalUsers} {totalUsers === 1 ? "account" : "accounts"}
              </div>
            </div>

            {users.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-600">
                  US
                </div>

                <h3 className="mt-4 font-semibold text-slate-950">
                  No users found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  No Bokhoni profiles are currently available to this
                  administration account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        User
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Username
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Role
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Language
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {users.map((profile) => {
                      const isCurrentUser =
                        profile.id === user.id;

                      return (
                        <tr
                          key={profile.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                {getInitials(profile.full_name)}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-slate-950">
                                    {profile.full_name ||
                                      "Unnamed Bokhoni User"}
                                  </p>

                                  {isCurrentUser && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                      You
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500">
                                  {profile.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {profile.username || "Not set"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleStyles(
                                profile.role
                              )}`}
                            >
                              {formatRole(profile.role)}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {profile.preferred_language ||
                              "Not set"}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />

                              Active
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <Link
                              href={`/admin/users/${profile.id}`}
                              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SECURITY INFORMATION */}
        <section className="mt-8 rounded-2xl bg-[#101827] p-6 text-white">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-medium text-slate-400">
                Protected Administration
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                User administration is server protected.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Bokhoni verifies the authenticated account and its database
                role before displaying user-management information. Role
                modification controls will be added separately with additional
                security checks and audit logging.
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Current Access
              </p>

              <p className="mt-1 font-semibold text-white">
                {formatRole(currentProfile.role)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}