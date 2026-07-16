const { pool } = require("../config/db");

// ── Vue d'ensemble plateforme ─────────────────────────────────

async function platformOverview(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users  WHERE role='apprenant' AND anonymized_at IS NULL) AS learners,
        (SELECT COUNT(*) FROM users  WHERE anonymized_at IS NULL)                       AS total_users,
        (SELECT COUNT(*) FROM modules WHERE published=true)                             AS published_modules,
        (SELECT COUNT(*) FROM enrollments)                                              AS total_enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE completed_at IS NOT NULL)               AS completed_enrollments,
        (SELECT ROUND(AVG(time_spent_seconds)::numeric,0) FROM progress
          WHERE time_spent_seconds > 0)                                                 AS avg_time_per_content,
        (SELECT COUNT(DISTINCT user_id) FROM progress
          WHERE updated_at >= now() - interval '30 days')                              AS active_last_30d
    `);
    const r = rows[0];
    res.json({
      learners:             Number(r.learners),
      totalUsers:           Number(r.total_users),
      publishedModules:     Number(r.published_modules),
      totalEnrollments:     Number(r.total_enrollments),
      completedEnrollments: Number(r.completed_enrollments),
      completionRate:       r.total_enrollments > 0
                              ? Math.round((r.completed_enrollments / r.total_enrollments) * 100) : 0,
      avgTimePerContentSec: Number(r.avg_time_per_content) || 0,
      activeLast30d:        Number(r.active_last_30d),
    });
  } catch (err) {
    next(err);
  }
}

// ── Analytics d'un module ─────────────────────────────────────

async function moduleAnalytics(req, res, next) {
  try {
    const { moduleId } = req.params;

    // Nombre d'inscrits + modules complétés
    const { rows: enrolRows } = await pool.query(`
      SELECT
        COUNT(*)                                            AS enrolled,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL)   AS completed
      FROM enrollments WHERE module_id = $1`, [moduleId]);
    const enrolled  = Number(enrolRows[0].enrolled);
    const completed = Number(enrolRows[0].completed);

    // Statistiques par contenu :
    // - taux de complétion (combien d'inscrits ont terminé ce contenu)
    // - temps moyen / médian / min / max passé
    // - score moyen au QCM si applicable
    const { rows: contentRows } = await pool.query(`
      SELECT
        c.id,
        c.type,
        c.title,
        ch.title                                                AS chapter_title,
        ch.position                                             AS chapter_pos,
        c.position                                              AS content_pos,
        COUNT(p.user_id)                                        AS views,
        COUNT(p.user_id) FILTER (WHERE p.completed)            AS completions,
        ROUND(AVG(p.time_spent_seconds)
              FILTER (WHERE p.time_spent_seconds > 0))::int     AS avg_sec,
        MIN(p.time_spent_seconds)
              FILTER (WHERE p.time_spent_seconds > 0)           AS min_sec,
        MAX(p.time_spent_seconds)
              FILTER (WHERE p.time_spent_seconds > 0)           AS max_sec,
        PERCENTILE_CONT(0.5) WITHIN GROUP
              (ORDER BY p.time_spent_seconds)
              FILTER (WHERE p.time_spent_seconds > 0)           AS median_sec,
        COUNT(p.user_id) FILTER (WHERE p.time_spent_seconds > 0) AS timed_views
      FROM contents c
      JOIN chapters ch ON ch.id = c.chapter_id
      LEFT JOIN progress p ON p.content_id = c.id
      WHERE ch.module_id = $1
      GROUP BY c.id, c.type, c.title, ch.title, ch.position, c.position
      ORDER BY ch.position, c.position`,
      [moduleId]
    );

    // Temps total estimé d'un parcours complet (somme des médianes ou moyennes par contenu)
    const totalEstimatedSec = contentRows.reduce((acc, c) => {
      return acc + (Number(c.median_sec) || Number(c.avg_sec) || 0);
    }, 0);

    // Taux de décrochage par chapitre : différence de complétion entre
    // le premier et le dernier contenu d'un chapitre
    const chapterMap = {};
    for (const c of contentRows) {
      const key = c.chapter_title;
      if (!chapterMap[key]) chapterMap[key] = [];
      chapterMap[key].push(c);
    }
    const chaptersStats = Object.entries(chapterMap).map(([title, contents]) => {
      const firstComp  = Number(contents[0]?.completions) || 0;
      const lastComp   = Number(contents[contents.length - 1]?.completions) || 0;
      const dropOff    = firstComp > 0 ? Math.round((1 - lastComp / firstComp) * 100) : 0;
      return { title, contentCount: contents.length, firstComp, lastComp, dropOffPercent: dropOff };
    });

    res.json({
      moduleId,
      enrolled,
      completed,
      completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
      totalEstimatedSec,
      suggestedDurationMin: Math.max(1, Math.round(totalEstimatedSec / 60)),
      contents: contentRows.map(c => ({
        id:           c.id,
        type:         c.type,
        title:        c.title,
        chapterTitle: c.chapter_title,
        views:        Number(c.views),
        completions:  Number(c.completions),
        completionRate: enrolled > 0 ? Math.round((Number(c.completions) / enrolled) * 100) : 0,
        avgSec:    Number(c.avg_sec)    || null,
        minSec:    Number(c.min_sec)    || null,
        maxSec:    Number(c.max_sec)    || null,
        medianSec: Number(c.median_sec) || null,
        timedViews: Number(c.timed_views),
      })),
      chapters: chaptersStats,
    });
  } catch (err) {
    next(err);
  }
}

// ── Liste de tous les modules avec leurs métriques clés ──────

async function allModulesOverview(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        m.id, m.title, m.category, m.duration_min,
        COUNT(DISTINCT e.id)                              AS enrolled,
        COUNT(DISTINCT e.id) FILTER (WHERE e.completed_at IS NOT NULL) AS completed,
        ROUND(AVG(p.time_spent_seconds)
              FILTER (WHERE p.time_spent_seconds > 0))::int AS avg_content_sec,
        COUNT(DISTINCT c.id)                              AS content_count
      FROM modules m
      LEFT JOIN enrollments e  ON e.module_id = m.id
      LEFT JOIN chapters ch    ON ch.module_id = m.id
      LEFT JOIN contents c     ON c.chapter_id = ch.id
      LEFT JOIN progress p     ON p.content_id = c.id
      WHERE m.published = true
      GROUP BY m.id
      ORDER BY enrolled DESC, m.title`);

    res.json({
      modules: rows.map(r => ({
        id:             r.id,
        title:          r.title,
        category:       r.category,
        durationMin:    r.duration_min,
        enrolled:       Number(r.enrolled),
        completed:      Number(r.completed),
        completionRate: Number(r.enrolled) > 0
                          ? Math.round((Number(r.completed) / Number(r.enrolled)) * 100) : 0,
        avgContentSec:  Number(r.avg_content_sec) || null,
        contentCount:   Number(r.content_count),
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { platformOverview, moduleAnalytics, allModulesOverview };
