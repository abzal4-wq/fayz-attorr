/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '**'}/**`,
      },
    ],
    formats: ['image/webp'],
  },
  // Prisma'ning native binary'lari serverless bundle'ga to'g'ri tushishi uchun
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
}

export default nextConfig
