import { MapPin, Instagram, Phone, Mail } from "lucide-react";
import logo from "@assets/image_1767376411038.png";

export function Footer() {
  return (
    <footer id="footer" className="bg-[#1A1A1A] text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div className="text-center md:text-left">
            <img 
              src={logo} 
              alt="Oná Xperience" 
              className="h-24 w-24 object-cover rounded-full mx-auto md:mx-0 mb-6 border-2 border-accent/20"
            />
            <p className="text-gray-400 max-w-sm mx-auto md:mx-0">
              Un espacio sagrado en la naturaleza para reconectar, descansar y celebrar la vida.
            </p>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl mb-6">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-accent" />
                <span>San Antonio Del Tequendama, Cundinamarca</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-accent" />
                <span>+57 319 249 7753</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-accent" />
                <span>reservas@onaxperience.com</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-2xl mb-6">Síguenos</h3>
            <a 
              href="https://instagram.com/ona_xperience" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-accent transition-colors text-lg"
            >
              <Instagram className="w-6 h-6" />
              <span>@ona_xperience</span>
            </a>
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-2">Horario de Atención</p>
              <p className="text-gray-300">Lunes a Domingo: 8:00 AM - 8:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500 space-y-2">
          <p>&copy; {new Date().getFullYear()} Oná Xperience. Todos los derechos reservados.</p>
          <p>
            Diseñado y desarrollado por{" "}
            <a 
              href="https://www.instagram.com/eber_vrg/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline transition-all font-medium"
            >
              Eber Vargas
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
