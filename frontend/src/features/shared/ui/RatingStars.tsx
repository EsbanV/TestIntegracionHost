export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
const full = Math.floor(rating);
const empty = 5 - full;
return (
<span className="inline-flex items-center gap-0.5 leading-none" aria-label={`Seller rating ${rating.toFixed(1)} out of 5`}>
{Array.from({ length: full }).map((_, i) => (
<Star key={`f${i}`} kind="full" size={size} />
))}
{Array.from({ length: empty }).map((_, i) => (
<Star key={`e${i}`} kind="empty" size={size} />
))}
</span>
);
}
function Star({ kind, size = 14 }: { kind: "full" | "empty"; size?: number }) {
return (
<svg
className="inline-block"
style={{ width: size, height: size }}
viewBox="0 0 24 24"
aria-hidden
fill={kind === "full" ? "#f59e0b" : "none"}
stroke={kind === "full" ? "#f59e0b" : "#d1d5db"}
strokeWidth={kind === "full" ? 0 : 1.5}
>
<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
</svg>
);
}