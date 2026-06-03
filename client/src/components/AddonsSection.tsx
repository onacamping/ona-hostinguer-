import { motion } from "framer-motion";
import { Flower2, Stars, Moon, Utensils, Film, Sparkles, Heart, Play, ImageIcon } from "lucide-react";
import { addons as staticAddons } from "@/lib/data";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const addonIcons: Record<string, React.ReactNode> = {
  dec_basica: <Flower2 className="w-8 h-8 text-accent" />,
  dec_premium: <Stars className="w-8 h-8 text-accent" />,
  plan_3_dias_aura: <Moon className="w-8 h-8 text-accent" />,
  plan_3_dias_arbol: <Moon className="w-8 h-8 text-accent" />,
  plan_3_dias_nido: <Moon className="w-8 h-8 text-accent" />,
  cena_romantica: <Heart className="w-8 h-8 text-accent" />,
  almuerzos: <Utensils className="w-8 h-8 text-accent" />,
  cine_palomitas: <Film className="w-8 h-8 text-accent" />,
  cine_cena: <Sparkles className="w-8 h-8 text-accent" />,
};

type MediaItem = { url: string; type: "image" | "video" };
type Addon = {
  id: string;
  title: string;
  price: number;
  description: string;
  details?: string[];
  media?: MediaItem[];
};

export function AddonsSection() {
  const [addons, setAddons] = useState<Addon[]>(staticAddons as Addon[]);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    fetch("/api/addons")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setAddons(data); })
      .catch(() => {});
  }, []);

  const openMedia = (addon: Addon) => {
    if (!addon.media || addon.media.length === 0) return;
    setMediaIndex(0);
    setSelectedAddon(addon);
  };

  return (
    <section className="py-20 bg-background border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Complementa tu estadía</span>
          <h2 className="text-3xl md:text-4xl font-serif mt-2">Adicionales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {addons.map((addon, index) => {
            const hasMedia = addon.media && addon.media.length > 0;
            const firstMedia = addon.media?.[0];
            return (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="flex flex-col rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden"
              >
                {hasMedia && firstMedia && (
                  <div
                    className="relative w-full h-44 cursor-pointer group overflow-hidden"
                    onClick={() => openMedia(addon)}
                  >
                    {firstMedia.type === "video" ? (
                      <video
                        src={firstMedia.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={firstMedia.url}
                        alt={addon.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        {firstMedia.type === "video" ? (
                          <Play className="w-4 h-4 text-primary ml-0.5" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                    {addon.media!.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                        +{addon.media!.length - 1} más
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col items-center text-center p-6">
                  {!hasMedia && (
                    <div className="mb-4 bg-background p-4 rounded-full shadow-sm">
                      {addonIcons[addon.id] ?? <Sparkles className="w-8 h-8 text-accent" />}
                    </div>
                  )}
                  <h3 className="text-xl font-serif font-medium mb-1">{addon.title}</h3>
                  <p className="text-accent font-bold mb-3">${addon.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                  {hasMedia && (
                    <button
                      onClick={() => openMedia(addon)}
                      className="mt-3 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
                    >
                      Ver fotos y videos →
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedAddon} onOpenChange={open => { if (!open) setSelectedAddon(null); }}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl bg-black border-none">
          {selectedAddon?.media && selectedAddon.media.length > 0 && (
            <div className="relative">
              <div className="aspect-video w-full bg-black flex items-center justify-center">
                {selectedAddon.media[mediaIndex].type === "video" ? (
                  <video
                    key={selectedAddon.media[mediaIndex].url}
                    src={selectedAddon.media[mediaIndex].url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    src={selectedAddon.media[mediaIndex].url}
                    alt={selectedAddon.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {selectedAddon.media.length > 1 && (
                <>
                  <button
                    onClick={() => setMediaIndex(i => (i - 1 + selectedAddon.media!.length) % selectedAddon.media!.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
                  >‹</button>
                  <button
                    onClick={() => setMediaIndex(i => (i + 1) % selectedAddon.media!.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors text-lg"
                  >›</button>
                  <div className="flex gap-1 justify-center absolute bottom-3 left-0 right-0">
                    {selectedAddon.media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === mediaIndex ? "bg-white" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="p-5 bg-white">
            <h3 className="font-serif text-xl font-semibold">{selectedAddon?.title}</h3>
            <p className="text-sm text-stone-500 mt-1">{selectedAddon?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
