import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 포트폴리오 빌드 — ESLint 경고/에러가 빌드를 막지 않게 함 (타입 에러는 여전히 잡힘)
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // 포트폴리오 시드 데이터(supabase/06_seed.sql)가 사용하는 외부 이미지 호스트
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
