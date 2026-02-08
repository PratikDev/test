function sanitizeValue(value: any, key?: string): any {
	// if value is null or undefined,
	// or isn't a string or object, return as is
	if (!value || !["string", "object"].includes(typeof value)) {
		return value;
	}

	if (typeof value === "string") {
		const lowerKey = key?.toLowerCase() || "";

		if (
			lowerKey.includes("content") ||
			lowerKey.includes("body") ||
			lowerKey.includes("data")
		) {
			if (value.length > 1000) {
				return value.substring(0, 1000) + "... [truncated]";
			}
		}

		if (
			lowerKey.includes("goal") ||
			lowerKey.includes("prompt") ||
			lowerKey.includes("message")
		) {
			if (value.length > 200) {
				return value.substring(0, 200) + "... [truncated]";
			}
		}

		if (
			lowerKey.includes("result") ||
			lowerKey.includes("text") ||
			lowerKey.includes("output")
		) {
			if (value.length > 500) {
				return value.substring(0, 500) + "... [truncated]";
			}
		}

		return value;
	}

	if (typeof value === "object") {
		if (Array.isArray(value)) {
			return value.map((item, index) =>
				sanitizeValue(item, `${key}[${index}]`),
			);
		}

		const sanitized: Record<string, any> = {};
		for (const [k, v] of Object.entries(value)) {
			const lowerK = k.toLowerCase();

			if (
				lowerK.includes("auth") ||
				lowerK.includes("password") ||
				lowerK.includes("token") ||
				lowerK.includes("secret") ||
				lowerK.includes("key") ||
				lowerK.includes("credential")
			) {
				sanitized[k] = "[REDACTED]";
				continue;
			}

			sanitized[k] = sanitizeValue(v, k);
		}
		return sanitized;
	}
}

function truncateStack(stack?: string): string | undefined {
	if (!stack) return undefined;
	const lines = stack.split("\n");
	if (lines.length > 50) {
		return lines.slice(0, 50).join("\n") + "\n... [stack truncated]";
	}
	return stack;
}

export { sanitizeValue, truncateStack };
