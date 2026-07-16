require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const apiRoutes = require("./routes/index");
const webhookRoutes = require("./routes/webhook.routes");
const { streamRouter } = require("./routes/video.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // nécessaire pour l'envoi du cookie de rafraîchissement httpOnly
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// ⚠️ ORDRE IMPORTANT : la route webhook Stripe doit être montée AVANT express.json(),
// car elle nécessite le corps brut (Buffer) pour vérifier la signature HMAC envoyée par Stripe.
app.use("/api/stripe/webhook", webhookRoutes);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", apiRoutes);

// Route de streaming vidéo protégée par jeton — montée à la racine, hors /api,
// car elle est appelée directement par la balise <video src="..."> du frontend.
app.use("/stream", streamRouter);

app.use((req, res) => res.status(404).json({ error: "Route introuvable." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✓ TutoRisk backend démarré sur http://localhost:${PORT}`);
});
