
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type UserProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
  preferred_language: string | null;
};

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify the current signed-in user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Verify administrative access using the database.
  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (
    adminError ||
    !adminProfile ||
    !["admin", "super_admin"].includes(adminProfile.role)
  ) {
    redirect("/");
  }

  // Retrieve the selected user's profile.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, role, preferred_language"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const profile = data as UserProfile;

  const displayName = profile.full_name || "Unnamed User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const roleLabel =
    profile.role === "super_admin"
      ? "Super Admin"
      : profile.role === "admin"
      ? "Administrator"
      : profile.role === "organisation"
      ? "Organisation"
      : profile.role === "mentor"
      ? "Mentor"
      : "User";

  const isCurrentUser = profile.id === user.id;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101827] font-bold text-white">
              B
            </div>

            <div>
              <h1 className="font-semibold">Bokhoni AI</h1>
              <p className="text-xs text-slate-500">
                Administration
              </p>
            </div>
          </Link>

          <span className="rounded-full bg-[#101827] px-4 py-2 text-xs font-semibold text-white">
            {adminProfile.role === "super_admin"
              ? "Super Admin"
              : "Administrator"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900">
            Administration
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            href="/admin/users"
            className="text-slate-500 hover:text-slate-900"
          >
            Users
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-medium text-slate-900">
            User Profile
          </span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              User Administration
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              User Profile
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              View registered account information and platform access.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Back to Users
          </Link>
        </div>

        <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#101827] px-8 py-9 text-white">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
                {initials || "U"}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold">
                    {displayName}
                  </h3>

                  {isCurrentUser && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Your Account
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  Bokhoni Registered Profile
                </p>

                <span className="mt-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h4 className="text-lg font-semibold">
              Account Information
            </h4>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["Full Name", displayName],
                ["Username", profile.username || "Not set"],
                ["Account Role", roleLabel],
                [
                  "Preferred Language",
                  profile.preferred_language || "Auto",
                ],
                ["User ID", profile.id],
                [
                  "Account Type",
                  isCurrentUser ? "Your Account" : "Registered User",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h4 className="text-lg font-semibold">
            Account Security
          </h4>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            This profile is displayed through a protected
            administration page. Bokhoni verifies the signed-in
            administrator and checks their database role before
            retrieving user information.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Administrative access verified
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/admin/users"
            className="inline-flex rounded-xl bg-[#101827] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1c2738]"
          >
            Return to User Management
          </Link>
        </div>
      </div>
    </main>
  );
}
