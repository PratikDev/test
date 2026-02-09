import { Badge } from "@/components/ui/badge";
import { levelColors } from "./data";

export default function LogLevelBadge({
	level,
}: {
	level: keyof typeof levelColors;
}) {
	return (
		<Badge
			variant="outline"
			className={`${levelColors[level]} text-xs uppercase font-semibold`}
		>
			{level}
		</Badge>
	);
}
