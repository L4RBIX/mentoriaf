import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const assets = [
  ["https://composio.dev/_next/static/media/f417133a7bc67e37-s.p.woff2", "public/fonts/composio/abc-diatype-regular.woff2"],
  ["https://composio.dev/_next/static/media/8052ba449b4ca60a-s.p.woff2", "public/fonts/composio/abc-diatype-medium.woff2"],
  ["https://composio.dev/_next/static/media/1e751dc5947d8156-s.p.woff2", "public/fonts/composio/abc-diatype-italic.woff2"],
  ["https://composio.dev/_next/static/media/bb3ef058b751a6ad-s.p.woff2", "public/fonts/composio/jetbrains-mono.woff2"],
  ["https://composio.dev/logos/composio-full-white.svg", "public/images/composio/logos/composio-full-white.svg"],
  ["https://composio.dev/logos/composio-full-black.svg", "public/images/composio/logos/composio-full-black.svg"],
  ["https://composio.dev/logos/composio-white.svg", "public/images/composio/logos/composio-white.svg"],
  ["https://composio.dev/clients/logo-agentai.svg", "public/images/composio/clients/logo-agentai.svg"],
  ["https://composio.dev/clients/logo-zoom.png", "public/images/composio/clients/logo-zoom.png"],
  ["https://composio.dev/clients/logo-letta.svg", "public/images/composio/clients/logo-letta.svg"],
  ["https://composio.dev/clients/logo-glean.svg", "public/images/composio/clients/logo-glean.svg"],
  ["https://composio.dev/clients/logo-hubspot.svg", "public/images/composio/clients/logo-hubspot.svg"],
  ["https://composio.dev/clients/logo-wabi.svg", "public/images/composio/clients/logo-wabi.svg"],
  ["https://composio.dev/images/clients/claude.svg", "public/images/composio/clients/claude.svg"],
  ["https://composio.dev/images/tool-calls-bg.png", "public/images/composio/tool-calls-bg.png"],
  ["https://composio.dev/images/constant-evolution-bg.png", "public/images/composio/constant-evolution-bg.png"],
  ["https://composio.dev/images/end-user-auth-bg.png", "public/images/composio/end-user-auth-bg.png"],
  ["https://composio.dev/images/dynamic-sandbox.png", "public/images/composio/dynamic-sandbox.png"],
  ["https://composio.dev/images/sdk-features/managed-auth-art.png", "public/images/composio/sdk/managed-auth-art.png"],
  ["https://composio.dev/images/sdk-features/triggers-art.png", "public/images/composio/sdk/triggers-art.png"],
  ["https://composio.dev/images/security/holographic-1.png", "public/images/composio/security/holographic-1.png"],
  ["https://composio.dev/images/security/holographic-2.png", "public/images/composio/security/holographic-2.png"],
  ["https://composio.dev/images/community/opennote-logo.png", "public/images/composio/community/opennote-logo.png"],
  ["https://composio.dev/images/community/abhi-arya.jpeg", "public/images/composio/community/abhi-arya.jpeg"],
  ["https://composio.dev/favicon.ico", "public/seo/favicon.ico"],
  ["https://composio.dev/favicon-16x16.png", "public/seo/favicon-16x16.png"],
  ["https://composio.dev/favicon-32x32.png", "public/seo/favicon-32x32.png"],
  ["https://composio.dev/apple-touch-icon.png", "public/seo/apple-touch-icon.png"],
  ["https://composio.dev/site.webmanifest", "public/seo/site.webmanifest"],
];

for (const name of [
  "slack",
  "notion",
  "github",
  "linear",
  "gmail",
  "stripe",
  "sentry",
  "vercel",
  "googlecalendar",
  "googledocs",
  "supabase",
  "googlesheets",
  "firecrawl",
]) {
  assets.push([`https://logos.composio.dev/api/${name}`, `public/images/composio/app-icons/${name}.png`]);
}

async function download(url, file) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  mkdirSync(dirname(resolve(file)), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(resolve(file)));
  console.log(`${file}`);
}

for (const [url, file] of assets) {
  await download(url, file);
}
