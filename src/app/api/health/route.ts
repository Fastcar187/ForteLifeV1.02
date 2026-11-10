import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const store = getDataStore();
    const facilities = store.getFacilities();

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        activeFacilitiesCount: facilities.length,
        latencyMs,
        version: "1.0.2",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err?.message || "Internal health check failure",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

