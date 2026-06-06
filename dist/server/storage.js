import { randomUUID } from "crypto";
export class MemStorage {
    users;
    bookings;
    campings;
    constructor() {
        this.users = new Map();
        this.bookings = new Map();
        this.campings = [
            {
                id: 1,
                typeId: 1,
                name: "Aura 1",
                images: ["/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg"],
                image: "/assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg",
                description: "Unidad Aura 1: Privacidad total con jacuzzi privado y vista al cañón.",
                features: ["Jacuzzi VIP", "Cine Privado", "Cena Especial", "Vista Premium", "Malla Catamarán", "Zona BBQ"],
                rating: 5.0
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
        return Array.from(this.users.values()).find((user) => user.username === username);
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
}
export const storage = new MemStorage();
