// Footer fijo para derechos reservados.
export default function Footer() {
	return (
		<footer
			className="fixed inset-x-0 bottom-0 w-full flex justify-center z-40 pointer-events-none"
			aria-label="Pie de página"
		>
			<span
				className="pointer-events-auto select-none text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 tracking-wide px-3 py-1 rounded-full bg-transparent"
			>
				2025 Marketplace UCT — Todos los derechos reservados
			</span>
		</footer>
	)
}