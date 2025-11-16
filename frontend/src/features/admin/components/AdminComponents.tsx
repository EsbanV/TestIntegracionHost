import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, ChevronRight, Loader2, AlertCircle, CheckCircle2, XCircle 
} from "lucide-react";
import { cn } from "@/lib/utils"; // Asegúrate de tener esta utilidad de shadcn

// --- Imports de Shadcn UI (Ajusta las rutas según tu proyecto) ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// 1. ADMIN SEARCH INPUT
// ============================================================================
type SearchInputProps = {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function AdminSearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder ?? "Buscar..."}
        className="pl-9 bg-white"
      />
    </div>
  );
}

// ============================================================================
// 2. STATUS BADGE
// ============================================================================
type StatusType = "ok" | "warn" | "err" | "neutral";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    warn: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    err: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    neutral: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
  };

  const icons = {
    ok: <CheckCircle2 className="w-3 h-3 mr-1.5" />,
    warn: <AlertCircle className="w-3 h-3 mr-1.5" />,
    err: <XCircle className="w-3 h-3 mr-1.5" />,
    neutral: null,
  };

  return (
    <Badge variant="outline" className={cn("px-2.5 py-0.5 font-medium transition-colors", styles[status], className)}>
      {icons[status]}
      {label}
    </Badge>
  );
}

// ============================================================================
// 3. STAT CARD
// ============================================================================
type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "positive" | "negative";
};

export function StatCard({ title, value, subtitle, icon, variant = "default" }: StatCardProps) {
  const variants = {
    default: "border-slate-200 bg-white",
    positive: "border-emerald-200 bg-emerald-50/30",
    negative: "border-red-200 bg-red-50/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("shadow-sm hover:shadow-md transition-shadow", variants[variant])}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground/70">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// 4. ADMIN TABLE
// ============================================================================
export type Column<T> = {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
};

type AdminTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  rowKey?: (item: T) => string | number;
  loading?: boolean;
  emptyContent?: ReactNode;
};

export function AdminTable<T>({ 
  columns, 
  data, 
  onRowClick, 
  rowKey, 
  loading, 
  emptyContent 
}: AdminTableProps<T>) {
  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            {columns.map((c) => (
              <TableHead 
                key={c.key} 
                style={{ width: c.width }} 
                className={cn(
                  "font-bold text-slate-700",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center"
                )}
              >
                {c.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`skel-${idx}`}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <Skeleton className="h-5 w-[80%]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center">
                {emptyContent ?? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="bg-slate-100 p-3 rounded-full mb-3">
                      <Search className="h-6 w-6 opacity-50" />
                    </div>
                    <p>No se encontraron resultados.</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => {
              const key = rowKey ? rowKey(item) : idx;
              return (
                <motion.tr
                  key={String(key)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((c) => (
                    <TableCell 
                      key={c.key}
                      className={cn(
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center"
                      )}
                    >
                      {c.render ? c.render(item) : (item as any)[c.key]}
                    </TableCell>
                  ))}
                </motion.tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// 5. ADMIN MODAL
// ============================================================================
type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSave?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  children?: ReactNode;
  maxWidth?: string;
};

export function AdminModal({ 
  open, 
  onClose, 
  title, 
  description,
  onSave, 
  isSaving,
  saveLabel = "Guardar",
  children,
  maxWidth = "max-w-lg"
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className={cn("sm:max-w-md", maxWidth)}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          {onSave && (
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saveLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 6. PAGE TRANSITION
// ============================================================================
type PageTransitionProps = { children: ReactNode };

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 7. INFO CARD (Replaces EmptyCard)
// ============================================================================
export type InfoRow = { 
  icon?: ReactNode; 
  label: string; 
  content: ReactNode 
};

type InfoCardProps = {
  title?: string;
  rows: InfoRow[];
  className?: string;
};

export function InfoCard({ title, rows, className }: InfoCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="bg-slate-50/50 border-b py-3">
          <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        </CardHeader>
      )}
      <div className="divide-y">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-3 gap-4 p-4 hover:bg-slate-50/30 transition-colors">
            <div className="flex items-center text-sm font-medium text-muted-foreground col-span-1">
              {r.icon && <span className="mr-2 text-slate-400">{r.icon}</span>}
              {r.label}
            </div>
            <div className="text-sm text-slate-900 col-span-2 font-medium break-words">
              {r.content}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}