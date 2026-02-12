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

export interface RemoteTool {
	name: string;
	description: string;
	parameters: Record<string, JsonValue>;
	implementation: string;
}
