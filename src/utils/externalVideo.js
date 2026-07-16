/**
 * Résout une URL vidéo externe en URL d'embed sécurisée.
 * Gère : YouTube (youtu.be, youtube.com), Vimeo, Dailymotion,
 * et toute URL directe .mp4/.webm/.ogg (lecteur natif).
 *
 * Renvoie { type, embedUrl, thumbnailUrl } ou null si l'URL n'est pas reconnue.
 */
function resolveExternalVideo(rawUrl) {
  if (!rawUrl) return null;

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // ── YouTube ──────────────────────────────────────────────
  // Formats : youtube.com/watch?v=ID, youtu.be/ID,
  //           youtube.com/embed/ID, youtube-nocookie.com
  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    let videoId = null;
    if (host === "youtu.be") {
      videoId = url.pathname.slice(1).split("/")[0];
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2];
    } else {
      videoId = url.searchParams.get("v");
    }
    if (!videoId) return null;
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId,
    };
  }

  // ── Vimeo ────────────────────────────────────────────────
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const videoId = parts.find((p) => /^\d+$/.test(p));
    if (!videoId) return null;
    return {
      platform: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1`,
      thumbnailUrl: null, // nécessite un appel API Vimeo
      videoId,
    };
  }

  // ── Dailymotion ──────────────────────────────────────────
  if (host === "dailymotion.com" || host === "dai.ly") {
    let videoId = null;
    if (host === "dai.ly") {
      videoId = url.pathname.slice(1);
    } else {
      const m = url.pathname.match(/\/video\/([a-zA-Z0-9]+)/);
      if (m) videoId = m[1];
    }
    if (!videoId) return null;
    return {
      platform: "dailymotion",
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
      thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${videoId}`,
      videoId,
    };
  }

  // ── Vidéo directe (mp4, webm, ogg) ──────────────────────
  const ext = url.pathname.split(".").pop().toLowerCase();
  if (["mp4", "webm", "ogg", "ogv", "m4v"].includes(ext)) {
    return {
      platform: "direct",
      embedUrl: rawUrl.trim(),
      thumbnailUrl: null,
      videoId: null,
    };
  }

  return null;
}

module.exports = { resolveExternalVideo };
