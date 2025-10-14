import type { Item } from "../types";
import { formatCLP, formatInt, placeholder } from "../utils/format";
import { RatingStars } from "./RatingStars";

export function PublicationCard({
item,
onClick,
}: {
item: Item;
onClick?: (id: string) => void;
}) {
const { id, title, author, buyNow, sellerSales, sellerRating, stock } = item;
return (
<article
className="bg-white rounded-2xl overflow-hidden shadow-[0_6px_28px_rgba(0,0,0,0.06)] border border-slate-200 flex flex-col"
onClick={() => onClick?.(id)}
role={onClick ? "button" : undefined}
>
<div className="aspect-[4/3] overflow-hidden bg-slate-100">
<div style={placeholder(id)} />
</div>


<div className="p-4 grid gap-2.5">
<div className="flex items-center justify-between">
<h3 className="m-0 text-base font-semibold leading-tight">{title}</h3>
</div>


{/* Stock + Precio */}
<div className="grid grid-cols-2 gap-2">
<div className="grid content-start gap-1">
<span className="text-xs text-slate-500">Disponibilidad</span>
<span
className={[
"inline-block rounded-full border text-[12px] font-bold px-2.5 py-0.5",
stock === 0
? "bg-rose-50 text-rose-800 border-rose-200"
: stock <= 5
? "bg-amber-50 text-amber-900 border-amber-300"
: "bg-emerald-50 text-emerald-800 border-emerald-300",
].join(" ")}
aria-label={`Stock ${stock === 0 ? "agotado" : stock}`}
title={stock === 0 ? "Agotado" : `${formatInt(stock)} disponibles`}
>
{stock === 0 ? "Agotado" : `${formatInt(stock)} disponibles`}
</span>
</div>


<div className="grid">
<span className="text-xs text-slate-500">Precio</span>
<strong className="text-sm">{formatCLP(buyNow)}</strong>
</div>
</div>


{/* Datos del vendedor */}
<div className="flex items-center justify-between mt-1">
<div className="inline-flex items-center gap-2">
<div className="size-5 rounded-full bg-slate-200" />
<span className="text-xs text-slate-500">{author}</span>
</div>
<div className="inline-flex items-center gap-2 text-xs text-slate-500">
<RatingStars rating={sellerRating} />
<span className="font-semibold text-slate-700">{sellerRating.toFixed(1)}</span>
<span className="opacity-60">•</span>
<span>{formatInt(sellerSales)} ventas</span>
</div>
</div>
</div>
</article>
);
}