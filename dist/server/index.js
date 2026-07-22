var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite-plugin-meta-images.ts
import fs3 from "fs";
import path3 from "path";
function metaImagesPlugin() {
  return {
    name: "vite-plugin-meta-images",
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        log("[meta-images] no Replit deployment domain found, skipping meta tag updates");
        return html;
      }
      const publicDir = path3.resolve(process.cwd(), "client", "public");
      const opengraphPngPath = path3.join(publicDir, "opengraph.png");
      const opengraphJpgPath = path3.join(publicDir, "opengraph.jpg");
      const opengraphJpegPath = path3.join(publicDir, "opengraph.jpeg");
      let imageExt = null;
      if (fs3.existsSync(opengraphPngPath)) {
        imageExt = "png";
      } else if (fs3.existsSync(opengraphJpgPath)) {
        imageExt = "jpg";
      } else if (fs3.existsSync(opengraphJpegPath)) {
        imageExt = "jpeg";
      }
      if (!imageExt) {
        log("[meta-images] OpenGraph image not found, skipping meta tag updates");
        return html;
      }
      const imageUrl = `${baseUrl}/opengraph.${imageExt}`;
      log("[meta-images] updating meta image tags to:", imageUrl);
      html = html.replace(
        /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
        `<meta property="og:image" content="${imageUrl}" />`
      );
      html = html.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
        `<meta name="twitter:image" content="${imageUrl}" />`
      );
      return html;
    }
  };
}
function getDeploymentUrl() {
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const url = `https://${process.env.REPLIT_INTERNAL_APP_DOMAIN}`;
    log("[meta-images] using internal app domain:", url);
    return url;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    log("[meta-images] using dev domain:", url);
    return url;
  }
  return null;
}
function log(...args) {
  if (process.env.NODE_ENV === "production") {
    console.log(...args);
  }
}
var init_vite_plugin_meta_images = __esm({
  "vite-plugin-meta-images.ts"() {
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path4 from "path";
var vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    init_vite_plugin_meta_images();
    vite_config_default = defineConfig({
      plugins: [
        react(),
        tailwindcss(),
        metaImagesPlugin()
      ],
      resolve: {
        alias: {
          "@": path4.resolve(import.meta.dirname, "client", "src"),
          "@shared": path4.resolve(import.meta.dirname, "shared"),
          "@assets": path4.resolve(import.meta.dirname, "attached_assets")
        }
      },
      css: {
        postcss: {
          plugins: []
        }
      },
      root: path4.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path4.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        host: "0.0.0.0",
        allowedHosts: true,
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  setupVite: () => setupVite
});
import { createServer as createViteServer, createLogger } from "vite";
import fs4 from "fs";
import path5 from "path";
import { nanoid } from "nanoid";
async function setupVite(server, app2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
var viteLogger;
var init_vite = __esm({
  "server/vite.ts"() {
    init_vite_config();
    viteLogger = createLogger();
  }
});

// server/index.ts
import express2 from "express";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  bookings;
  campings;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.bookings = /* @__PURE__ */ new Map();
    this.campings = [
      {
        id: 1,
        typeId: 1,
        name: "Aura 1",
        images: ["/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg"],
        image: "/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg",
        description: "Unidad Aura 1: Privacidad total con jacuzzi privado y vista al ca\xF1\xF3n.",
        features: ["Jacuzzi VIP", "Cine Privado", "Cena Especial", "Vista Premium", "Malla Catamar\xE1n", "Zona BBQ"],
        rating: 5
      }
    ];
  }
  async getCampings() {
    return this.campings;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      id,
      username: insertUser.username || "",
      password: insertUser.password || ""
    };
    this.users.set(id, user);
    return user;
  }
  async createBooking(insertBooking) {
    const id = randomUUID();
    const booking = {
      id,
      campingId: insertBooking.campingId || "",
      planId: insertBooking.planId || "",
      customerName: insertBooking.customerName || "",
      customerEmail: insertBooking.customerEmail || "",
      startDate: insertBooking.startDate || "",
      endDate: insertBooking.endDate || "",
      totalPrice: insertBooking.totalPrice || "",
      addons: insertBooking.addons || null
    };
    this.bookings.set(id, booking);
    return booking;
  }
};
var storage = new MemStorage();

// shared/schema.js
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campingId: varchar("camping_id").notNull(),
  planId: text("plan_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalPrice: text("total_price").notNull(),
  addons: text("addons").array()
});
var insertUserSchema = createInsertSchema(users);
var insertBookingSchema = createInsertSchema(bookings);

// server/routes.ts
import { execa } from "execa";
import path from "path";
import fs from "fs";
import multer from "multer";
import pg from "pg";
var { Pool } = pg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `comprobante-${uniqueSuffix}${ext}`);
  }
});
var upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten im\xE1genes"));
    }
  }
});
var mediaUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});
var uploadMedia = multer({
  storage: mediaUploadStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten im\xE1genes y videos"));
    }
  }
});
async function ensurePostgresSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        plan VARCHAR(255),
        camping VARCHAR(100),
        unidad VARCHAR(100),
        fecha_inicio VARCHAR(50),
        fecha_fin VARCHAR(50),
        adicionales TEXT,
        total INTEGER DEFAULT 0,
        abono INTEGER DEFAULT 0,
        saldo INTEGER DEFAULT 0,
        nombre VARCHAR(255),
        telefono VARCHAR(50),
        email VARCHAR(255),
        estado INTEGER DEFAULT 1,
        referencia VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comprobante TEXT,
        cedula VARCHAR(50)
      )
    `);
    console.log("PostgreSQL schema verified");
    await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cedula VARCHAR(50)`);
  } catch (error) {
    console.error("Error ensuring PostgreSQL schema:", error);
  }
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'media_files'
      )
    `);
    if (!tableCheck.rows[0].exists) {
      await pool.query(`DROP SEQUENCE IF EXISTS media_files_id_seq`);
      await pool.query(`
        CREATE TABLE media_files (
          id SERIAL PRIMARY KEY,
          data TEXT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("media_files table created");
    }
  } catch (error) {
    console.error("Error creating media_files table:", error);
  }
}
async function registerRoutes(httpServer2, app2) {
  await ensurePostgresSchema();
  app2.get("/api/listar-reservas.php", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM reservas ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/get-ocupacion.php", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT fecha_inicio, fecha_fin, unidad FROM reservas WHERE estado != 3"
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/cancelar-reserva.php", async (req, res) => {
    const { referencia } = req.body;
    if (!referencia) return res.status(400).json({ success: false, error: "Referencia no proporcionada" });
    try {
      if (referencia.startsWith("BLOCK-")) {
        const trimmedReferencia = referencia.trim();
        console.log("Intentando eliminar bloqueo f\xEDsico:", `'${trimmedReferencia}'`);
        const existingResult = await pool.query("SELECT * FROM reservas WHERE TRIM(referencia) ILIKE $1", [trimmedReferencia]);
        if (existingResult.rows.length === 0) {
          console.warn("No se encontr\xF3 por referencia, buscando coincidencias parciales...");
          const possibleResult = await pool.query("SELECT * FROM reservas WHERE referencia ILIKE $1", [`%${trimmedReferencia}%`]);
          if (possibleResult.rows.length > 0) {
            console.log("Encontrada coincidencia parcial:", possibleResult.rows[0].referencia);
            await pool.query("DELETE FROM reservas WHERE id = $1", [possibleResult.rows[0].id]);
            return res.json({ success: true, note: "Eliminado por coincidencia parcial" });
          }
          console.warn("Bloqueo no encontrado en DB:", `'${trimmedReferencia}'`);
          return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
        }
        const result = await pool.query("DELETE FROM reservas WHERE id = $1", [existingResult.rows[0].id]);
        if (result.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Error al eliminar" });
        }
        return res.json({ success: true });
      } else {
        const result = await pool.query("UPDATE reservas SET estado = 3 WHERE referencia = $1", [referencia]);
        if (result.rowCount === 0) {
          return res.status(404).json({ success: false, error: "Reserva no encontrada" });
        }
        return res.json({ success: true });
      }
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/marcar-saldo-pagado.php", async (req, res) => {
    const { referencia } = req.body;
    try {
      await pool.query("UPDATE reservas SET estado = 2, saldo = 0 WHERE referencia = $1", [referencia]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/marcar-completada.php", async (req, res) => {
    const { referencia } = req.body;
    try {
      await pool.query("UPDATE reservas SET estado = 4 WHERE referencia = $1", [referencia]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/actualizar-reserva.php", async (req, res) => {
    const { referencia, fecha_inicio, fecha_fin, unidad, nombre, email, telefono, cedula, plan, total, abono, estado, adicionales } = req.body;
    if (!referencia) return res.status(400).json({ success: false, error: "Faltan datos" });
    try {
      const camping = unidad ? unidad.split(" ")[0] : null;
      const totalNum = total !== void 0 ? parseFloat(total) : void 0;
      const abonoNum = abono !== void 0 ? parseFloat(abono) : void 0;
      const saldo = totalNum !== void 0 && abonoNum !== void 0 ? Math.max(0, totalNum - abonoNum) : void 0;
      const updates = [];
      const params = [];
      let paramIndex = 1;
      if (fecha_inicio) {
        updates.push(`fecha_inicio = $${paramIndex++}`);
        params.push(fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio);
      }
      if (fecha_fin) {
        updates.push(`fecha_fin = $${paramIndex++}`);
        params.push(fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin);
      }
      if (unidad) {
        updates.push(`unidad = $${paramIndex++}`);
        params.push(unidad);
      }
      if (camping) {
        updates.push(`camping = $${paramIndex++}`);
        params.push(camping);
      }
      if (nombre) {
        updates.push(`nombre = $${paramIndex++}`);
        params.push(nombre);
      }
      if (email) {
        updates.push(`email = $${paramIndex++}`);
        params.push(email);
      }
      if (telefono) {
        updates.push(`telefono = $${paramIndex++}`);
        params.push(telefono);
      }
      if (cedula !== void 0) {
        updates.push(`cedula = $${paramIndex++}`);
        params.push(cedula || null);
      }
      if (plan) {
        updates.push(`plan = $${paramIndex++}`);
        params.push(plan);
      }
      if (totalNum !== void 0) {
        updates.push(`total = $${paramIndex++}`);
        params.push(totalNum);
      }
      if (abonoNum !== void 0) {
        updates.push(`abono = $${paramIndex++}`);
        params.push(abonoNum);
      }
      if (saldo !== void 0) {
        updates.push(`saldo = $${paramIndex++}`);
        params.push(saldo);
      }
      if (estado !== void 0) {
        const estadoInt = parseInt(estado);
        updates.push(`estado = $${paramIndex++}`);
        params.push(estadoInt);
      }
      if (adicionales !== void 0) {
        updates.push(`adicionales = $${paramIndex++}`);
        params.push(adicionales !== null ? JSON.stringify(adicionales) : null);
      }
      if (updates.length === 0) return res.json({ success: true, message: "No updates provided" });
      const query = `UPDATE reservas SET ${updates.join(", ")} WHERE referencia = $${paramIndex}`;
      params.push(referencia);
      const result = await pool.query(query, params);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Reserva no encontrada" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Update Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/bulk-actions.php", async (req, res) => {
    const { action, referencias } = req.body;
    if (!referencias || !Array.isArray(referencias)) return res.status(400).json({ success: false, error: "Datos invalidos" });
    try {
      const placeholders = referencias.map((_, i) => `$${i + 1}`).join(",");
      if (action === "delete") {
        await pool.query(`DELETE FROM reservas WHERE referencia IN (${placeholders})`, referencias);
      } else if (action === "hide") {
        await pool.query(`UPDATE reservas SET estado = 5 WHERE referencia IN (${placeholders})`, referencias);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/crear-reserva-manual.php", async (req, res) => {
    const { nombre, email, telefono, unidad, fecha_inicio, fecha_fin, plan, total, abono, estado } = req.body;
    try {
      const startOnly = fecha_inicio.substring(0, 10);
      const endOnly = fecha_fin.substring(0, 10);
      const existingBooking = await pool.query(
        `SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND LEFT(fecha_inicio, 10) < $2 
         AND LEFT(fecha_fin, 10) > $3`,
        [unidad, endOnly, startOnly]
      );
      if (existingBooking.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Esta unidad ya se encuentra reservada para las fechas seleccionadas."
        });
      }
      const camping = unidad.split(" ")[0];
      const referencia = `MAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const saldo = Math.max(0, total - abono);
      const bogotaTime = new Date((/* @__PURE__ */ new Date()).getTime() - 5 * 60 * 60 * 1e3);
      const createdAt = bogotaTime.toISOString().replace("T", " ").substr(0, 19);
      const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
      const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;
      await pool.query(
        `INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          plan,
          camping,
          unidad,
          fechaInicioNorm,
          fechaFinNorm,
          total,
          abono,
          saldo,
          nombre,
          telefono,
          email,
          estado || 2,
          referencia,
          createdAt
        ]
      );
      res.json({ success: true, referencia });
    } catch (error) {
      console.error("Manual Reservation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/crear-reserva.php", async (req, res) => {
    const { plan, camping, unidad, fecha_inicio, fecha_fin, adicionales, total, nombre, telefono, email, cedula } = req.body;
    if (!plan || !camping || !unidad || !fecha_inicio || !fecha_fin || !nombre || !telefono || !email) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }
    try {
      const startOnly = fecha_inicio.substring(0, 10);
      const endOnly = fecha_fin.substring(0, 10);
      const existingBooking = await pool.query(
        `SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND LEFT(fecha_inicio, 10) < $2 
         AND LEFT(fecha_fin, 10) > $3`,
        [unidad, endOnly, startOnly]
      );
      if (existingBooking.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Esta unidad ya se encuentra reservada o bloqueada para las fechas seleccionadas."
        });
      }
      const ubFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");
      if (fs.existsSync(ubFile)) {
        try {
          const ub = JSON.parse(fs.readFileSync(ubFile, "utf-8"));
          const bookingStart = new Date(fecha_inicio.includes("T") ? fecha_inicio : fecha_inicio + "T12:00:00");
          const bookingEnd = new Date(fecha_fin.includes("T") ? fecha_fin : fecha_fin + "T12:00:00");
          const isUnitDisabled = ub.some((block) => {
            if (block.unitName !== unidad) return false;
            if (!block.fechaInicio && !block.fechaFin) return true;
            const blockStart = block.fechaInicio ? new Date(block.fechaInicio) : /* @__PURE__ */ new Date(0);
            const blockEnd = block.fechaFin ? new Date(block.fechaFin) : new Date(9999, 11, 31);
            return bookingStart <= blockEnd && bookingEnd >= blockStart;
          });
          if (isUnitDisabled) {
            return res.status(400).json({ success: false, error: "Esta unidad se encuentra inhabilitada para las fechas seleccionadas." });
          }
        } catch {
        }
      }
      const planBlocksFile2 = path.join(process.cwd(), "server", "api", "plan-blocks.json");
      let planBlocks = [];
      if (fs.existsSync(planBlocksFile2)) {
        try {
          planBlocks = JSON.parse(fs.readFileSync(planBlocksFile2, "utf-8"));
        } catch {
          planBlocks = [];
        }
      }
      let campingTypeMap = { "Aura VIP": 1, "Aura": 1, "\xC1rbol": 2, "Nido": 3 };
      try {
        const campingsData = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
        campingsData.forEach((c) => {
          const fw = c.name.split(" ")[0];
          if (fw && !campingTypeMap[fw]) campingTypeMap[fw] = c.typeId;
        });
      } catch {
      }
      const typeId = campingTypeMap[camping] || 0;
      const plansFile2 = path.join(process.cwd(), "server", "api", "plans.json");
      let dynamicPlans = [];
      try {
        dynamicPlans = JSON.parse(fs.readFileSync(plansFile2, "utf-8"));
      } catch {
        dynamicPlans = [];
      }
      const matchedPlan = dynamicPlans.find((p) => p.nombre === plan);
      const planId = matchedPlan?.id || "";
      if (planId && typeId) {
        const bookingStart = /* @__PURE__ */ new Date(fecha_inicio + "T12:00:00");
        const bookingEnd = /* @__PURE__ */ new Date(fecha_fin + "T12:00:00");
        const isBlocked = planBlocks.some((block) => {
          if (block.planId !== planId) return false;
          if (!block.campingIds.includes(typeId)) return false;
          const blockStart = /* @__PURE__ */ new Date(block.fechaInicio + "T12:00:00");
          const blockEnd = /* @__PURE__ */ new Date(block.fechaFin + "T12:00:00");
          return bookingStart <= blockEnd && bookingEnd >= blockStart;
        });
        if (isBlocked) {
          return res.status(400).json({
            success: false,
            error: "Este plan no est\xE1 disponible para el camping y fechas seleccionadas"
          });
        }
      }
      const referencia = `ONA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const abono = Math.round(total * 0.5);
      const saldo = total - abono;
      const bogotaTime = new Date((/* @__PURE__ */ new Date()).getTime() - 5 * 60 * 60 * 1e3);
      const createdAt = bogotaTime.toISOString().replace("T", " ").substr(0, 19);
      const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
      const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;
      await pool.query(
        `INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, adicionales, created_at, cedula
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          plan,
          camping,
          unidad,
          fechaInicioNorm,
          fechaFinNorm,
          total,
          abono,
          saldo,
          nombre,
          telefono,
          email,
          1,
          // PENDIENTE
          referencia,
          adicionales ? JSON.stringify(adicionales) : null,
          createdAt,
          cedula || null
        ]
      );
      res.json({ success: true, referencia });
    } catch (error) {
      console.error("Reservation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.all("/api/*.php", async (req, res) => {
    const relativePath = req.path.replace(/^\/api\//, "");
    const phpFile = path.join(process.cwd(), "server", "api", relativePath);
    if (!fs.existsSync(phpFile)) {
      return res.status(404).json({ error: "PHP file not found" });
    }
    try {
      const body = typeof req.body === "object" ? JSON.stringify(req.body) : req.body || "";
      const { stdout } = await execa("php", [phpFile], {
        input: body,
        shell: true,
        env: {
          REQUEST_METHOD: req.method,
          CONTENT_TYPE: "application/json",
          REMOTE_ADDR: req.ip,
          HTTP_USER_AGENT: req.get("user-agent") || "",
          COOKIE: req.get("cookie") || ""
          // IMPORTANTE: Pasar las cookies para mantener la sesión PHP
        }
      });
      try {
        const jsonResponse = JSON.parse(stdout);
        res.json(jsonResponse);
      } catch (e) {
        res.send(stdout);
      }
    } catch (error) {
      console.error("Execution Error:", error);
      res.status(500).json({ error: "PHP execution failed", details: error.message });
    }
  });
  app2.use("/admin", async (req, res, next) => {
    if (req.path === "/login" || req.path.includes(".")) {
      return next();
    }
    const phpCheckFile = path.join(process.cwd(), "server", "api", "check-session.php");
    if (!fs.existsSync(phpCheckFile)) {
      return next();
    }
    try {
      const { stdout } = await execa("php", [phpCheckFile]);
      const session = JSON.parse(stdout);
      if (!session?.logged_in) {
        return res.redirect("/admin/login");
      }
      next();
    } catch (error) {
      next();
    }
  });
  app2.post("/api/bloquear-fecha", async (req, res) => {
    const { unidad, fecha_inicio, fecha_fin } = req.body;
    if (!unidad || !fecha_inicio || !fecha_fin) {
      return res.json({ success: false, error: "Datos incompletos" });
    }
    try {
      const unidades = [];
      if (unidad === "all" || unidad === "Todas las unidades") {
        unidades.push("Aura 1", "Aura 2", "Aura 3", "Aura 4", "\xC1rbol 1", "Nido 1");
      } else {
        let normalizedUnidad = unidad;
        if (unidad === "Aura") normalizedUnidad = "Aura 1";
        if (unidad === "\xC1rbol") normalizedUnidad = "\xC1rbol 1";
        if (unidad === "Nido") normalizedUnidad = "Nido 1";
        unidades.push(normalizedUnidad);
      }
      for (const u of unidades) {
        const camping = u.split(" ")[0];
        const referencia = `BLOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const start = fecha_inicio.includes("T") ? fecha_inicio : `${fecha_inicio}T12:00:00`;
        const end = fecha_fin.includes("T") ? fecha_fin : `${fecha_fin}T12:00:00`;
        const bogotaTime = new Date((/* @__PURE__ */ new Date()).getTime() - 5 * 60 * 60 * 1e3);
        const createdAt = bogotaTime.toISOString().replace("T", " ").substr(0, 19);
        await pool.query(
          `INSERT INTO reservas (
            plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            "BLOQUEO ADMIN",
            camping,
            u,
            start,
            end,
            0,
            0,
            0,
            "ADMINISTRADOR",
            "0000000000",
            "admin@onaxperience.com",
            2,
            // CONFIRMADO
            referencia,
            createdAt
          ]
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Database Error:", error);
      res.json({ success: false, error: error.message });
    }
  });
  app2.post("/api/bookings", async (req, res) => {
    try {
      const parsed = insertBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid booking data" });
      }
      const booking = await storage.createBooking(parsed.data);
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
  const campingsFile = path.join(process.cwd(), "server", "api", "campings.json");
  app2.get("/api/campings", (req, res) => {
    try {
      if (!fs.existsSync(campingsFile)) fs.writeFileSync(campingsFile, JSON.stringify([]));
      const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/media/:id", async (req, res) => {
    try {
      const result = await pool.query("SELECT data, mime_type FROM media_files WHERE id = $1", [parseInt(req.params.id)]);
      if (result.rows.length === 0) return res.status(404).send("Not found");
      const { data, mime_type } = result.rows[0];
      const base64 = data.includes(",") ? data.split(",")[1] : data;
      const buffer = Buffer.from(base64, "base64");
      res.setHeader("Content-Type", mime_type);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(buffer);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  app2.post("/api/upload-camping-image", uploadMedia.single("image"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });
      const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      try {
        fs.unlinkSync(filePath);
      } catch {
      }
      const result = await pool.query(
        "INSERT INTO media_files (data, mime_type) VALUES ($1, $2) RETURNING id",
        [dataUri, file.mimetype]
      );
      res.json({ success: true, url: `/api/media/${result.rows[0].id}`, mimeType: file.mimetype });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/upload/media", uploadMedia.single("media"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });
      const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      const base64 = fileBuffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      try {
        fs.unlinkSync(filePath);
      } catch {
      }
      const result = await pool.query(
        "INSERT INTO media_files (data, mime_type) VALUES ($1, $2) RETURNING id",
        [dataUri, file.mimetype]
      );
      res.json({ success: true, url: `/api/media/${result.rows[0].id}`, mimeType: file.mimetype });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/upload-addon-media", uploadMedia.array("media", 20), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) return res.status(400).json({ success: false, error: "No files uploaded" });
      const results = [];
      for (const file of files) {
        const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString("base64");
        const dataUri = `data:${file.mimetype};base64,${base64}`;
        try {
          fs.unlinkSync(filePath);
        } catch {
        }
        const dbResult = await pool.query(
          "INSERT INTO media_files (data, mime_type) VALUES ($1, $2) RETURNING id",
          [dataUri, file.mimetype]
        );
        results.push({
          url: `/api/media/${dbResult.rows[0].id}`,
          type: file.mimetype.startsWith("video/") ? "video" : "image"
        });
      }
      res.json({ success: true, media: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/campings", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
      const maxId = data.reduce((max, c) => Math.max(max, c.id || 0), 0);
      const newCamping = { id: maxId + 1, rating: 5, images: [], videos: [], features: [], ...req.body };
      data.push(newCamping);
      fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
      res.json({ success: true, camping: newCamping });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.put("/api/campings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedCamping = req.body;
      const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
      const index = data.findIndex((c) => c.id === parseInt(id));
      if (index === -1) return res.status(404).json({ success: false, error: "Camping not found" });
      data[index] = { ...data[index], ...updatedCamping };
      fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
      res.json({ success: true, camping: data[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/campings/:id", (req, res) => {
    try {
      const { id } = req.params;
      let data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
      const initial = data.length;
      data = data.filter((c) => c.id !== parseInt(id));
      if (data.length === initial) return res.status(404).json({ success: false, error: "Camping not found" });
      fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const discountCodesFile = path.join(process.cwd(), "server", "api", "discount-codes.json");
  if (!fs.existsSync(discountCodesFile)) fs.writeFileSync(discountCodesFile, JSON.stringify([]));
  app2.get("/api/discount-codes", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/discount-codes", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
      const { codigo } = req.body;
      if (data.some((d) => d.codigo.toUpperCase() === (codigo || "").toUpperCase())) {
        return res.status(400).json({ success: false, error: "Ya existe un c\xF3digo con ese nombre" });
      }
      const newCode = { id: `dc_${Date.now()}`, activo: true, planIds: [], campingTypeIds: [], ...req.body, codigo: (codigo || "").toUpperCase() };
      data.push(newCode);
      fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
      res.json({ success: true, code: newCode });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.put("/api/discount-codes/:id", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
      const index = data.findIndex((d) => d.id === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, error: "C\xF3digo no encontrado" });
      data[index] = { ...data[index], ...req.body, codigo: (req.body.codigo || data[index].codigo).toUpperCase() };
      fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
      res.json({ success: true, code: data[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/discount-codes/:id", (req, res) => {
    try {
      let data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
      const initial = data.length;
      data = data.filter((d) => d.id !== req.params.id);
      if (data.length === initial) return res.status(404).json({ success: false, error: "C\xF3digo no encontrado" });
      fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/validate-discount", (req, res) => {
    try {
      const { codigo, planId, campingTypeId } = req.body;
      const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
      const plansData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server", "api", "plans.json"), "utf-8"));
      const campingsData = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
      const found = data.find((d) => d.codigo.toUpperCase() === (codigo || "").toUpperCase());
      if (!found) return res.json({ valid: false, mensaje: "C\xF3digo de descuento no v\xE1lido." });
      if (!found.activo) return res.json({ valid: false, mensaje: "Este c\xF3digo ya no est\xE1 activo." });
      const planOk = !found.planIds || found.planIds.length === 0 || found.planIds.includes(planId);
      const campingOk = !found.campingTypeIds || found.campingTypeIds.length === 0 || found.campingTypeIds.includes(campingTypeId);
      if (!planOk || !campingOk) {
        const validPlanNames = found.planIds?.length ? found.planIds.map((pid) => plansData.find((p) => p.id === pid)?.nombre || pid).join(", ") : "todos los planes";
        const validCampingNames = found.campingTypeIds?.length ? [...new Set(campingsData.filter((c) => found.campingTypeIds.includes(c.typeId)).map((c) => c.name.split(" ")[0]))].join(", ") : "todos los campings";
        return res.json({
          valid: false,
          mensaje: `Este c\xF3digo es v\xE1lido para: ${validPlanNames}${found.campingTypeIds?.length ? ` en ${validCampingNames}` : ""}.`
        });
      }
      res.json({ valid: true, descuento: { tipo: found.tipo, valor: found.valor, codigo: found.codigo } });
    } catch (error) {
      res.status(500).json({ valid: false, mensaje: error.message });
    }
  });
  const addonsFile = path.join(process.cwd(), "server", "api", "addons.json");
  app2.get("/api/addons", (req, res) => {
    try {
      if (!fs.existsSync(addonsFile)) fs.writeFileSync(addonsFile, JSON.stringify([]));
      const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/addons", (req, res) => {
    try {
      const newAddon = { ...req.body, id: `addon_${Date.now()}` };
      const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
      data.push(newAddon);
      fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
      res.json({ success: true, addon: newAddon });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.put("/api/addons/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedAddon = req.body;
      const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
      const index = data.findIndex((a) => a.id === id);
      if (index === -1) return res.status(404).json({ success: false, error: "Addon not found" });
      data[index] = { ...data[index], ...updatedAddon };
      fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
      res.json({ success: true, addon: data[index] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/addons/:id", (req, res) => {
    try {
      const { id } = req.params;
      let data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
      data = data.filter((a) => a.id !== id);
      fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const settingsFile = path.join(process.cwd(), "server", "api", "settings.json");
  app2.get("/api/settings", (req, res) => {
    try {
      if (!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, JSON.stringify({ heroMedia: { type: "image", url: "" } }));
      res.json(JSON.parse(fs.readFileSync(settingsFile, "utf-8")));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/settings", (req, res) => {
    try {
      const current = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, "utf-8")) : {};
      const updated = { ...current, ...req.body };
      fs.writeFileSync(settingsFile, JSON.stringify(updated, null, 2));
      res.json({ success: true, settings: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const tarifasFile = path.join(process.cwd(), "server", "api", "tarifas.json");
  const defaultTarifas = { entreSemana: 0, viernesODomingo: 0, sabadoFestivo: 0, diasFestivos: [], fechasEspeciales: [] };
  app2.get("/api/tarifas", (req, res) => {
    try {
      if (!fs.existsSync(tarifasFile)) fs.writeFileSync(tarifasFile, JSON.stringify(defaultTarifas));
      res.json(JSON.parse(fs.readFileSync(tarifasFile, "utf-8")));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/tarifas", (req, res) => {
    try {
      fs.writeFileSync(tarifasFile, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.post("/api/confirmar-pago", upload.single("receipt"), async (req, res) => {
    try {
      const { referencia, total } = req.body;
      const file = req.file;
      if (!referencia) {
        return res.status(400).json({ success: false, error: "Referencia no proporcionada" });
      }
      if (!file) {
        return res.status(400).json({ success: false, error: "Comprobante no subido" });
      }
      const totalAmount = parseFloat(total) || 0;
      if (totalAmount < 0) {
        return res.status(400).json({ success: false, error: "Monto inv\xE1lido" });
      }
      const existingReserva = await pool.query("SELECT id, estado FROM reservas WHERE referencia = $1", [referencia]);
      if (existingReserva.rows.length === 0) {
        if (file) {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", file.filename));
        }
        return res.status(404).json({ success: false, error: "Reserva no encontrada" });
      }
      if (existingReserva.rows[0].estado === 3 || existingReserva.rows[0].estado === 4) {
        if (file) {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", file.filename));
        }
        return res.status(400).json({ success: false, error: "Esta reserva ya est\xE1 cancelada o completada" });
      }
      const receiptPath = `/uploads/${file.filename}`;
      const result = await pool.query(
        `UPDATE reservas SET estado = 2, abono = $1, saldo = total - $2, comprobante = $3 WHERE referencia = $4`,
        [totalAmount, totalAmount, receiptPath, referencia]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, error: "No se pudo actualizar la reserva" });
      }
      res.json({ success: true, message: "Pago confirmado correctamente", receiptPath });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const planBlocksFile = path.join(process.cwd(), "server", "api", "plan-blocks.json");
  const ensurePlanBlocksFile = () => {
    if (!fs.existsSync(planBlocksFile)) {
      fs.writeFileSync(planBlocksFile, JSON.stringify([], null, 2));
    }
  };
  const readPlanBlocks = () => {
    ensurePlanBlocksFile();
    try {
      return JSON.parse(fs.readFileSync(planBlocksFile, "utf-8"));
    } catch {
      return [];
    }
  };
  const writePlanBlocks = (blocks) => {
    fs.writeFileSync(planBlocksFile, JSON.stringify(blocks, null, 2));
  };
  app2.get("/api/plan-blocks", (req, res) => {
    try {
      const blocks = readPlanBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/plan-blocks", (req, res) => {
    try {
      const { planId, campingIds, fechaInicio, fechaFin } = req.body;
      if (!planId || !campingIds || !fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }
      const normalizedStart = fechaInicio.includes("T") ? fechaInicio : `${fechaInicio}T12:00:00`;
      const normalizedEnd = fechaFin.includes("T") ? fechaFin : `${fechaFin}T12:00:00`;
      if (!Array.isArray(campingIds) || campingIds.length === 0) {
        return res.status(400).json({ success: false, error: "Debe seleccionar al menos un camping" });
      }
      const startDate = new Date(normalizedStart);
      const endDate = new Date(normalizedEnd);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        return res.status(400).json({ success: false, error: "No se permiten fechas pasadas" });
      }
      if (endDate < startDate) {
        return res.status(400).json({ success: false, error: "La fecha fin no puede ser menor que la fecha inicio" });
      }
      const blocks = readPlanBlocks();
      const isDuplicate = blocks.some(
        (block) => block.planId === planId && JSON.stringify(block.campingIds.sort()) === JSON.stringify(campingIds.sort()) && block.fechaInicio === normalizedStart && block.fechaFin === normalizedEnd
      );
      if (isDuplicate) {
        return res.status(400).json({ success: false, error: "Ya existe un bloqueo id\xE9ntico" });
      }
      const newBlock = {
        id: Date.now().toString(),
        planId,
        campingIds,
        fechaInicio: normalizedStart,
        fechaFin: normalizedEnd,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      blocks.push(newBlock);
      writePlanBlocks(blocks);
      res.json({ success: true, block: newBlock });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/plan-blocks/:id", (req, res) => {
    try {
      const { id } = req.params;
      let blocks = readPlanBlocks();
      const initialLength = blocks.length;
      blocks = blocks.filter((block) => block.id !== id);
      if (blocks.length === initialLength) {
        return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
      }
      writePlanBlocks(blocks);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const unitBlocksFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");
  const readUnitBlocks = () => {
    try {
      if (!fs.existsSync(unitBlocksFile)) {
        fs.writeFileSync(unitBlocksFile, JSON.stringify([], null, 2));
      }
      return JSON.parse(fs.readFileSync(unitBlocksFile, "utf-8"));
    } catch {
      return [];
    }
  };
  const writeUnitBlocks = (blocks) => {
    fs.writeFileSync(unitBlocksFile, JSON.stringify(blocks, null, 2));
  };
  app2.get("/api/unit-blocks", (req, res) => {
    try {
      const blocks = readUnitBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/unit-blocks", (req, res) => {
    try {
      const { unitName, motivo, fechaInicio, fechaFin } = req.body;
      if (!unitName) {
        return res.status(400).json({ success: false, error: "Falta la unidad" });
      }
      const normalizedStart = fechaInicio ? fechaInicio.length === 10 ? fechaInicio + "T12:00:00" : fechaInicio : null;
      const normalizedEnd = fechaFin ? fechaFin.length === 10 ? fechaFin + "T12:00:00" : fechaFin : null;
      if (normalizedStart && normalizedEnd && new Date(normalizedStart) > new Date(normalizedEnd)) {
        return res.status(400).json({ success: false, error: "La fecha de inicio debe ser anterior a la fecha de fin" });
      }
      const blocks = readUnitBlocks();
      const isDuplicate = blocks.some(
        (b) => b.unitName === unitName && b.fechaInicio === normalizedStart && b.fechaFin === normalizedEnd
      );
      if (isDuplicate) {
        return res.status(400).json({ success: false, error: "Ya existe un bloqueo igual" });
      }
      const bogotaTime = new Date((/* @__PURE__ */ new Date()).getTime() - 5 * 60 * 60 * 1e3);
      const newBlock = {
        id: `ub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        unitName,
        motivo: motivo || "Inhabilitada",
        fechaInicio: normalizedStart,
        fechaFin: normalizedEnd,
        createdAt: bogotaTime.toISOString()
      };
      blocks.push(newBlock);
      writeUnitBlocks(blocks);
      res.json({ success: true, block: newBlock });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/unit-blocks/:id", (req, res) => {
    try {
      const { id } = req.params;
      let blocks = readUnitBlocks();
      const initialLength = blocks.length;
      blocks = blocks.filter((b) => b.id !== id);
      if (blocks.length === initialLength) {
        return res.status(404).json({ success: false, error: "Bloqueo no encontrado" });
      }
      writeUnitBlocks(blocks);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const plansFile = path.join(process.cwd(), "server", "api", "plans.json");
  const readPlans = () => {
    try {
      if (!fs.existsSync(plansFile)) {
        return [];
      }
      return JSON.parse(fs.readFileSync(plansFile, "utf-8"));
    } catch {
      return [];
    }
  };
  const writePlans = (plans) => {
    fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2));
  };
  app2.get("/api/plans", (req, res) => {
    try {
      const plans = readPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/plans/active", (req, res) => {
    try {
      const plans = readPlans();
      const today = /* @__PURE__ */ new Date();
      today.setHours(12, 0, 0, 0);
      const activePlans = plans.filter((plan) => {
        if (!plan.estado) return false;
        if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
          const start = /* @__PURE__ */ new Date(plan.fechaInicio + "T12:00:00");
          const end = /* @__PURE__ */ new Date(plan.fechaFin + "T12:00:00");
          if (today < start || today > end) return false;
        }
        return true;
      });
      res.json(activePlans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/plans", (req, res) => {
    try {
      const { nombre, eslogan, descripcion, tipo, icono, color, precios, incluye, fechaInicio, fechaFin, preventa, desactivarOtros, bannerImage } = req.body;
      if (!nombre || !eslogan || !tipo || !precios) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }
      if (!precios["1"] || !precios["2"] || !precios["3"]) {
        return res.status(400).json({ success: false, error: "Debe definir precios para todos los tipos de camping" });
      }
      if (tipo === "temporada") {
        if (!fechaInicio || !fechaFin) {
          return res.status(400).json({ success: false, error: "Los planes de temporada requieren fechas de inicio y fin" });
        }
        const normalizedStart = fechaInicio.includes("T") ? fechaInicio : `${fechaInicio}T12:00:00`;
        const normalizedEnd = fechaFin.includes("T") ? fechaFin : `${fechaFin}T12:00:00`;
        const start = new Date(normalizedStart);
        const end = new Date(normalizedEnd);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
        if (diffDays > 62) {
          return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar m\xE1s de 2 meses" });
        }
        if (end < start) {
          return res.status(400).json({ success: false, error: "La fecha fin no puede ser anterior a la fecha inicio" });
        }
      }
      const plans = readPlans();
      const newId = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      const existingById = plans.find((p) => p.id === newId);
      if (existingById) {
        return res.status(400).json({ success: false, error: "Ya existe un plan con ese nombre" });
      }
      if (desactivarOtros) {
        plans.forEach((p) => {
          p.estado = false;
        });
      }
      const newPlan = {
        id: newId,
        nombre,
        eslogan,
        descripcion: descripcion || "",
        tipo,
        icono: icono || "Sparkles",
        color: color || "#8B5A2B",
        estado: true,
        preventa: preventa || false,
        fechaInicio: tipo === "temporada" ? fechaInicio : null,
        fechaFin: tipo === "temporada" ? fechaFin : null,
        precios,
        incluye: incluye || [],
        bannerImage: bannerImage || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      plans.push(newPlan);
      writePlans(plans);
      res.json({ success: true, plan: newPlan });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.put("/api/plans/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, eslogan, descripcion, tipo, icono, color, precios, incluye, fechaInicio, fechaFin, preventa, estado, desactivarOtros, bannerImage } = req.body;
      const plans = readPlans();
      const planIndex = plans.findIndex((p) => p.id === id);
      if (planIndex === -1) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }
      if (precios && (!precios["1"] || !precios["2"] || !precios["3"])) {
        return res.status(400).json({ success: false, error: "Debe definir precios para todos los tipos de camping" });
      }
      const planTipo = tipo || plans[planIndex].tipo;
      if (planTipo === "temporada") {
        const startDate = fechaInicio || plans[planIndex].fechaInicio;
        const endDate = fechaFin || plans[planIndex].fechaFin;
        if (!startDate || !endDate) {
          return res.status(400).json({ success: false, error: "Los planes de temporada requieren fechas" });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
        if (diffDays > 62) {
          return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar m\xE1s de 2 meses" });
        }
      }
      if (desactivarOtros && estado !== false) {
        plans.forEach((p, idx) => {
          if (idx !== planIndex) p.estado = false;
        });
      }
      const updatedPlan = {
        ...plans[planIndex],
        nombre: nombre ?? plans[planIndex].nombre,
        eslogan: eslogan ?? plans[planIndex].eslogan,
        descripcion: descripcion ?? plans[planIndex].descripcion,
        tipo: tipo ?? plans[planIndex].tipo,
        icono: icono ?? plans[planIndex].icono,
        color: color ?? plans[planIndex].color,
        estado: estado ?? plans[planIndex].estado,
        preventa: preventa ?? plans[planIndex].preventa,
        fechaInicio: tipo === "temporada" ? fechaInicio ?? plans[planIndex].fechaInicio : null,
        fechaFin: tipo === "temporada" ? fechaFin ?? plans[planIndex].fechaFin : null,
        precios: precios ?? plans[planIndex].precios,
        incluye: incluye ?? plans[planIndex].incluye,
        bannerImage: bannerImage !== void 0 ? bannerImage : plans[planIndex].bannerImage || null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      plans[planIndex] = updatedPlan;
      writePlans(plans);
      res.json({ success: true, plan: updatedPlan });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.patch("/api/plans/:id/toggle", (req, res) => {
    try {
      const { id } = req.params;
      const { desactivarOtros } = req.body;
      const plans = readPlans();
      const planIndex = plans.findIndex((p) => p.id === id);
      if (planIndex === -1) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }
      const newState = !plans[planIndex].estado;
      if (newState && desactivarOtros) {
        plans.forEach((p, idx) => {
          if (idx !== planIndex) p.estado = false;
        });
      }
      plans[planIndex].estado = newState;
      writePlans(plans);
      res.json({ success: true, plan: plans[planIndex] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app2.delete("/api/plans/:id", (req, res) => {
    try {
      const { id } = req.params;
      let plans = readPlans();
      const initialLength = plans.length;
      plans = plans.filter((plan) => plan.id !== id);
      if (plans.length === initialLength) {
        return res.status(404).json({ success: false, error: "Plan no encontrado" });
      }
      writePlans(plans);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  return httpServer2;
}

// server/static.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createServer } from "http";
import path6 from "path";
var app = express2();
var isProd = process.env.NODE_ENV === "production";
var rootDir = isProd ? path6.join(process.cwd(), "dist") : process.cwd();
app.use("/images", express2.static(path6.join(rootDir, "public", "images")));
app.use("/uploads", express2.static(path6.join(rootDir, "public", "uploads")));
app.use("/attached_assets", express2.static(path6.join(process.cwd(), "attached_assets")));
var httpServer = createServer(app);
app.use(
  express2.json({
    limit: "20mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express2.urlencoded({ extended: false, limit: "20mb" }));
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log2(logLine);
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
  } else {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    await setupVite2(httpServer, app);
  }
  const port = Number(process.env.PORT) || 5e3;
  httpServer.listen(port, "0.0.0.0", () => {
    log2(`serving on port ${port}`);
  });
})();
export {
  log2 as log
};
