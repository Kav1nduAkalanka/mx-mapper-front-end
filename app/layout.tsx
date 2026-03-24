import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MX Standards Mapper",
    description: "AIESEC TM Tool for mapping member experiences.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}