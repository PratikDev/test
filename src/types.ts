import { ToolSchema } from "../convex/tools/utils/types";

type SuccessResponse<T> = {
	success: true;
	data: T;
};
type FailureResponse = {
	success: false;
	message: string;
};
export type StatusAwareResponse<T = any> = SuccessResponse<T> | FailureResponse;

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| { [key: string]: JsonValue }
	| JsonValue[];

export interface RemoteTool extends ToolSchema {
	parameters: Record<string, JsonValue>;
}
