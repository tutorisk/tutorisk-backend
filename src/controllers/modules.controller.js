const path = require("path");
const { z } = require("zod");
const { pool } = require("../config/db");
const { resolveVatRate, computeTtcCents } = require("../utils/vat");
const { generateCertificatePdf } = require("../utils/certificate");
const { checkAndHandleModuleCompletion } = require("../utils/moduleCompletion");
const { ASSETS_DIR, EMBEDDABLE_MIME } = require("./certificateSettings.controller");
const { getActivePromotion, getActivePromotionsForModules } = require("./promotions.controller");
const { resolveExternalVideo } = require("../utils/externalVideo");

// ── Lecture publique ──────────────────────────────────────────

async function list(req, res, next) {
  try {
    const isEditor = req.user && ["admin", "pedagogue", "formateur"].includes(req.user.role);

    const { rows } = await pool.query(`
      SELECT m.*,
        COUNT(DISTINCT ch.id) AS chapters_count,
        e.id IS NOT NULL AS is_enrolled
      FROM modules m
      LEFT JOIN chapters ch ON ch.module_id = m.id
      LEFT JOIN enrollments e ON e.module_id = m.id AND e.user_id = $1
      WHERE ($2 OR m.published = true)
      GROUP BY m.id, e.id
      ORDER BY m.category, m.title
    `, [req.user?.id || null, isEditor]);

    // Calcule le taux de TVA applicable au visiteur (selon son code postal
    // enregistré s'il est connecté, sinon le taux par défaut France 20%) pour
    // afficher des prix TTC cohérents dans le catalogue sans avoir à interroger
    // la base à chaque module individuellement.
    let vat = { ratePercent: 20 };
    if (req.user) {
      const { rows: userRows } = await pool.query(`SELECT postal_code, country_code FROM users WHERE id = $1`, [req.user.id]);
      vat = await resolveVatRate(userRows[0]?.country_code || "FR", userRows[0]?.postal_code || "");
    } else {
      vat = await resolveVatRate("FR", "");
    }

    const promosByModule = await getActivePromotionsForModules(rows.map((r) => r.id));

    // Récupère les tags en lot pour tous les modules retournés
    const allIds = rows.map((r) => r.id);
    const tagRows = allIds.length > 0
      ? (await pool.query(`SELECT module_id, tag FROM module_tags WHERE module_id = ANY($1::text[]) ORDER BY tag`, [allIds])).rows
      : [];
    const tagsByModule = {};
    for (const tr of tagRows) {
      if (!tagsByModule[tr.module_id]) tagsByModule[tr.module_id] = [];
      tagsByModule[tr.module_id].push(tr.tag);
    }

    res.json({
      vatRatePercent: vat.ratePercent,
      modules: rows.map((r) => {
        const promo = promosByModule[r.id];
        const promoPriceCentsHt = promo ? Math.round(r.price_cents * (1 - Number(promo.discount_percent) / 100)) : null;
        return {
          id: r.id,
          title: r.title,
          category: r.category,
          durationMin: r.duration_min,
          level: r.level,
          priceCentsHt: r.price_cents,
          vatRatePercent: vat.ratePercent,
          priceCentsTtc: computeTtcCents(r.price_cents, vat.ratePercent),
          description: r.description,
          chaptersCount: Number(r.chapters_count),
          isEnrolled: r.is_enrolled,
          published: r.published,
          tags: tagsByModule[r.id] || [],
          promotion: promo ? {
            discountPercent: Number(promo.discount_percent),
            priceCentsHt: promoPriceCentsHt,
            priceCentsTtc: computeTtcCents(promoPriceCentsHt, vat.ratePercent),
            endsAt: promo.ends_at,
          } : null,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: moduleRows } = await pool.query(`SELECT * FROM modules WHERE id = $1`, [id]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    const mod = moduleRows[0];

    let isEnrolled = false;
    let isExpired = false;
    let expiresAt = null;
    if (req.user) {
      const { rows } = await pool.query(
        `SELECT expires_at FROM enrollments WHERE user_id = $1 AND module_id = $2`,
        [req.user.id, id]
      );
      isEnrolled = rows.length > 0;
      if (isEnrolled) {
        expiresAt = rows[0].expires_at;
        isExpired = expiresAt !== null && new Date(expiresAt) < new Date();
      }
    }
    // L'accès au contenu est refusé si l'inscription a expiré (sauf rôles
    // pédagogiques/admin qui voient toujours tout). L'admin peut lever cette
    // limite pour un apprenant précis en mettant expires_at à NULL (illimité)
    // via /api/admin/enrollments/:id/extend.
    const staffRole = ["admin", "pedagogue", "formateur"].includes(req.user?.role);
    const hasFullAccess = (isEnrolled && !isExpired) || staffRole;

    const { rows: chapterRows } = await pool.query(
      `SELECT * FROM chapters WHERE module_id = $1 ORDER BY position`,
      [id]
    );
    const { rows: contentRows } = await pool.query(
      `SELECT c.* FROM contents c
       JOIN chapters ch ON ch.id = c.chapter_id
       WHERE ch.module_id = $1 ORDER BY ch.position, c.position`,
      [id]
    );

    let progressByContent = {};
    let watchedByContent = {};
    if (req.user) {
      const { rows: progressRows } = await pool.query(
        `SELECT p.content_id, p.completed, p.watched_seconds FROM progress p
         JOIN contents c ON c.id = p.content_id
         JOIN chapters ch ON ch.id = c.chapter_id
         WHERE ch.module_id = $1 AND p.user_id = $2`,
        [id, req.user.id]
      );
      progressByContent = Object.fromEntries(progressRows.map((p) => [p.content_id, p.completed]));
      watchedByContent = Object.fromEntries(progressRows.map((p) => [p.content_id, p.watched_seconds]));
    }

    // Pour les contenus de type QCM, on récupère la question et les options
    // SANS jamais exposer is_correct au frontend (vérifié uniquement côté serveur).
    const qcmContentIds = contentRows.filter((c) => c.type === "qcm").map((c) => c.id);
    let questionsByContent = {};
    if (qcmContentIds.length > 0) {
      const { rows: qRows } = await pool.query(
        `SELECT * FROM qcm_questions WHERE content_id = ANY($1::uuid[]) ORDER BY content_id, position`,
        [qcmContentIds]
      );
      const questionIds = qRows.map((q) => q.id);
      const optRows = questionIds.length > 0
        ? (await pool.query(
            `SELECT id, question_id, option_text, position FROM qcm_options WHERE question_id = ANY($1::uuid[]) ORDER BY position`,
            [questionIds]
          )).rows
        : [];
      // Construit un tableau de questions par content_id (multi-questions supporté)
      for (const q of qRows) {
        if (!questionsByContent[q.content_id]) questionsByContent[q.content_id] = [];
        questionsByContent[q.content_id].push({
          id: q.id,
          text: q.question_text,
          explanationText: q.explanation_text || null,
          options: optRows.filter((o) => o.question_id === q.id).map((o) => ({ id: o.id, text: o.option_text })),
        });
      }
    }

    // Récupère le pass_score_percent pour chaque contenu QCM
    const passScoreByContent = {};
    if (qcmContentIds.length > 0) {
      const { rows: psRows } = await pool.query(
        `SELECT id, pass_score_percent FROM contents WHERE id = ANY($1::uuid[])`,
        [qcmContentIds]
      );
      for (const r of psRows) passScoreByContent[r.id] = r.pass_score_percent || 0;
    }

    const chapters = chapterRows.map((ch) => {
      const chContents = contentRows.filter((c) => c.chapter_id === ch.id);
      const completedInChapter = chContents.filter((c) => progressByContent[c.id]).length;
      const completionPercent = chContents.length > 0
        ? Math.round((completedInChapter / chContents.length) * 100) : 0;
      return {
        id: ch.id,
        title: ch.title,
        completionPercent,
        contents: chContents.map((c) => ({
          id: c.id,
          type: c.type,
          title: c.title,
          externalUrl: (c.type === "link" || c.type === "video_ext") ? c.external_url : undefined,
          embed: c.type === "video_ext" ? resolveExternalVideo(c.external_url) : undefined,
          contentText: c.type === "text" ? c.content_text : undefined,
          hasFile: !!(c.file_path),
          mimeType: c.mime_type || null,
          question: c.type === "qcm" ? questionsByContent[c.id] : undefined,
          passScorePercent: c.type === "qcm" ? (passScoreByContent[c.id] || 0) : undefined,
          completed: progressByContent[c.id] || false,
          watchedSeconds: c.type === "video" ? (watchedByContent[c.id] || 0) : undefined,
          locked: isExpired ? true : (!hasFullAccess && c.type !== "qcm"),
        })),
      };
    });


    let vat = { ratePercent: 20 };
    if (req.user) {
      const { rows: userRows } = await pool.query(`SELECT postal_code, country_code FROM users WHERE id = $1`, [req.user.id]);
      vat = await resolveVatRate(userRows[0]?.country_code || "FR", userRows[0]?.postal_code || "");
    } else {
      vat = await resolveVatRate("FR", "");
    }

    const promo = await getActivePromotion(mod.id);
    const promoPriceCentsHt = promo ? Math.round(mod.price_cents * (1 - Number(promo.discount_percent) / 100)) : null;

    res.json({
      module: {
        id: mod.id,
        title: mod.title,
        category: mod.category,
        durationMin: mod.duration_min,
        level: mod.level,
        priceCentsHt: mod.price_cents,
        vatRatePercent: vat.ratePercent,
        priceCentsTtc: computeTtcCents(mod.price_cents, vat.ratePercent),
        description: mod.description,
        isEnrolled,
        hasFullAccess,
        isExpired,
        expiresAt,
        published: mod.published,
        chapterOrderEnforced: mod.chapter_order_enforced || false,
        tags: (await pool.query(`SELECT tag FROM module_tags WHERE module_id=$1 ORDER BY tag`, [id])).rows.map(r=>r.tag),
        promotion: promo ? {
          discountPercent: Number(promo.discount_percent),
          priceCentsHt: promoPriceCentsHt,
          priceCentsTtc: computeTtcCents(promoPriceCentsHt, vat.ratePercent),
          endsAt: promo.ends_at,
        } : null,
      },
      chapters,
    });
  } catch (err) {
    next(err);
  }
}

// ── QCM ────────────────────────────────────────────────────────

async function checkQcmAnswer(req, res, next) {
  try {
    const { questionId } = req.params;
    const { optionId } = z.object({ optionId: z.string().uuid() }).parse(req.body);

    const { rows: optionRows } = await pool.query(
      `SELECT o.*, q.explanation_text FROM qcm_options o
       JOIN qcm_questions q ON q.id = o.question_id
       WHERE o.question_id = $1`,
      [questionId]
    );
    if (optionRows.length === 0) return res.status(404).json({ error: "Question introuvable." });

    const selected = optionRows.find((o) => o.id === optionId);
    const correctOptions = optionRows.filter((o) => o.is_correct);
    const correct = !!selected?.is_correct;
    const explanationText = optionRows[0]?.explanation_text || null;

    // NE marque PAS automatiquement le contenu comme terminé ici :
    // c'est submitQcm() qui le fait une fois TOUTES les questions répondues
    // et le seuil de réussite atteint.

    res.json({
      correct,
      correctOptionIds: correctOptions.map((o) => o.id),
      explanationText,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/modules/qcm/:contentId/submit — soumission finale d'un bloc QCM
// complet (toutes les questions répondues). Calcule le score, vérifie le seuil
// de réussite, et marque le contenu comme terminé si le seuil est atteint.
async function submitQcm(req, res, next) {
  try {
    const { contentId } = req.params;
    // answers: [{ questionId, selectedOptionId }]
    const { answers } = z.object({
      answers: z.array(z.object({ questionId: z.string().uuid(), selectedOptionId: z.string().uuid() })).min(1),
    }).parse(req.body);

    const { rows: qRows } = await pool.query(
      `SELECT q.id, q.explanation_text,
              json_agg(json_build_object('id', o.id, 'is_correct', o.is_correct) ORDER BY o.position) AS options
       FROM qcm_questions q JOIN qcm_options o ON o.question_id = q.id
       WHERE q.content_id = $1 GROUP BY q.id`,
      [contentId]
    );
    if (!qRows.length) return res.status(404).json({ error: "QCM introuvable." });

    const { rows: passRows } = await pool.query(`SELECT pass_score_percent FROM contents WHERE id = $1`, [contentId]);
    const passScore = passRows[0]?.pass_score_percent || 0;

    let correctCount = 0;
    const results = qRows.map((q) => {
      const answer = answers.find((a) => a.questionId === q.id);
      const selectedOption = answer ? q.options.find((o) => o.id === answer.selectedOptionId) : null;
      const isCorrect = selectedOption?.is_correct || false;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        isCorrect,
        explanationText: q.explanation_text || null,
        correctOptionIds: q.options.filter((o) => o.is_correct).map((o) => o.id),
        selectedOptionId: answer?.selectedOptionId || null,
      };
    });

    const scorePercent = Math.round((correctCount / qRows.length) * 100);
    const passed = scorePercent >= passScore;

    if (passed && req.user) {
      await pool.query(
        `INSERT INTO progress (user_id, content_id, completed, watched_seconds)
         VALUES ($1,$2,true,0)
         ON CONFLICT (user_id, content_id) DO UPDATE SET completed = true, updated_at = now()`,
        [req.user.id, contentId]
      );
      checkAndHandleModuleCompletion({
        userId: req.user.id, userName: req.user.name, userEmail: req.user.email, contentId,
      });
    }

    res.json({ scorePercent, correctCount, totalCount: qRows.length, passed, passScore, results });
  } catch (err) {
    next(err);
  }
}
// ── Gestion (admin / pédagogue) ──────────────────────────────

const createModuleSchema = z.object({
  id: z.string().min(2).max(40),
  title: z.string().min(3),
  category: z.string().min(2),
  durationMin: z.number().int().positive(),
  level: z.string().min(2),
  priceCents: z.number().int().min(0),
  description: z.string().optional(),
  chapterOrderEnforced: z.boolean().optional(),
});

async function createModule(req, res, next) {
  try {
    const data = createModuleSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO modules (id, title, category, duration_min, level, price_cents, description, pedagogue_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.id, data.title, data.category, data.durationMin, data.level, data.priceCents, data.description || null, req.user.id]
    );
    res.status(201).json({ module: rows[0] });
  } catch (err) {
    next(err);
  }
}

const updateModuleSchema = createModuleSchema.partial().omit({ id: true });

async function updateModule(req, res, next) {
  try {
    const data = updateModuleSchema.parse(req.body);
    const fields = [];
    const values = [];
    let i = 1;
    const map = { title: "title", category: "category", durationMin: "duration_min", level: "level", priceCents: "price_cents", description: "description", chapterOrderEnforced: "chapter_order_enforced" };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE modules SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    res.json({ module: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteModule(req, res, next) {
  try {
    await pool.query(`DELETE FROM modules WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

const addChapterSchema = z.object({ id: z.string().min(2), title: z.string().min(2), position: z.number().int().optional() });

async function addChapter(req, res, next) {
  try {
    const data = addChapterSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO chapters (id, module_id, title, position) VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.id, req.params.moduleId, data.title, data.position ?? 0]
    );
    res.status(201).json({ chapter: rows[0] });
  } catch (err) {
    next(err);
  }
}

const addContentSchema = z.object({
  type: z.enum(["video", "doc", "qcm", "link", "video_ext", "text"]),
  title: z.string().optional(),
  filePath: z.string().optional(),
  externalUrl: z.string().url().optional(),
  position: z.number().int().optional(),
});

async function addContent(req, res, next) {
  try {
    const data = addContentSchema.parse(req.body);

    // Pour video_ext : valider l'URL et extraire les métadonnées d'embed
    if (data.type === "video_ext") {
      if (!data.externalUrl) return res.status(400).json({ error: "Une URL est requise pour une vidéo externe." });
      const resolved = resolveExternalVideo(data.externalUrl);
      if (!resolved) return res.status(400).json({ error: "URL non reconnue. Formats acceptés : YouTube, Vimeo, Dailymotion, ou lien direct .mp4/.webm." });
    }

    const { rows } = await pool.query(
      `INSERT INTO contents (chapter_id, type, title, file_path, external_url, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.chapterId, data.type, data.title || null, data.filePath || null, data.externalUrl || null, data.position ?? 0]
    );
    res.status(201).json({ content: rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/modules/:id/certificate — génère l'attestation PDF du module,
// uniquement si l'utilisateur est inscrit ET a terminé 100% du contenu.
async function getCertificate(req, res, next) {
  try {
    const { id } = req.params;

    const { rows: moduleRows } = await pool.query(`SELECT * FROM modules WHERE id = $1`, [id]);
    if (moduleRows.length === 0) return res.status(404).json({ error: "Module introuvable." });
    const mod = moduleRows[0];

    const { rows: enrollRows } = await pool.query(
      `SELECT * FROM enrollments WHERE user_id = $1 AND module_id = $2`,
      [req.user.id, id]
    );
    if (enrollRows.length === 0) return res.status(403).json({ error: "Vous n'êtes pas inscrit à ce module." });

    const { rows: progRows } = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE p.completed) AS completed
       FROM contents c
       JOIN chapters ch ON ch.id = c.chapter_id
       LEFT JOIN progress p ON p.content_id = c.id AND p.user_id = $1
       WHERE ch.module_id = $2`,
      [req.user.id, id]
    );
    const { total, completed } = progRows[0];
    if (Number(total) === 0 || Number(completed) < Number(total)) {
      return res.status(409).json({ error: "Ce module n'est pas encore terminé à 100%." });
    }

    const completedAt = enrollRows[0].completed_at || new Date();
    const certificateNumber = `TR-${id.toUpperCase()}-${req.user.id.slice(0, 8).toUpperCase()}`;

    // Récupère la configuration de personnalisation (texte + tampon/signature)
    // définie par l'administrateur, pour les appliquer réellement sur le PDF.
    const { rows: settingsRows } = await pool.query(`SELECT * FROM certificate_settings WHERE id = 1`);
    const settings = settingsRows[0] || {};

    const stampFilePath = settings.stamp_path && EMBEDDABLE_MIME.includes(settings.stamp_mime)
      ? path.join(ASSETS_DIR, settings.stamp_path) : null;
    const signatureFilePath = settings.signature_path && EMBEDDABLE_MIME.includes(settings.signature_mime)
      ? path.join(ASSETS_DIR, settings.signature_path) : null;

    const pdfBuffer = await generateCertificatePdf({
      userName: req.user.name,
      moduleTitle: mod.title,
      durationMin: mod.duration_min,
      completedAt,
      certificateNumber,
      settings,
      stampFilePath,
      signatureFilePath,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="attestation-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// ── Gestion des chapitres ─────────────────────────────────────

async function updateChapter(req, res, next) {
  try {
    const data = z.object({ title: z.string().min(1).optional(), position: z.number().int().optional() }).parse(req.body);
    const fields = []; const values = []; let i = 1;
    if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
    if (data.position !== undefined) { fields.push(`position = $${i++}`); values.push(data.position); }
    if (!fields.length) return res.status(400).json({ error: "Aucune donnée." });
    values.push(req.params.chapterId);
    const { rows } = await pool.query(`UPDATE chapters SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: "Chapitre introuvable." });
    res.json({ chapter: rows[0] });
  } catch (err) { next(err); }
}

async function deleteChapter(req, res, next) {
  try {
    await pool.query(`DELETE FROM chapters WHERE id = $1`, [req.params.chapterId]);
    res.status(204).end();
  } catch (err) { next(err); }
}

// Réordonne tous les chapitres d'un module en une seule requête.
// Attend { order: ["ch1","ch2","ch3"] } — les positions sont mises à jour en bloc.
async function reorderChapters(req, res, next) {
  try {
    const { order } = z.object({ order: z.array(z.string()) }).parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < order.length; i++) {
        await client.query(`UPDATE chapters SET position = $1 WHERE id = $2 AND module_id = $3`, [i, order[i], req.params.moduleId]);
      }
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ── Gestion des contenus ──────────────────────────────────────

async function updateContent(req, res, next) {
  try {
    const data = z.object({
      title: z.string().optional(),
      externalUrl: z.string().url().optional().nullable(),
      position: z.number().int().optional(),
      passScorePercent: z.number().int().min(0).max(100).optional(),
    }).parse(req.body);
    const fields = []; const values = []; let i = 1;
    if (data.title !== undefined)            { fields.push(`title = $${i++}`);              values.push(data.title); }
    if (data.externalUrl !== undefined)      { fields.push(`external_url = $${i++}`);        values.push(data.externalUrl); }
    if (data.position !== undefined)         { fields.push(`position = $${i++}`);            values.push(data.position); }
    if (data.passScorePercent !== undefined) { fields.push(`pass_score_percent = $${i++}`);  values.push(data.passScorePercent); }
    if (!fields.length) return res.status(400).json({ error: "Aucune donnée." });
    values.push(req.params.contentId);
    const { rows } = await pool.query(`UPDATE contents SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
    if (!rows.length) return res.status(404).json({ error: "Contenu introuvable." });
    res.json({ content: rows[0] });
  } catch (err) { next(err); }
}

async function deleteContent(req, res, next) {
  try {
    // Supprime aussi le fichier physique si présent
    const { rows } = await pool.query(`DELETE FROM contents WHERE id = $1 RETURNING file_path`, [req.params.contentId]);
    if (rows[0]?.file_path) {
      const fs = require("fs");
      const fpath = path.join(process.env.PROTECTED_MEDIA_DIR || path.join(__dirname, "..", "..", "protected-media"), rows[0].file_path);
      fs.unlink(fpath, () => {});
    }
    res.status(204).end();
  } catch (err) { next(err); }
}

async function reorderContents(req, res, next) {
  try {
    const { order } = z.object({ order: z.array(z.string().uuid()) }).parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let i = 0; i < order.length; i++) {
        await client.query(`UPDATE contents SET position = $1 WHERE id = $2 AND chapter_id = $3`, [i, order[i], req.params.chapterId]);
      }
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ── Gestion des QCM ──────────────────────────────────────────

const qcmQuestionSchema = z.object({
  questionText: z.string().min(1, "La question ne peut pas être vide."),
  explanationText: z.string().optional().nullable(),
  position: z.number().int().optional(),
  options: z.array(z.object({
    optionText: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2, "Un QCM doit avoir au moins 2 options.").max(6),
});

// Crée une question QCM avec toutes ses options en une seule opération atomique.
async function addQcmQuestion(req, res, next) {
  try {
    const data = qcmQuestionSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: qRows } = await client.query(
        `INSERT INTO qcm_questions (content_id, question_text, explanation_text, position) VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.params.contentId, data.questionText, data.explanationText || null, data.position ?? 0]
      );
      const question = qRows[0];
      for (let i = 0; i < data.options.length; i++) {
        await client.query(
          `INSERT INTO qcm_options (question_id, option_text, is_correct, position) VALUES ($1,$2,$3,$4)`,
          [question.id, data.options[i].optionText, data.options[i].isCorrect, i]
        );
      }
      await client.query("COMMIT");
      const { rows: fullQ } = await pool.query(`SELECT * FROM qcm_options WHERE question_id = $1 ORDER BY position`, [question.id]);
      res.status(201).json({ question: { ...question, options: fullQ } });
    } catch (e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
  } catch (err) { next(err); }
}

// Met à jour une question QCM (texte + remplacement complet des options).
async function updateQcmQuestion(req, res, next) {
  try {
    const data = qcmQuestionSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`UPDATE qcm_questions SET question_text = $1, explanation_text = $2, position = $3 WHERE id = $4`,
        [data.questionText, data.explanationText || null, data.position ?? 0, req.params.questionId]);
      await client.query(`DELETE FROM qcm_options WHERE question_id = $1`, [req.params.questionId]);
      for (let i = 0; i < data.options.length; i++) {
        await client.query(`INSERT INTO qcm_options (question_id, option_text, is_correct, position) VALUES ($1,$2,$3,$4)`,
          [req.params.questionId, data.options[i].optionText, data.options[i].isCorrect, i]);
      }
      await client.query("COMMIT");
      const { rows: opts } = await pool.query(`SELECT * FROM qcm_options WHERE question_id = $1 ORDER BY position`, [req.params.questionId]);
      res.json({ question: { id: req.params.questionId, questionText: data.questionText, options: opts } });
    } catch (e) { await client.query("ROLLBACK"); throw e; }
    finally { client.release(); }
  } catch (err) { next(err); }
}

async function deleteQcmQuestion(req, res, next) {
  try {
    await pool.query(`DELETE FROM qcm_questions WHERE id = $1`, [req.params.questionId]);
    res.status(204).end();
  } catch (err) { next(err); }
}

// ── Publier / dépublier ───────────────────────────────────────

async function togglePublished(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE modules SET published = NOT published WHERE id = $1 RETURNING id, published`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Module introuvable." });
    res.json({ id: rows[0].id, published: rows[0].published });
  } catch (err) {
    next(err);
  }
}

// ── Duplication d'un module ───────────────────────────────────
// Clone le module avec ses chapitres et ses contenus (sauf les fichiers
// physiques qui restent partagés), en générant de nouveaux IDs pour tous
// les éléments. Le doublon est toujours créé en brouillon (published=false).

async function duplicateModule(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: srcRows } = await client.query(`SELECT * FROM modules WHERE id = $1`, [req.params.id]);
    if (!srcRows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Module introuvable." }); }
    const src = srcRows[0];

    // Nouvel identifiant unique basé sur l'original + suffixe horodaté
    const newId = `${src.id}-copie-${Date.now().toString(36)}`;
    const newTitle = `${src.title} (copie)`;

    await client.query(
      `INSERT INTO modules (id, title, category, duration_min, level, price_cents, description, pedagogue_id, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)`,
      [newId, newTitle, src.category, src.duration_min, src.level, src.price_cents, src.description, req.user.id]
    );

    const { rows: chapters } = await client.query(`SELECT * FROM chapters WHERE module_id = $1 ORDER BY position`, [src.id]);
    for (const ch of chapters) {
      const newChId = `${newId}-${ch.id}`;
      await client.query(`INSERT INTO chapters (id, module_id, title, position) VALUES ($1,$2,$3,$4)`, [newChId, newId, ch.title, ch.position]);

      const { rows: contents } = await client.query(`SELECT * FROM contents WHERE chapter_id = $1 ORDER BY position`, [ch.id]);
      for (const c of contents) {
        await client.query(
          `INSERT INTO contents (chapter_id, type, title, file_path, mime_type, external_url, content_text, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [newChId, c.type, c.title, c.file_path, c.mime_type, c.external_url, c.content_text, c.position]
        );
        // Les QCM sont aussi dupliqués avec leurs questions et options
        if (c.type === "qcm") {
          const { rows: newContent } = await client.query(`SELECT id FROM contents WHERE chapter_id = $1 AND position = $2 AND type = 'qcm' ORDER BY id DESC LIMIT 1`, [newChId, c.position]);
          const newContentId = newContent[0]?.id;
          if (newContentId) {
            const { rows: questions } = await client.query(`SELECT * FROM qcm_questions WHERE content_id = $1 ORDER BY position`, [c.id]);
            for (const q of questions) {
              const { rows: newQ } = await client.query(`INSERT INTO qcm_questions (content_id, question_text, position) VALUES ($1,$2,$3) RETURNING id`, [newContentId, q.question_text, q.position]);
              const { rows: options } = await client.query(`SELECT * FROM qcm_options WHERE question_id = $1 ORDER BY position`, [q.id]);
              for (const o of options) {
                await client.query(`INSERT INTO qcm_options (question_id, option_text, is_correct, position) VALUES ($1,$2,$3,$4)`, [newQ[0].id, o.option_text, o.is_correct, o.position]);
              }
            }
          }
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ id: newId, title: newTitle, published: false });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// ── Contenu texte enrichi ─────────────────────────────────────

async function updateTextContent(req, res, next) {
  try {
    const { contentText } = z.object({ contentText: z.string().max(50000) }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE contents SET content_text = $1 WHERE id = $2 AND type = 'text' RETURNING id`,
      [contentText, req.params.contentId]
    );
    if (!rows.length) return res.status(404).json({ error: "Contenu introuvable ou non de type texte." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list, detail, checkQcmAnswer, submitQcm,
  createModule, updateModule, deleteModule, togglePublished, duplicateModule,
  addChapter, updateChapter, deleteChapter, reorderChapters,
  addContent, updateContent, deleteContent, reorderContents, updateTextContent,
  addQcmQuestion, updateQcmQuestion, deleteQcmQuestion,
  getCertificate,
};
