// app/layout.tsx
import "../../styles/globals.css";
import ClientWrapper from "../../components/ClientWrapper"; // or adjust path
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "Tailwind Test",
  description: "Testing Tailwind CSS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ClientWrapper>{children}</ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
