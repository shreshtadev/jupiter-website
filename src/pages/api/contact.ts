import type { APIRoute } from "astro";

export const prerender = false; // runtime API route

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const projectType = String(formData.get("projectType") || "");
  const message = String(formData.get("message") || "");
  const recaptchaToken = String(formData.get("g-recaptcha-response") || "");

  if (!recaptchaToken) {
    return new Response("reCAPTCHA token missing", { status: 400 });
  }

  const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing RECAPTCHA_SECRET_KEY env var");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Verify with Google reCAPTCHA v3
  const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", recaptchaToken);
  // optional: params.append("remoteip", request.headers.get("x-forwarded-for") ?? "");

  const verifyResponse = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const verifyData = (await verifyResponse.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    challenge_ts?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  // Tune this threshold if needed (0.5 is a common starting point)
  const MIN_SCORE = 0.5;

  if (
    !verifyData.success ||
    (typeof verifyData.score === "number" && verifyData.score < MIN_SCORE) ||
    (verifyData.action && verifyData.action !== "contact_form")
  ) {
    console.warn("reCAPTCHA v3 verification failed", verifyData);
    return new Response("reCAPTCHA validation failed", { status: 400 });
  }

  // ✅ At this point reCAPTCHA looks good
  // Here you can:
  // - send an email (Resend/SendGrid/Nodemailer/etc.)
  // - store in DB
  // - trigger a webhook, etc.

  console.log("New contact form submission:", {
    name,
    email,
    projectType,
    message,
  });

  // Redirect or return JSON
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/?submitted=true",
    },
  });
};
