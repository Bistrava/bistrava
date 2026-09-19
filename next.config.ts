import type { NextConfig } from "next";

const productMediaPatterns: URL[] = [];
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    productMediaPatterns.push(
      new URL(
        "/storage/v1/object/public/product-media/**",
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
    );
  } catch {
    // Environment validation reports malformed URLs; builds remain safe without a remote pattern.
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  images: { remotePatterns: productMediaPatterns },
  async redirects() {
    return [
      {
        source: "/izbira-sistema",
        destination: "/izbira-mehcalca",
        permanent: true,
      },
      {
        source: "/montaza-in-vzdrzevanje",
        destination: "/mehcalci-vode",
        permanent: true,
      },
      {
        source: "/montaza-mehcalca-vode",
        destination: "/mehcalci-vode",
        permanent: true,
      },
      {
        source: "/servis-mehcalnih-naprav",
        destination: "/vodici",
        permanent: true,
      },
      {
        source: "/kontakt",
        destination: "/mehcalci-vode",
        permanent: true,
      },
      {
        source: "/dostava-in-vracila",
        destination: "/dostava",
        permanent: true,
      },
      {
        source: "/kategorije/mehcalci-vode",
        destination: "/mehcalci-vode",
        permanent: true,
      },
      {
        source: "/kategorije/resitve-proti-vodnemu-kamnu",
        destination: "/vodni-kamen",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.bistrava.com" }],
        destination: "https://bistrava.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
