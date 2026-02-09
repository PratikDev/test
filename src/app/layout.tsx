import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ConvexClientProvider } from "@/components/layout/ConvexClientProvider";
import Header from "@/components/layout/Header";

import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Orchestrator",
	description: "AI Agent Orchestration Platform",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
		>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0b]`}
			>
				<ConvexClientProvider>
					<div className="flex flex-col h-screen">
						<Header />
						<main className="grow overflow-auto">{children}</main>
					</div>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
