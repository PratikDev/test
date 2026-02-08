"use client";

import { Button } from "@/components/ui/button";

import { signIn } from "@/lib/auth/auth-client";

export default function Page() {
	return (
		<main className="w-full h-screen flex items-center justify-center">
			<Button
				size="3xl"
				onClick={signIn}
			>
				Login with Google
			</Button>
		</main>
	);
}
