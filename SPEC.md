# Product specification

## Goal

Turn the comments of one or two YouTube videos into a visual map analyzed by Codex through the locally configured YouTube MCP.

## Required experience

- Dark interface.
- The map occupies the main area; video URL controls sit on the right.
- Accept one YouTube video and optionally a second video for comparison.
- Categorize the audience conversation into thematic tags.
- Show relationships between video, tags, and representative comments.
- When two videos are analyzed, highlight themes shared by both audiences.
- Let the user inspect a node to understand its meaning and evidence.

## Integration constraints

- Reuse the user's authenticated Codex CLI and configured `youtube` MCP.
- Do not expose credentials to the browser.
- Accept no free-form agent prompt from the browser.
- Validate both request and model response.
- Keep the returned analysis compact despite reading up to 100 comments per video.

## Acceptance checks

- TypeScript typecheck and automated tests pass.
- Production frontend build succeeds.
- API rejects malformed and duplicate YouTube URLs.
- A real video can complete the API → Codex → MCP → structured JSON flow.
