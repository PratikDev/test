import { ConvexClient, ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
	throw new Error("NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
}

export const client = new ConvexClient(convexUrl);
export const httpClient = new ConvexHttpClient(convexUrl);
