#!/usr/bin/env node
/**
 * Smoke-check that blog hero/featured image paths resolve.
 * Usage: node scripts/verify-media-urls.mjs [--fetch]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMediaUrl, DEFAULT_BLOG_IMAGE, repairTenantR2Url } from '../src/lib/media-url.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const shouldFetch = process.argv.includes('--fetch');

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(heroImage|featuredImage|image):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return data;
}

async function main() {
  // Quick self-check for R2 tenant repair
  const bare =
    'https://pub-example.r2.dev/sample-cover.jpg';
  const repaired = repairTenantR2Url(bare);
  if (!repaired.includes('/tenants/interieurwonenplaza/')) {
    console.error('FAIL repairTenantR2Url did not insert tenant prefix:', repaired);
    process.exit(1);
  }
  console.log('OK   repairTenantR2Url →', repaired);

  const files = (await fs.readdir(BLOG_DIR)).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let ok = 0;
  let warn = 0;

  for (const file of files) {
    const text = await fs.readFile(path.join(BLOG_DIR, file), 'utf8');
    const data = parseFrontmatter(text);
    const hero = resolveMediaUrl(data.heroImage ?? data.featuredImage ?? data.image, {
      env: process.env,
      fallback: DEFAULT_BLOG_IMAGE,
    });
    const featured = resolveMediaUrl(data.featuredImage ?? data.heroImage ?? data.image, {
      env: process.env,
      fallback: DEFAULT_BLOG_IMAGE,
    });

    const relativeBroken = [hero, featured].some(
      (u) => u.startsWith('/media/') || u.startsWith('/api/media/'),
    );

    if (relativeBroken) {
      console.error(`FAIL ${file}: unresolved Payload-relative media URL (set PUBLIC_PAYLOAD_URL)`);
      console.error(`  hero=${hero}`);
      console.error(`  featured=${featured}`);
      warn += 1;
      continue;
    }

    if (shouldFetch) {
      for (const [label, url] of [
        ['hero', hero],
        ['featured', featured],
      ]) {
        const checkUrl = url.startsWith('http') ? url : `http://127.0.0.1:4321${url}`;
        try {
          const res = await fetch(checkUrl, { method: 'HEAD' });
          if (!res.ok) {
            console.warn(`WARN ${file} ${label}: HTTP ${res.status} → ${checkUrl}`);
            warn += 1;
          }
        } catch (err) {
          console.warn(`WARN ${file} ${label}: ${err.message} → ${checkUrl}`);
          warn += 1;
        }
      }
    }

    ok += 1;
  }

  console.log(`\nChecked ${files.length} posts · ok=${ok} · warnings=${warn}`);
  if (warn > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
