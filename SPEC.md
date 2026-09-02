# Product specification

## Goal

Turn the comments of one YouTube video into a visual map analyzed by the Node backend bundled with this application.

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

- Keep frontend and backend in this project with one `package.json` and serve both from the same origin.
- Do not expose credentials to the browser.
- Send only a validated video ID and the fixed comment limit; accept no free-form model prompt from the browser.
- Validate the API response with the frontend schema before rendering or persisting it.
- Keep descriptions compact while preserving every analyzed comment in the graph payload.

## Acceptance checks

- TypeScript typecheck and automated tests pass.
- Production frontend build succeeds.
- API rejects malformed video IDs and request bodies.
- A real video can complete the Browser → Node → YouTube → OpenAI → structured JSON flow.
