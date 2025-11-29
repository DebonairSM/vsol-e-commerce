import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  getCustomerByStripeId,
  stripe,
  syncSubscription,
} from "~/api/payments/service";
import {
  sendSubscriptionConfirmation,
  sendSubscriptionCanceled,
} from "~/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await handleSubscriptionChange(subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await getCustomerByStripeId(customerId);

  if (!customer) {
    console.error(`Customer not found for Stripe ID: ${customerId}`);
    return;
  }

  await syncSubscription(subscription, customer.userId, customer.tenantId);

  // send confirmation email for new active subscriptions
  if (subscription.status === "active" && customer.email) {
    const productName =
      subscription.items.data[0]?.price.nickname || "Subscription";
    await sendSubscriptionConfirmation(customer.email, productName);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await getCustomerByStripeId(customerId);

  if (!customer) {
    console.error(`Customer not found for Stripe ID: ${customerId}`);
    return;
  }

  await syncSubscription(subscription, customer.userId, customer.tenantId);

  // send cancellation email
  if (customer.email) {
    const productName =
      subscription.items.data[0]?.price.nickname || "Subscription";
    await sendSubscriptionCanceled(customer.email, productName);
  }
}



