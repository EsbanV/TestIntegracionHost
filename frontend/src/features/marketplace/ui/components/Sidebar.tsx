import { Link } from "react-router-dom";
import logo from "../../../../assets/img/logouct.png";

export function Sidebar({ active = "marketplace" }: { active?: "marketplace" | "chats" }) {
return (
// Parche alto completo: fondo del aside crece con la página, contenido sticky interno
<aside className="relative bg-white border-r">
<div className="sticky top-0 h-dvh flex flex-col gap-4 p-4">
<div className="flex items-center gap-2.5 px-1 py-1.5">
<div className="w-11 h-11 rounded-xl grid place-items-center bg-slate-50">
<img
src={logo}
alt="Logo UCT"
className="max-w-[70%] max-h-[70%] object-contain"
loading="lazy"
decoding="async"
/>
</div>
<strong className="font-extrabold">MarketUCT</strong>
</div>


<nav className="grid gap-1.5">
<Link
to="/marketplace"
className={[
"px-3 py-2 rounded-xl font-semibold no-underline",
active === "marketplace"
? "text-violet-600 bg-violet-50"
: "text-slate-500 hover:bg-violet-50 hover:text-violet-600",
].join(" ")}
>
MarketPlace
</Link>
<Link
to="/chats"
className={[
"px-3 py-2 rounded-xl font-semibold no-underline",
active === "chats"
? "text-violet-600 bg-violet-50"
: "text-slate-500 hover:bg-violet-50 hover:text-violet-600",
].join(" ")}
>
Chats
</Link>
</nav>
</div>
</aside>
);
}