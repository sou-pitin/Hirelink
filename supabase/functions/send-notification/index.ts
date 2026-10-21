import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotificationRequest {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  newStatus: string;
}

function getSubject(status: string, jobTitle: string): string {
  const subjects: Record<string, string> = {
    Reviewing: `Application Update: We're reviewing your application for ${jobTitle}`,
    Interview: `Great news! Interview invitation for ${jobTitle}`,
    Offer: `Job Offer for ${jobTitle} — congratulations!`,
    Rejected: `Application Update: ${jobTitle}`,
  };
  return subjects[status] || `Application Update: ${jobTitle}`;
}

function getBody(req: NotificationRequest): string {
  const { candidateName, jobTitle, companyName, newStatus } = req;
  const greeting = `Dear ${candidateName},\n\n`;

  const bodies: Record<string, string> = {
    Reviewing: `We wanted to let you know that your application for the ${jobTitle} position at ${companyName} is now under review. Our team is evaluating your qualifications and we will be in touch with you soon regarding next steps.\n\nThank you for your interest in joining ${companyName}.`,
    Interview: `We are pleased to inform you that your application for the ${jobTitle} position at ${companyName} has progressed to the interview stage. Our team was impressed with your background and would like to schedule an interview with you.\n\nWe will reach out shortly with available time slots. Please let us know if you have any scheduling constraints.`,
    Offer: `Congratulations! We are delighted to extend you an offer for the ${jobTitle} position at ${companyName}. We were highly impressed with your skills and experience throughout the interview process.\n\nWe will be sending you a detailed offer letter shortly. We look forward to welcoming you to the team!`,
    Rejected: `Thank you for taking the time to apply for the ${jobTitle} position at ${companyName}. After careful consideration, we have decided to move forward with other candidates whose profiles more closely match our current needs.\n\nWe appreciate your interest in ${companyName} and encourage you to apply for future openings that align with your experience. We wish you the best in your job search.`,
  };

  const body = bodies[newStatus] || `Your application status for ${jobTitle} at ${companyName} has been updated to: ${newStatus}.`;
  return greeting + body + `\n\nBest regards,\nThe ${companyName} Hiring Team`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();

    if (!body.candidateEmail || !body.newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: candidateEmail, newStatus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = getSubject(body.newStatus, body.jobTitle);
    const textBody = getBody(body);

    // Store notification record in the database as a durable log
    const { error: logError } = await supabase.from("email_notifications").upsert({
      application_id: body.applicationId,
      candidate_email: body.candidateEmail,
      candidate_name: body.candidateName,
      subject,
      body: textBody,
      status: body.newStatus,
      sent_at: new Date().toISOString(),
    }, { onConflict: "application_id" });

    if (logError) {
      console.error("Failed to log notification:", logError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification prepared for ${body.candidateEmail}`,
        subject,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
