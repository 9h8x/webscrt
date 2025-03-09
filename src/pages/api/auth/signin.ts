// SignIn
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Use formData to parse the incoming request
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  // Validate email and password
  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  // Sign in with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Handle error from Supabase
  if (error) {
    console.log(error)
    return new Response(error.message, { status: 500 });
  }

  // Set cookies for access and refresh tokens
  const { access_token, refresh_token } = data.session;
  cookies.set("sb-access-token", access_token, {
    path: "/",
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
  });

  // Redirect to the dashboard
  return redirect("/admin/dashboard");
};
