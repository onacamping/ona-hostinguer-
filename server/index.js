import express from "express";
// ✅ Con extensión .js (aunque el archivo fuente sea .ts)
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import path from "path";
const app = express();
// Corregido: Apuntar a las rutas correctas tanto en desarrollo como en producción (dist)
const isProd = process.env.NODE_ENV === "production";
const rootDir = isProd ? path.join(process.cwd(), "dist") : process.cwd();
app.use("/images", express.static(path.join(rootDir, "public", "images")));
app.use("/uploads", express.static(path.join(rootDir, "public", "uploads")));
app.use("/attached_assets", express.static(path.join(process.cwd(), "attached_assets")));
const httpServer = createServer(app);
app.use(express.json({
    limit: "20mb",
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));
export function log(message, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    await registerRoutes(httpServer, app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
    });
    if (isProd) {
        serveStatic(app);
    }
    else {
        const { setupVite } = await import("./vite.js");
        await setupVite(httpServer, app);
    }
    // Corregido: Se eliminó 'reusePort' para evitar bloqueos del firewall de Hostinger
    const port = Number(process.env.PORT) || 5000;
    httpServer.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
    });
})();
