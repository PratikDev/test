# Improvements

1. Threads
2. Single Convex instance for all operations
3. More schema validation
4. Fix all any/unknown types

# Research and findings

1. NextJS server side fetch failed issue on Bun Linux (https://github.com/vercel/next.js/discussions/70423#discussioncomment-11709365)
2. opencode sdk requires client authentication header (not mentioned in doc at all. they did mention it [here](https://opencode.ai/docs/sdk/#auth) but i didn't find it enough useful. had to go through some github issues, other users' implementations, and AI - that basically read the source code to figure it out)

# Limitations

1. **Tight coupling problem:** new tools can't be just added to convex and used right away. Need to add it in the tools registry as well (that's where the main logic lives). this breaks the whole point of storing tools in convex db.

- ### Solution
  - Tool implementation should live in convex. the idea is that the db will refer to a http endpoint or a convex function, and the local agent will only proxy the request. I can think of 3 approaches
    - each tool have it's own convex function (type-safe, easy to implement, but hard to maintain and too much boilerplate)
    - single convex function that takes tool name as argument and dispatches the request to the right (easy to maintain, less boilerplate, but not type-safe)
    - hybrid approach: separate convex functions for generic/mostly used tools like CRUD operations, and single dispatch function for custom tools (medium type-safety, medium maintenance, medium boilerplate)
- ### Cons to the solution
  - One thing i still need to face is "Convex vendor lock". what i basically mean is if we solely deploy our tools in convex, we can't outsource tools from somewhere else without writing a convex wrapper for them.
- ### Solution to above
  - i can make the convex tools table schema more generic to support convex functions, http endpoints, and shell commands. we store something like a "type" field to specify the type of the tool, and based on that we can decide how to execute it (`convex`, `fetch` or `opencode`). this way we can store a http endpoint as well (with necessary information obv), and execute it just like any other tool. Cool. I like this one
