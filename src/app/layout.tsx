import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { Navbar } from "@/components/Navbar";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { ScamBanner } from "@/components/ScamBanner";
import { ShieldCheck, HeartHandshake, FileDown } from "lucide-react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0F2942",
};

export const metadata: Metadata = {
  title: "Fortelife | Hospital Bookings & Health - Ghana's Healthcare Partner",
  description:
    "Official low-data healthcare appointment booking system compliant with Ghana Data Protection Act (Act 843). Accessible for public and private clinics across Ghana.",
  manifest: "/manifest.json",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const showDemoSwitcher =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_MODE === "true";

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-alabaster text-navy-950 font-sans selection:bg-teal-500 selection:text-white">
        <ScamBanner />
        {showDemoSwitcher && (
          <DevRoleSwitcher currentRole={session?.role} currentEmail={session?.email} />
        )}
        <Navbar user={session} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="bg-navy-950 text-slate-400 py-8 border-t border-navy-800 text-xs no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <div>
                <p className="font-semibold text-slate-200">
                  Compliant with Ghana Data Protection Act, 2012 (Act 843)
                </p>
                <p className="text-slate-400">
                  Data Protection Commission (DPC) Registered • AES-256-GCM Field Encryption
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-center md:text-right">
              <div>
                <p className="text-slate-300 font-medium">
                  Optimized for Ghana 3G Networks
                </p>
                <p className="text-slate-500 text-[11px]">
                  Zero heavy assets • Offline clinic queue print fallback enabled
                </p>
              </div>
              <a
                href="/Fortelife_Documentation.pdf"
                download="Fortelife_Full_Documentation.pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-teal-300 hover:text-white border border-navy-700 transition-colors text-[11px] font-medium"
                title="Download complete technical and clinical system documentation (PDF)"
              >
                <FileDown className="w-4 h-4 text-teal-400" />
                <span>Documentation (PDF)</span>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

