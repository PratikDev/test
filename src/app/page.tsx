"use client";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { api } from "../../convex/_generated/api";

const FormSchema = z.object({
	input: z.string().min(1),
});
type FormSchema = z.infer<typeof FormSchema>;

export default function Home() {
	const [threadId, setThreadId] = useState<string>("");
	const [response, setResponse] = useState<string>("");

	const createThread = useMutation(api.mutations.thread.createThread);
	const sendMessageToAgent = useAction(api.chat.sendMessageToAgent);

	const form = useForm<FormSchema>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			input: "",
		},
	});

	function onSubmit(data: FormSchema) {
		if (!threadId) return;
		sendMessageToAgent({ threadId, prompt: data.input }).then(setResponse);
	}

	useEffect(() => {
		if (!threadId) {
			createThread().then(setThreadId);
		}
	}, []);

	return (
		<main>
			{response && (
				<div className="mb-4 rounded-md bg-green-50 p-4">{response}</div>
			)}

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8"
				>
					<FormField
						control={form.control}
						name="input"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Message *</FormLabel>
								<FormControl>
									<Input
										placeholder="Input"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</main>
	);
}
