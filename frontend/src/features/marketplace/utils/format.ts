import type { CSSProperties } from "react";


export const formatCLP = (n: number) =>
new Intl.NumberFormat("es-CL", {
style: "currency",
currency: "CLP",
maximumFractionDigits: 0,
}).format(Math.round(n));


export const formatInt = (n: number) =>
new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
Math.round(n)
);


export function placeholder(seed: string): CSSProperties {
const hue = (hash(seed) % 360) | 0;
return {
width: "100%",
height: "100%",
background: `linear-gradient(135deg, hsl(${hue} 70% 88%), hsl(${
(hue + 40) % 360
} 70% 78%))`,
};
}


function hash(s: string) {
let h = 0;
for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
return Math.abs(h);
}