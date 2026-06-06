import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
});
export const bookings = pgTable("bookings", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    campingId: varchar("camping_id").notNull(),
    planId: text("plan_id").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    totalPrice: text("total_price").notNull(),
    addons: text("addons").array(),
});
// Esquemas de inserción (Zod)
export const insertUserSchema = createInsertSchema(users);
export const insertBookingSchema = createInsertSchema(bookings);
