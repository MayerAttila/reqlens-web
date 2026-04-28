import type { Metadata } from "next";
import { ToastProvider } from "../components/providers/toast-provider";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

export const metadata: Metadata = {
  title: "Reqlens",
  description: "Request analytics dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
