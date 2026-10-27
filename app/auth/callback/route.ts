import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error("Bokhoni authentication callback error:", error.message);

    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          "We could not complete your sign in. Please try again."
        )}`,
        requestUrl.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `/auth/login?error=${encodeURIComponent(
        "The authentication link is invalid or has expired."
      )}`,
      requestUrl.origin
    )
  );
}