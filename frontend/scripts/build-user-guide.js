#!/usr/bin/env node

/**
 * Build the User Guide PDF from markdown + screenshots.
 * Outputs:
 *   dist/user-guide.pdf
 *   frontend/public/user-guide.pdf
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const sourceMd = path.join(repoRoot, 'USER_GUIDE.md');
const distDir = path.join(repoRoot, 'dist');
const publicPdf = path.join(repoRoot, 'frontend', 'public', 'user-guide.pdf');
const htmlOut = path.join(distDir, 'user-guide.html');
const pdfOut = path.join(distDir, 'user-guide.pdf');

if (!fs.existsSync(sourceMd)) {
  console.error(`Source markdown not found at ${sourceMd}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });

// Custom renderer to resolve relative image paths to file:// URLs
const renderer = new marked.Renderer();
const defaultImage = renderer.image.bind(renderer);
renderer.image = function(token) {
  const href = token.href || '';
  const title = token.title || '';
  const text = token.text || '';

  // Resolve images relative to frontend/screenshots directory
  const screenshotsDir = path.join(repoRoot, 'frontend', 'screenshots');
  const resolved = href && !href.startsWith('http')
    ? `file://${path.resolve(screenshotsDir, href)}`
    : href;

  const titleAttr = title ? ` title="${title}"` : '';
  return `<figure><img src="${resolved}" alt="${text}"${titleAttr} /><figcaption>${text}</figcaption></figure>`;
};

const markdown = fs.readFileSync(sourceMd, 'utf8');
const body = marked.parse(markdown, { renderer });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HOA Management System - User Guide</title>
  <style>
    :root {
      --text: #1a1a1a;
      --muted: #555;
      --accent: #1976d2;
      --border: #e0e0e0;
    }
    body {
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      color: var(--text);
      margin: 0;
      padding: 32px;
      line-height: 1.6;
    }
    h1, h2, h3, h4 {
      color: #0f172a;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
      line-height: 1.25;
    }
    h1 { font-size: 32px; }
    h2 { font-size: 26px; }
    h3 { font-size: 21px; }
    h4 { font-size: 18px; }
    p, li { font-size: 14px; }
    code {
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 13px;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      overflow: auto;
      font-size: 13px;
    }
    img {
      max-width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.05);
    }
    figure {
      margin: 24px 0;
      page-break-inside: avoid;
    }
    figcaption {
      font-size: 12px;
      color: var(--muted);
      margin-top: 6px;
      text-align: center;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 8px;
      text-align: left;
    }
    blockquote {
      border-left: 4px solid var(--accent);
      padding-left: 12px;
      color: var(--muted);
      margin: 16px 0;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

fs.writeFileSync(htmlOut, html, 'utf8');

async function generatePdf() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`file://${htmlOut}`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'screen' });
  await page.pdf({
    path: pdfOut,
    format: 'A4',
    margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' },
    printBackground: true,
  });
  await browser.close();
}

generatePdf()
  .then(() => {
    fs.mkdirSync(path.dirname(publicPdf), { recursive: true });
    fs.copyFileSync(pdfOut, publicPdf);
    console.log(`User guide generated:\n- ${pdfOut}\n- ${publicPdf}`);
  })
  .catch((err) => {
    console.error('Failed to generate user guide PDF:', err);
    process.exit(1);
  });
