const { pool } = require("../config/db");

/**
 * Colonnes CSV attendues (séparateur : ; ou , auto-détecté) :
 *   Chapitre  |  Type  |  Titre
 *
 * Types acceptés : video, doc, qcm, link, video_ext, text
 * (toute valeur non reconnue est traitée comme "text")
 *
 * Exemple :
 *   Introduction;video;Présentation du module
 *   Introduction;doc;Support PDF
 *   Risques;qcm;Quiz sur les risques
 *   Risques;text;Réglementation applicable
 *
 * POST /api/modules/:moduleId/import-csv — corps multipart avec le fichier CSV.
 * Retourne un aperçu (dry_run=true par défaut) ou crée réellement les données.
 */
async function importCsv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier CSV reçu." });
    const dryRun = req.query.dry_run !== "false"; // aperçu par défaut

    const text = req.file.buffer.toString("utf-8").replace(/\r/g, "");
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

    if (!lines.length) return res.status(400).json({ error: "Fichier CSV vide." });

    // Détection automatique du séparateur (premier ligne)
    const sep = lines[0].includes(";") ? ";" : ",";

    // Skip l'en-tête si présent (contient "Chapitre" ou "Chapter")
    const dataLines = /chapitre|chapter|type|titre/i.test(lines[0]) ? lines.slice(1) : lines;

    if (!dataLines.length) return res.status(400).json({ error: "Aucune donnée après l'en-tête." });

    const VALID_TYPES = ["video", "doc", "qcm", "link", "video_ext", "text"];
    const chapterOrder = [];
    const chapterContents = {};

    for (let i = 0; i < dataLines.length; i++) {
      const parts = dataLines[i].split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 2) continue;

      const [rawChapter, rawType, rawTitle] = parts;
      const chapterName = rawChapter || "Chapitre 1";
      const contentType = VALID_TYPES.includes((rawType || "").toLowerCase())
        ? rawType.toLowerCase()
        : "text";
      const title = rawTitle || `Contenu ${i + 1}`;

      if (!chapterContents[chapterName]) {
        chapterOrder.push(chapterName);
        chapterContents[chapterName] = [];
      }
      chapterContents[chapterName].push({ type: contentType, title });
    }

    const preview = chapterOrder.map((ch) => ({
      chapter: ch,
      contents: chapterContents[ch],
    }));

    if (dryRun) {
      return res.json({
        dry_run: true,
        chaptersToCreate: chapterOrder.length,
        contentsToCreate: Object.values(chapterContents).reduce((a, c) => a + c.length, 0),
        preview,
        tip: "Pour importer réellement, ajoutez ?dry_run=false à l'URL.",
      });
    }

    // Import réel — transactionnel
    const client = await pool.connect();
    const created = { chapters: 0, contents: 0 };
    try {
      await client.query("BEGIN");

      // Position de départ = après les chapitres existants
      const { rows: existingChs } = await client.query(
        `SELECT COUNT(*) AS cnt FROM chapters WHERE module_id = $1`,
        [req.params.moduleId]
      );
      let chPos = Number(existingChs[0].cnt);

      for (const chName of chapterOrder) {
        const chId = `${req.params.moduleId}-import-${Date.now()}-${chPos}`;
        await client.query(
          `INSERT INTO chapters (id, module_id, title, position) VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO NOTHING`,
          [chId, req.params.moduleId, chName, chPos]
        );
        created.chapters++;

        const contents = chapterContents[chName];
        for (let ci = 0; ci < contents.length; ci++) {
          await client.query(
            `INSERT INTO contents (chapter_id, type, title, position) VALUES ($1,$2,$3,$4)`,
            [chId, contents[ci].type, contents[ci].title, ci]
          );
          created.contents++;
        }
        chPos++;
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({ dry_run: false, ...created, preview });
  } catch (err) {
    next(err);
  }
}

module.exports = { importCsv };
