// app/layout.tsx
import "../../styles/globals.css";
import ClientWrapper from "../../components/ClientWrapper"; // or adjust path

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
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
