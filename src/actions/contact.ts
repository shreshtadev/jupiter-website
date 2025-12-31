import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import PocketBase from "pocketbase";

let pb: PocketBase;

export const sendContact = defineAction({
  accept: "json",
  input: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    projectType: z.string().min(2).max(100),
    message: z.string().min(10).max(500),
    recaptchaToken: z.string(),
  }),
  handler: async (input) => {
    if (!pb) {
      const url = import.meta.env.CONTACT_US_URL;
      if (!url) {
        throw new Error(
          "CONTACT_US_URL is not defined in environment variables",
        );
      }
      pb = new PocketBase(import.meta.env.CONTACT_US_URL);
    }
    const { name, email, projectType, message, recaptchaToken } = input;
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
      return { message: "reCAPTCHA validation failed", status: 400 };
    }
    const contactUsData = {
      fullName: name,
      emailId: email,
      projectType: projectType,
      projectDetails: message,
    };

    const record = await pb.collection("contactus_forms").create(contactUsData);
    return {
      message: "Submitted successfully",
      emailId: record.id,
      status: 200,
    };
  },
});
