"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Terminal } from "lucide-react";

export default function Header() {
	const pathname = usePathname();

	const navItems = [
		{ href: "/", label: "Dashboard", icon: Terminal },
		{ href: "/observe", label: "Observe", icon: Activity },
	];

	return (
		<header className="border-b border-zinc-800 bg-zinc-950">
			<div className="max-w-7xl mx-auto px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 text-zinc-100 font-semibold"
					>
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<Terminal className="w-4 h-4 text-white" />
						</div>
						<span>Orchestrator</span>
					</Link>

					{/* Navigation */}
					<nav className="flex items-center gap-1">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							const Icon = item.icon;

							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
										isActive
											? "bg-zinc-800 text-zinc-100"
											: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
									}`}
								>
									<Icon className="w-4 h-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>
			</div>
		</header>
	);
}