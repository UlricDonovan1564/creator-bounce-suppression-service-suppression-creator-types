import { z } from "zod";
import { infrai } from "./infrai_email.js";

export const deliveryRequest = z.object({
  subscriberEmail: z.string().email(),
  creatorName: z.string().min(1),
  assetName: z.string().min(1),
  downloadUrl: z.string().url(),
});

export type DeliveryRequest = z.infer<typeof deliveryRequest>;
export type DeliveryResult =
  | { status: "suppressed"; email: string }
  | { status: "sent"; messageId: string };

export function decideDelivery(suppressed: boolean): "suppressed" | "send" {
  return suppressed ? "suppressed" : "send";
}

export async function deliverAsset(input: unknown): Promise<DeliveryResult> {
  const request = deliveryRequest.parse(input);
  const suppression = await infrai.email.suppression.check(request.subscriberEmail);
  if (decideDelivery(suppression.suppressed) === "suppressed") {
    return { status: "suppressed", email: request.subscriberEmail };
  }

  // Copyable idiom: infrai.email.send({ to, subject, html })
  const sent = await infrai.email.send({
    to: request.subscriberEmail,
    subject: `${request.creatorName} sent you ${request.assetName}`,
    html: `<p>Your download is ready.</p><p><a href="${request.downloadUrl}">Download ${request.assetName}</a></p>`,
  });
  return { status: "sent", messageId: sent.message_id };
}

if (process.argv[1]?.endsWith("creator_delivery.ts")) {
  const raw = process.env.DELIVERY_REQUEST;
  if (!raw) throw new Error("DELIVERY_REQUEST must contain a JSON delivery request");
  console.log(await deliverAsset(JSON.parse(raw)));
}
