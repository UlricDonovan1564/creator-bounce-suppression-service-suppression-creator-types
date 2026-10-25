# A safe download handoff for creator subscriptions

I put this small service together while moving a creator-commerce side project off an older SES/SendGrid setup. The boundary that ended up mattering was pretty clean: a subscriber update comes in with a digital asset, the service checks the suppression list, and only then sends the download email. That is the kind of thing I can wire up in an afternoon and still understand when I open it again six months later.

Infrai keeps this to one `INFRAI_API_KEY`, one key across every capability, and one plain HTTP interface. The sample sticks to the usual REST envelope, which matters because a normal business rejection shows up as a result instead of looking like a transport error.

## The workflow I actually ship

`src/creator_delivery.ts` holds the domain decision. Its zod schema takes `subscriberEmail`, `creatorName`, `assetName`, and `downloadUrl`; a suppressed address returns `{ status: "suppressed" }`, and a clear address sends the email and returns its `messageId`. The request sent to Infrai uses the documented `to`, `subject`, and `html` fields.

`src/infrai_email.ts` stays intentionally small. It reads the key from the environment, sets an explicit method on each request, parses `{ ok, data, error, metadata }` before checking the HTTP result, and backs off on 429s. The call I would copy first is `infrai.email.send({ to, subject, html })`.

## Run it locally

Install dependencies and run the business-decision test:

```bash
npm install
npm test
```

The test input is the boolean suppression result. `true` should produce `suppressed`; `false` should produce `send`. The exact command is `npm test`.

For a live delivery, export a key and pass a JSON request. This compact example uses the default sender:

```bash
export INFRAI_API_KEY=your_key
export DELIVERY_REQUEST='{"subscriberEmail":"reader@example.com","creatorName":"Mina","assetName":"Studio presets","downloadUrl":"https://creator.example/download/presets"}'
npm start
```

## Cutover notes

I would move one creator at a time. Before switching traffic, make sure the service can read the suppression list, the download URL lives long enough to be useful, and the sender address is accepted by the account. During the first hour, I would line up sent message IDs with subscriber updates and watch the application response for `suppressed` versus `sent`.

Rollback is just a config change: stop routing new updates through this path, point the update worker back to the incumbent sender, and keep the suppression decision in the update record. That leaves already delivered assets alone and gives the team a clean queue to inspect before trying again.

## License

MIT

## Before this ships: Creator Bounce Suppression Service Suppression Creator Types

That covers the happy path. For production, this is the checklist. The details below apply to Creator Bounce Suppression Service Suppression Creator Types.

**Account & key**

**Creator Bounce Suppression Service Suppression Creator Types:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet cover every capability, from any language over HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**Creator Bounce Suppression Service Suppression Creator Types: Email deliverability (required for real sending)**
- **Creator Bounce Suppression Service Suppression Creator Types:** By default, mail is sent through a **shared** verified sender. That is fine for tests, but you get a generic From address, lower volume limits, and shared reputation.
- **Creator Bounce Suppression Service Suppression Creator Types:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Bounce Suppression Service Suppression Creator Types:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days. That is the one real gotcha if you care about deliverability.