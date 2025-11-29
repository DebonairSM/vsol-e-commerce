import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@example.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * send an email using resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: from || FROM_EMAIL,
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
}

/**
 * send subscription confirmation email
 */
export async function sendSubscriptionConfirmation(
  email: string,
  planName: string,
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Confirmed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; margin-bottom: 24px;">Welcome to ${planName}!</h1>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          Thank you for subscribing. Your ${planName} subscription is now active.
        </p>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          You now have access to all the features included in your plan. Head to your dashboard to get started.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Go to Dashboard
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          If you have any questions, just reply to this email.
        </p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${planName}!`,
    html,
  });
}

/**
 * send subscription canceled email
 */
export async function sendSubscriptionCanceled(
  email: string,
  planName: string,
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Canceled</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; margin-bottom: 24px;">Subscription Canceled</h1>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          Your ${planName} subscription has been canceled.
        </p>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          We're sorry to see you go. If you change your mind, you can always resubscribe from your billing page.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
           style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Billing
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          If you have any feedback, we'd love to hear from you.
        </p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${planName} subscription has been canceled`,
    html,
  });
}

/**
 * send payment failed email
 */
export async function sendPaymentFailed(email: string, planName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; margin-bottom: 24px;">Payment Failed</h1>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          We couldn't process your payment for ${planName}.
        </p>
        <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 16px;">
          Please update your payment method to avoid service interruption.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
           style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Update Payment Method
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 32px;">
          If you need help, just reply to this email.
        </p>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Action required: Payment failed for ${planName}`,
    html,
  });
}



