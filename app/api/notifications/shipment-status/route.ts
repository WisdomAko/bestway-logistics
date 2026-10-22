import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Require an authenticated Supabase session.
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);

    // 2. Validate the Supabase configuration.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Authentication service is not configured." },
        { status: 500 }
      );
    }

    // 3. Verify the logged-in user.
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired login session." },
        { status: 401 }
      );
    }

    // 4. Allow only the configured administrator email.
    const adminEmail = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    if (
      !adminEmail ||
      !user.email ||
      user.email.trim().toLowerCase() !== adminEmail
    ) {
      return NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      );
    }

    // 5. Confirm the email service is configured.
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const {
      recipientEmail,
      trackingNumber,
      status,
      currentLocation,
      destination,
      estimatedDelivery,
    } = await request.json();

    // 6. Validate the required notification details.
    if (
      typeof recipientEmail !== "string" ||
      !recipientEmail.trim() ||
      typeof trackingNumber !== "string" ||
      !trackingNumber.trim() ||
      typeof status !== "string" ||
      !status.trim()
    ) {
      return NextResponse.json(
        {
          error: "Missing required shipment notification details.",
        },
        { status: 400 }
      );
    }

    // 7. Send the customer notification.
    const resend = new Resend(resendApiKey);
    const trackingUrl =
      "https://bestway-logistics-six.vercel.app";

    const result = await resend.emails.send({
      from: "Bestway Logistics <onboarding@resend.dev>",
      to: [recipientEmail.trim()],
      subject: `Shipment ${trackingNumber.trim()} status update`,
      text: [
        "Hello,",
        "",
        `Your Bestway Logistics shipment (${trackingNumber.trim()}) has a status update.`,
        `Status: ${status.trim()}`,
        typeof currentLocation === "string" &&
        currentLocation.trim()
          ? `Current location: ${currentLocation.trim()}`
          : "",
        typeof destination === "string" &&
        destination.trim()
          ? `Destination: ${destination.trim()}`
          : "",
        typeof estimatedDelivery === "string" &&
        estimatedDelivery.trim()
          ? `Estimated delivery: ${estimatedDelivery.trim()}`
          : "",
        "",
        `Track your shipment: ${trackingUrl}`,
        "",
        "Thank you for choosing Bestway Logistics.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (result.error) {
      console.error("Resend email error:", result.error);

      return NextResponse.json(
        { error: "The notification email could not be sent." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shipment notification email accepted.",
    });
  } catch (error) {
    console.error("Shipment notification error:", error);

    return NextResponse.json(
      { error: "Unable to process the email notification." },
      { status: 500 }
    );
  }
}