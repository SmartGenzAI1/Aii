// @ts-nocheck
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/utility/error-boundary"
import { GlobalState } from "@/components/utility/global-state"
import { Providers } from "@/components/utility/providers"
import TranslationsProvider from "@/components/utility/translations-provider"
import initTranslations from "@/lib/i18n"
import { Database } from "@root/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { ReactNode } from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const APP_NAME = "GenZ AI"
const APP_DEFAULT_TITLE = "GenZ AI - The Ultimate AI Chat Experience"
const APP_TITLE_TEMPLATE = "%s | GenZ AI"
const APP_DESCRIPTION = "🔥 The Ultimate AI Chat Experience for Gen Z - Modern AI chat with multi-provider support, real-time failover, and vibes that match your energy. Chat with Groq, Claude, GPT, and more!"

interface RootLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE
  },
  description: APP_DESCRIPTION,
  keywords: ["AI chat", "Gen Z", "artificial intelligence", "chatbot", "OpenAI", "Claude", "Groq", "GPT", "AI assistant", "modern chat"],
  authors: [{ name: "SmartGenzAI Team" }],
  creator: "SmartGenzAI",
  publisher: "SmartGenzAI",
  formatDetection: {
    telephone: false
  },
  metadataBase: new URL("https://genz-ai.com"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512x512.png",
    apple: "/icon-512x512.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: APP_DEFAULT_TITLE,
    startupImage: "/icon-512x512.png"
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION,
    url: "https://genz-ai.com",
    images: [
      {
        url: "/LIGHT_BRAND_LOGO.png",
        width: 200,
        height: 200,
        alt: "GenZ AI Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION,
    images: ["/LIGHT_BRAND_LOGO.png"],
    creator: "@SmartGenzAI"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  category: "AI & Chat"
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover"
}

const i18nNamespaces = ["translation"]

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const session = (await supabase.auth.getSession()).data.session

  const { t, resources } = await initTranslations(locale, i18nNamespaces)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="dark">
          <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={locale}
            resources={resources}
          >
            <ErrorBoundary>
              <Toaster richColors position="top-center" duration={3000} />
              <div className="bg-background text-foreground flex h-dvh flex-col items-center overflow-x-auto min-h-screen-safe">
                {session ? <GlobalState>{children}</GlobalState> : children}
              </div>
            </ErrorBoundary>
          </TranslationsProvider>
        </Providers>
      </body>
    </html>
  )
}
