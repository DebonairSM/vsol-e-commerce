"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { User } from "~/db/schema/users/types";
import type { StripeSubscription } from "~/db/schema/payments/types";

import { PaymentForm } from "~/ui/components/payments/PaymentForm";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Alert, AlertDescription, AlertTitle } from "~/ui/primitives/alert";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Badge } from "~/ui/primitives/badge";

interface SubscriptionsResponse {
  subscriptions: StripeSubscription[];
}

interface BillingPageClientProps {
  user: User | null;
}

export function BillingPageClient({ user }: BillingPageClientProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in");
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        const response = await fetch("/api/payments/subscriptions");
        if (!response.ok) {
          throw new Error("Failed to fetch subscriptions");
        }
        const data = (await response.json()) as SubscriptionsResponse;
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        setError("Failed to load subscription data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user, router]);

  const hasActiveSubscription = subscriptions.some(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/payments/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to open billing portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error opening portal:", err);
      setError("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get("checkout_success");

    if (checkoutSuccess === "true") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      router.refresh();
    }
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Billing</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subscription Status */}
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription plan and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{subscription.productId}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {subscription.status}
                        {subscription.cancelAtPeriodEnd &&
                          " (cancels at period end)"}
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-muted-foreground">
                          {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}:{" "}
                          {new Date(
                            subscription.currentPeriodEnd,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        subscription.status === "active" ||
                        subscription.status === "trialing"
                          ? "default"
                          : subscription.status === "past_due"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                You don't have any active subscriptions.
              </p>
            )}
          </CardContent>
          <CardFooter>
            {hasActiveSubscription && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Payment Plans */}
      {!hasActiveSubscription && (
        <div className="grid gap-6 md:grid-cols-2">
          <PaymentForm
            slug="pro"
            title="Pro Plan"
            description="Get access to all premium features and priority support."
            buttonText="Subscribe to Pro"
          />
          <PaymentForm
            slug="premium"
            title="Premium Plan"
            description="Everything in Pro plus exclusive content and early access to new features."
            buttonText="Subscribe to Premium"
          />
        </div>
      )}
    </div>
  );
}
