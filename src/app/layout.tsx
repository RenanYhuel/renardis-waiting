import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Renardis - Cloud Computing Éthique pour les Jeunes",
    description:
        "Association proposant un service de cloud computing éthique, accessible et éducatif à destination des jeunes. Favoriser l'autonomie numérique, la collaboration et l'inclusion dans le respect de la vie privée. Site en construction.",
    keywords: [
        "cloud computing",
        "éthique",
        "jeunes",
        "éducation numérique",
        "vie privée",
        "solidarité",
        "inclusion",
        "autonomie numérique",
        "association",
    ],
    openGraph: {
        title: "Renardis - Cloud Computing Éthique pour les Jeunes",
        description:
            "Association pour un cloud computing éthique, accessible et éducatif. Solidarité, inclusion et respect de la vie privée.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
                <Toaster
                    theme="dark"
                    position="top-center"
                    closeButton
                    richColors
                    duration={5000}
                    toastOptions={{
                        style: {
                            background: "rgba(0, 19, 44, 0.95)",
                            border: "1px solid rgba(79, 195, 247, 0.3)",
                            color: "#4fc3f7",
                            backdropFilter: "blur(10px)",
                        },
                        className: "touch-pan-x",
                    }}
                />
            </body>
        </html>
    );
}
