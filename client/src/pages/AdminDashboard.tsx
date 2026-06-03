import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit, 
  Search, 
  Tent, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Wallet, 
  Square, 
  CheckSquare, 
  Download,
  ExternalLink,
  MoreVertical,
  Filter,
  LogOut,
  EyeOff,
  Power,
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
  Minus,
  X,
  Image as ImageIcon,
  Video,
  Package,
  Upload
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { campings } from "@/lib/data";
import { cn } from "@/lib/utils";

type Reserva = {
  id: number;
  referencia: string;
  nombre: string;
  email?: string;
  telefono?: string;
  cedula?: string;
  plan: string;
  camping: string;
  unidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  total: number;
  abono: number;
  saldo: number;
  estado: number;
  adicionales: string[] | null;
  created_at?: string;
  comprobante?: string;
};

export default function AdminDashboard() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campingFilter, setCampingFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"fecha" | "tipo_camping" | "estado" | "tipo_plan">("fecha");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState({ unidad: "all", fecha_inicio: "", fecha_fin: "" });
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedReservas, setSelectedReservas] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calFilter, setCalFilter] = useState<"all" | "reserved" | "blocked" | "free">("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Fill previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
    
    for (let i = firstDayOfWeek; i > 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i + 1), isCurrentMonth: false });
    }
    
    // Fill current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    return days;
  };

  const [selectedDayReservas, setSelectedDayReservas] = useState<Reserva[]>([]);
  const [isDayReservasModalOpen, setIsDayReservasModalOpen] = useState(false);

  const getDayStatus = (date: Date) => {
    // Usar formato local para evitar desfases de zona horaria en la visualización
    // Forzamos la fecha a mediodía para que al convertir a ISO/String no cambie de día por el offset
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0);
    
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    const activeReservas = reservas.filter(r => {
      // Normalizar para comparación de solo fecha local
      // El servidor envía YYYY-MM-DD o YYYY-MM-DDT12:00:00
      const start = (r.fecha_inicio || "").substring(0, 10);
      const end = (r.fecha_fin || "").substring(0, 10);
      return dateStr >= start && dateStr < end && r.estado !== 3; // Not cancelled
    });

    if (activeReservas.length === 0) return { status: "free" as const, color: "bg-green-100 text-green-700", label: "Libre" };
    
    const isBlocked = activeReservas.some(r => r.plan === "BLOQUEO ADMIN");
    const count = activeReservas.length;
    const maxUnits = 6;

    if (isBlocked) return { status: "blocked" as const, color: "bg-red-100 text-red-700", label: `Bloqueado (${count})` };
    if (count >= maxUnits) return { status: "reserved" as const, color: "bg-orange-100 text-orange-700", label: "Lleno (6/6)" };
    
    return { status: "reserved" as const, color: "bg-yellow-100 text-yellow-700", label: `Reservado (${count}/${maxUnits})` };
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  
  // Plan Blocks state
  type PlanBlock = {
    id: string;
    planId: string;
    campingIds: number[];
    fechaInicio: string;
    fechaFin: string;
    createdAt: string;
  };
  type UnitBlock = {
    id: string;
    unitName: string;
    motivo: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    createdAt: string;
  };
  const [unitBlocks, setUnitBlocks] = useState<UnitBlock[]>([]);
  const [isUnitBlockModalOpen, setIsUnitBlockModalOpen] = useState(false);
  const [unitBlockForm, setUnitBlockForm] = useState({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });

  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>([]);
  const [isPlanBlockModalOpen, setIsPlanBlockModalOpen] = useState(false);
  const [planBlockForm, setPlanBlockForm] = useState({
    planId: "",
    campingIds: [] as number[],
    fechaInicio: "",
    fechaFin: ""
  });
  const [planBlockError, setPlanBlockError] = useState<string | null>(null);

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
    createdAt: string;
  };

  const [dynamicPlans, setDynamicPlans] = useState<DynamicPlan[]>([]);
  const [dynamicCampings, setDynamicCampings] = useState<any[]>([]);
  const [dynamicAddons, setDynamicAddons] = useState<any[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCampingModalOpen, setIsCampingModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DynamicPlan | null>(null);
  const [editingCamping, setEditingCamping] = useState<any | null>(null);
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [planFormError, setPlanFormError] = useState<string | null>(null);
  const [campingForm, setCampingForm] = useState({
    name: "",
    description: "",
    image: "",
    images: [] as string[],
    videos: [] as string[],
    features: [] as string[],
    newFeature: ""
  });
  const [addonForm, setAddonForm] = useState({
    title: "",
    price: 0,
    description: "",
    details: [] as string[],
    newDetail: "",
    allowMultiple: false,
    multipleLabel: "",
    maxQuantity: null as number | null,
    media: [] as { url: string; type: "image" | "video" }[]
  });
  const [campingUploading, setCampingUploading] = useState(false);
  const [addonUploading, setAddonUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [planBannerUploading, setPlanBannerUploading] = useState(false);
  const [heroSettings, setHeroSettings] = useState<{ type: string; url: string }>({ type: "image", url: "" });
  const [tarifasData, setTarifasData] = useState({ entreSemana: 0, viernesODomingo: 0, sabadoFestivo: 0, diasFestivos: [] as string[], fechasEspeciales: [] as string[] });
  const [newFestivo, setNewFestivo] = useState("");
  const [newEspecial, setNewEspecial] = useState("");
  const [tarifasSaving, setTarifasSaving] = useState(false);
  const [planForm, setPlanForm] = useState({
    nombre: "",
    eslogan: "",
    descripcion: "",
    tipo: "normal" as "normal" | "temporada" | "preventa",
    icono: "Sparkles",
    color: "#8B5A2B",
    fechaInicio: "",
    fechaFin: "",
    preventa: false,
    desactivarOtros: false,
    precios: { "1": 0, "2": 0, "3": 0 } as Record<string, number>,
    incluye: [] as string[],
    newIncluye: "",
    bannerImage: ""
  });

  const iconOptions = [
    { id: "Sparkles", icon: Sparkles, name: "Estrellas" },
    { id: "Heart", icon: Heart, name: "Corazón" },
    { id: "Film", icon: Film, name: "Cine" },
    { id: "Star", icon: Star, name: "Estrella" },
    { id: "Sun", icon: Sun, name: "Sol" },
    { id: "Moon", icon: Moon, name: "Luna" },
    { id: "TreePine", icon: TreePine, name: "Árbol" },
    { id: "Mountain", icon: Mountain, name: "Montaña" },
    { id: "Flame", icon: Flame, name: "Fuego" },
    { id: "Gift", icon: Gift, name: "Regalo" },
    { id: "Tag", icon: Tag, name: "Etiqueta" }
  ];

  const getIconComponent = (iconId: string) => {
    const option = iconOptions.find(o => o.id === iconId);
    return option ? option.icon : Sparkles;
  };
  
  // Función para normalizar fechas al guardado y evitar desfases
  const normalizeDateForSave = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  };

  const [editData, setEditData] = useState({ 
    referencia: "", 
    fecha_inicio: "", 
    fecha_fin: "", 
    unidad: "",
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    plan: "",
    total: 0,
    abono: 0,
    estado: 0,
    adicionales: [] as string[]
  });

  const [isNewReservaModalOpen, setIsNewReservaModalOpen] = useState(false);
  const [newReservaData, setNewReservaData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    unidad: "Aura 1",
    fecha_inicio: "",
    fecha_fin: "",
    plan: "",
    total: 0,
    abono: 0,
    estado: 2
  });

  useEffect(() => {
    if (newReservaData.fecha_inicio && newReservaData.fecha_fin && newReservaData.unidad && newReservaData.plan) {
      const campingName = newReservaData.unidad.split(' ')[0];
      const camping = campings.find(c => c.name.startsWith(campingName));
      
      if (camping) {
        const selectedDynPlan = dynamicPlans.find(p => p.nombre === newReservaData.plan);
        const price = selectedDynPlan ? (selectedDynPlan.precios?.[camping.typeId.toString()] || 0) : 0;

        const start = new Date(newReservaData.fecha_inicio);
        const end = new Date(newReservaData.fecha_fin);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (nights > 0 && price > 0) {
          const calculatedTotal = price * nights;
          setNewReservaData(prev => ({ ...prev, total: calculatedTotal }));
        }
      }
    }
  }, [newReservaData.fecha_inicio, newReservaData.fecha_fin, newReservaData.unidad, newReservaData.plan, dynamicPlans]);

  useEffect(() => {
    fetchReservas();
    fetchPlanBlocks();
    fetchDynamicPlans();
    fetchDynamicCampings();
    fetchDynamicAddons();
    fetch("/api/settings").then(r => r.json()).then(d => { if (d.heroMedia) setHeroSettings(d.heroMedia); }).catch(() => {});
    fetch("/api/tarifas").then(r => r.json()).then(d => setTarifasData(d)).catch(() => {});
  }, []);

  const fetchDynamicCampings = async () => {
    try {
      const response = await fetch("/api/campings");
      if (response.ok) setDynamicCampings(await response.json());
    } catch (error) { console.error("Error fetching campings:", error); }
  };

  const fetchDynamicAddons = async () => {
    try {
      const response = await fetch("/api/addons");
      if (response.ok) setDynamicAddons(await response.json());
    } catch (error) { console.error("Error fetching addons:", error); }
  };

  const handleSaveCamping = async () => {
    try {
      const { newFeature, ...campingData } = campingForm as any;
      const url = `/api/campings/${editingCamping.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campingData)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Camping actualizado correctamente" });
        setIsCampingModalOpen(false);
        fetchDynamicCampings();
      } else {
        toast({ title: "Error", description: data.error || "No se pudo actualizar el camping", variant: "destructive" });
      }
    } catch (error) { toast({ title: "Error", description: "Error de conexión", variant: "destructive" }); }
  };

  const handleSaveAddon = async () => {
    if (!addonForm.title.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }
    try {
      const url = editingAddon ? `/api/addons/${editingAddon.id}` : "/api/addons";
      const method = editingAddon ? "PUT" : "POST";
      const { newDetail, ...addonData } = addonForm;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonData)
      });
      if (response.ok) {
        toast({ title: "Éxito", description: editingAddon ? "Adicional actualizado" : "Adicional creado" });
        setIsAddonModalOpen(false);
        fetchDynamicAddons();
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.error || "No se pudo guardar", variant: "destructive" });
      }
    } catch (error) { toast({ title: "Error", description: "Error de conexión", variant: "destructive" }); }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm("¿Eliminar este adicional?")) return;
    try {
      const response = await fetch(`/api/addons/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast({ title: "Éxito", description: "Adicional eliminado" });
        fetchDynamicAddons();
      }
    } catch (error) { toast({ title: "Error", description: "Error de conexión", variant: "destructive" }); }
  };
  
  const fetchPlanBlocks = async () => {
    try {
      const response = await fetch("/api/plan-blocks");
      if (response.ok) {
        const data = await response.json();
        setPlanBlocks(data);
      }
    } catch (error) {
      console.error("Error fetching plan blocks:", error);
    }
  };

  const handleCreatePlanBlock = async () => {
    setPlanBlockError(null);
    
    if (!planBlockForm.planId || planBlockForm.campingIds.length === 0 || !planBlockForm.fechaInicio || !planBlockForm.fechaFin) {
      setPlanBlockError("Por favor complete todos los campos");
      return;
    }

    const normalizedForm = {
      ...planBlockForm,
      fechaInicio: planBlockForm.fechaInicio.includes('T') ? planBlockForm.fechaInicio : planBlockForm.fechaInicio + 'T12:00:00',
      fechaFin: planBlockForm.fechaFin.includes('T') ? planBlockForm.fechaFin : planBlockForm.fechaFin + 'T12:00:00'
    };

    try {
      const response = await fetch("/api/plan-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo de plan creado correctamente" });
        setIsPlanBlockModalOpen(false);
        setPlanBlockForm({ planId: "", campingIds: [], fechaInicio: "", fechaFin: "" });
        fetchPlanBlocks();
      } else {
        setPlanBlockError(data.error || "Error al crear bloqueo");
      }
    } catch (error) {
      setPlanBlockError("Error de conexión");
    }
  };

  const handleDeletePlanBlock = async (id: string) => {
    try {
      const response = await fetch(`/api/plan-blocks/${id}`, { method: "DELETE" });
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo eliminado" });
        fetchPlanBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const fetchUnitBlocks = async () => {
    try {
      const response = await fetch("/api/unit-blocks");
      if (response.ok) {
        const data = await response.json();
        setUnitBlocks(data);
      }
    } catch (error) {
      console.error("Error fetching unit blocks:", error);
    }
  };

  const handleCreateUnitBlock = async () => {
    if (!unitBlockForm.unitName) {
      toast({ title: "Error", description: "Selecciona una unidad", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/unit-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitName: unitBlockForm.unitName,
          motivo: unitBlockForm.motivo || "Inhabilitada",
          fechaInicio: unitBlockForm.fechaInicio || null,
          fechaFin: unitBlockForm.fechaFin || null
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Unidad inhabilitada correctamente" });
        setIsUnitBlockModalOpen(false);
        setUnitBlockForm({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });
        fetchUnitBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleDeleteUnitBlock = async (id: string) => {
    try {
      const response = await fetch(`/api/unit-blocks/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Bloqueo de unidad eliminado" });
        fetchUnitBlocks();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const allUnits = campings.map(c => c.name);

  useEffect(() => {
    fetchUnitBlocks();
  }, []);

  const toggleCampingSelection = (typeId: number) => {
    setPlanBlockForm(prev => ({
      ...prev,
      campingIds: prev.campingIds.includes(typeId)
        ? prev.campingIds.filter(id => id !== typeId)
        : [...prev.campingIds, typeId]
    }));
  };

  const getCampingTypeName = (typeId: number) => {
    const typeMap: Record<number, string> = { 1: "Aura VIP", 2: "Árbol", 3: "Nido" };
    return typeMap[typeId] || `Tipo ${typeId}`;
  };

  const getPlanName = (planId: string) => {
    const plan = dynamicPlans.find(p => p.id === planId);
    return plan?.nombre || planId;
  };

  const fetchDynamicPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      if (response.ok) {
        const data = await response.json();
        setDynamicPlans(data);
      }
    } catch (error) {
      console.error("Error fetching dynamic plans:", error);
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      nombre: "",
      eslogan: "",
      descripcion: "",
      tipo: "normal",
      icono: "Sparkles",
      color: "#8B5A2B",
      fechaInicio: "",
      fechaFin: "",
      preventa: false,
      desactivarOtros: false,
      precios: { "1": 0, "2": 0, "3": 0 },
      incluye: [],
      newIncluye: "",
      bannerImage: ""
    });
    setEditingPlan(null);
    setPlanFormError(null);
  };

  const openEditPlan = (plan: DynamicPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      nombre: plan.nombre,
      eslogan: plan.eslogan,
      descripcion: plan.descripcion || "",
      tipo: plan.tipo,
      icono: plan.icono || "Sparkles",
      color: plan.color || "#8B5A2B",
      fechaInicio: plan.fechaInicio || "",
      fechaFin: plan.fechaFin || "",
      preventa: plan.preventa || false,
      desactivarOtros: false,
      precios: plan.precios || { "1": 0, "2": 0, "3": 0 },
      incluye: plan.incluye || [],
      newIncluye: "",
      bannerImage: (plan as any).bannerImage || ""
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    setPlanFormError(null);
    
    if (!planForm.nombre || !planForm.eslogan || !planForm.tipo) {
      setPlanFormError("Por favor complete los campos obligatorios");
      return;
    }

    if (!planForm.precios["1"] || !planForm.precios["2"] || !planForm.precios["3"]) {
      setPlanFormError("Debe definir precios para todos los tipos de camping");
      return;
    }

    if (planForm.tipo === "temporada" && (!planForm.fechaInicio || !planForm.fechaFin)) {
      setPlanFormError("Los planes de temporada requieren fechas de inicio y fin");
      return;
    }

    try {
      const payload = {
        nombre: planForm.nombre,
        eslogan: planForm.eslogan,
        descripcion: planForm.descripcion,
        tipo: planForm.tipo,
        icono: planForm.icono,
        color: planForm.color,
        fechaInicio: planForm.tipo === "temporada" ? (planForm.fechaInicio.includes('T') ? planForm.fechaInicio : planForm.fechaInicio + 'T12:00:00') : null,
        fechaFin: planForm.tipo === "temporada" ? (planForm.fechaFin.includes('T') ? planForm.fechaFin : planForm.fechaFin + 'T12:00:00') : null,
        preventa: planForm.tipo === "preventa",
        precios: planForm.precios,
        incluye: planForm.incluye,
        desactivarOtros: planForm.desactivarOtros,
        bannerImage: planForm.bannerImage || null
      };

      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: editingPlan ? "Plan actualizado correctamente" : "Plan creado correctamente" });
        setIsPlanModalOpen(false);
        resetPlanForm();
        fetchDynamicPlans();
      } else {
        setPlanFormError(data.error || "Error al guardar plan");
      }
    } catch (error) {
      setPlanFormError("Error de conexión");
    }
  };

  const handleTogglePlan = async (planId: string, desactivarOtros: boolean = false) => {
    try {
      const response = await fetch(`/api/plans/${planId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desactivarOtros })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: `Plan ${data.plan.estado ? 'activado' : 'desactivado'}` });
        fetchDynamicPlans();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Está seguro de eliminar este plan? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Éxito", description: "Plan eliminado" });
        fetchDynamicPlans();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const addIncluye = () => {
    if (planForm.newIncluye.trim()) {
      setPlanForm(prev => ({
        ...prev,
        incluye: [...prev.incluye, prev.newIncluye.trim()],
        newIncluye: ""
      }));
    }
  };

  const removeIncluye = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      incluye: prev.incluye.filter((_, i) => i !== index)
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
  };

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/listar-reservas.php", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      // Comentar validación estricta de 403 para asegurar visibilidad en dev
      /*
      if (response.status === 403) {
        console.warn("Acceso denegado de la API");
        return;
      }
      */
      const data = await response.json();
      console.log("Datos recibidos de la API:", data);
      if (Array.isArray(data)) {
        setReservas(data);
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "Error", description: "No se pudieron cargar las reservas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const handleCreateManualReserva = async () => {
    try {
      const normalizedData = {
        ...newReservaData,
        fecha_inicio: newReservaData.fecha_inicio.substring(0, 10) + 'T12:00:00',
        fecha_fin: newReservaData.fecha_fin.substring(0, 10) + 'T12:00:00'
      };
      const response = await fetch("/api/crear-reserva-manual.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Reserva manual creada" });
        setIsNewReservaModalOpen(false);
        fetchReservas();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const generateBookingReceipt = (reserva: Reserva) => {
    const rawAdicionales = reserva.adicionales;
    let addonIds: string[] = [];
    if (Array.isArray(rawAdicionales)) {
      addonIds = rawAdicionales;
    } else if (typeof rawAdicionales === "string") {
      try { addonIds = JSON.parse(rawAdicionales); } catch { addonIds = []; }
    }
    const addonNames = dynamicAddons.filter((a: any) => addonIds.includes(a.id)).map((a: any) => a.title);
    const cedulaRow = reserva.cedula ? 1 : 0;
    const extraHeight = addonNames.length > 0 ? 60 + addonNames.length * 28 : 0;
    const canvasHeight = 1000 + extraHeight + cedulaRow * 45;

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
    
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return format(date, "dd 'de' MMMM yyyy", { locale: es });
      } catch {
        return dateStr;
      }
    };
    
    const details = [
      { label: "Referencia", value: reserva.referencia || "---" },
      { label: "Huésped", value: reserva.nombre || "---" },
      ...(reserva.cedula ? [{ label: "Cédula", value: reserva.cedula }] : []),
      { label: "Plan", value: reserva.plan || "---" },
      { label: "Alojamiento", value: reserva.unidad || "---" },
      { label: "Check-in", value: formatDate(reserva.fecha_inicio) },
      { label: "Check-out", value: formatDate(reserva.fecha_fin) },
      { label: "Total", value: `$${(reserva.total || 0).toLocaleString()} COP` },
      { label: "Abono", value: `$${(reserva.abono || 0).toLocaleString()} COP` },
      { label: "Saldo pendiente", value: `$${(reserva.saldo || 0).toLocaleString()} COP` },
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

    if (addonNames.length > 0) {
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
      addonNames.forEach((name) => {
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
    ctx.fillText("Check-in: 3:00 PM - 6:00 PM  |  Check-out: antes de 11:30 AM", 100, y + 60);
    ctx.fillStyle = "#6B7280";
    ctx.font = "12px Arial";
    ctx.fillText("El saldo pendiente se cancela al llegar a Oná.", 100, y + 90);
    ctx.fillText("Presenta esta imagen al momento de tu llegada.", 100, y + 110);
    
    ctx.fillStyle = "#5C4033";
    ctx.font = "italic 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("San Antonio del Tequendama, Cundinamarca - Colombia", 400, canvasHeight - 50);
    ctx.fillText("WhatsApp: +57 319 249 7753", 400, canvasHeight - 30);
    
    const imageUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `reserva-ona-${reserva.referencia}.png`;
    link.click();
    
    toast({ title: "Comprobante generado", description: "El comprobante se ha descargado correctamente." });
  };

  const handleAction = async (endpoint: string, payload: any) => {
    // Validación de fechas para el bloqueo
    if (endpoint === "bloquear-fecha.php") {
      if (!payload.fecha_inicio || !payload.fecha_fin) {
        toast({ title: "Error", description: "Por favor selecciona ambas fechas", variant: "destructive" });
        return;
      }
      
      // Normalizar fechas para comparación (solo YYYY-MM-DD)
      const start = payload.fecha_inicio;
      const end = payload.fecha_fin;
      
      if (start < today) {
        toast({ title: "Error", description: "No puedes bloquear fechas pasadas", variant: "destructive" });
        return;
      }
      
      if (end < start) {
        toast({ title: "Error", description: "La fecha de fin no puede ser anterior a la de inicio", variant: "destructive" });
        return;
      }
    }

    try {
      const normalizedPayload = {
        ...payload,
        fecha_inicio: (payload.fecha_inicio || "").substring(0, 10) + 'T12:00:00',
        fecha_fin: (payload.fecha_fin || "").substring(0, 10) + 'T12:00:00'
      };
      
      console.log("Enviando payload a", endpoint, normalizedPayload);
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(normalizedPayload)
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: "Operación realizada correctamente" });
        setIsModalOpen(false);
        setIsBlockModalOpen(false);
        fetchReservas();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedReservas.length === 0) return;
    
    const referencias = reservas
      .filter(r => selectedReservas.includes(r.id))
      .map(r => r.referencia);

    try {
      const response = await fetch("/api/bulk-actions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, referencias })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Éxito", description: `${selectedReservas.length} registros procesados.` });
        setSelectedReservas([]);
        fetchReservas();
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al procesar acción masiva", variant: "destructive" });
    }
  };

  const getStatusBadge = (estado: number) => {
    switch (estado) {
      case 1: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case 2: return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Abonado</Badge>;
      case 3: return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      case 4: return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>;
      default: return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const filteredReservas = reservas.filter(r => {
    const matchesText = r.nombre.toLowerCase().includes(filter.toLowerCase()) || 
                       r.referencia.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.estado.toString() === statusFilter;
    const matchesCamping = campingFilter === "all" || r.camping === campingFilter;
    // No filtrar por plan !== "BLOQUEO ADMIN" aquí si queremos que aparezcan en el conteo total o debug
    return matchesText && matchesStatus && matchesCamping;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "fecha":
        comparison = new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
        break;
      case "tipo_camping":
        comparison = a.camping.localeCompare(b.camping);
        break;
      case "estado":
        comparison = a.estado - b.estado;
        break;
      case "tipo_plan":
        comparison = a.plan.localeCompare(b.plan);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/logout.php", { method: "POST" });
      setLocation("/admin/login");
    } catch (error) {
      setLocation("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              onClick={() => setViewMode("list")}
              className="rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" /> Lista
            </Button>
            <Button 
              variant={viewMode === "calendar" ? "default" : "outline"} 
              onClick={() => setViewMode("calendar")}
              className="rounded-xl"
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> Calendario
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white border-accent text-accent hover:bg-accent hover:text-white" onClick={() => setIsBlockModalOpen(true)}>
              <Lock className="w-4 h-4 mr-2" /> Bloquear Fechas
            </Button>
            <Button variant="outline" className="bg-primary text-white hover:bg-primary/90" onClick={() => setIsNewReservaModalOpen(true)}>
              <CalendarIcon className="w-4 h-4 mr-2" /> Nueva Reserva
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}><ChevronLeft className="w-4 h-4 mr-2" /> Sitio Web</Button>
            <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Salir</Button>
          </div>
        </div>

        <Tabs defaultValue="reservas" className="w-full">
          {viewMode === "list" && (
            <TabsList className="flex flex-wrap gap-1 mb-8 bg-stone-100 rounded-xl p-1 h-auto">
              <TabsTrigger value="reservas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Reservas</TabsTrigger>
              <TabsTrigger value="planes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Planes</TabsTrigger>
              <TabsTrigger value="campings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Campings</TabsTrigger>
              <TabsTrigger value="addons" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Adicionales</TabsTrigger>
              <TabsTrigger value="bloqueos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bloqueos</TabsTrigger>
              <TabsTrigger value="plan-blocks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Restricciones</TabsTrigger>
              <TabsTrigger value="unit-blocks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Inhabilitar</TabsTrigger>
              <TabsTrigger value="inicio" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">🏔 Inicio</TabsTrigger>
              <TabsTrigger value="tarifas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">💰 Tarifas</TabsTrigger>
            </TabsList>
          )}

          {viewMode === "list" ? (
            <>
              <TabsContent value="reservas">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                <div className="flex flex-1 gap-4">
                  <div className="flex-1 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input 
                      placeholder="Buscar por cliente o referencia..." 
                      className="pl-10 rounded-xl"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="1">Pendiente</SelectItem>
                      <SelectItem value="2">Abonado</SelectItem>
                      <SelectItem value="3">Cancelado</SelectItem>
                      <SelectItem value="4">Completado</SelectItem>
                      <SelectItem value="5">Oculto</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="w-[160px] h-9 border-none bg-transparent shadow-none focus:ring-0">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fecha">Fecha</SelectItem>
                        <SelectItem value="tipo_camping">Camping</SelectItem>
                        <SelectItem value="estado">Estado</SelectItem>
                        <SelectItem value="tipo_plan">Plan</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 rounded-lg hover:bg-white hover:shadow-sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      title={sortOrder === "asc" ? "Menor a Mayor" : "Mayor a Menor"}
                    >
                      {sortOrder === "asc" ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4 -rotate-90" />}
                    </Button>
                  </div>
                </div>
                
                {selectedReservas.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-xs font-bold px-2">{selectedReservas.length} seleccionados</span>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleBulkAction('delete')}>
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-700 hover:bg-stone-100" onClick={() => handleBulkAction('hide')}>
                      <EyeOff className="w-4 h-4 mr-1" /> Ocultar
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <button 
                          onClick={() => {
                            const visibleIds = filteredReservas.filter(r => r.plan !== "BLOQUEO ADMIN").map(r => r.id);
                            if (selectedReservas.length === visibleIds.length) {
                              setSelectedReservas([]);
                            } else {
                              setSelectedReservas(visibleIds);
                            }
                          }}
                        >
                          {selectedReservas.length > 0 ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4 text-stone-300" />}
                        </button>
                      </TableHead>
                      <TableHead className="font-bold">Referencia</TableHead>
                      <TableHead className="font-bold">Cliente</TableHead>
                      <TableHead className="font-bold">Creada el</TableHead>
                      <TableHead className="font-bold">Estancia</TableHead>
                      <TableHead className="font-bold">Unidad</TableHead>
                      <TableHead className="font-bold">Total / Saldo</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservas.filter(r => r.plan !== "BLOQUEO ADMIN" && r.estado !== 5).map((reserva) => (
                      <TableRow 
                        key={reserva.id} 
                        className={cn("hover:bg-stone-50/50 cursor-pointer", selectedReservas.includes(reserva.id) && "bg-stone-50")}
                        onClick={() => {
                          if (selectedReservas.includes(reserva.id)) {
                            setSelectedReservas(selectedReservas.filter(id => id !== reserva.id));
                          } else {
                            setSelectedReservas([...selectedReservas, reserva.id]);
                          }
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => {
                            if (selectedReservas.includes(reserva.id)) {
                              setSelectedReservas(selectedReservas.filter(id => id !== reserva.id));
                            } else {
                              setSelectedReservas([...selectedReservas, reserva.id]);
                            }
                          }}>
                            {selectedReservas.includes(reserva.id) ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4 text-stone-300" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold">{reserva.referencia}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-900">{reserva.nombre}</span>
                            <span className="text-[10px] uppercase tracking-tighter text-stone-400">{reserva.plan}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-stone-500">
                            {reserva.created_at ? format(new Date(reserva.created_at), "dd/MM/yy HH:mm", { locale: es }) : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-stone-600">
                            {format(new Date(reserva.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(reserva.fecha_fin), "dd MMM", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tent className="w-4 h-4 text-accent" />
                            <span className="text-sm font-bold">{reserva.unidad}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">${reserva.total.toLocaleString()}</span>
                            <span className="text-[10px] text-red-500">Saldo: ${reserva.saldo.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(reserva.estado)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedReserva(reserva); setIsModalOpen(true); }}><MoreVertical className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campings">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-serif text-primary mb-6">Gestión de Campings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dynamicCampings.map(c => (
                  <div key={c.id} className="border rounded-2xl p-4 flex gap-4 items-start">
                    <img src={c.image} alt={c.name} className="w-24 h-24 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      <p className="text-sm text-stone-500 line-clamp-2">{c.description}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                        setEditingCamping(c);
                        setCampingForm({ ...c, images: c.images || [], videos: c.videos || [], newFeature: "" });
                        setIsCampingModalOpen(true);
                      }}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="addons">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-primary">Adicionales</h2>
                </div>
                <Button
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium"
                  onClick={() => {
                    setEditingAddon(null);
                    setAddonForm({ title: "", price: 0, description: "", details: [], newDetail: "", allowMultiple: false, multipleLabel: "", maxQuantity: null, media: [] });
                    setIsAddonModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Nuevo adicional
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicAddons.map(a => (
                  <div key={a.id} className="border border-stone-200 rounded-2xl p-5 flex flex-col gap-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-stone-800 text-sm leading-snug">{a.title}</h3>
                        {a.description && (
                          <p className="text-[12px] text-stone-400 mt-0.5 leading-snug">{a.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-stone-800 shrink-0">
                        ${(a.price || 0).toLocaleString("es-CO")}
                      </span>
                    </div>
                    {(a.details || []).length > 0 && (
                      <ul className="space-y-0.5">
                        {(a.details || []).map((d: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-stone-500">
                            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 text-xs font-medium rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50"
                        onClick={() => {
                          setEditingAddon(a);
                          const base = { title: "", price: 0, description: "", details: [], allowMultiple: false, multipleLabel: "", maxQuantity: null, media: [], ...a };
                          setAddonForm({ ...base, media: base.media || [], details: base.details || [], maxQuantity: base.maxQuantity ?? null, newDetail: "" });
                          setIsAddonModalOpen(true);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 shrink-0"
                        onClick={() => handleDeleteAddon(a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planes">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Gestión de Planes</h2>
                <Button 
                  variant="outline" 
                  className="bg-accent text-white hover:bg-accent/90" 
                  onClick={() => { resetPlanForm(); setIsPlanModalOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Crear Nuevo Plan
                </Button>
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="font-bold">Plan</TableHead>
                      <TableHead className="font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="font-bold">Precios</TableHead>
                      <TableHead className="font-bold">Fechas</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                          No hay planes configurados. Crea el primero.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dynamicPlans.map((plan) => {
                        const IconComp = getIconComponent(plan.icono);
                        return (
                          <TableRow key={plan.id} className="hover:bg-stone-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: `${plan.color}20` }}
                                >
                                  <IconComp className="w-5 h-5" style={{ color: plan.color }} />
                                </div>
                                <div>
                                  <p className="font-bold text-primary">{plan.nombre}</p>
                                  <p className="text-xs text-stone-500">{plan.eslogan}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-bold uppercase",
                                  plan.tipo === "normal" && "border-stone-300 text-stone-600",
                                  plan.tipo === "temporada" && "border-orange-300 bg-orange-50 text-orange-600",
                                  plan.tipo === "preventa" && "border-purple-300 bg-purple-50 text-purple-600"
                                )}
                              >
                                {plan.tipo === "preventa" && "🏷️ "}
                                {plan.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={plan.estado ? "default" : "secondary"}
                                className={cn(
                                  plan.estado ? "bg-green-500 hover:bg-green-600" : "bg-stone-300"
                                )}
                              >
                                {plan.estado ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div><span className="text-stone-400">Aura:</span> {formatPrice(plan.precios["1"])}</div>
                                <div><span className="text-stone-400">Árbol:</span> {formatPrice(plan.precios["2"])}</div>
                                <div><span className="text-stone-400">Nido:</span> {formatPrice(plan.precios["3"])}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin ? (
                                <div className="text-xs">
                                  <div>{format(new Date(plan.fechaInicio), "dd MMM", { locale: es })}</div>
                                  <div className="text-stone-400">→</div>
                                  <div>{format(new Date(plan.fechaFin), "dd MMM yyyy", { locale: es })}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-400">Sin límite</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-stone-600 hover:text-primary"
                                  onClick={() => openEditPlan(plan)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className={cn(
                                    plan.estado 
                                      ? "text-red-500 hover:text-red-700 hover:bg-red-50" 
                                      : "text-green-500 hover:text-green-700 hover:bg-green-50"
                                  )}
                                  onClick={() => handleTogglePlan(plan.id)}
                                >
                                  <Power className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bloqueos">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Fechas Bloqueadas (Admin)</h2>
                <Button variant="outline" className="bg-white border-accent text-accent hover:bg-accent hover:text-white" onClick={() => setIsBlockModalOpen(true)}>
                  <Lock className="w-4 h-4 mr-2" /> Nuevo Bloqueo
                </Button>
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="font-bold">Referencia</TableHead>
                      <TableHead className="font-bold">Unidad</TableHead>
                      <TableHead className="font-bold">Desde</TableHead>
                      <TableHead className="font-bold">Hasta</TableHead>
                      <TableHead className="font-bold">Creado el</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.filter(r => r.plan === "BLOQUEO ADMIN").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">No hay bloqueos activos</TableCell>
                      </TableRow>
                    ) : (
                      reservas.filter(r => r.plan === "BLOQUEO ADMIN").map((bloqueo) => (
                        <TableRow key={bloqueo.id} className="hover:bg-stone-50/50">
                          <TableCell className="font-mono text-xs font-bold">{bloqueo.referencia}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tent className="w-4 h-4 text-accent" />
                              <span className="text-sm font-bold">{bloqueo.unidad}</span>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(bloqueo.fecha_inicio), "dd MMM yyyy", { locale: es })}</TableCell>
                          <TableCell>{format(new Date(bloqueo.fecha_fin), "dd MMM yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-xs text-stone-500">
                            {bloqueo.created_at ? format(new Date(bloqueo.created_at), "dd/MM/yy HH:mm", { locale: es }) : "Reciente"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("¿Está seguro de eliminar este bloqueo definitivamente?")) {
                                  handleAction("cancelar-reserva.php", { referencia: bloqueo.referencia });
                                }
                              }}
                            >
                              <Unlock className="w-4 h-4 mr-2" /> Desbloquear
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plan-blocks">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Bloqueo de Planes por Camping</h2>
                <Button 
                  variant="outline" 
                  className="bg-white border-accent text-accent hover:bg-accent hover:text-white" 
                  onClick={() => setIsPlanBlockModalOpen(true)}
                >
                  <Lock className="w-4 h-4 mr-2" /> Nuevo Bloqueo de Plan
                </Button>
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="font-bold">Plan</TableHead>
                      <TableHead className="font-bold">Campings</TableHead>
                      <TableHead className="font-bold">Desde</TableHead>
                      <TableHead className="font-bold">Hasta</TableHead>
                      <TableHead className="font-bold">Creado</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planBlocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                          No hay bloqueos de planes activos
                        </TableCell>
                      </TableRow>
                    ) : (
                      planBlocks.map((block) => (
                        <TableRow key={block.id} className="hover:bg-stone-50/50">
                          <TableCell className="font-medium">{getPlanName(block.planId)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {block.campingIds.map(typeId => (
                                <Badge key={typeId} variant="outline" className="text-xs">
                                  {getCampingTypeName(typeId)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{block.fechaInicio ? format(new Date(block.fechaInicio.includes('T') ? block.fechaInicio : block.fechaInicio + 'T12:00:00'), "dd/MM/yyyy", { locale: es }) : "---"}</TableCell>
                          <TableCell>{block.fechaFin ? format(new Date(block.fechaFin.includes('T') ? block.fechaFin : block.fechaFin + 'T12:00:00'), "dd/MM/yyyy", { locale: es }) : "---"}</TableCell>
                          <TableCell className="text-xs text-stone-500">
                            {format(new Date(block.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePlanBlock(block.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unit-blocks">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-primary">Inhabilitar Unidades de Camping</h2>
                <Button 
                  variant="outline" 
                  className="bg-white border-accent text-accent hover:bg-accent hover:text-white" 
                  onClick={() => setIsUnitBlockModalOpen(true)}
                >
                  <Lock className="w-4 h-4 mr-2" /> Inhabilitar Unidad
                </Button>
              </div>

              <div className="rounded-xl border border-stone-100 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead className="font-bold">Unidad</TableHead>
                      <TableHead className="font-bold">Motivo</TableHead>
                      <TableHead className="font-bold">Desde</TableHead>
                      <TableHead className="font-bold">Hasta</TableHead>
                      <TableHead className="font-bold">Creado</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitBlocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-stone-500">
                          No hay unidades inhabilitadas
                        </TableCell>
                      </TableRow>
                    ) : (
                      unitBlocks.map((block) => (
                        <TableRow key={block.id} className="hover:bg-stone-50/50">
                          <TableCell className="font-medium">{block.unitName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              {block.motivo}
                            </Badge>
                          </TableCell>
                          <TableCell>{block.fechaInicio ? format(new Date(block.fechaInicio.includes('T') ? block.fechaInicio : block.fechaInicio + 'T12:00:00'), "dd/MM/yyyy", { locale: es }) : "Indefinido"}</TableCell>
                          <TableCell>{block.fechaFin ? format(new Date(block.fechaFin.includes('T') ? block.fechaFin : block.fechaFin + 'T12:00:00'), "dd/MM/yyyy", { locale: es }) : "Indefinido"}</TableCell>
                          <TableCell className="text-xs text-stone-500">
                            {format(new Date(block.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleDeleteUnitBlock(block.id)}
                            >
                              <Unlock className="w-4 h-4 mr-1" /> Habilitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ── INICIO TAB ── */}
          <TabsContent value="inicio">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 max-w-2xl mx-auto space-y-8">
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-1">Fondo de la Página de Inicio</h3>
                <p className="text-sm text-stone-500">Sube una imagen o video para el fondo del hero. El cambio se verá reflejado inmediatamente en la página principal.</p>
              </div>

              {/* Preview */}
              {heroSettings.url && (
                <div className="relative rounded-2xl overflow-hidden h-48 bg-stone-100">
                  {heroSettings.type === "video" ? (
                    <video src={heroSettings.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={heroSettings.url} alt="Hero actual" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {heroSettings.type === "video" ? "Video actual" : "Imagen actual"}
                  </div>
                  <button
                    onClick={async () => {
                      const updated = { type: "image", url: "" };
                      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heroMedia: updated }) });
                      setHeroSettings(updated);
                      toast({ title: "Fondo eliminado", description: "Se restauró el fondo por defecto." });
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload image */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-stone-700">Subir imagen de fondo</p>
                  <input type="file" id="hero-image-upload" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setHeroUploading(true);
                    const fd = new FormData();
                    fd.append("media", file);
                    try {
                      const res = await fetch("/api/upload/media", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.url) {
                        const updated = { type: "image", url: data.url };
                        await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heroMedia: updated }) });
                        setHeroSettings(updated);
                        toast({ title: "Imagen actualizada", description: "El fondo se actualizó correctamente." });
                      }
                    } catch { toast({ title: "Error", description: "No se pudo subir la imagen.", variant: "destructive" }); }
                    finally { setHeroUploading(false); e.target.value = ""; }
                  }} />
                  <Button variant="outline" size="sm" disabled={heroUploading} className="w-full" onClick={() => document.getElementById("hero-image-upload")?.click()}>
                    {heroUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo...</> : <><Upload className="w-4 h-4 mr-1" /> Subir imagen</>}
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-stone-700">Subir video de fondo</p>
                  <p className="text-xs text-stone-400">Máx. 200 MB. Puede tardar.</p>
                  <input type="file" id="hero-video-upload" accept="video/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setHeroUploading(true);
                    const fd = new FormData();
                    fd.append("media", file);
                    try {
                      const res = await fetch("/api/upload/media", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.url) {
                        const updated = { type: "video", url: data.url };
                        await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heroMedia: updated }) });
                        setHeroSettings(updated);
                        toast({ title: "Video actualizado", description: "El fondo de video se actualizó correctamente." });
                      }
                    } catch { toast({ title: "Error", description: "No se pudo subir el video.", variant: "destructive" }); }
                    finally { setHeroUploading(false); e.target.value = ""; }
                  }} />
                  <Button variant="outline" size="sm" disabled={heroUploading} className="w-full" onClick={() => document.getElementById("hero-video-upload")?.click()}>
                    {heroUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo... (puede tardar)</> : <><Upload className="w-4 h-4 mr-1" /> Subir video</>}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TARIFAS TAB ── */}
          <TabsContent value="tarifas">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 max-w-3xl mx-auto space-y-8">
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-1">Configuración de Tarifas</h3>
                <p className="text-sm text-stone-500">Define un valor adicional (en COP) que se suma al precio del plan según el tipo de día en que cae la reserva.</p>
              </div>

              {/* Surcharge cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "entreSemana", label: "Entre Semana", desc: "Lunes a jueves" },
                  { key: "viernesODomingo", label: "Viernes o Domingo", desc: "Viernes y domingos regulares" },
                  { key: "sabadoFestivo", label: "Sábado / Festivo", desc: "Sábados y días festivos" }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="rounded-2xl border border-stone-200 p-5 space-y-3 bg-stone-50">
                    <div>
                      <p className="font-bold text-stone-700 text-sm">{label}</p>
                      <p className="text-xs text-stone-400">{desc}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        min={0}
                        value={(tarifasData as any)[key]}
                        onChange={(e) => setTarifasData(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-7 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Festivos list */}
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-stone-700">Días Festivos (fecha exacta)</p>
                  <p className="text-xs text-stone-400">Formato: YYYY-MM-DD, ej: 2025-12-25. Se aplica tarifa de Sábado/Festivo.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newFestivo}
                    onChange={(e) => setNewFestivo(e.target.value)}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (!newFestivo || tarifasData.diasFestivos.includes(newFestivo)) return;
                    setTarifasData(prev => ({ ...prev, diasFestivos: [...prev.diasFestivos, newFestivo].sort() }));
                    setNewFestivo("");
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tarifasData.diasFestivos.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-100">
                    {tarifasData.diasFestivos.map((d) => (
                      <span key={d} className="flex items-center gap-1 bg-white border border-stone-200 rounded-full px-3 py-1 text-xs text-stone-700">
                        {d}
                        <button onClick={() => setTarifasData(prev => ({ ...prev, diasFestivos: prev.diasFestivos.filter(x => x !== d) }))} className="text-red-400 hover:text-red-600 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Fechas especiales anuales */}
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-stone-700">Fechas Especiales Anuales</p>
                  <p className="text-xs text-stone-400">Formato: MM-DD, ej: 12-25. Se repite cada año. Se aplica tarifa de Sábado/Festivo.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MM-DD"
                    maxLength={5}
                    value={newEspecial}
                    onChange={(e) => setNewEspecial(e.target.value.replace(/[^0-9-]/g, ""))}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    if (!newEspecial.match(/^\d{2}-\d{2}$/) || tarifasData.fechasEspeciales.includes(newEspecial)) return;
                    setTarifasData(prev => ({ ...prev, fechasEspeciales: [...prev.fechasEspeciales, newEspecial].sort() }));
                    setNewEspecial("");
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tarifasData.fechasEspeciales.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-100">
                    {tarifasData.fechasEspeciales.map((d) => (
                      <span key={d} className="flex items-center gap-1 bg-white border border-stone-200 rounded-full px-3 py-1 text-xs text-stone-700">
                        {d}
                        <button onClick={() => setTarifasData(prev => ({ ...prev, fechasEspeciales: prev.fechasEspeciales.filter(x => x !== d) }))} className="text-red-400 hover:text-red-600 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-3"
                disabled={tarifasSaving}
                onClick={async () => {
                  setTarifasSaving(true);
                  try {
                    const res = await fetch("/api/tarifas", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tarifasData) });
                    const data = await res.json();
                    if (data.success) toast({ title: "Tarifas guardadas", description: "Los cambios se aplicarán a nuevas reservas." });
                    else toast({ title: "Error", description: "No se pudieron guardar las tarifas.", variant: "destructive" });
                  } catch { toast({ title: "Error", description: "Error de conexión.", variant: "destructive" }); }
                  finally { setTarifasSaving(false); }
                }}
              >
                {tarifasSaving ? <><span className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" /> Guardando...</> : "Guardar Cambios"}
              </Button>
            </div>
          </TabsContent>
        </>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-bold capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <Select value={calFilter} onValueChange={(v: any) => setCalFilter(v)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="free">Solo Libres</SelectItem>
                  <SelectItem value="reserved">Solo Reservados</SelectItem>
                  <SelectItem value="blocked">Solo Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-7 gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                <div key={day} className="bg-stone-50 p-2 text-center text-xs font-bold text-stone-500 uppercase">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map(({ date, isCurrentMonth }, idx) => {
                const status = getDayStatus(date);
                const isFiltered = calFilter === "all" || calFilter === status.status;
                
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "min-h-[100px] bg-white p-2 transition-all relative group cursor-pointer",
                      !isCurrentMonth && "bg-stone-50 opacity-50",
                      !isFiltered && "grayscale opacity-30"
                    )}
                    onClick={() => {
                      const checkDate = new Date(date);
                      checkDate.setHours(12, 0, 0, 0);
                      const y = checkDate.getFullYear();
                      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
                      const d = String(checkDate.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      
                      const dayReservas = reservas.filter(r => {
                        const start = (r.fecha_inicio || "").substring(0, 10);
                        const end = (r.fecha_fin || "").substring(0, 10);
                        // Usar comparación de strings que es segura para fechas YYYY-MM-DD
                        return dateStr >= start && dateStr < end && r.estado !== 3;
                      });
                      if (dayReservas.length > 0) {
                        setSelectedDayReservas(dayReservas);
                        setIsDayReservasModalOpen(true);
                      }
                    }}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      (() => {
                        const d1 = new Date(date);
                        d1.setHours(12,0,0,0);
                        const d2 = new Date();
                        d2.setHours(12,0,0,0);
                        return d1.getTime() === d2.getTime();
                      })() && "bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full"
                    )}>
                      {date.getDate()}
                    </span>
                    
                    <div className={cn(
                      "mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase truncate",
                      status.color
                    )}>
                      {status.label}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-6 text-xs text-stone-500 justify-center border-t border-stone-100 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Disponible
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" /> Reservado
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Bloqueado
              </div>
            </div>
          </div>
        </div>
      )}
    </Tabs>
      </div>

      <Dialog open={isCampingModalOpen} onOpenChange={setIsCampingModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem]">
          <DialogHeader><DialogTitle>Editar Camping: {campingForm.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={campingForm.name} onChange={e => setCampingForm({...campingForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <textarea className="w-full rounded-xl border p-3 text-sm min-h-[100px]" value={campingForm.description} onChange={e => setCampingForm({...campingForm, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Características (Separadas por coma)</Label>
              <Input value={campingForm.features.join(", ")} onChange={e => setCampingForm({...campingForm, features: e.target.value.split(",").map(f => f.trim())})} />
            </div>
            <div className="space-y-2">
              <Label>Imagen Principal</Label>
              <Input value={campingForm.image} onChange={e => setCampingForm({...campingForm, image: e.target.value})} placeholder="URL o sube una foto..." />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="main-image-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCampingUploading(true);
                    const fd = new FormData();
                    fd.append("image", file);
                    try {
                      const res = await fetch("/api/upload-camping-image", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.success && data.url) {
                        setCampingForm(prev => ({ ...prev, image: data.url }));
                        toast({ title: "Imagen subida" });
                      } else {
                        toast({ title: "Error al subir", description: data.error || "", variant: "destructive" });
                      }
                    } catch (err: any) {
                      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
                    }
                    setCampingUploading(false);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={campingUploading} onClick={() => document.getElementById("main-image-upload")?.click()}>
                  {campingUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo...</> : <><Plus className="w-4 h-4 mr-1" /> Subir foto</>}
                </Button>
              </div>
              {campingForm.image && (
                <img src={campingForm.image} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl border" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Galería de Imágenes</Label>
              <div className="space-y-2">
                {campingForm.images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={img}
                      onChange={e => {
                        const next = [...campingForm.images];
                        next[idx] = e.target.value;
                        setCampingForm({ ...campingForm, images: next });
                      }}
                      placeholder="URL de imagen..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCampingForm({ ...campingForm, images: campingForm.images.filter((_, i) => i !== idx) })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCampingForm({ ...campingForm, images: [...campingForm.images, ""] })}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar URL
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="gallery-image-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setCampingUploading(true);
                      toast({ title: `Subiendo ${files.length} imagen(es)...` });
                      const uploaded: string[] = [];
                      for (const file of files) {
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await fetch("/api/upload-camping-image", { method: "POST", body: fd });
                          const data = await res.json();
                          if (data.success && data.url) uploaded.push(data.url);
                        } catch {}
                      }
                      if (uploaded.length > 0) {
                        setCampingForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
                        toast({ title: `${uploaded.length} imagen(es) subida(s) ✓` });
                      } else {
                        toast({ title: "Error al subir las imágenes", variant: "destructive" });
                      }
                      setCampingUploading(false);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={campingUploading}
                    onClick={() => document.getElementById("gallery-image-upload")?.click()}
                  >
                    {campingUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo...</> : <><Plus className="w-4 h-4 mr-1" /> Subir fotos</>}
                  </Button>
                </div>
              </div>
              {campingForm.images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {campingForm.images.filter(Boolean).map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`preview-${idx}`} className="w-full h-20 object-cover rounded-lg border" />
                      <button
                        onClick={() => setCampingForm({...campingForm, images: campingForm.images.filter((_,i) => i !== idx)})}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Videos de Galería</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    id="gallery-video-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setCampingUploading(true);
                      toast({ title: `Subiendo ${files.length} video(s)... (puede tardar)` });
                      const uploaded: string[] = [];
                      for (const file of files) {
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await fetch("/api/upload-camping-image", { method: "POST", body: fd });
                          const data = await res.json();
                          if (data.success && data.url) uploaded.push(data.url);
                        } catch {}
                      }
                      if (uploaded.length > 0) {
                        setCampingForm(prev => ({ ...prev, videos: [...prev.videos, ...uploaded] }));
                        toast({ title: `${uploaded.length} video(s) subido(s) ✓` });
                      } else {
                        toast({ title: "Error al subir los videos", variant: "destructive" });
                      }
                      setCampingUploading(false);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={campingUploading}
                    onClick={() => document.getElementById("gallery-video-upload")?.click()}
                  >
                    {campingUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo...</> : <><Plus className="w-4 h-4 mr-1" /> Subir videos</>}
                  </Button>
                </div>
                {campingForm.videos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {campingForm.videos.filter(Boolean).map((vid, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border bg-stone-100 h-20 flex items-center justify-center">
                        <video src={vid} className="w-full h-full object-cover" muted preload="metadata" />
                        <button
                          onClick={() => setCampingForm(prev => ({...prev, videos: prev.videos.filter((_,i) => i !== idx)}))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampingModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCamping}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingAddon ? "Editar adicional" : "Nuevo adicional"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Título</Label>
              <Input value={addonForm.title} onChange={e => setAddonForm({...addonForm, title: e.target.value})} placeholder="Decoración especial" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Precio (COP)</Label>
              <Input type="number" value={addonForm.price} onChange={e => setAddonForm({...addonForm, price: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Descripción</Label>
              <textarea className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none" rows={3} value={addonForm.description} onChange={e => setAddonForm({...addonForm, description: e.target.value})} placeholder="Para cumpleaños, aniversario, pedida de noviazgo, noche de bodas o romántica." />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Detalles</Label>
              <div className="space-y-2">
                {addonForm.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={detail} onChange={e => { const next = [...addonForm.details]; next[idx] = e.target.value; setAddonForm({...addonForm, details: next}); }} className="text-sm" />
                    <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-600 shrink-0" onClick={() => setAddonForm({...addonForm, details: addonForm.details.filter((_,i) => i !== idx)})}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={addonForm.newDetail}
                    onChange={e => setAddonForm({...addonForm, newDetail: e.target.value})}
                    placeholder="Detalle del adicional"
                    className="text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (addonForm.newDetail.trim()) { setAddonForm({...addonForm, details: [...addonForm.details, addonForm.newDetail.trim()], newDetail: ""}); }}}}
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { if (addonForm.newDetail.trim()) { setAddonForm({...addonForm, details: [...addonForm.details, addonForm.newDetail.trim()], newDetail: ""}); }}}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 p-4 space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Cantidad Seleccionable</Label>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Permitir múltiples unidades</p>
                  {addonForm.allowMultiple && addonForm.multipleLabel && (
                    <p className="text-xs text-stone-500 truncate">{addonForm.multipleLabel}</p>
                  )}
                </div>
                <Switch checked={addonForm.allowMultiple} onCheckedChange={v => setAddonForm({...addonForm, allowMultiple: v})} />
              </div>
              {addonForm.allowMultiple && (
                <div className="space-y-2">
                  <Input
                    value={addonForm.multipleLabel}
                    onChange={e => setAddonForm({...addonForm, multipleLabel: e.target.value})}
                    placeholder="Ej: El precio es por persona, cena por persona"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-stone-500 mb-1">Límite de unidades (opcional)</p>
                      <Input
                        type="number"
                        min={1}
                        value={addonForm.maxQuantity ?? ""}
                        onChange={e => setAddonForm({...addonForm, maxQuantity: e.target.value ? parseInt(e.target.value) : null})}
                        placeholder="Sin límite"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-400">Fotos y Videos</Label>
                <p className="text-xs text-stone-400 mt-1">Las fotos y videos se mostrarán al cliente cuando haga clic en este adicional.</p>
              </div>
              {(addonForm.media || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(addonForm.media || []).map((item, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-stone-200 bg-stone-100">
                      {item.type === "image" ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 gap-1">
                          <Video className="w-6 h-6 text-white" />
                          <span className="text-white text-[10px]">Video</span>
                        </div>
                      )}
                      <button
                        onClick={() => setAddonForm({...addonForm, media: addonForm.media.filter((_,i) => i !== idx)})}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${addonUploading ? "border-accent/50 cursor-not-allowed bg-stone-50" : "border-stone-200 hover:border-accent/50 cursor-pointer"}`}
                onClick={() => !addonUploading && document.getElementById("addon-media-upload")?.click()}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  id="addon-media-upload"
                  className="hidden"
                  disabled={addonUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    setAddonUploading(true);
                    toast({ title: `Subiendo ${files.length} archivo(s)... (puede tardar)` });
                    const fd = new FormData();
                    files.forEach(f => fd.append("media", f));
                    try {
                      const res = await fetch("/api/upload-addon-media", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.success) {
                        setAddonForm(prev => ({...prev, media: [...prev.media, ...data.media]}));
                        toast({ title: `${data.media.length} archivo(s) subido(s) ✓` });
                      } else {
                        toast({ title: "Error al subir", description: data.error || "Intenta de nuevo", variant: "destructive" });
                      }
                    } catch (err: any) {
                      toast({ title: "Error al subir archivos", description: err.message, variant: "destructive" });
                    }
                    setAddonUploading(false);
                    e.target.value = "";
                  }}
                />
                {addonUploading ? (
                  <div className="flex flex-col items-center gap-2 text-accent">
                    <span className="w-6 h-6 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" />
                    <p className="text-sm font-medium">Subiendo... (puede tardar)</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-stone-400">
                    <Plus className="w-5 h-5" />
                    <p className="text-sm font-medium">Subir fotos o videos</p>
                    <p className="text-xs">Puedes seleccionar varios a la vez</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddonModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAddon} className="bg-primary text-white hover:bg-primary/90">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Gestionar Reserva</DialogTitle>
            <DialogDescription>
              Referencia: <span className="font-mono font-bold text-primary">{selectedReserva?.referencia}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-3 py-4">
            {selectedReserva?.comprobante && (
              <button 
                onClick={() => {
                  setComprobanteUrl(selectedReserva.comprobante || null);
                  setIsComprobanteModalOpen(true);
                }}
                className="inline-flex items-center justify-start gap-3 h-12 rounded-xl px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors w-full"
              >
                <CheckCircle2 className="w-4 h-4" /> Ver Comprobante de Pago
              </button>
            )}
            {selectedReserva?.plan !== "BLOQUEO ADMIN" && (
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12 rounded-xl bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                onClick={() => {
                  if (selectedReserva) {
                    generateBookingReceipt(selectedReserva);
                  }
                }}
              >
                <Download className="w-4 h-4" /> Generar Comprobante de Reserva
              </Button>
            )}
            <Button 
              variant="outline" 
              className="justify-start gap-3 h-12 rounded-xl"
              onClick={() => {
                if (selectedReserva) {
                  const parsedAdicionales = (() => {
                    const raw = selectedReserva.adicionales;
                    if (!raw) return [];
                    if (Array.isArray(raw)) return raw;
                    try { return JSON.parse(raw as unknown as string); } catch { return []; }
                  })();
                  setEditData({
                    referencia: selectedReserva.referencia,
                    fecha_inicio: selectedReserva.fecha_inicio,
                    fecha_fin: selectedReserva.fecha_fin,
                    unidad: selectedReserva.unidad,
                    nombre: selectedReserva.nombre,
                    email: selectedReserva.email || "",
                    telefono: selectedReserva.telefono || "",
                    cedula: selectedReserva.cedula || "",
                    plan: selectedReserva.plan,
                    total: selectedReserva.total,
                    abono: selectedReserva.abono,
                    estado: selectedReserva.estado,
                    adicionales: parsedAdicionales
                  });
                  setIsEditModalOpen(true);
                  setIsModalOpen(false);
                }
              }}
            >
              <CalendarIcon className="w-4 h-4" /> Modificar Reserva (Fechas/Unidad/Estado)
            </Button>
            {selectedReserva?.estado === 1 && (
              <Button 
                className="justify-start gap-3 h-12 rounded-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAction("marcar-saldo-pagado.php", { referencia: selectedReserva.referencia })}
              >
                <Wallet className="w-4 h-4" /> Marcar Saldo Pagado
              </Button>
            )}
            {(selectedReserva?.estado === 1 || selectedReserva?.estado === 2) && (
              <>
                {selectedReserva?.plan !== "BLOQUEO ADMIN" && (
                  <Button 
                    className="justify-start gap-3 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                    onClick={() => handleAction("marcar-completada.php", { referencia: selectedReserva.referencia })}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar como Completada
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  className="justify-start gap-3 h-12 rounded-xl"
                  onClick={() => {
                    if (confirm(`¿Está seguro de que desea eliminar este registro permanentemente?`)) {
                      handleAction("cancelar-reserva.php", { referencia: selectedReserva.referencia });
                    }
                  }}
                >
                  <XCircle className="w-4 h-4" /> {selectedReserva?.plan === "BLOQUEO ADMIN" ? "Eliminar Bloqueo" : "Cancelar Reserva"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Modificar Reserva</DialogTitle>
            <DialogDescription>
              Ajusta las fechas o cambia la unidad de la reserva <span className="font-mono font-bold">{editData.referencia}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input 
                  value={editData.nombre}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  value={editData.telefono}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, telefono: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Correo Electrónico</Label>
                <Input 
                  value={editData.email}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Cédula</Label>
                <Input 
                  value={editData.cedula}
                  className="rounded-xl"
                  placeholder="Número de identificación"
                  onChange={(e) => setEditData({...editData, cedula: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select onValueChange={(v) => setEditData({...editData, unidad: v})} value={editData.unidad}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aura 1">Aura 1</SelectItem>
                    <SelectItem value="Aura 2">Aura 2</SelectItem>
                    <SelectItem value="Aura 3">Aura 3</SelectItem>
                    <SelectItem value="Aura 4">Aura 4</SelectItem>
                    <SelectItem value="Árbol 1">Árbol 1</SelectItem>
                    <SelectItem value="Nido 1">Nido 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select onValueChange={(v) => setEditData({...editData, plan: v})} value={editData.plan}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPlans.map(plan => {
                      const isActive = plan.estado;
                      if (!isActive) return null;
                      
                      if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
                        const now = new Date();
                        now.setHours(12, 0, 0, 0);
                        const start = new Date(plan.fechaInicio + 'T12:00:00');
                        const end = new Date(plan.fechaFin + 'T12:00:00');
                        if (now < start || now > end) return null;
                      }
                      
                      return <SelectItem key={plan.id} value={plan.nombre}>{plan.nombre}</SelectItem>;
                    })}
                    <SelectItem value="BLOQUEO ADMIN">Bloqueo Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={editData.fecha_inicio ? editData.fecha_inicio.substring(0, 10) : ""}
                  onChange={(e) => {
                    // Si el usuario cambia la fecha manualmente en el input tipo date,
                    // aseguramos que mantenga el sufijo T12:00:00 para consistencia
                    const val = e.target.value;
                    setEditData({...editData, fecha_inicio: val ? (val.includes('T') ? val : val + 'T12:00:00') : ""});
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={editData.fecha_fin ? editData.fecha_fin.substring(0, 10) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditData({...editData, fecha_fin: val ? (val.includes('T') ? val : val + 'T12:00:00') : ""});
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total</Label>
                <Input 
                  type="number" 
                  value={editData.total}
                  className="rounded-xl font-bold"
                  onChange={(e) => setEditData({...editData, total: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Abono</Label>
                <Input 
                  type="number" 
                  value={editData.abono}
                  className="rounded-xl"
                  onChange={(e) => setEditData({...editData, abono: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select onValueChange={(v) => setEditData({...editData, estado: parseInt(v)})} value={editData.estado.toString()}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pendiente</SelectItem>
                    <SelectItem value="2">Abonado</SelectItem>
                    <SelectItem value="3">Cancelado</SelectItem>
                    <SelectItem value="4">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="font-semibold text-primary">Adicionales</Label>
              <div className="border rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto bg-stone-50">
                {dynamicAddons.length === 0 && <p className="text-sm text-stone-400">No hay adicionales disponibles</p>}
                {dynamicAddons.map(addon => {
                  const isSelected = editData.adicionales.includes(addon.id);
                  return (
                    <label key={addon.id} className="flex items-center justify-between gap-2 cursor-pointer p-2 rounded-lg hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newAdicionales = isSelected
                              ? editData.adicionales.filter(id => id !== addon.id)
                              : [...editData.adicionales, addon.id];
                            const addonsPrice = newAdicionales.reduce((sum, id) => {
                              const a = dynamicAddons.find(x => x.id === id);
                              return sum + (a ? a.price : 0);
                            }, 0);
                            setEditData(prev => ({
                              ...prev,
                              adicionales: newAdicionales,
                              total: prev.total + (isSelected ? -(addon.price) : addon.price)
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{addon.title}</span>
                      </div>
                      <span className="text-xs font-medium text-accent">{formatPrice(addon.price)}</span>
                    </label>
                  );
                })}
              </div>
              {editData.adicionales.length > 0 && (
                <p className="text-xs text-stone-500">{editData.adicionales.length} adicional(es) seleccionado(s)</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button 
                className="rounded-xl bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  const dataToSave = {
                    ...editData,
                    fecha_inicio: normalizeDateForSave(editData.fecha_inicio),
                    fecha_fin: normalizeDateForSave(editData.fecha_fin),
                    adicionales: editData.adicionales
                  };
                  handleAction("actualizar-reserva.php", dataToSave);
                }}
              >
                Guardar Cambios
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Bloquear Fechas</DialogTitle>
            <DialogDescription>
              Las fechas bloqueadas no estarán disponibles para reserva en el sitio web.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unidad a bloquear</Label>
              <Select onValueChange={(v) => setBlockData({...blockData, unidad: v})} defaultValue="all">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las unidades</SelectItem>
                  {campings.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input 
                  type="date" 
                  min={today}
                  className="rounded-xl" 
                  onChange={(e) => setBlockData(prev => ({...prev, fecha_inicio: e.target.value}))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input 
                  type="date" 
                  min={blockData.fecha_inicio || today}
                  className="rounded-xl" 
                  onChange={(e) => setBlockData(prev => ({...prev, fecha_fin: e.target.value}))} 
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={() => {
                const dataToSave = {
                  ...blockData,
                  fecha_inicio: normalizeDateForSave(blockData.fecha_inicio),
                  fecha_fin: normalizeDateForSave(blockData.fecha_fin)
                };
                handleAction("bloquear-fecha", dataToSave);
              }}
              disabled={!blockData.fecha_inicio || !blockData.fecha_fin}
            >
              Confirmar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewReservaModalOpen} onOpenChange={setIsNewReservaModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Crear Nueva Reserva</DialogTitle>
            <DialogDescription>
              Ingresa los detalles para crear una reserva manual.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Cliente</Label>
                <Input 
                  placeholder="Juan Perez" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, nombre: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input 
                  type="email" 
                  placeholder="juan@ejemplo.com" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input 
                  placeholder="300 123 4567" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, telefono: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select onValueChange={(v) => setNewReservaData({...newReservaData, unidad: v})} defaultValue="Aura 1">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aura 1">Aura 1</SelectItem>
                    <SelectItem value="Aura 2">Aura 2</SelectItem>
                    <SelectItem value="Aura 3">Aura 3</SelectItem>
                    <SelectItem value="Aura 4">Aura 4</SelectItem>
                    <SelectItem value="Árbol 1">Árbol 1</SelectItem>
                    <SelectItem value="Nido 1">Nido 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, fecha_inicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, fecha_fin: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select onValueChange={(v) => setNewReservaData({...newReservaData, plan: v})} value={newReservaData.plan}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPlans.map(plan => {
                      const isActive = plan.estado;
                      if (!isActive) return null;
                      
                      if (plan.tipo === "temporada" && plan.fechaInicio && plan.fechaFin) {
                        const now = new Date();
                        now.setHours(12, 0, 0, 0);
                        const start = new Date(plan.fechaInicio + 'T12:00:00');
                        const end = new Date(plan.fechaFin + 'T12:00:00');
                        if (now < start || now > end) return null;
                      }
                      
                      return <SelectItem key={plan.id} value={plan.nombre}>{plan.nombre}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total (Auto)</Label>
                <Input 
                  type="number" 
                  value={newReservaData.total}
                  className="rounded-xl bg-stone-50 font-bold"
                  onChange={(e) => setNewReservaData({...newReservaData, total: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Abono</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="rounded-xl"
                  onChange={(e) => setNewReservaData({...newReservaData, abono: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado Inicial</Label>
              <Select onValueChange={(v) => setNewReservaData({...newReservaData, estado: parseInt(v)})} defaultValue="2">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Pendiente (Sin pago)</SelectItem>
                  <SelectItem value="2">Abonado (Confirmado)</SelectItem>
                  <SelectItem value="4">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewReservaModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-primary text-white hover:bg-primary/90"
              onClick={handleCreateManualReserva}
              disabled={!newReservaData.nombre || !newReservaData.fecha_inicio || !newReservaData.fecha_fin || !newReservaData.plan}
            >
              Crear Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDayReservasModalOpen} onOpenChange={setIsDayReservasModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Reservas del Día</DialogTitle>
            <DialogDescription>
              {selectedDayReservas.length > 0 && format(new Date(selectedDayReservas[0].fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedDayReservas.map((reserva) => (
              <div 
                key={reserva.id} 
                className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedReserva(reserva);
                  setIsModalOpen(true);
                  setIsDayReservasModalOpen(false);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-primary">{reserva.nombre}</h4>
                    <p className="text-xs text-stone-500 font-mono">{reserva.referencia}</p>
                  </div>
                  {getStatusBadge(reserva.estado)}
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <div className="flex items-center gap-1">
                    <Tent className="w-4 h-4 text-accent" />
                    <span className="font-medium">{reserva.unidad}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {reserva.plan}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDayReservasModalOpen(false)} className="rounded-xl w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isComprobanteModalOpen} onOpenChange={setIsComprobanteModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Comprobante de Pago</DialogTitle>
            <DialogDescription>
              Referencia: <span className="font-mono font-bold text-primary">{selectedReserva?.referencia}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {comprobanteUrl ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                  <img 
                    src={comprobanteUrl} 
                    alt="Comprobante de pago" 
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 rounded-xl"
                    onClick={() => window.open(comprobanteUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir en nueva pestaña
                  </Button>
                  <a 
                    href={comprobanteUrl} 
                    download={`comprobante-${selectedReserva?.referencia}.png`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full rounded-xl">
                      <Download className="w-4 h-4 mr-2" /> Descargar Imagen
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-500">
                No hay comprobante disponible para esta reserva.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComprobanteModalOpen(false)} className="rounded-xl w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlanBlockModalOpen} onOpenChange={(open) => {
        setIsPlanBlockModalOpen(open);
        if (!open) {
          setPlanBlockError(null);
          setPlanBlockForm({ planId: "", campingIds: [], fechaInicio: "", fechaFin: "" });
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Bloquear Plan por Camping</DialogTitle>
            <DialogDescription>
              Bloquea un plan específico en uno o más campings durante un rango de fechas. Este plan no estará disponible para reserva durante ese período.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan a bloquear</Label>
              <Select onValueChange={(v) => setPlanBlockForm({...planBlockForm, planId: v})} value={planBlockForm.planId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Campings afectados</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { typeId: 1, name: "Aura VIP" },
                  { typeId: 2, name: "Árbol" },
                  { typeId: 3, name: "Nido" }
                ].map(camping => (
                  <button
                    key={camping.typeId}
                    type="button"
                    onClick={() => toggleCampingSelection(camping.typeId)}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2",
                      planBlockForm.campingIds.includes(camping.typeId)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    )}
                  >
                    {planBlockForm.campingIds.includes(camping.typeId) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {camping.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input 
                  type="date" 
                  min={today}
                  className="rounded-xl" 
                  value={planBlockForm.fechaInicio}
                  onChange={(e) => setPlanBlockForm({...planBlockForm, fechaInicio: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input 
                  type="date" 
                  min={planBlockForm.fechaInicio || today}
                  className="rounded-xl" 
                  value={planBlockForm.fechaFin}
                  onChange={(e) => setPlanBlockForm({...planBlockForm, fechaFin: e.target.value})} 
                />
              </div>
            </div>

            {planBlockError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {planBlockError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={handleCreatePlanBlock}
              disabled={!planBlockForm.planId || planBlockForm.campingIds.length === 0 || !planBlockForm.fechaInicio || !planBlockForm.fechaFin}
            >
              Confirmar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnitBlockModalOpen} onOpenChange={(open) => {
        setIsUnitBlockModalOpen(open);
        if (!open) setUnitBlockForm({ unitName: "", motivo: "", fechaInicio: "", fechaFin: "" });
      }}>
        <DialogContent className="sm:max-w-lg rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Inhabilitar Unidad de Camping</DialogTitle>
            <DialogDescription>
              Marca una unidad como no disponible. Si dejas las fechas vacías, se inhabilitará de forma indefinida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select onValueChange={(v) => setUnitBlockForm({...unitBlockForm, unitName: v})} value={unitBlockForm.unitName}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {allUnits.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input 
                placeholder="Ej: En mantenimiento, Fuera de servicio..." 
                className="rounded-xl"
                value={unitBlockForm.motivo}
                onChange={(e) => setUnitBlockForm({...unitBlockForm, motivo: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde (opcional)</Label>
                <Input 
                  type="date" 
                  className="rounded-xl" 
                  value={unitBlockForm.fechaInicio}
                  onChange={(e) => setUnitBlockForm({...unitBlockForm, fechaInicio: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta (opcional)</Label>
                <Input 
                  type="date" 
                  min={unitBlockForm.fechaInicio || undefined}
                  className="rounded-xl" 
                  value={unitBlockForm.fechaFin}
                  onChange={(e) => setUnitBlockForm({...unitBlockForm, fechaFin: e.target.value})} 
                />
              </div>
            </div>

            <p className="text-xs text-stone-400 italic">Si no seleccionas fechas, la unidad quedará inhabilitada indefinidamente hasta que la habilites manualmente.</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnitBlockModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCreateUnitBlock}
              disabled={!unitBlockForm.unitName}
            >
              Inhabilitar Unidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlanModalOpen} onOpenChange={(open) => {
        setIsPlanModalOpen(open);
        if (!open) resetPlanForm();
      }}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              {editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? "Modifica la información del plan." : "Configura un nuevo plan para ofrecer a tus clientes."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Nombre del plan *</Label>
                <Input 
                  className="rounded-xl" 
                  placeholder="Ej: Plan Romántico"
                  value={planForm.nombre}
                  onChange={(e) => setPlanForm({...planForm, nombre: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Eslogan *</Label>
                <Input 
                  className="rounded-xl" 
                  placeholder="Ej: La escapada perfecta para dos"
                  value={planForm.eslogan}
                  onChange={(e) => setPlanForm({...planForm, eslogan: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Descripción</Label>
              <Input 
                className="rounded-xl" 
                placeholder="Descripción breve del plan"
                value={planForm.descripcion}
                onChange={(e) => setPlanForm({...planForm, descripcion: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Tipo de plan *</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "normal", label: "Normal", desc: "Plan estándar sin límite de fechas" },
                  { id: "temporada", label: "Temporada", desc: "Plan con fechas específicas (máx 2 meses)" },
                  { id: "preventa", label: "Preventa", desc: "Plan con badge de preventa visible" }
                ].map(tipo => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setPlanForm({...planForm, tipo: tipo.id as any})}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 transition-all text-left flex-1 min-w-[140px]",
                      planForm.tipo === tipo.id
                        ? "border-accent bg-accent/10"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    <p className={cn("font-bold text-sm", planForm.tipo === tipo.id ? "text-accent" : "text-stone-700")}>{tipo.label}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{tipo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {planForm.tipo === "temporada" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-bold text-orange-600">Fecha inicio *</Label>
                  <Input 
                    type="date" 
                    className="rounded-xl" 
                    value={planForm.fechaInicio}
                    onChange={(e) => setPlanForm({...planForm, fechaInicio: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-bold text-orange-600">Fecha fin *</Label>
                  <Input 
                    type="date" 
                    min={planForm.fechaInicio}
                    className="rounded-xl" 
                    value={planForm.fechaFin}
                    onChange={(e) => setPlanForm({...planForm, fechaFin: e.target.value})} 
                  />
                </div>
                <p className="col-span-2 text-xs text-orange-600">Máximo 2 meses de duración</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Ícono</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPlanForm({...planForm, icono: opt.id})}
                        className={cn(
                          "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                          planForm.icono === opt.id
                            ? "border-accent bg-accent/10"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        )}
                        title={opt.name}
                      >
                        <Icon className={cn("w-5 h-5", planForm.icono === opt.id ? "text-accent" : "text-stone-500")} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Color</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={planForm.color}
                    onChange={(e) => setPlanForm({...planForm, color: e.target.value})}
                    className="w-10 h-10 rounded-xl border-2 border-stone-200 cursor-pointer"
                  />
                  <Input 
                    className="rounded-xl flex-1" 
                    value={planForm.color}
                    onChange={(e) => setPlanForm({...planForm, color: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">Precios por camping *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Aura VIP</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="599990"
                    value={planForm.precios["1"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "1": parseInt(e.target.value) || 0}})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Árbol</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="399990"
                    value={planForm.precios["2"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "2": parseInt(e.target.value) || 0}})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-400">Nido</Label>
                  <Input 
                    type="number" 
                    className="rounded-xl" 
                    placeholder="369990"
                    value={planForm.precios["3"] || ""}
                    onChange={(e) => setPlanForm({...planForm, precios: {...planForm.precios, "3": parseInt(e.target.value) || 0}})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider font-bold text-stone-500">¿Qué incluye?</Label>
              <div className="flex gap-2">
                <Input 
                  className="rounded-xl flex-1" 
                  placeholder="Ej: Bebida de bienvenida"
                  value={planForm.newIncluye}
                  onChange={(e) => setPlanForm({...planForm, newIncluye: e.target.value})}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIncluye())}
                />
                <Button type="button" variant="outline" className="rounded-xl" onClick={addIncluye}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {planForm.incluye.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {planForm.incluye.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                      {item}
                      <button type="button" onClick={() => removeIncluye(idx)} className="text-red-500 hover:text-red-700">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Banner Image Toggle */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-stone-700">Modo imagen</p>
                  <p className="text-xs text-stone-500">Actívalo para que la tarjeta del plan muestre solo una foto en vez del texto.</p>
                </div>
                <Switch
                  checked={!!planForm.bannerImage}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setPlanForm({ ...planForm, bannerImage: "" });
                    }
                    // Si se activa, no hacemos nada aquí — el usuario debe subir la imagen
                  }}
                />
              </div>

              {!!planForm.bannerImage && (
                <div className="relative rounded-xl overflow-hidden h-40">
                  <img src={planForm.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, bannerImage: "" })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!planForm.bannerImage && (
                <div>
                  <input type="file" id="plan-banner-upload" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPlanBannerUploading(true);
                    const fd = new FormData();
                    fd.append("media", file);
                    try {
                      const res = await fetch("/api/upload/media", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.url) {
                        setPlanForm({ ...planForm, bannerImage: data.url });
                        toast({ title: "Imagen subida", description: "La imagen de banner se cargó correctamente." });
                      } else {
                        toast({ title: "Error", description: data.error || "No se pudo subir la imagen", variant: "destructive" });
                      }
                    } catch (err) {
                      toast({ title: "Error", description: "Error de conexión al subir la imagen", variant: "destructive" });
                    } finally { setPlanBannerUploading(false); e.target.value = ""; }
                  }} />
                  <Button type="button" variant="outline" size="sm" disabled={planBannerUploading} onClick={() => document.getElementById("plan-banner-upload")?.click()}>
                    {planBannerUploading ? <><span className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" /> Subiendo...</> : <><Upload className="w-4 h-4 mr-1" /> Subir imagen de banner</>}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={planForm.desactivarOtros}
                  onChange={(e) => setPlanForm({...planForm, desactivarOtros: e.target.checked})}
                  className="w-5 h-5 rounded border-stone-300 text-accent focus:ring-accent"
                />
                <div>
                  <p className="font-bold text-sm text-stone-700">Desactivar otros planes</p>
                  <p className="text-xs text-stone-500">Al guardar, todos los demás planes se desactivarán y solo este quedará visible.</p>
                </div>
              </label>
            </div>

            {planFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {planFormError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button 
              className="rounded-xl bg-accent hover:bg-accent/90"
              onClick={handleSavePlan}
            >
              {editingPlan ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
