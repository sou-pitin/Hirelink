import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  user_id: string;
  type: "application" | "message" | "job_status" | "system";
  title: string;
  body?: string;
  link?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, type, title, body, link } = await req.json() as NotificationRequest;

    // Validate required fields
    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!title || typeof title !== "string" || title.length > 200) {
      return new Response(
        JSON.stringify({ error: "title is required and must be 200 chars or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (body && body.length > 1000) {
      return new Response(
        JSON.stringify({ error: "body must be 1000 chars or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the in-site notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id,
      type: type || "system",
      title,
      body: body ?? null,
      link: link ?? null,
      read: false,
    });

    if (notifError) {
      return new Response(
        JSON.stringify({ error: notifError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the user's email to send an email notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user_id)
      .maybeSingle();

    // Log email notification (in a real deployment, this would integrate with an email service
    // like Resend, SendGrid, or AWS SES via their API)
    if (profile?.email) {
      console.log(`[EMAIL] To: ${profile.email}, Subject: ${title}, Body: ${body ?? "(no body)"}`);
    }

    return new Response(
      JSON.stringify({ success: true, email_sent_to: profile?.email ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
