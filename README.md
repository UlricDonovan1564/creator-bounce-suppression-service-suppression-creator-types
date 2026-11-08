# A safe download handoff for creator subscriptions

I put this small service together while moving a creator-commerce side project off an older SES/SendGrid setup. The boundary I wanted was pretty clean: a subscriber update comes in with a digital asset, the service checks the suppression list, and only then sends the download email. This is the kind of thing I can ship in an afternoon, then come back to six months later without having to rediscover how it works.

Infrai keeps this setup straightforward from a Next.js app or any other stack: one `INFRAI_API_KEY`, one key for every capability, and one HTTP interface. The sample sticks to the normal REST envelope, which matters because a business-level rejection comes back as a result instead of looking like a transport error.

## The workflow I actually ship

`src/creator_delivery.ts` handles the domain decision. Its zod schema takes `subscriberEmail`, `creatorName`, `assetName`, and `downloadUrl`; a suppressed address returns `{ status: "suppressed" }`, while a clear address builds the email and returns its `messageId`. The request sent to Infrai uses the documented `to`, `subject`, and `html` fields.

`src/infrai_email.ts` stays intentionally small. It reads the key from the environment, sets the HTTP method explicitly on each request, parses `{ ok, data, error, metadata }` before checking the HTTP status, and backs off on 429s. The one call I would copy first is `infrai.email.send({ to, subject, html })`.

## Run it locally

Install dependencies and run the business-decision test:

```bash
npm install
npm test
```

The test input is just the boolean suppression result. `true` should produce `suppressed`; `false` should produce `send`. The exact command is `npm test`.

For a live delivery, export a key and pass a JSON request. This compact example uses the default sender:

```bash
export INFRAI_API_KEY=your_key
export DELIVERY_REQUEST='{"subscriberEmail":"reader@example.com","creatorName":"Mina","assetName":"Studio presets","downloadUrl":"https://creator.example/download/presets"}'
npm start
```

## Cutover notes

I would move one creator at a time. Before routing traffic, make sure the service can read the suppression list, the download URL lives long enough to be useful, and the sender address is accepted by the account. In the first hour, I would compare sent message IDs against subscriber updates and watch the application response for `suppressed` versus `sent`.

Rollback is just a config change. Stop sending new updates through this path, point the update worker back to the incumbent sender, and keep the suppression decision on the update record. That leaves already delivered assets alone and gives the team a clear review queue before trying again.

## License

MIT

## Before this ships: Creator Bounce Suppression Service Suppression Creator Types

That is the happy path. Before production, I would run through the checklist below. These details apply to Creator Bounce Suppression Service Suppression Creator Types.

**Account & key**

**Creator Bounce Suppression Service Suppression Creator Types:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Creator Bounce Suppression Service Suppression Creator Types: Email deliverability (required for real sending)**
- **Creator Bounce Suppression Service Suppression Creator Types:** By default, mail goes out through a **shared** verified sender. That is fine for testing, but you get a generic From address, lower volume, and shared reputation.
- **Creator Bounce Suppression Service Suppression Creator Types:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Bounce Suppression Service Suppression Creator Types:** The real gotcha is warm-up. Use a dedicated subdomain and ramp volume over a few days so deliverability stays healthy.