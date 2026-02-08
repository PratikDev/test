import { TOOL_CATEGORIES, type Tool } from "../tools/types";

export const INITIAL_TOOLS: Tool[] = [
  {
    name: "readFile",
    description:
      "Read the contents of a file from the filesystem. Returns the file content as a string.",
    category: TOOL_CATEGORIES.FILESYSTEM,
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the file" },
      },
      required: ["path"],
    },
    implementation: "opencode:readFile",
  },
  {
    name: "writeFile",
    description:
      "Write content to a file on the filesystem. Creates the file if it doesn't exist.",
    category: TOOL_CATEGORIES.FILESYSTEM,
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the file" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
    implementation: "opencode:writeFile",
  },
  {
    name: "listDirectory",
    description:
      "List all files and subdirectories in a directory. Returns names and types of entries.",
    category: TOOL_CATEGORIES.FILESYSTEM,
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the directory" },
      },
      required: ["path"],
    },
    implementation: "opencode:listDirectory",
  },
  {
    name: "runCommand",
    description:
      "Execute a shell command and return the output. Use for running scripts, git commands, etc.",
    category: TOOL_CATEGORIES.SHELL,
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        cwd: {
          type: "string",
          description: "Working directory for the command",
        },
      },
      required: ["command"],
    },
    implementation: "opencode:runCommand",
  },
  {
    name: "searchCode",
    description:
      "Search for patterns in code files using grep or ripgrep. Useful for finding functions, classes, or text.",
    category: TOOL_CATEGORIES.CODE,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search pattern (regex)" },
        path: {
          type: "string",
          description: "Directory or file to search in",
        },
      },
      required: ["query"],
    },
    implementation: "opencode:searchCode",
  },
];