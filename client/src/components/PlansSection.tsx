import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Heart, Film, Star, Sun, Moon, TreePine, Mountain, Flame, Gift, Tag, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Film: <Film className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Sun: <Sun className="w-6 h-6" />,
  Moon: <Moon className="w-6 h-6" />,
  TreePine: <TreePine className="w-6 h-6" />,
  Mountain: <Mountain className="w-6 h-6" />,
  Flame: <Flame className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Tag: <Tag className="w-6 h-6" />,
};

export function PlansSection() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const { data: plans = [] } = useQuery<any[]>({
    queryKey: ["/api/plans/active"],
  });

  return (
    <section id="planes" className="py-24 bg-stone-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Experiencias Todo Incluido</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-4 mb-6">Nuestros Planes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hemos diseñado experiencias completas para que no tengas que preocuparte por nada. Solo llega y disfruta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              {plan.bannerImage ? (
                /* ── IMAGE MODE ── */
                <div
                  className="h-full relative rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300 flex flex-col min-h-[420px] cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <img
                    src={plan.bannerImage}
                    alt={plan.nombre}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {plan.preventa && (
                    <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 animate-pulse">
                      PREVENTA
                    </div>
                  )}

                  <div className="relative z-10 mt-auto p-5">
                    <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-2 text-center">
                      Toca para ver detalles
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLocation(`/reservar?planId=${plan.id}`); }}
                      className="w-full py-3 text-sm font-bold uppercase tracking-widest rounded-xl transition-all"
                      style={{ backgroundColor: plan.color || '#8B5A2B', color: '#fff' }}
                    >
                      Reservar este Plan
                    </button>
                  </div>
                </div>
              ) : (
                /* ── NORMAL MODE ── */
                <Card className="h-full border-none shadow-md bg-card flex flex-col relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div
                    className="absolute top-0 left-0 w-full h-2"
                    style={{ backgroundColor: plan.color || '#8B5A2B' }}
                  />

                  {plan.preventa && (
                    <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 animate-pulse">
                      PREVENTA
                    </div>
                  )}

                  <CardHeader className="text-center pb-2 pt-10">
                    <div
                      className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                      style={{ color: plan.color || '#8B5A2B' }}
                    >
                      {iconMap[plan.icono] || <Sparkles className="w-6 h-6" />}
                    </div>
                    <CardTitle className="font-serif text-2xl">{plan.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground italic mt-2">{plan.eslogan}</p>
                  </CardHeader>

                  <CardContent className="flex-grow pt-4">
                    <div className="space-y-3">
                      {plan.incluye?.slice(0, 8).map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                          <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.incluye?.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center mt-2 italic">Y más detalles exclusivos...</p>
                      )}
                    </div>
                  </CardContent>

                  <div className="p-6 mt-auto">
                    <button
                      onClick={() => setLocation(`/reservar?planId=${plan.id}`)}
                      className="w-full py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-medium tracking-wide uppercase text-sm cursor-pointer"
                    >
                      Reservar este Plan
                    </button>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal para plan en modo imagen */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) setSelectedPlan(null); }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none bg-transparent shadow-2xl">
          {selectedPlan && (
            <div className="relative">
              {/* Imagen a pantalla completa */}
              <img
                src={selectedPlan.bannerImage}
                alt={selectedPlan.nombre}
                className="w-full max-h-[75vh] object-cover"
              />

              {/* Gradiente inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badge preventa */}
              {selectedPlan.preventa && (
                <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                  PREVENTA
                </div>
              )}

              {/* Contenido inferior */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-white font-serif text-2xl font-bold mb-1">{selectedPlan.nombre}</h2>
                <p className="text-white/75 text-sm italic mb-4">{selectedPlan.eslogan}</p>

                {selectedPlan.incluye?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {selectedPlan.incluye.slice(0, 5).map((item: string, i: number) => (
                      <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 shrink-0" /> {item}
                      </span>
                    ))}
                    {selectedPlan.incluye.length > 5 && (
                      <span className="text-white/60 text-xs self-center">+{selectedPlan.incluye.length - 5} más incluidos</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setSelectedPlan(null); setLocation(`/reservar?planId=${selectedPlan.id}`); }}
                  className="w-full py-3.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: selectedPlan.color || '#8B5A2B', color: '#fff' }}
                >
                  Seleccionar este Plan
                </button>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
