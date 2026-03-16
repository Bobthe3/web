const { onRequest } = require("firebase-functions/v2/https");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// --- Track link events (public, no auth) ---
// Receives beacon data and stores in link_events collection
exports.track = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    await db.collection("link_events").add({
      type: data.type || "unknown",
      url: data.url || "",
      source: data.source || "",
      page: data.page || "",
      referrer: data.referrer || "",
      sessionId: data.sessionId || "",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ua: req.headers["user-agent"] || ""
    });
    res.status(204).end();
  } catch (e) {
    res.status(204).end(); // Still 204 — don't break user experience
  }
});

// --- Validate private post access ---
exports.validateAccess = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  try {
    const { slug, password } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!slug || !password) { res.status(400).json({ error: "Missing slug or password" }); return; }

    // Find post by slug
    const snap = await db.collection("posts").where("slug", "==", slug).limit(1).get();
    if (snap.empty) { res.status(404).json({ error: "Post not found" }); return; }

    const post = snap.docs[0].data();
    if (!post.isPrivate) { res.status(400).json({ error: "Post is not private" }); return; }

    // SHA-256 hash the provided password and compare
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(password).digest("hex");

    if (hash === post.passwordHash) {
      res.json({ markdown: post.markdown });
    } else {
      res.status(403).json({ error: "Incorrect password" });
    }
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Access via expiring link ---
exports.accessLink = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") { res.status(405).end(); return; }
  try {
    const { linkId } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!linkId) { res.status(400).json({ error: "Missing linkId" }); return; }

    const linkRef = db.collection("access_links").doc(linkId);

    // Use transaction to atomically check and increment views
    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(linkRef);
      if (!doc.exists) return { expired: true, reason: "Link not found" };

      const link = doc.data();

      // Check time expiry
      if (link.expiresAt && link.expiresAt.toDate() < new Date()) {
        return { expired: true, reason: "This post has expired. If this is a mistake, please contact the admin." };
      }

      // Check view limit
      if (link.currentViews >= link.maxViews) {
        return { expired: true, reason: "This post has expired. If this is a mistake, please contact the admin." };
      }

      // Increment views
      t.update(linkRef, { currentViews: link.currentViews + 1 });

      // Get post content
      const postDoc = await t.get(db.collection("posts").doc(link.postId));
      if (!postDoc.exists) return { expired: true, reason: "Post not found" };

      return { markdown: postDoc.data().markdown, title: postDoc.data().title };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Dashboard data (admin only, authenticated) ---
exports.dashboardData = onCall(async (request) => {
  // Verify auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required");
  }

  const days = request.data.days || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const snap = await db.collection("link_events")
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(since))
    .get();

  const events = [];
  snap.forEach(doc => events.push(doc.data()));

  // Aggregate
  const inbound = {};
  const pages = {};
  const outbound = {};
  const internal = {};

  events.forEach(e => {
    if (e.type === "inbound") {
      const src = e.source || e.referrer || "direct";
      inbound[src] = (inbound[src] || 0) + 1;
      pages[e.page] = (pages[e.page] || 0) + 1;
    } else if (e.type === "outbound") {
      outbound[e.url] = (outbound[e.url] || 0) + 1;
    } else if (e.type === "internal") {
      internal[e.url] = (internal[e.url] || 0) + 1;
    }
  });

  // Sort helper
  const sortObj = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 50);

  return {
    totalEvents: events.length,
    inboundSources: sortObj(inbound),
    topPages: sortObj(pages),
    outboundClicks: sortObj(outbound),
    internalClicks: sortObj(internal),
    days
  };
});
