/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["utfs.io", "res.cloudinary.com", "lh3.googleusercontent.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["mongoose"],
  },
};

export default nextConfig;
