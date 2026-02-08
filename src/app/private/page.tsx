import { redirect } from "next/navigation";

import { api } from "@/../convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth/auth-server";

export default async function Page() {
	const user = await fetchAuthQuery(api.auth.getCurrentUser);
	if (!user) {
		redirect("/login");
	}

	return <main>Private</main>;
}
