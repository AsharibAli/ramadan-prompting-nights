/* From https://clerk.com/docs/webhooks/sync-data */

import type { WebhookEvent } from "@clerk/backend";
import { logger } from "@repo/logs";
import type { Context } from "hono";
import { Hono } from "hono";
import { Webhook } from "svix";
import { ramadanService } from "@/modules/ramadan/ramadan.service";

// Singleton Svix Webhook instance — avoid re-creating on every request
let _webhookInstance: Webhook | null = null;
let _webhookError: string | null = null;

function getWebhookInstance(): Webhook | null {
  if (_webhookInstance) return _webhookInstance;
  if (_webhookError) return null;

  const secret = process.env.CLERK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
  if (!secret || secret.includes("your_clerk_webhook_secret")) {
    _webhookError = "Webhook signing secret missing or placeholder";
    return null;
  }

  try {
    _webhookInstance = new Webhook(secret);
    return _webhookInstance;
  } catch (error) {
    _webhookError = "Invalid signing secret";
    logger.warn({ error }, "Invalid Clerk webhook signing secret");
    return null;
  }
}

async function handleClerkWebhook(c: Context) {
  const wh = getWebhookInstance();
  if (!wh) {
    return c.json({ message: `Webhook skipped: ${_webhookError}` }, 200);
  }
  // Get headers
  const svix_id = c.req.header("svix-id");
  const svix_timestamp = c.req.header("svix-timestamp");
  const svix_signature = c.req.header("svix-signature");

  // If there are no headers, error out
  if (!(svix_id && svix_timestamp && svix_signature)) {
    return c.text("Error: Missing Svix headers", 400);
  }

  // Get body
  const payload = await c.req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error("Error: Could not verify webhook:", err);
    return c.text("Error: Verification error", 400);
  }

  // Handle user events
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const primaryEmailAddress = email_addresses?.[0]?.email_address;
    if (!primaryEmailAddress) {
      return c.text("No email address found", 400);
    }

    const name = [first_name, last_name].filter(Boolean).join(" ").trim() || "GIAIC Student";

    try {
      await ramadanService.upsertUser({
        id,
        name,
        email: primaryEmailAddress,
        imageUrl: image_url,
      });
    } catch (error) {
      logger.error("Error upserting user:", error);
      return c.text("Error: Database operation failed", 500);
    }
  }

  return c.json({ message: "webhook received" }, 200);
}

const webhookRoutes = new Hono()
  .post("/", async (c) => handleClerkWebhook(c));

export { webhookRoutes };
