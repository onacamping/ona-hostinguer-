import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Moon,
  Clock,
  CreditCard,
  ChevronLeft,
  User,
  IdCard,
  Phone,
  LayoutGrid,
  Sparkles,
  Info,
  Tent,
  Mail,
  Upload,
  Download,
  MessageCircle,
  QrCode,
  Building2,
  Copy,
  Check,
  Maximize2,
  X,
  EyeOff,
  Heart,
  Film,
  Star,
  Sun,
  TreePine,
  Mountain,
  Flame,
  Gift,
  Tag,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { campings as staticCampings, addons as staticAddons, getActiveSeason } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [step, setStep] = useState(() => {
    // Si viene con campingId, lo pre-seleccionamos pero empezamos en el paso 1 (Elegir Plan)
    return 1;
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    searchParams.get("planId") || null,
  );
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(() => {
    const typeId = searchParams.get("typeId");
    if (typeId) return parseInt(typeId);
    const campingId = searchParams.get("campingId");
    if (campingId) {
      const camping = staticCampings.find((c) => c.id === parseInt(campingId));
      return camping ? camping.typeId : null;
    }
    return null;
  });
  const [campings, setCampings] = useState<any[]>(staticCampings);
  const [dynamicAddons, setDynamicAddons] = useState<any[]>(staticAddons);
  const [tarifas, setTarifas] = useState<any>(null);

  useEffect(() => {
    fetch("/api/campings")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setCampings(data); })
      .catch(() => {});
    fetch("/api/addons")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setDynamicAddons(data); })
      .catch(() => {});
    fetch("/api/tarifas")
      .then((r) => r.json())
      .then((d) => setTarifas(d))
      .catch(() => {});
  }, []);
  const [selectedCampingId, setSelectedCampingId] = useState<number | null>(
    () => {
      const id = searchParams.get("campingId");
      return id ? parseInt(id) : null;
    },
  );
  const [range, setRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => {
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    return {
      from: fromStr ? new Date(parseInt(fromStr)) : undefined,
      to: toStr ? new Date(parseInt(toStr)) : undefined,
    };
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [arrivalTime, setArrivalTime] = useState("3:00 PM");
  const [showPolicies, setShowPolicies] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [isBooking, setIsBooking] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [whatsappRedirectUrl, setWhatsappRedirectUrl] = useState<string | null>(
    null,
  );
  const [confirmedBookings, setConfirmedBookings] = useState<
    { from: Date; to: Date }[]
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "transfer">("qr");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);
  const canvasRef = useState<HTMLCanvasElement | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; tipo?: string; valor?: number; mensaje?: string } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [planBlocks, setPlanBlocks] = useState<
    Array<{
      id: string;
      planId: string;
      campingIds: number[];
      fechaInicio: string;
      fechaFin: string;
    }>
  >([]);

  type DynamicPlan = {
    id: string;
    nombre: string;
    eslogan: string;
    descripcion: string;
    tipo: "normal" | "temporada" | "preventa";
    icono: string;
    color: string;
    estado: boolean;
    preventa: boolean;
    fechaInicio: string | null;
    fechaFin: string | null;
    precios: Record<string, number>;
    incluye: string[];
  };

  const [dynamicPlans, setDynamicPlans] = useState<DynamicPlan[]>([]);

  type UnitBlock = {
    id: string;
    unitName: string;
    motivo: string;
    fechaInicio: string | null;
    fechaFin: string | null;
  };
  const [unitBlocks, setUnitBlocks] = useState<UnitBlock[]>([]);

  const isUnitBlocked = (unitName: string) => {
    return unitBlocks.some((block) => {
      if (block.unitName !== unitName) return false;
      if (!block.fechaInicio && !block.fechaFin) return true;
      const blockStart = block.fechaInicio
        ? new Date(
            block.fechaInicio.includes("T")
              ? block.fechaInicio
              : block.fechaInicio + "T12:00:00",
          )
        : new Date(0);
      const blockEnd = block.fechaFin
        ? new Date(
            block.fechaFin.includes("T")
              ? block.fechaFin
              : block.fechaFin + "T12:00:00",
          )
        : new Date(9999, 11, 31);
      if (range.from && range.to) {
        return range.from <= blockEnd && range.to >= blockStart;
      }
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now >= blockStart && now <= blockEnd;
    });
  };

  const getUnitBlockMotivo = (unitName: string) => {
    const block = unitBlocks.find((b) => {
      if (b.unitName !== unitName) return false;
      if (!b.fechaInicio && !b.fechaFin) return true;
      const blockStart = b.fechaInicio
        ? new Date(
            b.fechaInicio.includes("T")
              ? b.fechaInicio
              : b.fechaInicio + "T12:00:00",
          )
        : new Date(0);
      const blockEnd = b.fechaFin
        ? new Date(
            b.fechaFin.includes("T") ? b.fechaFin : b.fechaFin + "T12:00:00",
          )
        : new Date(9999, 11, 31);
      if (range.from && range.to) {
        return range.from <= blockEnd && range.to >= blockStart;
      }
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      return now >= blockStart && now <= blockEnd;
    });
    return block?.motivo || "Inhabilitada";
  };

  const iconMap: Record<string, LucideIcon> = {
    Sparkles,
    Heart,
    Film,
    Star,
    Sun,
    Moon,
    TreePine,
    Mountain,
    Flame,
    Gift,
    Tag,
  };

  const getIconComponent = (iconId: string): LucideIcon => {
    return iconMap[iconId] || Sparkles;
  };

  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/plan-blocks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlanBlocks(data);
        }
      })
      .catch((err) => console.error("Error fetching plan blocks:", err));

    fetch("/api/plans/active")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDynamicPlans(data);
        }
      })
      .catch((err) => console.error("Error fetching plans:", err));

    fetch("/api/unit-blocks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUnitBlocks(data);
        }
      })
      .catch((err) => console.error("Error fetching unit blocks:", err));
  }, []);

  const isPlanBlocked = (
    planId: string,
    typeId: number | null,
    dateRange: { from?: Date; to?: Date },
  ) => {
    if (!typeId || !dateRange.from || !dateRange.to) return false;

    return planBlocks.some((block) => {
      if (block.planId !== planId) return false;
      if (!block.campingIds.includes(typeId)) return false;

      const blockStart = new Date(block.fechaInicio);
      const blockEnd = new Date(block.fechaFin);
      const rangeStart = dateRange.from!;
      const rangeEnd = dateRange.to!;

      return rangeStart <= blockEnd && rangeEnd >= blockStart;
    });
  };

  const bankInfo = {
    banco: "(Bre-B)",
    llave: "@9020462995",
    titular: "Oná Xperience SAS",
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copiado",
      description: "Información copiada al portapapeles",
    });
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es muy grande. Máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBookingImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const activeAddonNames = dynamicAddons
        .filter((a) => selectedAddons.includes(a.id))
        .map((a) => {
          const qty = addonQuantities[a.id];
          return qty && qty > 1 ? `${a.title} x${qty}` : a.title;
        });
      const addonLines = activeAddonNames.length > 0 ? activeAddonNames : [];
      const extraHeight =
        addonLines.length > 0 ? 60 + addonLines.length * 28 : 0;
      const canvasHeight = 1000 + extraHeight;

      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#FDFCFB";
      ctx.fillRect(0, 0, 800, canvasHeight);

      ctx.fillStyle = "#5C4033";
      ctx.fillRect(0, 0, 800, 120);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Oná Xperience", 400, 70);
      ctx.font = "16px Arial";
      ctx.fillText("Confirmación de Reserva", 400, 100);

      ctx.fillStyle = "#5C4033";
      ctx.textAlign = "left";
      ctx.font = "bold 24px Georgia";
      ctx.fillText("Detalles de tu Reserva", 50, 180);

      ctx.strokeStyle = "#E5E7EB";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(750, 200);
      ctx.stroke();

      const details = [
        { label: "Referencia", value: bookingRef || "---" },
        { label: "Huésped", value: fullName },
        { label: "Plan", value: selectedPlan?.nombre || "---" },
        { label: "Alojamiento", value: initialCamping?.name || "---" },
        {
          label: "Check-in",
          value: range.from
            ? format(range.from, "dd 'de' MMMM yyyy", { locale: es })
            : "---",
        },
        {
          label: "Check-out",
          value: range.to
            ? format(range.to, "dd 'de' MMMM yyyy", { locale: es })
            : "---",
        },
        { label: "Total", value: `$${total.toLocaleString()} COP` },
        { label: "Anticipo (35%)", value: `$${deposit.toLocaleString()} COP` },
        {
          label: "Saldo pendiente",
          value: `$${(total - deposit).toLocaleString()} COP`,
        },
      ];

      let y = 250;
      ctx.font = "16px Arial";
      details.forEach(({ label, value }) => {
        ctx.fillStyle = "#6B7280";
        ctx.fillText(label + ":", 50, y);
        ctx.fillStyle = "#1F2937";
        ctx.font = "bold 16px Arial";
        ctx.fillText(value, 250, y);
        ctx.font = "16px Arial";
        y += 45;
      });

      if (addonLines.length > 0) {
        y += 10;
        ctx.strokeStyle = "#E5E7EB";
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(750, y);
        ctx.stroke();
        y += 30;
        ctx.fillStyle = "#5C4033";
        ctx.font = "bold 18px Georgia";
        ctx.fillText("Adicionales", 50, y);
        y += 25;
        ctx.font = "14px Arial";
        addonLines.forEach((name) => {
          ctx.fillStyle = "#C45C26";
          ctx.fillText("•", 60, y);
          ctx.fillStyle = "#1F2937";
          ctx.fillText(name, 80, y);
          y += 28;
        });
      }

      ctx.fillStyle = "#F3F4F6";
      ctx.fillRect(50, y + 20, 700, 120);
      ctx.fillStyle = "#5C4033";
      ctx.font = "bold 14px Arial";
      ctx.fillText(
        "Check-in: 3:00 PM - 6:00 PM  |  Check-out: antes de 11:30 AM",
        100,
        y + 60,
      );
      ctx.fillStyle = "#6B7280";
      ctx.font = "12px Arial";
      ctx.fillText(
        "El saldo pendiente se cancela al llegar a Oná.",
        100,
        y + 90,
      );
      ctx.fillText(
        "Presenta esta imagen al momento de tu llegada.",
        100,
        y + 110,
      );

      ctx.fillStyle = "#5C4033";
      ctx.font = "italic 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "San Antonio del Tequendama, Cundinamarca - Colombia",
        400,
        canvasHeight - 50,
      );
      ctx.fillText("WhatsApp: +57 319 249 7753", 400, canvasHeight - 30);

      resolve(canvas.toDataURL("image/png"));
    });
  };

  const handlePaymentComplete = async () => {
    if (!receiptFile) {
      toast({
        title: "Error",
        description: "Por favor sube el comprobante de pago.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("referencia", bookingRef || "");
      formData.append("total", deposit.toString());

      const response = await fetch("/api/confirmar-pago", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const bookingImageUrl = await generateBookingImage();

        const link = document.createElement("a");
        link.href = bookingImageUrl;
        link.download = `reserva-ona-${bookingRef}.png`;
        link.click();

        const whatsappMessage = encodeURIComponent(
          `¡Hola! Acabo de realizar mi reserva en Oná Xperience.\n\n` +
            `Referencia: ${bookingRef}\n` +
            `Nombre: ${fullName}\n` +
            `Plan: ${selectedPlan?.nombre}\n` +
            `Alojamiento: ${initialCamping?.name}\n` +
            `Fechas: ${range.from ? format(range.from, "dd/MM/yyyy") : ""} - ${range.to ? format(range.to, "dd/MM/yyyy") : ""}\n` +
            `Anticipo: $${deposit.toLocaleString()} COP\n\n` +
            `Adjunto mi comprobante de pago y confirmación de reserva.`,
        );

        const whatsappUrl = `https://wa.me/573192497753?text=${whatsappMessage}`;
        setWhatsappRedirectUrl(whatsappUrl);
        setShowSuccess(true);
      } else {
        throw new Error(data.error || "Error al confirmar pago");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const campingTypes = [
    { id: 1, name: "Aura (VIP)", icon: <Sparkles className="w-4 h-4" /> },
    { id: 2, name: "Árbol", icon: <Tent className="w-4 h-4" /> },
    { id: 3, name: "Nido", icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  const filteredUnits = useMemo(
    () =>
      selectedTypeId ? campings.filter((c) => c.typeId === selectedTypeId) : [],
    [selectedTypeId],
  );

  const initialCamping = useMemo(
    () => campings.find((c) => c.id === selectedCampingId) || campings[0],
    [selectedCampingId],
  );

  useEffect(() => {
    if (selectedCampingId) {
      fetch(`/api/get-ocupacion.php?unidadId=${selectedCampingId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setConfirmedBookings(
              data.map((b: any) => ({
                from: new Date(
                  b.fecha_inicio.includes("T")
                    ? b.fecha_inicio
                    : b.fecha_inicio + "T12:00:00",
                ),
                to: new Date(
                  b.fecha_fin.includes("T")
                    ? b.fecha_fin
                    : b.fecha_fin + "T12:00:00",
                ),
              })),
            );
          }
        })
        .catch((err) => console.error("Error fetching occupation:", err));
    }
  }, [selectedCampingId]);

  const saveBooking = (newBooking: { from: Date; to: Date }) => {
    if (!selectedCampingId) return;
    const updated = [...confirmedBookings, newBooking];
    setConfirmedBookings(updated);
    localStorage.setItem(
      `ona_confirmed_bookings_${selectedCampingId}`,
      JSON.stringify(updated),
    );
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mínimo 2 días de anticipación (No permitir hoy ni mañana)
    const minLeadTime = new Date(today);
    minLeadTime.setDate(today.getDate() + 2);
    if (date < minLeadTime) return true;

    // Regla de Temporada Fija (Bloques trimestrales) solo para el Plan Bruma
    if (selectedPlanId === "bruma") {
      const activeSeason = getActiveSeason(today);
      if (activeSeason) {
        if (date < activeSeason.start || date > activeSeason.end) {
          return true;
        }
      }
    }

    // Bloquear fechas si hay un bloqueo de plan para el plan y camping seleccionados
    if (selectedPlanId && selectedTypeId) {
      const isBlockedByPlanBlock = planBlocks.some((block) => {
        if (block.planId !== selectedPlanId) return false;
        if (!block.campingIds.includes(selectedTypeId)) return false;

        const blockStart = new Date(block.fechaInicio);
        const blockEnd = new Date(block.fechaFin);
        blockStart.setHours(0, 0, 0, 0);
        blockEnd.setHours(0, 0, 0, 0);

        return date >= blockStart && date <= blockEnd;
      });

      if (isBlockedByPlanBlock) return true;
    }

    // Bloquear si hay una reserva o bloqueo administrativo en esta unidad
    const isOccupied = confirmedBookings.some((booking) => {
      const bFrom = new Date(booking.from);
      const bTo = new Date(booking.to);
      bFrom.setHours(12, 0, 0, 0);
      bTo.setHours(12, 0, 0, 0);

      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);

      // Si la fecha es igual al inicio o está entre inicio y fin, está ocupado.
      // Pero permitimos que el check-out de uno sea el check-in del otro.
      return checkDate >= bFrom && checkDate < bTo;
    });

    return isOccupied;
  };

  const hasPlan3Dias = selectedAddons.some(
    (id) =>
      id === "plan_3_dias_aura" ||
      id === "plan_3_dias_arbol" ||
      id === "plan_3_dias_nido",
  );

  const nights = hasPlan3Dias || selectedAddons.includes("extra_night") ? 2 : 1;
  const days = nights + 1;

  const selectedPlan =
    dynamicPlans.find((p) => p.id === selectedPlanId) || dynamicPlans[0];

  // Clear selected plan if it becomes blocked due to camping/date changes
  useEffect(() => {
    if (selectedPlanId && selectedTypeId && range.from && range.to) {
      if (isPlanBlocked(selectedPlanId, selectedTypeId, range)) {
        setSelectedPlanId(null);
        toast({
          title: "Plan no disponible",
          description:
            "El plan seleccionado no está disponible para este camping en las fechas elegidas. Por favor selecciona otro plan.",
          variant: "destructive",
        });
      }
    }
  }, [selectedTypeId, range.from, range.to, planBlocks]);

  // Logic for 3-day plans
  useEffect(() => {
    if (selectedPlanId === "3_dias" && selectedTypeId) {
      const typeAddonMap: Record<number, string> = {
        1: "plan_3_dias_aura",
        2: "plan_3_dias_arbol",
        3: "plan_3_dias_nido",
      };
      const addonId = typeAddonMap[selectedTypeId];
      if (addonId && !selectedAddons.includes(addonId)) {
        setSelectedAddons((prev) => {
          // Remove any other 3-day plan addons first
          const filtered = prev.filter((id) => !id.startsWith("plan_3_dias_"));
          return [...filtered, addonId];
        });
      }
    } else if (selectedPlanId !== "3_dias") {
      // Remove 3-day plan addons if plan is changed
      setSelectedAddons((prev) =>
        prev.filter((id) => !id.startsWith("plan_3_dias_")),
      );
    }
  }, [selectedPlanId, selectedTypeId]);

  const activeAddons = dynamicAddons.filter((a) => selectedAddons.includes(a.id));

  const visibleAddons = dynamicAddons.filter((a) => {
    if (!a.id.startsWith("plan_3_dias_")) return true;

    if (!selectedTypeId) return false;

    return (
      (selectedTypeId === 1 && a.id === "plan_3_dias_aura") ||
      (selectedTypeId === 2 && a.id === "plan_3_dias_arbol") ||
      (selectedTypeId === 3 && a.id === "plan_3_dias_nido")
    );
  });

  const totalBase = useMemo(() => {
    if (!selectedPlanId || !selectedCampingId || !selectedPlan) return 0;
    const typeId = initialCamping?.typeId?.toString();
    if (!typeId) return 0;
    return selectedPlan.precios?.[typeId] || 0;
  }, [selectedPlanId, selectedCampingId, selectedPlan, initialCamping]);
  const addonsTotal = activeAddons.reduce((acc, curr) => {
    const qty = addonQuantities[curr.id] || 1;
    return acc + curr.price * qty;
  }, 0);

  const tarifaSurcharge = useMemo(() => {
    if (!tarifas || !range.from || !selectedPlanId || totalBase === 0) return 0;
    let surcharge = 0;
    for (let i = 0; i < nights; i++) {
      const nightDate = addDays(range.from, i);
      const dateStr = format(nightDate, "yyyy-MM-dd");
      const monthDay = format(nightDate, "MM-dd");
      const dow = nightDate.getDay();
      const isFestivo =
        (tarifas.diasFestivos || []).includes(dateStr) ||
        (tarifas.fechasEspeciales || []).includes(monthDay);
      const nextDay = addDays(nightDate, 1);
      const isNextFestivo =
        (tarifas.diasFestivos || []).includes(format(nextDay, "yyyy-MM-dd")) ||
        (tarifas.fechasEspeciales || []).includes(format(nextDay, "MM-dd"));
      const isSundayBeforeHolidayMonday =
        dow === 0 && nextDay.getDay() === 1 && isNextFestivo;
      if (isFestivo || dow === 6 || isSundayBeforeHolidayMonday) {
        surcharge += tarifas.sabadoFestivo || 0;
      } else if (dow === 5 || dow === 0) {
        surcharge += tarifas.viernesODomingo || 0;
      } else {
        surcharge += tarifas.entreSemana || 0;
      }
    }
    return surcharge;
  }, [tarifas, range.from, nights, selectedPlanId, totalBase]);

  const discountAmount = useMemo(() => {
    if (!discountResult?.valid || !discountResult.valor) return 0;
    const base = totalBase + addonsTotal + tarifaSurcharge;
    if (discountResult.tipo === "porcentaje") return Math.round(base * discountResult.valor / 100);
    return Math.min(discountResult.valor, base);
  }, [discountResult, totalBase, addonsTotal, tarifaSurcharge]);

  const total = totalBase + addonsTotal + tarifaSurcharge - discountAmount;
  const deposit = Math.round(total * 0.35);

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    setIsValidatingDiscount(true);
    try {
      const res = await fetch("/api/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: discountCode.trim().toUpperCase(),
          planId: selectedPlanId,
          campingTypeId: initialCamping?.typeId ?? null,
        }),
      });
      const data = await res.json();
      setDiscountResult(data);
    } catch {
      setDiscountResult({ valid: false, mensaje: "Error al validar el código" });
    }
    setIsValidatingDiscount(false);
  };

  const isFormValid = useMemo(() => {
    return !!(
      selectedPlanId &&
      selectedCampingId &&
      range.from &&
      range.to &&
      fullName &&
      idNumber &&
      phone &&
      email
    );
  }, [
    selectedPlanId,
    selectedCampingId,
    range,
    fullName,
    idNumber,
    phone,
    email,
  ]);

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) => {
      // Si el addon ya está seleccionado, lo quitamos
      if (prev.includes(addonId)) {
        return prev.filter((id) => id !== addonId);
      }

      // Si es un plan 3 días nuevo, quitamos otros planes 3 días previos
      if (addonId.startsWith("plan_3_dias_")) {
        const filtered = prev.filter((id) => !id.startsWith("plan_3_dias_"));
        return [...filtered, addonId];
      }

      // Para cualquier otro adicional
      return [...prev, addonId];
    });
  };

  const isStepValid = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return !!selectedPlanId;
      case 2:
        return !!selectedTypeId;
      case 3:
        return !!selectedCampingId;
      case 4:
        if (!range.from || !range.to) return false;
        if (
          selectedPlanId &&
          isPlanBlocked(selectedPlanId, selectedTypeId, range)
        )
          return false;
        return true;
      case 5:
        return true; // Adicionales es opcional
      case 6:
        return !!fullName && !!email && !!idNumber && !!phone;
      default:
        return true;
    }
  };

  const getStepError = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        return !selectedPlanId ? "Selecciona un plan" : null;
      case 2:
        return !selectedTypeId ? "Selecciona un camping" : null;
      case 3:
        return !selectedCampingId ? "Selecciona una unidad" : null;
      case 4:
        if (!range.from || !range.to) return "Selecciona las fechas";
        if (
          selectedPlanId &&
          isPlanBlocked(selectedPlanId, selectedTypeId, range)
        ) {
          return "Este plan no está disponible para el camping y fechas seleccionadas";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const error = getStepError(step);
    if (error) {
      toast({ title: "Atención", description: error, variant: "destructive" });
      return;
    }

    // Lógica para saltar pasos si ya tenemos información pre-seleccionada
    let nextStep = step + 1;

    // Si venimos desde la ventana de detalles (tenemos campingId)
    // Saltamos la selección de tipo de camping (paso 2) y unidad (paso 3)
    if (searchParams.get("campingId")) {
      if (step === 1) {
        nextStep = 4; // De Plan (1) saltamos directo a Fechas (4)
      }
    }

    // Si estamos en el paso 6 (Información del Huésped) y vamos al 7 (Pago)
    // disparamos primero el modal de políticas
    if (step === 6) {
      handleBookingPreCheck();
      return;
    }

    setStep(nextStep);
  };

  const handleBookingPreCheck = () => {
    if (
      !selectedCampingId ||
      !range.from ||
      !range.to ||
      !fullName ||
      !idNumber ||
      !phone ||
      !email
    ) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    setShowPolicies(true);
  };

  const handleBooking = async () => {
    if (!acceptedPolicies) {
      toast({
        title: "Atención",
        description: "Debes aceptar las políticas para continuar.",
        variant: "destructive",
      });
      return;
    }

    setShowPolicies(false);
    setIsBooking(true);
    try {
      // Verificar si se seleccionó adicional de noche extra para extender la fecha de fin
      const hasExtraNight = selectedAddons.some((addon) =>
        addon.startsWith("plan_3_dias_"),
      );

      let finalEndDate = range.to;
      if (hasExtraNight && range.to) {
        // Agregar 1 día a la fecha de fin por la noche extra
        finalEndDate = new Date(range.to);
        finalEndDate.setDate(finalEndDate.getDate() + 1);
      }

      const response = await fetch("/api/crear-reserva.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan?.nombre || "",
          camping: campingTypes.find((t) => t.id === selectedTypeId)?.name,
          unidad: initialCamping.name,
          fecha_inicio: range.from ? format(range.from, "yyyy-MM-dd") : "",
          fecha_fin: finalEndDate ? format(finalEndDate, "yyyy-MM-dd") : "",
          adicionales: selectedAddons.map(id => {
            const qty = addonQuantities[id];
            return qty && qty > 1 ? `${id}:${qty}` : id;
          }),
          total: total,
          nombre: fullName,
          telefono: phone,
          email: email,
          cedula: idNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBookingRef(data.referencia);
        setStep(7); // Ir al paso de pago con botón Bold
      } else {
        throw new Error(data.error || "Error al crear reserva");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif text-primary mb-4">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-stone-500 mb-6">
            Hemos recibido tu pago. Por favor envíanos tu comprobante por
            WhatsApp para completar el proceso.
          </p>

          {whatsappRedirectUrl && (
            <a
              href={whatsappRedirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-widest mb-4 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar a WhatsApp
            </a>
          )}

          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full h-14 rounded-2xl border-primary text-primary font-bold uppercase tracking-widest"
          >
            Volver al inicio
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-8 md:py-16 px-4 relative">
      {/* Modal de Políticas */}
      {showPolicies && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-stone-100 bg-stone-50/50">
              <h2 className="text-2xl font-serif text-primary">
                Requisitos y Políticas de Reserva
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Por favor lee atentamente antes de proceder al pago.
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl">
                <h3 className="text-lg font-bold text-accent flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  Información Importante
                </h3>
                <p className="text-primary font-medium leading-relaxed text-base">
                  Oná es un espacio diseñado exclusivamente para{" "}
                  <span className="underline decoration-accent decoration-2">
                    parejas
                  </span>
                  . Para garantizar la tranquilidad y la experiencia de
                  conexión,{" "}
                  <span className="font-bold">
                    no se permite el ingreso de mascotas ni niños
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-6 text-stone-600 text-sm leading-relaxed text-justify">
                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    1. Reservas y Pagos
                  </h4>
                  <p>
                    1.1 Recomendamos realizar la reserva con anticipación para
                    garantizar disponibilidad. El huésped debe verificar
                    cuidadosamente la disponibilidad.
                  </p>
                  <p>
                    1.2 La reserva se confirma con un depósito del 50%. El saldo
                    restante se cancela al llegar a Oná.
                  </p>
                  <p>
                    1.3 <strong>Cambio de fecha:</strong> Si se informa con
                    mínimo 72 horas de anticipación, podrá reprogramarse la
                    reserva, sujeto a disponibilidad.
                  </p>
                  <p>
                    1.4 Política de cancelación: Con al menos 15 días de
                    anticipación se reembolsa el 100%. Con menos de 15 días, no
                    hay reembolso.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    2. Check-in y Check-out
                  </h4>
                  <p>
                    2.1 Check-in: A partir de las 3:00 p.m. Última hora de
                    entrada: 6:00 p.m.
                  </p>
                  <p>2.2 Check-out: Debe realizarse antes de las 12:00 a.m.</p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    3. Responsabilidades
                  </h4>
                  <p>
                    3.1 Oná no se hace responsable por errores del huésped al
                    momento de reservar (fecha, tipo de alojamiento, servicios
                    incluidos).
                  </p>
                  <p>
                    3.2 No se realizan reembolsos por malentendidos que estén
                    claramente especificados en la información del plan.
                  </p>
                  <p>
                    3.3 No hay reembolsos por condiciones climáticas, cortes de
                    luz, lluvias o situaciones externas fuera de nuestro
                    control.
                  </p>
                  <p>
                    3.4 Si se presentan eventos ajenos tanto al camping como al
                    cliente, tales como: paros, derrumbes, cierres de vías o
                    accidentes, se permitirá cambio de fecha sin costo
                    adicional, sujeto a disponibilidad.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    4. Normas del Establecimiento
                  </h4>
                  <p>
                    4.1 No se permite el ingreso de alimentos ni bebidas
                    externas.
                  </p>
                  <p>
                    <span className="font-bold text-primary italic underline">
                      4.2 Mascotas:
                    </span>{" "}
                    No se permite el ingreso de mascotas bajo ninguna
                    circunstancia.
                  </p>
                  <p>
                    <span className="font-bold text-primary italic underline">
                      4.3 Menores de edad:
                    </span>{" "}
                    No se permite el ingreso de menores de 18 años. El espacio
                    es exclusivo para adultos en pareja.
                  </p>
                  <p>
                    4.5 Ruido: Mantener el volumen bajo después de las 9:00 p.m.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    5. Seguridad y Responsabilidad
                  </h4>
                  <p>
                    • Contamos con cámaras de seguridad en áreas comunes para
                    velar por el bienestar y la tranquilidad de nuestros
                    huéspedes.
                  </p>
                  <p>
                    • Las grabaciones se manejan de manera confidencial y solo
                    se utilizan con fines de seguridad.
                  </p>
                  <p>
                    • La finca no se hace responsable por objetos perdidos o
                    dañados.
                  </p>
                  <p>
                    • En caso de emergencia, comuníquese con el personal
                    disponible las 24 horas.
                  </p>
                  <p>
                    • Los daños ocasionados a la propiedad deberán ser pagados
                    por el huésped.
                  </p>
                  <p>
                    • Objetos olvidados se guardarán durante 30 días. Si no son
                    reclamados, serán donados o desechados.
                  </p>
                  <p>
                    • Fumar solo en áreas designadas. No está permitido dentro
                    de las carpas o habitaciones. El incumplimiento de esta
                    norma puede generar sanciones o retiro sin reembolso.
                  </p>
                  <p>
                    • No se toleran faltas de respeto, agresiones físicas o
                    verbales. Cualquier comportamiento violento será motivo de
                    expulsión inmediata y se notificará a las autoridades.
                  </p>
                  <p>
                    • No se permite arrojar basura, vidrio, cigarrillos u otros
                    objetos en las fogatas o jacuzzis.
                  </p>
                  <p>
                    • No se permite el consumo de sustancias alucinógenas ni
                    comportamientos inapropiados.
                  </p>
                  <p>
                    • Está prohibido ingresar armas de fuego, elementos
                    cortopunzantes o explosivos.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    6. Derecho de Admisión
                  </h4>
                  <p>
                    Nos reservamos el derecho de admisión a personas que alteren
                    la seguridad o tranquilidad del lugar.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    7. Protección de Datos
                  </h4>
                  <p>
                    La información personal se utiliza únicamente para gestionar
                    su reserva. No se comparte con terceros sin autorización del
                    huésped.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-bold text-primary uppercase tracking-wider text-xs">
                    8. Quejas y Sugerencias
                  </h4>
                  <p>
                    Cualquier inconveniente o sugerencia puede comunicarse
                    directamente al personal durante su estadía.
                  </p>
                </section>
              </div>
            </div>

            <div className="p-8 border-t border-stone-100 bg-stone-50/30 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-stone-200">
                <Checkbox
                  id="accept-policies"
                  checked={acceptedPolicies}
                  onCheckedChange={(checked) =>
                    setAcceptedPolicies(checked as boolean)
                  }
                  className="mt-1"
                />
                <Label
                  htmlFor="accept-policies"
                  className="text-sm text-stone-600 cursor-pointer leading-tight"
                >
                  He leído y acepto los requisitos y políticas, incluyendo que
                  es un espacio{" "}
                  <span className="font-bold text-primary">
                    solo para parejas adultos, sin niños ni mascotas
                  </span>
                  .
                </Label>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPolicies(false)}
                  className="flex-1 h-14 rounded-2xl border-stone-200 text-stone-500 font-bold uppercase tracking-widest"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={!acceptedPolicies}
                  className="flex-[2] h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Continuar al Pago
                </Button>
              </div>
              {!acceptedPolicies && (
                <p className="text-[10px] text-center text-accent font-medium italic">
                  Es muy recomendable leer todas las políticas antes de
                  continuar.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-stone-400 hover:text-accent mb-8 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium uppercase tracking-widest">
            Regresar
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100"
            >
              <h1 className="text-4xl font-serif text-primary mb-2">
                Tu Experiencia Oná
              </h1>
              <p className="text-stone-500 mb-10">
                Personaliza cada detalle de tu refugio en la naturaleza.
              </p>

              <div className="space-y-12">
                {step === 1 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl font-serif">1. Elige tu Plan</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {dynamicPlans.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-stone-500">
                          Cargando planes...
                        </div>
                      ) : (
                        dynamicPlans.map((plan) => {
                          const isBlockedForSelection =
                            selectedTypeId && range.from && range.to
                              ? isPlanBlocked(plan.id, selectedTypeId, range)
                              : false;
                          const IconComp = getIconComponent(plan.icono);

                          return (
                            <div key={plan.id} className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  if (!isBlockedForSelection) {
                                    setSelectedPlanId(plan.id);
                                  }
                                }}
                                disabled={isBlockedForSelection}
                                className={cn(
                                  "text-left p-6 rounded-3xl border transition-all flex flex-col group w-full relative",
                                  isBlockedForSelection
                                    ? "border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed"
                                    : selectedPlanId === plan.id
                                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                                      : "border-stone-100 bg-stone-50/30 hover:bg-white",
                                )}
                              >
                                {plan.tipo === "preventa" && (
                                  <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                    PREVENTA
                                  </div>
                                )}
                                {plan.tipo === "temporada" &&
                                  plan.fechaInicio &&
                                  plan.fechaFin && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                      {format(
                                        new Date(plan.fechaInicio),
                                        "dd MMM",
                                        { locale: es },
                                      )}{" "}
                                      -{" "}
                                      {format(
                                        new Date(plan.fechaFin),
                                        "dd MMM",
                                        { locale: es },
                                      )}
                                    </div>
                                  )}
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{
                                      backgroundColor: `${plan.color}20`,
                                    }}
                                  >
                                    <IconComp
                                      className="w-4 h-4"
                                      style={{ color: plan.color }}
                                    />
                                  </div>
                                  <h3
                                    className={cn(
                                      "font-bold",
                                      isBlockedForSelection
                                        ? "text-stone-400"
                                        : "text-stone-800",
                                    )}
                                  >
                                    {plan.nombre}
                                  </h3>
                                </div>
                                <p className="text-[10px] text-stone-500 leading-tight">
                                  {plan.eslogan}
                                </p>
                                {selectedTypeId && (
                                  <p
                                    className="text-sm font-bold mt-2"
                                    style={{ color: plan.color }}
                                  >
                                    $
                                    {(
                                      plan.precios?.[
                                        selectedTypeId.toString()
                                      ] || 0
                                    ).toLocaleString()}
                                  </p>
                                )}
                                {isBlockedForSelection && (
                                  <div className="mt-2 flex items-center gap-1 text-red-500">
                                    <EyeOff className="w-3 h-3" />
                                    <span className="text-[10px] font-medium">
                                      No disponible para este camping en estas
                                      fechas
                                    </span>
                                  </div>
                                )}
                              </button>

                              <AnimatePresence>
                                {selectedPlanId === plan.id &&
                                  plan.incluye &&
                                  plan.incluye.length > 0 &&
                                  !isBlockedForSelection && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden px-4"
                                    >
                                      <div className="py-4 space-y-2 border-t border-stone-100 mt-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
                                          Incluye:
                                        </p>
                                        {plan.incluye.map((feature, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2 text-[10px] text-stone-600"
                                          >
                                            <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                                            {feature}
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {selectedPlan?.tipo === "temporada" &&
                      selectedPlan?.fechaInicio &&
                      selectedPlan?.fechaFin && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex gap-3 items-start"
                        >
                          <Info className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-primary">
                              Plan de Temporada
                            </p>
                            <p className="text-xs text-stone-600 mt-1">
                              Este plan solo está disponible del
                              <span className="font-bold ml-1">
                                {format(
                                  new Date(selectedPlan.fechaInicio),
                                  "d 'de' MMMM",
                                  { locale: es },
                                )}
                              </span>{" "}
                              al
                              <span className="font-bold ml-1">
                                {format(
                                  new Date(selectedPlan.fechaFin),
                                  "d 'de' MMMM 'de' yyyy",
                                  { locale: es },
                                )}
                              </span>
                              .
                            </p>
                          </div>
                        </motion.div>
                      )}
                    {!selectedPlanId && (
                      <p className="text-xs text-red-500 italic mt-2">
                        Selecciona un plan para continuar
                      </p>
                    )}
                  </section>
                )}

                {step === 2 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <Tent className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl font-serif">
                        2. Elige el tipo de Camping
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {campingTypes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTypeId(t.id);
                          }}
                          className={cn(
                            "p-6 rounded-3xl border transition-all text-center group",
                            selectedTypeId === t.id
                              ? "border-accent bg-accent/5 ring-1 ring-accent"
                              : "border-stone-100 bg-stone-50/30 hover:bg-white",
                          )}
                        >
                          <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary mb-3">
                            {t.icon}
                          </div>
                          <span className="font-bold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                    {!selectedTypeId && (
                      <p className="text-xs text-red-500 italic mt-2">
                        Selecciona un camping para continuar
                      </p>
                    )}
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Volver a Planes
                    </Button>
                  </section>
                )}

                {step === 3 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl font-serif">
                        3. Selecciona tu Unidad
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filteredUnits.map((unit) => {
                        const blocked = isUnitBlocked(unit.name);
                        const motivo = blocked
                          ? getUnitBlockMotivo(unit.name)
                          : "";
                        return (
                          <button
                            key={unit.id}
                            onClick={() => {
                              if (!blocked) setSelectedCampingId(unit.id);
                            }}
                            disabled={blocked}
                            className={cn(
                              "p-6 rounded-3xl border transition-all text-center group relative overflow-hidden",
                              blocked
                                ? "border-red-200 bg-red-50/50 opacity-70 cursor-not-allowed"
                                : selectedCampingId === unit.id
                                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                                  : "border-stone-100 bg-stone-50/30 hover:bg-white",
                            )}
                          >
                            <span
                              className={cn(
                                "font-bold",
                                blocked && "text-stone-400",
                              )}
                            >
                              {unit.name}
                            </span>
                            {blocked && (
                              <div className="mt-2 flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1 text-red-500">
                                  <Lock className="w-3 h-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Inhabilitada
                                  </span>
                                </div>
                                {motivo && motivo !== "Inhabilitada" && (
                                  <span className="text-[9px] text-red-400 italic">
                                    {motivo}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedCampingId && (
                      <p className="text-xs text-red-500 italic mt-2">
                        Selecciona una unidad para continuar
                      </p>
                    )}
                    <Button variant="ghost" onClick={() => setStep(2)}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Volver a Tipos
                    </Button>
                  </section>
                )}

                {step >= 4 && (
                  <div className="space-y-12">
                    {step === 4 && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl font-serif">
                            4. Fechas y Llegada
                          </h2>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center gap-2 text-sm text-stone-500">
                          <Info className="w-4 h-4 text-accent" />
                          <span>Check-in: 3:00 PM | Check-out: 12:00 AM</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Rango de estancia
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-14 justify-start text-left font-normal border-stone-100 bg-stone-50/50 rounded-2xl hover:bg-white transition-all",
                                    !range.from && "text-stone-400",
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-5 w-5 text-accent" />
                                  {range.from ? (
                                    <span>
                                      Llegada:{" "}
                                      {format(range.from, "dd MMM", {
                                        locale: es,
                                      })}{" "}
                                      {selectedTypeId === 1 && (
                                        <>
                                          ({days} Días / {nights}{" "}
                                          {nights === 1 ? "Noche" : "Noches"})
                                        </>
                                      )}
                                    </span>
                                  ) : (
                                    <span>Selecciona tu fecha</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-none"
                                align="start"
                              >
                                <Calendar
                                  initialFocus
                                  mode="single"
                                  selected={range.from}
                                  onSelect={(d: any) => {
                                    if (d) {
                                      const isPlan3Dias = selectedAddons.some(
                                        (id) => id.startsWith("plan_3_dias_"),
                                      );
                                      const nightsToApply = isPlan3Dias ? 2 : 1;
                                      const to = new Date(d);
                                      to.setDate(d.getDate() + nightsToApply);
                                      setRange({ from: d, to });
                                    }
                                  }}
                                  disabled={isDateDisabled}
                                  locale={es}
                                  className="p-4"
                                />
                              </PopoverContent>
                            </Popover>
                            {!range.from && (
                              <p className="text-xs text-red-500 italic">
                                Selecciona las fechas para continuar
                              </p>
                            )}
                            {range.from &&
                              range.to &&
                              selectedPlanId &&
                              isPlanBlocked(
                                selectedPlanId,
                                selectedTypeId,
                                range,
                              ) && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3">
                                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium">
                                      Plan no disponible
                                    </p>
                                    <p className="text-xs mt-1">
                                      El plan seleccionado no está disponible
                                      para este camping en las fechas elegidas.
                                      Por favor, selecciona otras fechas o
                                      cambia el plan.
                                    </p>
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Hora de llegada
                            </Label>
                            <RadioGroup
                              value={arrivalTime}
                              onValueChange={setArrivalTime}
                              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                            >
                              {[
                                "3:00 PM",
                                "3:30 PM",
                                "4:00 PM",
                                "4:30 PM",
                                "5:00 PM",
                                "5:30 PM",
                                "6:00 PM",
                              ].map((time) => (
                                <Label
                                  key={time}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all",
                                    arrivalTime === time
                                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                                      : "border-stone-100 bg-stone-50/30 hover:bg-white",
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem
                                      value={time}
                                      id={time}
                                      className="sr-only"
                                    />
                                    <Clock
                                      className={cn(
                                        "w-3 h-3",
                                        arrivalTime === time
                                          ? "text-accent"
                                          : "text-stone-300",
                                      )}
                                    />
                                    <span className="text-xs font-medium">
                                      {time}
                                    </span>
                                  </div>
                                  {arrivalTime === time && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                  )}
                                </Label>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                        <Button variant="ghost" onClick={() => setStep(3)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Volver a
                          Unidad
                        </Button>
                      </section>
                    )}

                    {step === 5 && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <LayoutGrid className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl font-serif">
                            5. Adicionales (Opcional)
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {visibleAddons.map((addon) => {
                            const isSelected = selectedAddons.includes(addon.id);
                            const qty = addonQuantities[addon.id] || 1;
                            const hasMedia = addon.media && addon.media.length > 0;
                            return (
                            <div
                              key={addon.id}
                              className={cn(
                                "flex flex-col rounded-3xl border transition-all overflow-hidden",
                                isSelected
                                  ? "border-accent bg-accent/5"
                                  : "border-stone-100 bg-stone-50/30 hover:bg-white",
                              )}
                            >
                              <div
                                className="flex items-center gap-4 cursor-pointer p-5"
                                onClick={() => handleAddonToggle(addon.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleAddonToggle(addon.id)}
                                  className="rounded-full border-stone-200"
                                />
                                <div className="flex-grow">
                                  <h3 className="text-sm font-bold">
                                    {addon.title}
                                  </h3>
                                  <p className="text-[10px] text-stone-500">
                                    {addon.description}
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-stone-400">
                                  ${addon.price.toLocaleString()}
                                </span>
                              </div>

                              {isSelected && hasMedia && (
                                <div className="px-5 pb-3">
                                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {addon.media.map((item: {url: string; type: string}, idx: number) => (
                                      <div key={idx} className="shrink-0 w-28 h-20 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                                        {item.type === "image" ? (
                                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <video src={item.url} className="w-full h-full object-cover" controls muted playsInline />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isSelected && addon.allowMultiple && (
                                <div className="px-5 pb-4 pt-1">
                                  <p className="text-[10px] text-stone-500 mb-2">{addon.multipleLabel || "Cantidad"}</p>
                                  <div className="flex items-center gap-3">
                                    <button
                                      className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setAddonQuantities(prev => ({...prev, [addon.id]: Math.max(1, (prev[addon.id] || 1) - 1)})); }}
                                    >
                                      <span className="text-lg leading-none">−</span>
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center">{qty}</span>
                                    <button
                                      className={cn("w-8 h-8 rounded-full border flex items-center justify-center transition-colors", addon.maxQuantity && qty >= addon.maxQuantity ? "border-stone-100 text-stone-300 cursor-not-allowed" : "border-stone-200 text-stone-600 hover:bg-stone-100")}
                                      onClick={(e) => { e.stopPropagation(); if (!addon.maxQuantity || qty < addon.maxQuantity) setAddonQuantities(prev => ({...prev, [addon.id]: (prev[addon.id] || 1) + 1})); }}
                                    >
                                      <span className="text-lg leading-none">+</span>
                                    </button>
                                    {addon.maxQuantity && (
                                      <span className="text-[10px] text-stone-400 ml-1">máx {addon.maxQuantity}</span>
                                    )}
                                    <span className="text-xs text-stone-400 ml-1">= ${(addon.price * qty).toLocaleString()}</span>
                                  </div>
                                </div>
                              )}

                              {addon.details && addon.details.length > 0 && (
                                <div className="px-5 pb-4 pt-1 border-t border-stone-100 mt-0">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] uppercase tracking-widest font-bold text-accent hover:text-accent hover:bg-accent/10 px-0"
                                      >
                                        <Info className="w-3 h-3 mr-1.5" /> Ver
                                        detalles
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-stone-100">
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                                        ¿Qué incluye?
                                      </h4>
                                      <ul className="space-y-2">
                                        {addon.details.map((detail: string, idx: number) => (
                                          <li
                                            key={idx}
                                            className="flex items-start gap-2 text-[11px] text-stone-600"
                                          >
                                            <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                                            {detail}
                                          </li>
                                        ))}
                                      </ul>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                            );
                          })}
                        </div>
                        <Button variant="ghost" onClick={() => setStep(4)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Volver a
                          Fechas
                        </Button>
                      </section>
                    )}

                    {step === 6 && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <User className="w-4 h-4" />
                          </div>
                          <h2 className="text-xl font-serif">
                            6. Información del Huésped
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Nombre Completo
                            </Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                              <Input
                                placeholder="Tu nombre"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Correo Electrónico
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                              <Input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Cédula / ID
                            </Label>
                            <div className="relative">
                              <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                              <Input
                                placeholder="ID"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
                              Número de Contacto
                            </Label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                              <Input
                                placeholder="WhatsApp"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="pl-11 h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" onClick={() => setStep(5)}>
                          <ChevronLeft className="w-4 h-4 mr-2" /> Volver a
                          Adicionales
                        </Button>
                      </section>
                    )}

                    {step === 7 && (
                      <section className="space-y-8 py-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <CreditCard className="w-8 h-8" />
                          </div>
                          <h2 className="text-3xl font-serif">
                            Finalizar Reserva
                          </h2>
                          <p className="text-stone-500 max-w-sm">
                            Para confirmar tu estancia, realiza el pago del
                            anticipo de{" "}
                            <span className="font-bold text-primary">
                              ${deposit.toLocaleString()} COP
                            </span>
                          </p>
                          <p className="text-xs text-stone-400 font-mono bg-stone-50 px-4 py-2 rounded-xl">
                            REFERENCIA: {bookingRef}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                          <button
                            onClick={() => setPaymentMethod("qr")}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                              paymentMethod === "qr"
                                ? "border-accent bg-accent/5"
                                : "border-stone-200 hover:border-stone-300",
                            )}
                          >
                            <QrCode
                              className={cn(
                                "w-8 h-8",
                                paymentMethod === "qr"
                                  ? "text-accent"
                                  : "text-stone-400",
                              )}
                            />
                            <span className="text-sm font-bold">
                              Pagar con QR
                            </span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod("transfer")}
                            className={cn(
                              "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                              paymentMethod === "transfer"
                                ? "border-accent bg-accent/5"
                                : "border-stone-200 hover:border-stone-300",
                            )}
                          >
                            <Building2
                              className={cn(
                                "w-8 h-8",
                                paymentMethod === "transfer"
                                  ? "text-accent"
                                  : "text-stone-400",
                              )}
                            />
                            <span className="text-sm font-bold">
                              Transferencia
                            </span>
                          </button>
                        </div>

                        {paymentMethod === "qr" && (
                          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 max-w-sm mx-auto text-center">
                            <div
                              className="bg-white p-6 rounded-2xl shadow-sm mb-4 relative group cursor-pointer"
                              onClick={() => setShowQrFullscreen(true)}
                            >
                              <img
                                src="/images/qr-pago.png"
                                alt="QR de Pago"
                                className="w-48 h-48 mx-auto object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f5f5f5' width='200' height='200'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='.3em' font-size='14' fill='%23999'%3EQR de Pago%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/90 px-3 py-1 rounded-full shadow">
                                  Ampliar
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowQrFullscreen(true)}
                              className="text-xs text-accent hover:underline mb-2 flex items-center justify-center gap-1 mx-auto"
                            >
                              <Maximize2 className="w-3 h-3" /> Ver en pantalla
                              completa
                            </button>
                            <p className="text-xs text-stone-500 mb-2">
                              Escanea el código QR con tu app bancaria
                            </p>
                            <p className="text-lg font-bold text-primary">
                              ${deposit.toLocaleString()} COP
                            </p>
                          </div>
                        )}

                        {paymentMethod === "transfer" && (
                          <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 max-w-md mx-auto space-y-4">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                              <Building2 className="w-5 h-5" /> Datos para
                              Transferencia
                            </h3>

                            {[
                              {
                                label: "Banco",
                                value: bankInfo.banco,
                                key: "banco",
                              },
                              {
                                label: "Llave de Negocio",
                                value: bankInfo.llave,
                                key: "llave",
                              },
                              {
                                label: "Titular",
                                value: bankInfo.titular,
                                key: "titular",
                              },
                            ].map(({ label, value, key }) => (
                              <div
                                key={key}
                                className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-100"
                              >
                                <div>
                                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                                    {label}
                                  </p>
                                  <p className="text-sm font-bold text-stone-800">
                                    {value}
                                  </p>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(value, key)}
                                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                >
                                  {copiedField === key ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-stone-400" />
                                  )}
                                </button>
                              </div>
                            ))}

                            <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                              <p className="text-sm font-bold text-accent">
                                Monto a transferir:
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                ${deposit.toLocaleString()} COP
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="bg-white p-6 rounded-3xl border border-stone-200 max-w-md mx-auto space-y-4">
                          <h3 className="font-bold text-primary flex items-center gap-2">
                            <Upload className="w-5 h-5" /> Subir Comprobante de
                            Pago
                          </h3>
                          <p className="text-xs text-stone-500">
                            Una vez realizado el pago, sube la captura o imagen
                            de tu transacción.
                          </p>

                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                              className={cn(
                                "border-2 border-dashed rounded-2xl p-8 text-center transition-all",
                                receiptPreview
                                  ? "border-green-400 bg-green-50"
                                  : "border-stone-300 hover:border-accent",
                              )}
                            >
                              {receiptPreview ? (
                                <div className="space-y-3">
                                  <img
                                    src={receiptPreview}
                                    alt="Comprobante"
                                    className="max-h-40 mx-auto rounded-lg shadow-md"
                                  />
                                  <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" /> Comprobante
                                    cargado
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="w-10 h-10 text-stone-300 mx-auto" />
                                  <p className="text-sm text-stone-500">
                                    Arrastra o haz clic para subir
                                  </p>
                                  <p className="text-[10px] text-stone-400">
                                    PNG, JPG hasta 5MB
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={handlePaymentComplete}
                            disabled={!receiptFile || isUploading}
                            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            {isUploading ? (
                              "Procesando..."
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Confirmar
                                y Enviar a WhatsApp
                              </span>
                            )}
                          </Button>

                          <p className="text-[10px] text-stone-400 text-center italic">
                            Al confirmar, se generará tu reserva y serás
                            redirigido a WhatsApp para enviar la confirmación.
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          onClick={() => setStep(6)}
                          className="mx-auto flex"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> Volver
                        </Button>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 overflow-hidden relative"
              >
                <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-accent" /> Resumen de Reserva
                </h3>
                <div className="space-y-5">
                  <div className="flex flex-col gap-1 text-sm text-white/70">
                    {selectedPlanId && selectedPlan ? (
                      <div className="flex justify-between">
                        <span className="italic">{selectedPlan.nombre}</span>
                        <span className="font-bold text-white">
                          ${totalBase.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="italic text-white/40">
                        Plan no seleccionado
                      </span>
                    )}
                    {selectedCampingId ? (
                      <span className="text-xs text-accent font-bold uppercase tracking-wider">
                        {initialCamping.name}
                        {initialCamping.typeId === 1 && (
                          <> ({days} Días / {nights}{" "}
                          {nights === 1 ? "Noche" : "Noches"})</>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30 italic">
                        Unidad no seleccionada
                      </span>
                    )}
                  </div>
                  {tarifaSurcharge > 0 && (
                    <div className="flex justify-between text-[11px] text-white/50 pt-1">
                      <span>Tarifa por tipo de día</span>
                      <span>+ ${tarifaSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                  {activeAddons.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      {activeAddons.map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between text-[11px] text-white/50"
                        >
                          <span>{a.title}</span>
                          <span>+ ${a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {range.from && (
                    <div className="pt-2 border-t border-white/10 text-[11px] text-white/50">
                      <span>
                        Del {format(range.from, "dd MMM", { locale: es })} al{" "}
                        {format(range.to!, "dd MMM", { locale: es })}
                      </span>
                    </div>
                  )}
                  {fullName && (
                    <div className="pt-2 border-t border-white/10 text-[11px] text-white/50">
                      <span>Huésped: {fullName}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-white/20">
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center mb-2 text-sm text-green-400">
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Descuento ({discountCode.toUpperCase()})</span>
                        <span className="font-bold">− ${discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm uppercase tracking-widest font-bold">
                        Total
                      </span>
                      <span className="text-3xl font-serif font-bold text-accent">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/10 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">
                        Anticipo (35%)
                      </span>
                      <span className="text-xl font-bold">
                        ${deposit.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      El saldo de <b>${(total - deposit).toLocaleString()}</b>{" "}
                      se cancela al llegar.
                    </p>
                  </div>

                  {step < 7 && (
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepValid(step)}
                      className={cn(
                        "w-full h-14 bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-2xl font-bold uppercase tracking-[0.2em] transition-all active:scale-95 group",
                        !isStepValid(step) &&
                          "opacity-50 grayscale cursor-not-allowed",
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Continuar{" "}
                        <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  )}

                  {/* Discount code input */}
                  <div className="pt-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-medium">¿Tienes un código de descuento?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={e => {
                          setDiscountCode(e.target.value.toUpperCase());
                          if (discountResult) setDiscountResult(null);
                        }}
                        onKeyDown={e => e.key === "Enter" && validateDiscountCode()}
                        placeholder="CÓDIGO"
                        className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                      />
                      <button
                        onClick={validateDiscountCode}
                        disabled={isValidatingDiscount || !discountCode.trim()}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isValidatingDiscount ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {discountResult && (
                      <p className={`text-[10px] mt-1.5 font-medium ${discountResult.valid ? "text-green-400" : "text-red-400"}`}>
                        {discountResult.valid
                          ? `✓ Código válido: ${discountResult.tipo === "porcentaje" ? `${discountResult.valor}% de descuento` : `$${(discountResult.valor || 0).toLocaleString()} de descuento`}`
                          : `✗ ${discountResult.mensaje || "Código inválido"}`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {showQrFullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrFullscreen(false)}
        >
          <button
            onClick={() => setShowQrFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-stone-300 transition-colors p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src="/images/qr-pago.png"
              alt="QR de Pago"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white mt-4 text-lg">
              Escanea con tu app bancaria
            </p>
            <p className="text-center text-accent font-bold text-2xl mt-2">
              ${deposit.toLocaleString()} COP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
