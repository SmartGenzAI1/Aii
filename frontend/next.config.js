const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

const withPWA = require("next-pwa")({
  dest: "public"
})

function parseHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const isProd = process.env.NODE_ENV === "production"

// Comma-separated allowlist of remote image hostnames (no wildcards).
// Example: NEXT_IMAGE_REMOTE_HOSTS=cdn.example.com,images.example.com
const extraImageHosts = (process.env.NEXT_IMAGE_REMOTE_HOSTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const supabaseHost = parseHostname(process.env.NEXT_PUBLIC_SUPABASE_URL || "")
const imageHosts = Array.from(new Set([supabaseHost, ...extraImageHosts].filter(Boolean)))

const remotePatterns = []
if (!isProd) {
  remotePatterns.push(
    { protocol: "http", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" }
  )
}
for (const host of imageHosts) {
  remotePatterns.push({ protocol: "https", hostname: host })
}

module.exports = withBundleAnalyzer(
  withPWA({
    reactStrictMode: true,
    images: {
      remotePatterns
    },
    experimental: {
      serverComponentsExternalPackages: ["sharp", "onnxruntime-node"]
    }
  })
)
