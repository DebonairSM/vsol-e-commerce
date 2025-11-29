"use client";

import { useState } from "react";

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

interface PaymentFormProps {
  slug?: string;
  priceId?: string;
  buttonText?: string;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export function PaymentForm({
  slug = "pro",
  priceId,
  buttonText = "Subscribe",
  title = "Upgrade to Pro",
  description = "Get access to all premium features and support the project.",
  onSuccess,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, priceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error initiating checkout:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initiate checkout. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Loading..." : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
