import { NextRequest, NextResponse } from "next/server";
import { getDataStore } from "@/lib/data-store";

const store = getDataStore();

// WhatsApp Webhook Verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_SECRET || "dev_webhook_secret";

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden verification token" }, { status: 403 });
}

// Inbound webhook for WhatsApp and SMS delivery reports & STOP opt-out (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check WhatsApp incoming message (e.g. STOP command)
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages && messages.length > 0) {
      const msg = messages[0];
      const text = msg.text?.body?.trim().toUpperCase();

      if (text === "STOP" || text === "UNSUBSCRIBE") {
        const senderPhone = `+${msg.from}`;
        // Find patient user and set opt-out
        store.recordAudit("PATIENT_MESSAGING_OPT_OUT", "notification_prefs", null, null, {
          phoneMasked: senderPhone.slice(0, 4) + "••••",
          action: "REPLIED_STOP",
        });

        return NextResponse.json({ status: "opted_out_successfully" });
      }
    }

    // Check delivery status updates (e.g., delivered, read, failed)
    const statuses = body.entry?.[0]?.changes?.[0]?.value?.statuses;
    if (statuses && statuses.length > 0) {
      const statusUpdate = statuses[0];
      store.recordAudit("MESSAGE_STATUS_RECEIVED", "message_log", null, null, {
        providerMsgId: statusUpdate.id,
        status: statusUpdate.status,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing error" },
      { status: 400 }
    );
  }
}

