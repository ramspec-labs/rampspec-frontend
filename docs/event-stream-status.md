# Live connection feedback

The reconnecting transport reports connecting, connected, retrying and
disconnected independently of authoritative run outcomes. A persistent polite,
atomic status region displays text for every state, with reserved space so
updates do not move the timeline. Empty timelines show an explicit empty state.

Transient errors close the previous source and retry after 1, 2, 4, 8 and then
15 seconds. Opening a connection resets backoff. Permanently closed sources
stop instead of repeatedly retrying rejected access. Stop/unmount cancels timers,
closes the active source and ignores late callbacks. Changing the run endpoint
discards the previous timeline. Malformed messages do not become run events.

The current backend publishes reference-run JSON routes, not an SSE route. The
server-side optional `RAMPSPEC_RUN_EVENT_STREAM_URL` configuration supplies an
actual deployed HTTPS endpoint template containing `{runId}`. The frontend
substitutes an encoded run ID, rejects credentials/fragments/invalid URLs, and
uses the existing EventSource transport without adding authentication material
to URLs or storage. Configure only an endpoint intended for browser access;
backend authorization and CORS remain authoritative. No server route is added.
Without valid configuration, the page says disconnected/unavailable, rather
than presenting sample events and claiming a connection or executing run.

Tests cover live announcements, retry boundaries, cleanup, late results,
permanently rejected access, empty state and switching runs. All data is synthetic.
