import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import logo from "@assets/image_1767376411038.png";
import heroBgDefault from "@assets/image_1768327290624.png";

export function Hero() {
  const [, setLocation] = useLocation();
  const [heroMedia, setHeroMedia] = useState<{ type: string; url: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { if (d.heroMedia?.url) setHeroMedia(d.heroMedia); })
      .catch(() => {});
  }, []);

  const bgUrl = heroMedia?.url || heroBgDefault;
  const isVideo = heroMedia?.type === "video" && !!heroMedia?.url;

  return (
    <section id="home" className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {isVideo ? (
        <video
          key={bgUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={bgUrl}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <img
            src={logo}
            alt="Oná Xperience"
            className="h-32 md:h-40 w-32 md:w-40 object-cover rounded-full border-4 border-white/20 shadow-2xl mx-auto"
          />
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-serif italic font-light mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          ONÁ es más que un lugar.
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl font-sans max-w-2xl mb-10 text-white/90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Es un hogar creado por una familia que, en medio de un momento difícil, decidió no rendirse y transformar su historia en experiencias para parejas que quieren reconectar, volver a elegirse y vivir todo desde el amor.
        </motion.p>

        <motion.button
          onClick={() => {
            const section = document.getElementById('campings');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }}
          className="group relative px-8 py-3 bg-transparent border border-white text-white rounded-full overflow-hidden transition-all hover:bg-white hover:text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <span className="relative z-10 font-medium tracking-wide uppercase">Escoge tu loving</span>
        </motion.button>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white to-transparent" />
      </motion.div>
    </section>
  );
}
