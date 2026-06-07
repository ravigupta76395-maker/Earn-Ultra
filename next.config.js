/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
}

module.exports = nextConfig
