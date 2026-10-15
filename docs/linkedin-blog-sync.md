# LinkedIn posts in the ROOTS-AI blog

The 10 posts supplied in the initial ROOTS-AI LinkedIn export are bundled in
`lib/linkedin/archive.json`; their supplied order is preserved because the export has no post
timestamps or individual post links. Nine verified images are stored locally in `public/linkedin`
so the archive does not depend on expiring LinkedIn media URLs. The tenth post uses the built-in
image treatment because its export field contained a profile URL, not an image.
Each imported post opens as its own full article at `/blog/linkedin/<post-slug>`.

New posts are displayed on `/blog` after they are sent to `POST /api/v1/linkedin/webhook`. The
application receives and displays posts; it does not sign in to LinkedIn or poll the profile itself.
Configure an authorized integration with permission to read the ROOTS-AI LinkedIn profile and send
each new post to this endpoint. Live posts appear before the bundled archive; exact text duplicates
are omitted.

## Configure the platform

1. Apply `supabase/migrations/20261015_linkedin_posts.sql` to the production Supabase project. It
   creates a private posts table and media bucket.
2. Set `LINKEDIN_WEBHOOK_SECRET` to a long random secret in the production app environment. Set
   send the same value using the `Authorization: Bearer` header or the `x-webhook-secret` header.
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured on the server.
   Never put the service-role key in the automation or browser.
4. Configure the integration to POST JSON to
   `https://roots-ai.health/api/v1/linkedin/webhook`. Newly published posts then appear on `/blog`.

The endpoint accepts an object or an array of up to 20 posts. For additional historical imports, use an integration that can export the profile's posts, then
send all available posts in batches of 20; a successful response contains one result per input.
Repeated delivery is safe: posts are upserted by LinkedIn post ID. An item can use `id` (or
`post_id`, `urn`, or `guid`), `url`/`permalink`, `text`/`content`/`commentary`, `author`,
`published_at`, and `image`/`image_url`. Only LinkedIn post URLs and HTTPS image URLs are kept.

For example:

```json
{
  "id": "urn:li:activity:123456789",
  "url": "https://www.linkedin.com/feed/update/urn:li:activity:123456789",
  "text": "A ROOTS-AI company update",
  "author": "ROOTS-AI",
  "published_at": "2026-10-15T09:00:00Z",
  "image_url": "https://example.com/post-image.jpg"
}
```

Check the JSON `results` array for `saved` statuses. Split batches that exceed 20 items; oversized
requests are rejected rather than partially imported.
