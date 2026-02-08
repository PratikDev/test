Assignment Brief

The assignment is to build two connected components: a local coding agent and a server-side Convex application that serves as a tool registry.

Local Application
The local application uses the OpenCode SDK and centers on an orchestrator agent. This agent can create tasks and has access to all standard OpenCode tools available on the user's machine.

Server-Side Tool Search
The orchestrator connects to a server-side tool search hosted in Convex, built with the AI SDK and/or Convex Agents. Tool discovery is powered by the Convex RAG component — new tools can be registered by simply adding entries to the vector database. The local agent queries this service to find and retrieve tools on demand.

Observability
The system should include some degree of observability into agent behavior and tool usage.

Evaluation Criteria
The goal is not to maximize the number of features or tools available. The focus is on the architecture: how the local agent, the tool search service, and the server-side infrastructure are wired together.
