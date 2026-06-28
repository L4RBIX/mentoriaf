import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetUrl = "https://composio.dev/?ref=saaspo.com";
const outDir = resolve("docs/research/composio");
const shotDir = resolve("docs/design-references/composio");

mkdirSync(outDir, { recursive: true });
mkdirSync(shotDir, { recursive: true });

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: ok, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else ok(message.result);
      }
    });
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.ws.addEventListener("open", resolveOpen, { once: true });
      this.ws.addEventListener("error", rejectOpen, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
    });
  }

  close() {
    this.ws.close();
  }
}

async function launchChrome(port) {
  const profile = resolve(".tmp/chrome-composio-profile");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ], { stdio: "ignore" });

  for (let i = 0; i < 80; i += 1) {
    try {
      await fetchJson(`http://127.0.0.1:${port}/json/version`);
      return chrome;
    } catch {
      await delay(125);
    }
  }
  chrome.kill();
  throw new Error("Chrome did not start");
}

async function createPage(port) {
  const target = await fetchJson(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");
  return cdp;
}

async function navigate(cdp, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await cdp.send("Page.navigate", { url: targetUrl });
  await delay(6500);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
}

async function screenshot(cdp, file, full = false, y = 0, height = 1200, width = 1440) {
  let params = { format: "png", captureBeyondViewport: true };
  if (full) {
    const metrics = await cdp.send("Page.getLayoutMetrics");
    params = {
      ...params,
      clip: {
        x: 0,
        y: 0,
        width: Math.ceil(metrics.cssContentSize.width),
        height: Math.ceil(metrics.cssContentSize.height),
        scale: 1,
      },
    };
  } else {
    params = {
      ...params,
      clip: {
        x: 0,
        y,
        width,
        height,
        scale: 1,
      },
    };
  }
  const result = await cdp.send("Page.captureScreenshot", params);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(result.data, "base64"));
}

const extractScript = String.raw`
(() => {
  const props = [
    "fontSize","fontWeight","fontFamily","lineHeight","letterSpacing","color",
    "backgroundColor","backgroundImage","padding","margin","width","height",
    "maxWidth","display","flexDirection","justifyContent","alignItems","gap",
    "gridTemplateColumns","borderRadius","border","boxShadow","overflow",
    "position","top","right","bottom","left","zIndex","opacity","transform",
    "transition","animationName","animationDuration","animationTimingFunction",
    "filter","backdropFilter"
  ];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none";
  };
  const styleOf = (el) => {
    const s = getComputedStyle(el);
    const out = {};
    for (const prop of props) out[prop] = s[prop];
    return out;
  };
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) };
  };
  const pick = (selector, limit = 20) => [...document.querySelectorAll(selector)]
    .filter(visible)
    .slice(0, limit)
    .map((el) => ({
      selector,
      tag: el.tagName.toLowerCase(),
      className: String(el.className || "").slice(0, 220),
      text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 900),
      rect: rectOf(el),
      style: styleOf(el),
    }));
  const textBlocks = [...document.querySelectorAll("h1,h2,h3,p,a,button,span,li,code,pre")]
    .filter(visible)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      className: String(el.className || "").slice(0, 160),
      text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 500),
      rect: rectOf(el),
      font: {
        family: getComputedStyle(el).fontFamily,
        size: getComputedStyle(el).fontSize,
        weight: getComputedStyle(el).fontWeight,
        lineHeight: getComputedStyle(el).lineHeight,
        color: getComputedStyle(el).color,
        letterSpacing: getComputedStyle(el).letterSpacing,
      },
    }))
    .filter((item) => item.text);
  const colorSet = new Set();
  [...document.querySelectorAll("*")].filter(visible).slice(0, 900).forEach((el) => {
    const s = getComputedStyle(el);
    [s.color, s.backgroundColor, s.borderColor].forEach((value) => {
      if (value && value !== "rgba(0, 0, 0, 0)") colorSet.add(value);
    });
  });
  const sections = [...document.querySelectorAll("section,main > div,main > *")]
    .filter(visible)
    .slice(0, 40)
    .map((el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      className: String(el.className || "").slice(0, 240),
      text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 1200),
      rect: rectOf(el),
      style: styleOf(el),
    }));
  const backgroundImages = [...document.querySelectorAll("*")]
    .filter((el) => getComputedStyle(el).backgroundImage !== "none")
    .slice(0, 80)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      className: String(el.className || "").slice(0, 180),
      rect: rectOf(el),
      backgroundImage: getComputedStyle(el).backgroundImage.slice(0, 600),
    }));
  return {
    url: location.href,
    title: document.title,
    viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
    bodyClass: document.body.className,
    htmlClass: document.documentElement.className,
    nav: pick("nav, header", 10),
    headings: pick("h1,h2,h3", 80),
    buttons: pick("button,a[href]", 120),
    cards: pick("[class*='card'], [class*='Card'], article, pre, code", 120),
    sections,
    textBlocks,
    colors: [...colorSet],
    fonts: [...new Set(textBlocks.map((item) => item.font.family))],
    images: [...document.images].map((img) => ({ src: img.currentSrc || img.src, alt: img.alt, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, rect: rectOf(img), className: String(img.className || "").slice(0, 160) })),
    videos: [...document.querySelectorAll("video")].map((video) => ({ src: video.currentSrc || video.src || video.querySelector("source")?.src, poster: video.poster, autoplay: video.autoplay, loop: video.loop, muted: video.muted, rect: rectOf(video) })),
    svgs: [...document.querySelectorAll("svg")].slice(0, 80).map((svg) => ({ outer: svg.outerHTML.slice(0, 700), rect: rectOf(svg), text: svg.textContent?.trim().slice(0, 100) })),
    backgroundImages,
    animationElements: [...document.querySelectorAll("*")]
      .filter((el) => visible(el) && (getComputedStyle(el).animationName !== "none" || getComputedStyle(el).transitionDuration !== "0s"))
      .slice(0, 160)
      .map((el) => ({ tag: el.tagName.toLowerCase(), className: String(el.className || "").slice(0, 180), text: (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 160), rect: rectOf(el), style: styleOf(el) })),
    scripts: [...document.scripts].map((script) => script.src).filter(Boolean).slice(0, 80),
    links: [...document.querySelectorAll("link")].map((link) => ({ rel: link.rel, href: link.href, as: link.as, type: link.type })).slice(0, 120),
  };
})()
`;

async function inspectViewport(width, height, label) {
  const port = width === 1440 ? 9227 : 9228;
  const chrome = await launchChrome(port);
  try {
    const cdp = await createPage(port);
    await navigate(cdp, width, height);
    const data = await evaluate(cdp, extractScript);
    writeFileSync(resolve(outDir, `${label}.json`), `${JSON.stringify(data, null, 2)}\n`);
    await screenshot(cdp, resolve(shotDir, `original-${label}-full.png`), true, 0, height, width);
    for (const y of [0, 700, 1400, 2200, 3200, 4300, 5600]) {
      if (y < data.viewport.scrollHeight) {
        await screenshot(cdp, resolve(shotDir, `original-${label}-y${y}.png`), false, y, height, width);
      }
    }
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.floor(width / 2), y: Math.floor(height / 2) });
    await delay(700);
    const afterHover = await evaluate(cdp, `JSON.stringify({ el: document.elementFromPoint(${Math.floor(width / 2)}, ${Math.floor(height / 2)})?.outerHTML?.slice(0, 500), transform: getComputedStyle(document.elementFromPoint(${Math.floor(width / 2)}, ${Math.floor(height / 2)})).transform, color: getComputedStyle(document.elementFromPoint(${Math.floor(width / 2)}, ${Math.floor(height / 2)})).color })`);
    writeFileSync(resolve(outDir, `${label}-hover.json`), `${afterHover}\n`);
    await cdp.send("Runtime.evaluate", { expression: "scrollTo(0, 360)", awaitPromise: true });
    await delay(700);
    const scrolled = await evaluate(cdp, extractScript);
    writeFileSync(resolve(outDir, `${label}-scrolled.json`), `${JSON.stringify({ nav: scrolled.nav, animationElements: scrolled.animationElements.slice(0, 40) }, null, 2)}\n`);
    cdp.close();
  } finally {
    chrome.kill();
  }
}

await inspectViewport(1440, 1200, "desktop");
await inspectViewport(390, 900, "mobile");
