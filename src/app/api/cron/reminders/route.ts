import { NextRequest, NextResponse } from "next/server";
import { getDataStore } from "@/lib/data-store";
import { dispatchAppointmentNotification } from "@/lib/messaging";
import { decrypt } from "@/lib/crypto";

const store = getDataStore();

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET for security
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET || "dev_cron_secret";

  if (process.env.NODE_ENV === "production") {
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }
  }

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Get active booked appointments
  const allAppointments = store.getAppointments({
    id: "system-cron",
    email: "system@cron.local",
    role: "platform_admin",
  }, { status: "booked" });

  let remindersSent = 0;

  for (const app of allAppointments) {
    const slotTime = new Date(app.slot.startTime);

    // If appointment is within 24 hours and hasn't received a reminder yet
    if (slotTime > now && slotTime <= next24h && !app.reminderSentAt) {
      const user = store.getUserById(app.patientId);
      if (user) {
        const phone = decrypt(user.phoneEnc);
        const dateStr = slotTime.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const timeStr = slotTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await dispatchAppointmentNotification("whatsapp", {
          patientId: app.patientId,
          phone,
          appointmentId: app.id,
          clinicName: app.facility.name,
          date: dateStr,
          time: timeStr,
          referenceCode: app.referenceCode,
          eventType: "reminder_24h",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/patient/appointments`,
        });

        app.reminderSentAt = new Date().toISOString();
        remindersSent += 1;
      }
    }
  }

  store.recordAudit("CRON_REMINDERS_TRIGGERED", "cron", null, null, {
    remindersSent,
    window: "24h",
  });

  return NextResponse.json({
    success: true,
    remindersSent,
    timestamp: new Date().toISOString(),
  });
}
