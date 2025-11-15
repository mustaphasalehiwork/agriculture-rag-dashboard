/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': ['./Docs/**/*'],
  },
}

export default nextConfig