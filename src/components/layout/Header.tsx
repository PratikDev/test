"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { signIn, signOut } from "@/lib/auth/auth-client";

export default function Header() {
	const router = useRouter();

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

	return (
		<header className="w-screen flex items-center justify-between px-8 py-6 bg-accent">
			<h1 className="text-2xl font-bold">Header</h1>

			<div>
				<Unauthenticated>
					<Button
						type="button"
						onClick={signIn}
					>
						Sign In
					</Button>
				</Unauthenticated>

				<Authenticated>
					<div className="space-x-2">
						<Button
							type="button"
							onClick={handleSignOut}
						>
							Sign Out
						</Button>
					</div>
				</Authenticated>

				<AuthLoading>Loading...</AuthLoading>
			</div>
		</header>
	);
}
