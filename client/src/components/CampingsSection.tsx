import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampingDetailsDialog } from "./CampingDetailsDialog";
import { campings as staticCampings, pricingMatrix, getActiveSeason } from "@/lib/data";
import { Star, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Lock } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function ImageCarousel({ images, name, campingId }: { images: string[], name: string, campingId: number }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative h-64 overflow-hidden group/carousel" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((src, index) => (
          <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
            <img 
              src={src} 
              alt={`${name} - ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
      
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
            ))}
          </div>
        </>
      )}
      
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold text-primary z-10">
        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        5.0
      </div>
    </div>
  );
}

export function CampingsSection() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [ocupacion, setOcupacion] = useState<Record<number, {from: Date, to: Date}[]>>({});
  const [unitBlocks, setUnitBlocks] = useState<{id: string; unitName: string; motivo: string; fechaInicio: string | null; fechaFin: string | null}[]>([]);
  const [campings, setCampings] = useState<any[]>(staticCampings);

  useEffect(() => {
    fetch("/api/campings")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setCampings(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/unit-blocks")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUnitBlocks(data); })
      .catch(() => {});
  }, []);

  const isUnitBlocked = useCallback((unitName: string, date: Date | undefined) => {
    return unitBlocks.some(block => {
      if (block.unitName !== unitName) return false;
      if (!block.fechaInicio && !block.fechaFin) return true;
      const blockStart = block.fechaInicio ? new Date(block.fechaInicio.includes('T') ? block.fechaInicio : block.fechaInicio + 'T12:00:00') : new Date(0);
      const blockEnd = block.fechaFin ? new Date(block.fechaFin.includes('T') ? block.fechaFin : block.fechaFin + 'T12:00:00') : new Date(9999, 11, 31);
      if (date) {
        const checkDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
        return checkDate >= blockStart && checkDate <= blockEnd;
      }
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now >= blockStart && now <= blockEnd;
    });
  }, [unitBlocks]);

  const getUnitBlockMotivo = useCallback((unitName: string) => {
    const block = unitBlocks.find(b => {
      if (b.unitName !== unitName) return false;
      if (!b.fechaInicio && !b.fechaFin) return true;
      const blockStart = b.fechaInicio ? new Date(b.fechaInicio.includes('T') ? b.fechaInicio : b.fechaInicio + 'T12:00:00') : new Date(0);
      const blockEnd = b.fechaFin ? new Date(b.fechaFin.includes('T') ? b.fechaFin : b.fechaFin + 'T12:00:00') : new Date(9999, 11, 31);
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now >= blockStart && now <= blockEnd;
    });
    return block?.motivo || "Inhabilitada";
  }, [unitBlocks]);

  useEffect(() => {
    Promise.all(campings.map(c => 
      fetch(`/api/get-ocupacion.php?unidadId=${c.id}`)
        .then(res => res.json())
        .then(data => ({ id: c.id, data }))
    )).then(results => {
      const newOcupacion: Record<number, {from: Date, to: Date, unidad: string}[]> = {};
      results.forEach(({ id, data }) => {
        if (Array.isArray(data)) {
          newOcupacion[id] = data.map((b: any) => {
            // Normalizar fechas eliminando cualquier componente de tiempo
            const fromStr = b.fecha_inicio.includes('T') ? b.fecha_inicio.split('T')[0] : b.fecha_inicio;
            const toStr = b.fecha_fin.includes('T') ? b.fecha_fin.split('T')[0] : b.fecha_fin;
            
            // Usar Date.UTC para asegurar consistencia total e independencia de la zona horaria del navegador
            const [y1, m1, d1] = fromStr.split('-').map(Number);
            const [y2, m2, d2] = toStr.split('-').map(Number);

            return {
              from: new Date(Date.UTC(y1, m1 - 1, d1, 12, 0, 0)),
              to: new Date(Date.UTC(y2, m2 - 1, d2, 12, 0, 0)),
              unidad: b.unidad || ""
            };
          });
        }
      });
      setOcupacion(newOcupacion as any);
    });
  }, []);

  const isUnitAvailable = useCallback((campingObj: any, date: Date | undefined) => {
    if (!date) return true;
    
    const unitName = campingObj.name; 
    const allBookingsForType = (ocupacion as any)[campingObj.id] || [];
    
    // Normalizar la fecha seleccionada usando UTC para comparar contra las fechas UTC de la base de datos
    const checkDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));

    const isOccupied = allBookingsForType.some((booking: any) => {
      // Regla de Oro: Solo bloquear si la unidad coincide EXACTAMENTE
      if (booking.unidad && booking.unidad !== unitName) {
        return false;
      }

      // Comparación robusta usando timestamps UTC
      const checkTime = checkDate.getTime();
      const fromTime = booking.from.getTime();
      const toTime = booking.to.getTime();
      
      return checkTime >= fromTime && checkTime < toTime;
    });

    return !isOccupied;
  }, [ocupacion]);

  const availableCampings = useMemo(() => {
    return campings.filter(c => {
      if (isUnitBlocked(c.name, selectedDate)) return true;
      return isUnitAvailable(c, selectedDate);
    });
  }, [selectedDate, isUnitAvailable, isUnitBlocked]);

  return (
    <section id="campings" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Nuestros Espacios</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-4 mb-6">Escoge tu loving</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Cada uno de nuestros espacios está diseñado para ofrecerte una experiencia única de conexión con la naturaleza sin sacrificar comodidad.
          </p>

          <div className="max-w-md mx-auto mb-16 p-6 bg-white rounded-[2rem] shadow-xl shadow-stone-100 border border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4 text-accent" /> Verifica Disponibilidad
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-14 justify-start text-left font-normal border-stone-100 bg-stone-50/50 rounded-2xl hover:bg-white hover:border-accent transition-all",
                    !selectedDate && "text-stone-400"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-accent" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM", { locale: es })
                  ) : (
                    <span>¿Cuándo nos quieres visitar?</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none" align="center">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const minLeadTime = new Date(today);
                    minLeadTime.setDate(today.getDate() + 2);
                    return date < minLeadTime;
                  }}
                  locale={es}
                  className="p-4"
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <p className="text-[10px] text-accent mt-3 font-medium uppercase tracking-wider animate-pulse">
                Mostrando {availableCampings.length} unidades disponibles
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {availableCampings.map((camping, index) => (
              <motion.div
                key={camping.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const blocked = isUnitBlocked(camping.name, selectedDate);
                  return (
                    <Card className={cn(
                      "border-none shadow-lg overflow-hidden group h-full flex flex-col bg-card transition-all duration-500",
                      blocked ? "opacity-75 ring-2 ring-red-300" : "hover:shadow-2xl"
                    )}>
                      <div className="relative">
                        <ImageCarousel images={camping.images} name={camping.name} campingId={camping.id} />
                        {blocked && (
                          <div className="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center z-20">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2 shadow-lg">
                              <Lock className="w-7 h-7 text-red-500" />
                              <span className="text-red-600 font-bold text-sm uppercase tracking-wider">Inhabilitada</span>
                              <span className="text-red-500/80 text-xs text-center max-w-[200px]">{getUnitBlockMotivo(camping.name)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-2xl font-serif font-medium">{camping.name}</h3>
                          {blocked && (
                            <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">
                              <Lock className="w-3 h-3 mr-1" /> No disponible
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {camping.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="secondary" className="bg-secondary/50 hover:bg-secondary font-normal text-secondary-foreground text-[10px] uppercase tracking-wider">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex items-center justify-between border-t border-border pt-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {blocked ? "Unidad no disponible" : "Reserva tu experiencia"}
                          </span>
                        </div>
                        {!blocked ? (
                          <CampingDetailsDialog camping={camping} range={{ from: selectedDate, to: selectedDate ? new Date(selectedDate.getTime() + 86400000) : undefined }}>
                            <Button variant="outline" className="text-xs uppercase tracking-widest font-bold border-accent text-accent hover:bg-accent hover:text-white transition-colors">
                              Ver Detalles
                            </Button>
                          </CampingDetailsDialog>
                        ) : (
                          <Button variant="outline" disabled className="text-xs uppercase tracking-widest font-bold border-red-200 text-red-400 cursor-not-allowed">
                            No Disponible
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })()}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {availableCampings.length === 0 && selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-stone-50 rounded-[3rem] border border-dashed border-stone-200"
          >
            <Info className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-stone-500">No hay unidades disponibles</h3>
            <p className="text-stone-400">Prueba con otras fechas para encontrar tu refugio ideal.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
