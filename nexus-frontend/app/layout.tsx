import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthContext";
import { FloatingBubble } from "@/components/layout/FloatingBubble";

export const metadata: Metadata = {
  title: "NEXUS — MindGigs AI Marketplace",
  description: "API-first agentic sales growth engine powered by Groq API, FAISS, and Firebase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-white min-h-screen font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          {children}
          <FloatingBubble />
        </AuthProvider>
      </body>
    </html>
  );
}
