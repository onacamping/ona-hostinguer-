import { storage } from "./storage.js";
import { insertBookingSchema } from "../shared/schema.js";
import { execa } from "execa";
import path from "path";
import fs from "fs";
import multer from "multer";
import pg from "pg";
const { Pool } = pg;
// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `comprobante-${uniqueSuffix}${ext}`);
    }
});
const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});
// Multer for media uploads (images + videos) - stores to temp then converts to base64
const mediaUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `media-${uniqueSuffix}${ext}`);
    }
});
const uploadMedia = multer({
    storage: mediaUploadStorage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes y videos'));
        }
    }
});
async function ensurePostgresSchema() {
    try {
        // Ensure the reservas table exists with all required columns
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
        // Add cedula column if it doesn't exist yet (migration for existing databases)
        await pool.query(`ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cedula VARCHAR(50)`);
    }
    catch (error) {
        console.error("Error ensuring PostgreSQL schema:", error);
    }
    // Media files table — separate block so a duplicate-sequence error doesn't abort everything
    try {
        const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'media_files'
      )
    `);
        if (!tableCheck.rows[0].exists) {
            // Drop any orphaned sequence from a previous partial creation attempt
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
    }
    catch (error) {
        console.error("Error creating media_files table:", error);
    }
}
export async function registerRoutes(httpServer, app) {
    await ensurePostgresSchema();
    app.get("/api/listar-reservas.php", async (req, res) => {
        try {
            const result = await pool.query("SELECT * FROM reservas ORDER BY created_at DESC");
            res.json(result.rows);
        }
        catch (error) {
            console.error("Database Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/get-ocupacion.php", async (req, res) => {
        try {
            const result = await pool.query("SELECT fecha_inicio, fecha_fin, unidad FROM reservas WHERE estado != 3");
            res.json(result.rows);
        }
        catch (error) {
            console.error("Database Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/cancelar-reserva.php", async (req, res) => {
        const { referencia } = req.body;
        if (!referencia)
            return res.status(400).json({ success: false, error: "Referencia no proporcionada" });
        try {
            // Si es un bloqueo admin (referencia empieza por BLOCK-), lo eliminamos físicamente de la DB
            if (referencia.startsWith('BLOCK-')) {
                const trimmedReferencia = referencia.trim();
                console.log("Intentando eliminar bloqueo físico:", `'${trimmedReferencia}'`);
                // Primero verificamos si existe
                const existingResult = await pool.query("SELECT * FROM reservas WHERE TRIM(referencia) ILIKE $1", [trimmedReferencia]);
                if (existingResult.rows.length === 0) {
                    // Intentar buscar por coincidencia parcial
                    console.warn("No se encontró por referencia, buscando coincidencias parciales...");
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
            }
            else {
                // Si es reserva normal, la cancelamos (estado 3)
                const result = await pool.query("UPDATE reservas SET estado = 3 WHERE referencia = $1", [referencia]);
                if (result.rowCount === 0) {
                    return res.status(404).json({ success: false, error: "Reserva no encontrada" });
                }
                return res.json({ success: true });
            }
        }
        catch (error) {
            console.error("Delete Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/marcar-saldo-pagado.php", async (req, res) => {
        const { referencia } = req.body;
        try {
            await pool.query("UPDATE reservas SET estado = 2, saldo = 0 WHERE referencia = $1", [referencia]);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/marcar-completada.php", async (req, res) => {
        const { referencia } = req.body;
        try {
            await pool.query("UPDATE reservas SET estado = 4 WHERE referencia = $1", [referencia]);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/actualizar-reserva.php", async (req, res) => {
        const { referencia, fecha_inicio, fecha_fin, unidad, nombre, email, telefono, cedula, plan, total, abono, estado, adicionales } = req.body;
        if (!referencia)
            return res.status(400).json({ success: false, error: "Faltan datos" });
        try {
            // Si el estado es null o undefined, no lo actualizamos. 
            // Pero si viene, permitimos cualquier valor (1: Pendiente, 2: Confirmado, 3: Cancelado, 4: Completado)
            const camping = unidad ? unidad.split(' ')[0] : null;
            const totalNum = total !== undefined ? parseFloat(total) : undefined;
            const abonoNum = abono !== undefined ? parseFloat(abono) : undefined;
            const saldo = (totalNum !== undefined && abonoNum !== undefined) ? Math.max(0, totalNum - abonoNum) : undefined;
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
            if (cedula !== undefined) {
                updates.push(`cedula = $${paramIndex++}`);
                params.push(cedula || null);
            }
            if (plan) {
                updates.push(`plan = $${paramIndex++}`);
                params.push(plan);
            }
            if (totalNum !== undefined) {
                updates.push(`total = $${paramIndex++}`);
                params.push(totalNum);
            }
            if (abonoNum !== undefined) {
                updates.push(`abono = $${paramIndex++}`);
                params.push(abonoNum);
            }
            if (saldo !== undefined) {
                updates.push(`saldo = $${paramIndex++}`);
                params.push(saldo);
            }
            if (estado !== undefined) {
                const estadoInt = parseInt(estado);
                updates.push(`estado = $${paramIndex++}`);
                params.push(estadoInt);
            }
            if (adicionales !== undefined) {
                updates.push(`adicionales = $${paramIndex++}`);
                params.push(adicionales !== null ? JSON.stringify(adicionales) : null);
            }
            if (updates.length === 0)
                return res.json({ success: true, message: "No updates provided" });
            const query = `UPDATE reservas SET ${updates.join(", ")} WHERE referencia = $${paramIndex}`;
            params.push(referencia);
            const result = await pool.query(query, params);
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: "Reserva no encontrada" });
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/bulk-actions.php", async (req, res) => {
        const { action, referencias } = req.body;
        if (!referencias || !Array.isArray(referencias))
            return res.status(400).json({ success: false, error: "Datos invalidos" });
        try {
            const placeholders = referencias.map((_, i) => `$${i + 1}`).join(',');
            if (action === 'delete') {
                await pool.query(`DELETE FROM reservas WHERE referencia IN (${placeholders})`, referencias);
            }
            else if (action === 'hide') {
                await pool.query(`UPDATE reservas SET estado = 5 WHERE referencia IN (${placeholders})`, referencias);
            }
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/crear-reserva-manual.php", async (req, res) => {
        const { nombre, email, telefono, unidad, fecha_inicio, fecha_fin, plan, total, abono, estado } = req.body;
        try {
            // Check if the specific unit is already taken for these dates
            // Normalize dates to YYYY-MM-DD for stable comparison
            const startOnly = fecha_inicio.substring(0, 10);
            const endOnly = fecha_fin.substring(0, 10);
            const existingBooking = await pool.query(`SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND TO_CHAR(fecha_inicio::timestamp, 'YYYY-MM-DD') < $2 
         AND TO_CHAR(fecha_fin::timestamp, 'YYYY-MM-DD') > $3`, [unidad, endOnly, startOnly]);
            if (existingBooking.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Esta unidad ya se encuentra reservada para las fechas seleccionadas."
                });
            }
            const camping = unidad.split(' ')[0];
            const referencia = `MAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const saldo = Math.max(0, total - abono);
            // Ajustar a zona horaria de Bogotá (UTC-5)
            const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
            const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);
            const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
            const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;
            await pool.query(`INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
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
            ]);
            res.json({ success: true, referencia });
        }
        catch (error) {
            console.error("Manual Reservation Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Customer reservation endpoint with plan block and unit availability validation
    app.post("/api/crear-reserva.php", async (req, res) => {
        const { plan, camping, unidad, fecha_inicio, fecha_fin, adicionales, total, nombre, telefono, email, cedula } = req.body;
        if (!plan || !camping || !unidad || !fecha_inicio || !fecha_fin || !nombre || !telefono || !email) {
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        }
        try {
            // Check if the specific unit is already taken for these dates
            const startOnly = fecha_inicio.substring(0, 10);
            const endOnly = fecha_fin.substring(0, 10);
            const existingBooking = await pool.query(`SELECT id FROM reservas 
         WHERE unidad = $1 AND estado != 3 
         AND TO_CHAR(fecha_inicio::timestamp, 'YYYY-MM-DD') < $2 
         AND TO_CHAR(fecha_fin::timestamp, 'YYYY-MM-DD') > $3`, [unidad, endOnly, startOnly]);
            if (existingBooking.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: "Esta unidad ya se encuentra reservada o bloqueada para las fechas seleccionadas."
                });
            }
            // Check for unit blocks (compare against reservation dates, not current time)
            const ubFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");
            if (fs.existsSync(ubFile)) {
                try {
                    const ub = JSON.parse(fs.readFileSync(ubFile, "utf-8"));
                    const bookingStart = new Date(fecha_inicio.includes('T') ? fecha_inicio : fecha_inicio + 'T12:00:00');
                    const bookingEnd = new Date(fecha_fin.includes('T') ? fecha_fin : fecha_fin + 'T12:00:00');
                    const isUnitDisabled = ub.some((block) => {
                        if (block.unitName !== unidad)
                            return false;
                        if (!block.fechaInicio && !block.fechaFin)
                            return true;
                        const blockStart = block.fechaInicio ? new Date(block.fechaInicio) : new Date(0);
                        const blockEnd = block.fechaFin ? new Date(block.fechaFin) : new Date(9999, 11, 31);
                        return bookingStart <= blockEnd && bookingEnd >= blockStart;
                    });
                    if (isUnitDisabled) {
                        return res.status(400).json({ success: false, error: "Esta unidad se encuentra inhabilitada para las fechas seleccionadas." });
                    }
                }
                catch { }
            }
            // Check for plan blocks
            const planBlocksFile = path.join(process.cwd(), "server", "api", "plan-blocks.json");
            let planBlocks = [];
            if (fs.existsSync(planBlocksFile)) {
                try {
                    planBlocks = JSON.parse(fs.readFileSync(planBlocksFile, "utf-8"));
                }
                catch {
                    planBlocks = [];
                }
            }
            // Map camping name to typeId (dynamic from campings.json)
            let campingTypeMap = { "Aura VIP": 1, "Aura": 1, "Árbol": 2, "Nido": 3 };
            try {
                const campingsData = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
                campingsData.forEach((c) => {
                    const fw = c.name.split(' ')[0];
                    if (fw && !campingTypeMap[fw])
                        campingTypeMap[fw] = c.typeId;
                });
            }
            catch { }
            const typeId = campingTypeMap[camping] || 0;
            // Get planId from dynamic plans
            const plansFile = path.join(process.cwd(), "server", "api", "plans.json");
            let dynamicPlans = [];
            try {
                dynamicPlans = JSON.parse(fs.readFileSync(plansFile, "utf-8"));
            }
            catch {
                dynamicPlans = [];
            }
            const matchedPlan = dynamicPlans.find((p) => p.nombre === plan);
            const planId = matchedPlan?.id || "";
            // Check if this plan+camping+date is blocked
            if (planId && typeId) {
                const bookingStart = new Date(fecha_inicio + 'T12:00:00');
                const bookingEnd = new Date(fecha_fin + 'T12:00:00');
                const isBlocked = planBlocks.some((block) => {
                    if (block.planId !== planId)
                        return false;
                    if (!block.campingIds.includes(typeId))
                        return false;
                    const blockStart = new Date(block.fechaInicio + 'T12:00:00');
                    const blockEnd = new Date(block.fechaFin + 'T12:00:00');
                    return bookingStart <= blockEnd && bookingEnd >= blockStart;
                });
                if (isBlocked) {
                    return res.status(400).json({
                        success: false,
                        error: "Este plan no está disponible para el camping y fechas seleccionadas"
                    });
                }
            }
            const referencia = `ONA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const abono = Math.round(total * 0.5);
            const saldo = total - abono;
            // Ajustar a zona horaria de Bogotá (UTC-5)
            const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
            const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);
            const fechaInicioNorm = fecha_inicio.length === 10 ? fecha_inicio + "T12:00:00" : fecha_inicio;
            const fechaFinNorm = fecha_fin.length === 10 ? fecha_fin + "T12:00:00" : fecha_fin;
            await pool.query(`INSERT INTO reservas (
          plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, adicionales, created_at, cedula
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`, [
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
                1, // PENDIENTE
                referencia,
                adicionales ? JSON.stringify(adicionales) : null,
                createdAt,
                cedula || null
            ]);
            res.json({ success: true, referencia });
        }
        catch (error) {
            console.error("Reservation Error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Middleware to handle .php files
    app.all("/api/*.php", async (req, res) => {
        const relativePath = req.path.replace(/^\/api\//, "");
        const phpFile = path.join(process.cwd(), "server", "api", relativePath);
        if (!fs.existsSync(phpFile)) {
            return res.status(404).json({ error: "PHP file not found" });
        }
        try {
            const body = typeof req.body === 'object' ? JSON.stringify(req.body) : (req.body || "");
            const { stdout } = await execa("php", [phpFile], {
                input: body,
                shell: true,
                env: {
                    REQUEST_METHOD: req.method,
                    CONTENT_TYPE: "application/json",
                    REMOTE_ADDR: req.ip,
                    HTTP_USER_AGENT: req.get('user-agent') || '',
                    COOKIE: req.get('cookie') || '', // IMPORTANTE: Pasar las cookies para mantener la sesión PHP
                }
            });
            try {
                const jsonResponse = JSON.parse(stdout);
                res.json(jsonResponse);
            }
            catch (e) {
                res.send(stdout);
            }
        }
        catch (error) {
            console.error("Execution Error:", error);
            res.status(500).json({ error: "PHP execution failed", details: error.message });
        }
    });
    // Admin route protection middleware
    app.use("/admin", async (req, res, next) => {
        // Avoid redirect loop if already on login page
        if (req.path === "/login" || req.path.includes(".")) {
            return next();
        }
        const phpCheckFile = path.join(process.cwd(), "server", "api", "check-session.php");
        if (!fs.existsSync(phpCheckFile)) {
            // If check-session.php doesn't exist, we can't verify session, but we shouldn't block access
            // until we create it. For now, let's proceed to avoid breaking the UI.
            return next();
        }
        try {
            const { stdout } = await execa("php", [phpCheckFile]);
            const session = JSON.parse(stdout);
            if (!session?.logged_in) {
                return res.redirect("/admin/login");
            }
            next();
        }
        catch (error) {
            next(); // Fallback to next if PHP fails to avoid blocking legitimate access
        }
    });
    app.post("/api/bloquear-fecha", async (req, res) => {
        const { unidad, fecha_inicio, fecha_fin } = req.body;
        if (!unidad || !fecha_inicio || !fecha_fin) {
            return res.json({ success: false, error: "Datos incompletos" });
        }
        try {
            const unidades = [];
            if (unidad === 'all' || unidad === 'Todas las unidades') {
                unidades.push("Aura 1", "Aura 2", "Aura 3", "Aura 4", "Árbol 1", "Nido 1");
            }
            else {
                // Normalizar nombre de unidad si viene solo el nombre del camping
                let normalizedUnidad = unidad;
                if (unidad === "Aura")
                    normalizedUnidad = "Aura 1";
                if (unidad === "Árbol")
                    normalizedUnidad = "Árbol 1";
                if (unidad === "Nido")
                    normalizedUnidad = "Nido 1";
                unidades.push(normalizedUnidad);
            }
            for (const u of unidades) {
                const camping = u.split(' ')[0];
                const referencia = `BLOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
                // Asegurar que las fechas se guarden con el sufijo T12:00:00 si no lo tienen
                const start = fecha_inicio.includes('T') ? fecha_inicio : `${fecha_inicio}T12:00:00`;
                const end = fecha_fin.includes('T') ? fecha_fin : `${fecha_fin}T12:00:00`;
                // Ajustar a zona horaria de Bogotá (UTC-5)
                const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
                const createdAt = bogotaTime.toISOString().replace('T', ' ').substr(0, 19);
                await pool.query(`INSERT INTO reservas (
            plan, camping, unidad, fecha_inicio, fecha_fin, total, abono, saldo, nombre, telefono, email, estado, referencia, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
                    'BLOQUEO ADMIN',
                    camping,
                    u,
                    start,
                    end,
                    0, 0, 0,
                    'ADMINISTRADOR',
                    '0000000000',
                    'admin@onaxperience.com',
                    2, // CONFIRMADO
                    referencia,
                    createdAt
                ]);
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error("Database Error:", error);
            res.json({ success: false, error: error.message });
        }
    });
    app.post("/api/bookings", async (req, res) => {
        try {
            const parsed = insertBookingSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Invalid booking data" });
            }
            const booking = await storage.createBooking(parsed.data);
            res.json(booking);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create booking" });
        }
    });
    // Campings Management
    const campingsFile = path.join(process.cwd(), "server", "api", "campings.json");
    app.get("/api/campings", (req, res) => {
        try {
            if (!fs.existsSync(campingsFile))
                fs.writeFileSync(campingsFile, JSON.stringify([]));
            const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // Serve media files from PostgreSQL (persists across deploys)
    app.get("/api/media/:id", async (req, res) => {
        try {
            const result = await pool.query("SELECT data, mime_type FROM media_files WHERE id = $1", [parseInt(req.params.id)]);
            if (result.rows.length === 0)
                return res.status(404).send("Not found");
            const { data, mime_type } = result.rows[0];
            const base64 = data.includes(",") ? data.split(",")[1] : data;
            const buffer = Buffer.from(base64, "base64");
            res.setHeader("Content-Type", mime_type);
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            res.send(buffer);
        }
        catch (error) {
            res.status(500).send(error.message);
        }
    });
    app.post("/api/upload-camping-image", uploadMedia.single("image"), async (req, res) => {
        try {
            const file = req.file;
            if (!file)
                return res.status(400).json({ success: false, error: "No file uploaded" });
            const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
            const fileBuffer = fs.readFileSync(filePath);
            const base64 = fileBuffer.toString("base64");
            const dataUri = `data:${file.mimetype};base64,${base64}`;
            try {
                fs.unlinkSync(filePath);
            }
            catch { }
            const result = await pool.query("INSERT INTO media_files (data, mime_type, created_at) VALUES ($1, $2, NOW()) RETURNING id", [dataUri, file.mimetype]);
            res.json({ success: true, url: `/api/media/${result.rows[0].id}`, mimeType: file.mimetype });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Generic media upload endpoint for plan banners, hero, etc.
    app.post("/api/upload/media", uploadMedia.single("media"), async (req, res) => {
        try {
            const file = req.file;
            if (!file)
                return res.status(400).json({ success: false, error: "No file uploaded" });
            const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
            const fileBuffer = fs.readFileSync(filePath);
            const base64 = fileBuffer.toString("base64");
            const dataUri = `data:${file.mimetype};base64,${base64}`;
            try {
                fs.unlinkSync(filePath);
            }
            catch { }
            const result = await pool.query("INSERT INTO media_files (data, mime_type, created_at) VALUES ($1, $2, NOW()) RETURNING id", [dataUri, file.mimetype]);
            res.json({ success: true, url: `/api/media/${result.rows[0].id}`, mimeType: file.mimetype });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/upload-addon-media", uploadMedia.array("media", 20), async (req, res) => {
        try {
            const files = req.files;
            if (!files || files.length === 0)
                return res.status(400).json({ success: false, error: "No files uploaded" });
            const results = [];
            for (const file of files) {
                const filePath = path.join(process.cwd(), "public", "uploads", file.filename);
                const fileBuffer = fs.readFileSync(filePath);
                const base64 = fileBuffer.toString("base64");
                const dataUri = `data:${file.mimetype};base64,${base64}`;
                try {
                    fs.unlinkSync(filePath);
                }
                catch { }
                const dbResult = await pool.query("INSERT INTO media_files (data, mime_type, created_at) VALUES ($1, $2, NOW()) RETURNING id", [dataUri, file.mimetype]);
                results.push({
                    url: `/api/media/${dbResult.rows[0].id}`,
                    type: file.mimetype.startsWith("video/") ? "video" : "image"
                });
            }
            res.json({ success: true, media: results });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/campings", (req, res) => {
        try {
            const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
            const maxId = data.reduce((max, c) => Math.max(max, c.id || 0), 0);
            const newCamping = { id: maxId + 1, rating: 5, images: [], videos: [], features: [], ...req.body };
            data.push(newCamping);
            fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
            res.json({ success: true, camping: newCamping });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.put("/api/campings/:id", (req, res) => {
        try {
            const { id } = req.params;
            const updatedCamping = req.body;
            const data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
            const index = data.findIndex((c) => c.id === parseInt(id));
            if (index === -1)
                return res.status(404).json({ success: false, error: "Camping not found" });
            data[index] = { ...data[index], ...updatedCamping };
            fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
            res.json({ success: true, camping: data[index] });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/campings/:id", (req, res) => {
        try {
            const { id } = req.params;
            let data = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
            const initial = data.length;
            data = data.filter((c) => c.id !== parseInt(id));
            if (data.length === initial)
                return res.status(404).json({ success: false, error: "Camping not found" });
            fs.writeFileSync(campingsFile, JSON.stringify(data, null, 2));
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Discount Codes Management
    const discountCodesFile = path.join(process.cwd(), "server", "api", "discount-codes.json");
    if (!fs.existsSync(discountCodesFile))
        fs.writeFileSync(discountCodesFile, JSON.stringify([]));
    app.get("/api/discount-codes", (req, res) => {
        try {
            const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/discount-codes", (req, res) => {
        try {
            const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
            const { codigo } = req.body;
            if (data.some((d) => d.codigo.toUpperCase() === (codigo || "").toUpperCase())) {
                return res.status(400).json({ success: false, error: "Ya existe un código con ese nombre" });
            }
            const newCode = { id: `dc_${Date.now()}`, activo: true, planIds: [], campingTypeIds: [], ...req.body, codigo: (codigo || "").toUpperCase() };
            data.push(newCode);
            fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
            res.json({ success: true, code: newCode });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.put("/api/discount-codes/:id", (req, res) => {
        try {
            const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
            const index = data.findIndex((d) => d.id === req.params.id);
            if (index === -1)
                return res.status(404).json({ success: false, error: "Código no encontrado" });
            data[index] = { ...data[index], ...req.body, codigo: (req.body.codigo || data[index].codigo).toUpperCase() };
            fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
            res.json({ success: true, code: data[index] });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/discount-codes/:id", (req, res) => {
        try {
            let data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
            const initial = data.length;
            data = data.filter((d) => d.id !== req.params.id);
            if (data.length === initial)
                return res.status(404).json({ success: false, error: "Código no encontrado" });
            fs.writeFileSync(discountCodesFile, JSON.stringify(data, null, 2));
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/validate-discount", (req, res) => {
        try {
            const { codigo, planId, campingTypeId } = req.body;
            const data = JSON.parse(fs.readFileSync(discountCodesFile, "utf-8"));
            const plansData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server", "api", "plans.json"), "utf-8"));
            const campingsData = JSON.parse(fs.readFileSync(campingsFile, "utf-8"));
            const found = data.find((d) => d.codigo.toUpperCase() === (codigo || "").toUpperCase());
            if (!found)
                return res.json({ valid: false, mensaje: "Código de descuento no válido." });
            if (!found.activo)
                return res.json({ valid: false, mensaje: "Este código ya no está activo." });
            const planOk = !found.planIds || found.planIds.length === 0 || found.planIds.includes(planId);
            const campingOk = !found.campingTypeIds || found.campingTypeIds.length === 0 || found.campingTypeIds.includes(campingTypeId);
            if (!planOk || !campingOk) {
                const validPlanNames = found.planIds?.length
                    ? found.planIds.map((pid) => plansData.find((p) => p.id === pid)?.nombre || pid).join(", ")
                    : "todos los planes";
                const validCampingNames = found.campingTypeIds?.length
                    ? [...new Set(campingsData.filter((c) => found.campingTypeIds.includes(c.typeId)).map((c) => c.name.split(' ')[0]))].join(", ")
                    : "todos los campings";
                return res.json({
                    valid: false,
                    mensaje: `Este código es válido para: ${validPlanNames}${found.campingTypeIds?.length ? ` en ${validCampingNames}` : ""}.`
                });
            }
            res.json({ valid: true, descuento: { tipo: found.tipo, valor: found.valor, codigo: found.codigo } });
        }
        catch (error) {
            res.status(500).json({ valid: false, mensaje: error.message });
        }
    });
    // Addons Management
    const addonsFile = path.join(process.cwd(), "server", "api", "addons.json");
    app.get("/api/addons", (req, res) => {
        try {
            if (!fs.existsSync(addonsFile))
                fs.writeFileSync(addonsFile, JSON.stringify([]));
            const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/addons", (req, res) => {
        try {
            const newAddon = { ...req.body, id: `addon_${Date.now()}` };
            const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
            data.push(newAddon);
            fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
            res.json({ success: true, addon: newAddon });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.put("/api/addons/:id", (req, res) => {
        try {
            const { id } = req.params;
            const updatedAddon = req.body;
            const data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
            const index = data.findIndex((a) => a.id === id);
            if (index === -1)
                return res.status(404).json({ success: false, error: "Addon not found" });
            data[index] = { ...data[index], ...updatedAddon };
            fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
            res.json({ success: true, addon: data[index] });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/addons/:id", (req, res) => {
        try {
            const { id } = req.params;
            let data = JSON.parse(fs.readFileSync(addonsFile, "utf-8"));
            data = data.filter((a) => a.id !== id);
            fs.writeFileSync(addonsFile, JSON.stringify(data, null, 2));
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Settings (hero media, etc.)
    const settingsFile = path.join(process.cwd(), "server", "api", "settings.json");
    app.get("/api/settings", (req, res) => {
        try {
            if (!fs.existsSync(settingsFile))
                fs.writeFileSync(settingsFile, JSON.stringify({ heroMedia: { type: "image", url: "" } }));
            res.json(JSON.parse(fs.readFileSync(settingsFile, "utf-8")));
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.put("/api/settings", (req, res) => {
        try {
            const current = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, "utf-8")) : {};
            const updated = { ...current, ...req.body };
            fs.writeFileSync(settingsFile, JSON.stringify(updated, null, 2));
            res.json({ success: true, settings: updated });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Tarifas por día
    const tarifasFile = path.join(process.cwd(), "server", "api", "tarifas.json");
    const defaultTarifas = { entreSemana: 0, viernesODomingo: 0, sabadoFestivo: 0, diasFestivos: [], fechasEspeciales: [] };
    app.get("/api/tarifas", (req, res) => {
        try {
            if (!fs.existsSync(tarifasFile))
                fs.writeFileSync(tarifasFile, JSON.stringify(defaultTarifas));
            res.json(JSON.parse(fs.readFileSync(tarifasFile, "utf-8")));
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.put("/api/tarifas", (req, res) => {
        try {
            fs.writeFileSync(tarifasFile, JSON.stringify(req.body, null, 2));
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.post("/api/confirmar-pago", upload.single("receipt"), async (req, res) => {
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
                return res.status(400).json({ success: false, error: "Monto inválido" });
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
                return res.status(400).json({ success: false, error: "Esta reserva ya está cancelada o completada" });
            }
            const receiptPath = `/uploads/${file.filename}`;
            const result = await pool.query(`UPDATE reservas SET estado = 2, abono = $1, saldo = total - $2, comprobante = $3 WHERE referencia = $4`, [totalAmount, totalAmount, receiptPath, referencia]);
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: "No se pudo actualizar la reserva" });
            }
            res.json({ success: true, message: "Pago confirmado correctamente", receiptPath });
        }
        catch (error) {
            console.error("Error confirming payment:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ============ Plan Blocks API ============
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
        }
        catch {
            return [];
        }
    };
    const writePlanBlocks = (blocks) => {
        fs.writeFileSync(planBlocksFile, JSON.stringify(blocks, null, 2));
    };
    app.get("/api/plan-blocks", (req, res) => {
        try {
            const blocks = readPlanBlocks();
            res.json(blocks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/plan-blocks", (req, res) => {
        try {
            const { planId, campingIds, fechaInicio, fechaFin } = req.body;
            if (!planId || !campingIds || !fechaInicio || !fechaFin) {
                return res.status(400).json({ success: false, error: "Datos incompletos" });
            }
            // Normalizar fechas para consistencia
            const normalizedStart = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T12:00:00`;
            const normalizedEnd = fechaFin.includes('T') ? fechaFin : `${fechaFin}T12:00:00`;
            if (!Array.isArray(campingIds) || campingIds.length === 0) {
                return res.status(400).json({ success: false, error: "Debe seleccionar al menos un camping" });
            }
            const startDate = new Date(normalizedStart);
            const endDate = new Date(normalizedEnd);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate < today) {
                return res.status(400).json({ success: false, error: "No se permiten fechas pasadas" });
            }
            if (endDate < startDate) {
                return res.status(400).json({ success: false, error: "La fecha fin no puede ser menor que la fecha inicio" });
            }
            const blocks = readPlanBlocks();
            // Check for duplicate
            const isDuplicate = blocks.some((block) => block.planId === planId &&
                JSON.stringify(block.campingIds.sort()) === JSON.stringify(campingIds.sort()) &&
                block.fechaInicio === normalizedStart &&
                block.fechaFin === normalizedEnd);
            if (isDuplicate) {
                return res.status(400).json({ success: false, error: "Ya existe un bloqueo idéntico" });
            }
            const newBlock = {
                id: Date.now().toString(),
                planId,
                campingIds,
                fechaInicio: normalizedStart,
                fechaFin: normalizedEnd,
                createdAt: new Date().toISOString()
            };
            blocks.push(newBlock);
            writePlanBlocks(blocks);
            res.json({ success: true, block: newBlock });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/plan-blocks/:id", (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ============ Unit Blocks API ============
    const unitBlocksFile = path.join(process.cwd(), "server", "api", "unit-blocks.json");
    const readUnitBlocks = () => {
        try {
            if (!fs.existsSync(unitBlocksFile)) {
                fs.writeFileSync(unitBlocksFile, JSON.stringify([], null, 2));
            }
            return JSON.parse(fs.readFileSync(unitBlocksFile, "utf-8"));
        }
        catch {
            return [];
        }
    };
    const writeUnitBlocks = (blocks) => {
        fs.writeFileSync(unitBlocksFile, JSON.stringify(blocks, null, 2));
    };
    app.get("/api/unit-blocks", (req, res) => {
        try {
            const blocks = readUnitBlocks();
            res.json(blocks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/unit-blocks", (req, res) => {
        try {
            const { unitName, motivo, fechaInicio, fechaFin } = req.body;
            if (!unitName) {
                return res.status(400).json({ success: false, error: "Falta la unidad" });
            }
            const normalizedStart = fechaInicio ? (fechaInicio.length === 10 ? fechaInicio + "T12:00:00" : fechaInicio) : null;
            const normalizedEnd = fechaFin ? (fechaFin.length === 10 ? fechaFin + "T12:00:00" : fechaFin) : null;
            if (normalizedStart && normalizedEnd && new Date(normalizedStart) > new Date(normalizedEnd)) {
                return res.status(400).json({ success: false, error: "La fecha de inicio debe ser anterior a la fecha de fin" });
            }
            const blocks = readUnitBlocks();
            const isDuplicate = blocks.some((b) => b.unitName === unitName &&
                b.fechaInicio === normalizedStart &&
                b.fechaFin === normalizedEnd);
            if (isDuplicate) {
                return res.status(400).json({ success: false, error: "Ya existe un bloqueo igual" });
            }
            const bogotaTime = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/unit-blocks/:id", (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // ============ Dynamic Plans API ============
    const plansFile = path.join(process.cwd(), "server", "api", "plans.json");
    const readPlans = () => {
        try {
            if (!fs.existsSync(plansFile)) {
                return [];
            }
            return JSON.parse(fs.readFileSync(plansFile, "utf-8"));
        }
        catch {
            return [];
        }
    };
    const writePlans = (plans) => {
        fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2));
    };
    app.get("/api/plans", (req, res) => {
        try {
            const plans = readPlans();
            res.json(plans);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.get("/api/plans/active", (req, res) => {
        try {
            const plans = readPlans();
            const today = new Date();
            today.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
            const activePlans = plans.filter((plan) => {
                if (!plan.estado)
                    return false;
                if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
                    const start = new Date(plan.fechaInicio + 'T12:00:00');
                    const end = new Date(plan.fechaFin + 'T12:00:00');
                    if (today < start || today > end)
                        return false;
                }
                return true;
            });
            res.json(activePlans);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    app.post("/api/plans", (req, res) => {
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
                // Asegurar formato T12:00:00 para consistencia
                const normalizedStart = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T12:00:00`;
                const normalizedEnd = fechaFin.includes('T') ? fechaFin : `${fechaFin}T12:00:00`;
                const start = new Date(normalizedStart);
                const end = new Date(normalizedEnd);
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 62) {
                    return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar más de 2 meses" });
                }
                if (end < start) {
                    return res.status(400).json({ success: false, error: "La fecha fin no puede ser anterior a la fecha inicio" });
                }
            }
            const plans = readPlans();
            const newId = nombre.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, "");
            const existingById = plans.find((p) => p.id === newId);
            if (existingById) {
                return res.status(400).json({ success: false, error: "Ya existe un plan con ese nombre" });
            }
            if (desactivarOtros) {
                plans.forEach((p) => { p.estado = false; });
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
                createdAt: new Date().toISOString()
            };
            plans.push(newPlan);
            writePlans(plans);
            res.json({ success: true, plan: newPlan });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.put("/api/plans/:id", (req, res) => {
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
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 62) {
                    return res.status(400).json({ success: false, error: "Los planes de temporada no pueden durar más de 2 meses" });
                }
            }
            if (desactivarOtros && estado !== false) {
                plans.forEach((p, idx) => {
                    if (idx !== planIndex)
                        p.estado = false;
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
                fechaInicio: tipo === "temporada" ? (fechaInicio ?? plans[planIndex].fechaInicio) : null,
                fechaFin: tipo === "temporada" ? (fechaFin ?? plans[planIndex].fechaFin) : null,
                precios: precios ?? plans[planIndex].precios,
                incluye: incluye ?? plans[planIndex].incluye,
                bannerImage: bannerImage !== undefined ? bannerImage : (plans[planIndex].bannerImage || null),
                updatedAt: new Date().toISOString()
            };
            plans[planIndex] = updatedPlan;
            writePlans(plans);
            res.json({ success: true, plan: updatedPlan });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.patch("/api/plans/:id/toggle", (req, res) => {
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
                    if (idx !== planIndex)
                        p.estado = false;
                });
            }
            plans[planIndex].estado = newState;
            writePlans(plans);
            res.json({ success: true, plan: plans[planIndex] });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    app.delete("/api/plans/:id", (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    return httpServer;
}
