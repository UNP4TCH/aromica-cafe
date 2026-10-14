import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, ".demo-data");
const dataFilePath = path.join(dataDir, "demo_snapshot.json");

const PORT = 5176;
const HOST = "127.0.0.1";
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB payload limit
const MAX_SSE_CLIENTS = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_WRITES_PER_WINDOW = 120; // 120 write mutations/min per IP

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load baseline defaults from cafe.ts if file doesn't exist
function getBaselineSnapshot() {
  return {
    version: 1,
    updatedAt: Date.now(),
    profile: {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Aromica Café",
      brandWord1: "Aromica",
      brandWord2: "Café",
      tagline: "Coffee • Chai • Comfort",
      slogan: "Good Food, Good Mood",
      description: "A warm neighborhood café for unhurried cups of coffee, steaming kullad chai, and freshly prepared comfort food near Boral High School.",
      neighborhood: "Near Boral High School",
      city: "Kolkata",
      address: {
        street: "Rajnarayan Park, C/9, Boral Main Road, near Boral High School",
        locality: "Usha Pally, Kamdahari",
        cityRegion: "Kolkata, Rajpur Sonarpur",
        statePostal: "West Bengal 700154",
        full: "AROMICA CAFE, Rajnarayan park, C/9, Boral Main Road, near Boral high school, Usha Pally, Kamdahari, Kolkata, Rajpur Sonarpur, West Bengal 700154"
      },
      landmarks: ["Near Boral High School", "Rajnarayan Park, C/9", "Boral Main Road"],
      landmarkGuidance: "Travel along Boral Main Road toward Usha Pally and Kamdahari. Look for Rajnarayan Park near Boral High School; the café is at premises C/9.",
      visitDescription: "Conveniently situated on Boral Main Road near Boral High School. Drop by for a relaxed evening cup, comfort snacks, or takeaways.",
      phone: { enabled: true, display: "+91 ••••• •••••", raw: "", href: "#" },
      whatsapp: { enabled: true, display: "+91 ••••• •••••", raw: "", href: "#" },
      instagram: { enabled: true, handle: "@aromica_cafe_", href: "https://www.instagram.com/aromica_cafe_/" },
      reviews: { enabled: true, href: "https://www.google.com/maps/search/?api=1&query=AROMICA+CAFE+Boral+Main+Road+Kolkata" },
      orderOnline: { enabled: true, label: "Order Online", href: "https://order.khide.in/191242969" },
      menuFlipbook: { enabled: true, label: "Flipbook Menu", href: "https://go.fliplink.me/view/89104736-B13B-4B7A-936A-A6440716531F" },
      directions: {
        enabled: true,
        href: "https://www.google.com/maps/dir//AROMICA+CAFE,+Rajnarayan+park,+C%2F9,+Boral+Main+Road,+near+Boral+high+school,+Usha+Pally,+Kamdahari,+Kolkata,+Rajpur+Sonarpur,+West+Bengal+700154/@22.4724502,88.3706634,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a027117fdf49f9d:0x8c5e094bd0449ba!2m2!1d88.3758395!2d22.4543465?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D",
        embedSrc: "https://maps.google.com/maps?q=22.4543465,88.3758395&z=16&output=embed"
      },
      coordinates: { lat: 22.4543465, lng: 88.3758395 },
      heroImage: {
        src: "/images/aromica-exterior-drinks-01.webp",
        alt: "AROMICA Café storefront at night with illuminated signage and two chilled drinks held in a toast"
      },
      hours: {
        regular: "5:00 PM – 10:30 PM",
        closedDay: "Monday",
        summary: "Tue–Sun 5:00 – 10:30 PM (Mon closed)",
        daysOpenSummary: "Tuesday – Sunday",
        timeOpenSummary: "5:00 PM – 10:30 PM",
        closedDaySummary: "Monday: Closed",
        scheduleNote: "Evening neighborhood service · Kitchen closes at 10:15 PM"
      },
      atmosphere: {
        eyebrow: "Coffee · Chai · Comfort",
        title: "Good Food, Good Mood",
        description: "A warm neighborhood corner near Boral High School for unhurried evenings, quiet conversations, and freshly prepared comfort food.",
        image: {
          src: "/images/aromica-interior-01.webp",
          alt: "Interior wall with painted green arches, framed artwork, and woven pendant lamps inside Aromica Café",
          badge: "Inside Aromica · Boral"
        }
      },
      menu: {
        title: "The Menu",
        eyebrow: "Fresh Taste · Friendly Prices",
        subtitle: "Prepared for evening cravings—from a quick kullad chai to full comfort meals.",
        footerNote: "Prices are inclusive of taxes. Customizations such as extra cheese, paneer or chicken are available on request."
      },
      menuMeta: {
        title: "The Menu",
        eyebrow: "Fresh Taste · Friendly Prices",
        subtitle: "Prepared for evening cravings—from a quick kullad chai to full comfort meals.",
        footerNote: "Prices are inclusive of taxes. Customizations such as extra cheese, paneer or chicken are available on request."
      }
    },
    menuCategories: [
      {
        id: "beverages",
        label: "Coffee & Beverages",
        groups: [
          {
            title: "Hot Coffee",
            items: [
              { name: "Black Coffee", price: "35", veg: true, available: true },
              { name: "Milk Coffee", price: "35 / 55", veg: true, available: true },
              { name: "Cappuccino", price: "89", veg: true, available: true }
            ]
          },
          {
            title: "Cold Coffee & Shakes",
            note: "Add a scoop of ice cream for ₹29",
            items: [
              { name: "Classic Cold Coffee", price: "109", veg: true, available: true }
            ]
          }
        ]
      },
      {
        id: "momos",
        label: "Momos",
        groups: [
          {
            title: "Momos (6 pcs)",
            items: [
              { name: "Veg Momo", price: "79", veg: true, available: true },
              { name: "Chicken Momo", price: "99", veg: false, available: true },
              { name: "Gandharaj Momo", price: "129", veg: false, available: true, description: "Kolkata fragrant gondhoraj lime twist" }
            ]
          }
        ]
      }
    ],
    schedule: [
      { day: "Monday", dayIndex: 1, hours: "Closed", isClosed: true },
      { day: "Tuesday", dayIndex: 2, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" },
      { day: "Wednesday", dayIndex: 3, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" },
      { day: "Thursday", dayIndex: 4, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" },
      { day: "Friday", dayIndex: 5, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" },
      { day: "Saturday", dayIndex: 6, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" },
      { day: "Sunday", dayIndex: 0, hours: "5:00 PM – 10:30 PM", isClosed: false, openMinutes: 1020, closeMinutes: 1350, openDisplay: "5:00 PM", closeDisplay: "10:30 PM" }
    ],
    galleryItems: [
      { id: "storefront-night", title: "Aromica Under the Lights", category: "storefront", caption: "Storefront at dusk on Boral Main Road", src: "/images/aromica-exterior-drinks-01.webp", alt: "AROMICA storefront at night", width: 1200, height: 900 },
      { id: "interior-arches", title: "Green Arches & Warm Glow", category: "interior", caption: "Cozy seating with painted green arches", src: "/images/aromica-interior-01.webp", alt: "Interior seating", width: 1200, height: 900 }
    ],
    reviews: [
      { id: "rev-1", author: "Poulomi S.", rating: 5, date: "2 weeks ago", text: "Great neighborhood spot near Boral High School. The Gandharaj momos are super fragrant!", source: "Google" }
    ]
  };
}

// In-memory cache for fast read performance and zero redundant disk I/O
let inMemorySnapshot = null;

function readStoredSnapshot() {
  if (inMemorySnapshot) {
    return inMemorySnapshot;
  }

  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.version === "number" && Array.isArray(parsed.menuCategories)) {
        inMemorySnapshot = parsed;
        return inMemorySnapshot;
      }
    }
  } catch (err) {
    console.error("Error reading stored demo snapshot:", err);
  }

  const baseline = getBaselineSnapshot();
  writeStoredSnapshot(baseline);
  return baseline;
}

// Atomic file write using a temp file + rename to prevent corruption
function writeStoredSnapshot(snapshot) {
  inMemorySnapshot = snapshot;
  const tempPath = `${dataFilePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf-8");
    fs.renameSync(tempPath, dataFilePath);
  } catch (err) {
    console.error("Error atomically saving demo snapshot:", err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
  }
}

// In-memory list of connected Server-Sent Events clients
const sseClients = new Set();

function notifyClients(updatedSnapshot) {
  const payload = `data: ${JSON.stringify({ type: "SYNC_UPDATE", updatedAt: updatedSnapshot.updatedAt })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
]);

// Sliding-window rate limiter for write endpoints
const writeRateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const history = writeRateLimiter.get(ip) || [];
  const validHistory = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  if (validHistory.length >= MAX_WRITES_PER_WINDOW) {
    writeRateLimiter.set(ip, validHistory);
    return false;
  }
  
  validHistory.push(now);
  writeRateLimiter.set(ip, validHistory);
  return true;
}

// Input validation for snapshot payloads
function validateSnapshotPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, reason: "Payload must be a non-empty object" };
  }
  if (!Array.isArray(payload.menuCategories)) {
    return { valid: false, reason: "menuCategories must be an array" };
  }
  if (payload.menuCategories.length > 50) {
    return { valid: false, reason: "menuCategories exceeds maximum allowed limit of 50" };
  }

  for (let c = 0; c < payload.menuCategories.length; c++) {
    const cat = payload.menuCategories[c];
    if (!cat || typeof cat !== "object") {
      return { valid: false, reason: `Category at index ${c} must be an object` };
    }
    if (typeof cat.id !== "string" || cat.id.length === 0 || cat.id.length > 100) {
      return { valid: false, reason: `Category at index ${c} has invalid id` };
    }
    if (typeof cat.label !== "string" || cat.label.length === 0 || cat.label.length > 100) {
      return { valid: false, reason: `Category at index ${c} has invalid label` };
    }
    if (!Array.isArray(cat.groups) || cat.groups.length > 50) {
      return { valid: false, reason: `Category '${cat.id}' groups must be an array (max 50)` };
    }

    for (let g = 0; g < cat.groups.length; g++) {
      const grp = cat.groups[g];
      if (!grp || typeof grp !== "object") {
        return { valid: false, reason: `Group at index ${g} in category '${cat.id}' must be an object` };
      }
      if (typeof grp.title !== "string" || grp.title.length > 100) {
        return { valid: false, reason: `Group at index ${g} in category '${cat.id}' has invalid title` };
      }
      if (!Array.isArray(grp.items) || grp.items.length > 100) {
        return { valid: false, reason: `Group '${grp.title}' items must be an array (max 100)` };
      }

      for (let i = 0; i < grp.items.length; i++) {
        const item = grp.items[i];
        if (!item || typeof item !== "object") {
          return { valid: false, reason: `Item at index ${i} in group '${grp.title}' must be an object` };
        }
        if (typeof item.name !== "string" || item.name.trim().length === 0 || item.name.length > 120) {
          return { valid: false, reason: `Item at index ${i} in group '${grp.title}' has invalid name` };
        }
        if (typeof item.price !== "string" && typeof item.price !== "number") {
          return { valid: false, reason: `Item '${item.name}' has invalid price type` };
        }
        if (String(item.price).length > 40) {
          return { valid: false, reason: `Item '${item.name}' has excessive price string length` };
        }
        if (typeof item.available !== "undefined" && typeof item.available !== "boolean") {
          return { valid: false, reason: `Item '${item.name}' available property must be a boolean` };
        }
      }
    }
  }

  return { valid: true };
}

// Initialise memory cache on server startup
readStoredSnapshot();

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;

  // Defensive origin check: active rejection of unauthorized web browser origins
  if (origin) {
    if (!ALLOWED_ORIGINS.has(origin)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden: Disallowed cross-origin request" }));
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // Direct requests (local scripts, tests, curl)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Preflight OPTIONS handling
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = req.socket.remoteAddress || "127.0.0.1";
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  // 1. Healthcheck / Status
  if (parsedUrl.pathname === "/health" || parsedUrl.pathname === "/api/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    });
    res.end(JSON.stringify({
      status: "ok",
      service: "aromica-demo-sync",
      port: PORT,
      activeSseClients: sseClients.size,
    }));
    return;
  }

  // 2. Server-Sent Events (SSE) stream for instant real-time synchronization
  if (parsedUrl.pathname === "/api/events") {
    if (sseClients.size >= MAX_SSE_CLIENTS) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "SSE connection capacity reached (max 100)" }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`);
    sseClients.add(res);

    const cleanup = () => {
      sseClients.delete(res);
    };

    req.on("close", cleanup);
    res.on("error", cleanup);
    return;
  }

  // 3. Read current demo snapshot (served efficiently from in-memory cache)
  if (req.method === "GET" && (parsedUrl.pathname === "/api/snapshot" || parsedUrl.pathname === "/snapshot")) {
    const snapshot = readStoredSnapshot();
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-cache, must-revalidate",
    });
    res.end(JSON.stringify(snapshot));
    return;
  }

  // Rate-limiting check for write mutations
  if (req.method === "POST" && (parsedUrl.pathname === "/api/snapshot" || parsedUrl.pathname === "/api/reset" || parsedUrl.pathname === "/reset" || parsedUrl.pathname === "/snapshot")) {
    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, {
        "Content-Type": "application/json",
        "Retry-After": "60",
      });
      res.end(JSON.stringify({ error: "Too Many Requests: Rate limit exceeded for snapshot mutations" }));
      return;
    }
  }

  // 4. Save updated demo snapshot
  if (req.method === "POST" && (parsedUrl.pathname === "/api/snapshot" || parsedUrl.pathname === "/snapshot")) {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      res.writeHead(415, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unsupported Media Type: Content-Type must be application/json" }));
      return;
    }

    const contentLength = Number(req.headers["content-length"]);
    if (contentLength && contentLength > MAX_PAYLOAD_SIZE) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload Too Large: Max snapshot size is 1MB" }));
      return;
    }

    let body = "";
    let bodyExceeded = false;

    req.on("data", (chunk) => {
      if (bodyExceeded) return;
      body += chunk;
      if (body.length > MAX_PAYLOAD_SIZE) {
        bodyExceeded = true;
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload Too Large: Max snapshot size is 1MB" }));
        req.resume();
      }
    });

    req.on("end", () => {
      if (bodyExceeded) return;

      try {
        const payload = JSON.parse(body);
        const validation = validateSnapshotPayload(payload);
        if (!validation.valid) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Invalid snapshot payload: ${validation.reason}` }));
          return;
        }

        const updatedSnapshot = {
          ...payload,
          updatedAt: Date.now(),
        };

        writeStoredSnapshot(updatedSnapshot);
        notifyClients(updatedSnapshot);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, updatedAt: updatedSnapshot.updatedAt }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Malformed JSON payload" }));
      }
    });
    return;
  }

  // 5. Reset snapshot to pristine demo defaults
  if (req.method === "POST" && (parsedUrl.pathname === "/api/reset" || parsedUrl.pathname === "/reset")) {
    const baseline = getBaselineSnapshot();
    writeStoredSnapshot(baseline);
    notifyClients(baseline);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, reset: true, snapshot: baseline }));
    return;
  }

  // 404 for unmapped routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, HOST, () => {
  console.log(`[Aromica Demo Sync Server] running at http://${HOST}:${PORT}`);
});
