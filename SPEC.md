# Product specification

## Goal

Turn the comments of one YouTube video into a visual map analyzed by Codex through the locally configured YouTube MCP.

## Required experience

- Dark interface.
- The map occupies the main area; video URL controls sit on the right.
- Accept exactly one YouTube video per analysis.
- Categorize the audience conversation into thematic tags.
- Show every analyzed comment once, connected to its primary thematic tag.
- Make high-volume tags visually stronger and support hover, drag, pan, and zoom exploration.
- Let the user inspect a node to understand its meaning and evidence.
- Persist recent searches and their analysis in browser localStorage.
- Keep the interface minimal: no demo, status badge, comparison controls, metrics card, legend, or footer labels.

## Integration constraints

- Reuse the user's authenticated Codex CLI and configured `youtube` MCP.
- Do not expose credentials to the browser.
- Accept no free-form agent prompt from the browser.
- Validate both request and model response.
- Keep descriptions compact while preserving every analyzed comment in the graph payload.

## Acceptance checks

- TypeScript typecheck and automated tests pass.
- Production frontend build succeeds.
- API rejects malformed input and multiple-video payloads.
- A real video can complete the API → Codex → MCP → structured JSON flow.
