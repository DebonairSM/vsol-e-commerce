import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productSlug: string }> },
) {
  const { productSlug } = await params;
  const url = new URL(request.url);

  // redirect to base checkout route with products query param
  url.pathname = "/auth/checkout";
  url.searchParams.set("products", productSlug);

  return NextResponse.redirect(url);
}



