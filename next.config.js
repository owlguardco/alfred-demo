// Build guard: a NEXT_PUBLIC_ variable is inlined into the browser bundle, so
// any name that looks like a credential fails the build.
const leaked = Object.keys(process.env).filter(
  (k) => k.startsWith('NEXT_PUBLIC_') && /PIN|SECRET|KEY|TOKEN|PASSWORD/i.test(k.slice(12))
)
if (leaked.length) {
  throw new Error(`Refusing to build: credential-like public env vars ${leaked.join(', ')}. Make them server-only.`)
}

/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
