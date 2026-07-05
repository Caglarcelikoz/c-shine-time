import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow document uploads (warranty/receipt PDFs, images) up to 10 MB.
      bodySizeLimit: "10mb",
    },
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
