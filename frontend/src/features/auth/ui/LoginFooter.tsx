// Footer específico para la página de login
export default function LoginFooter() {
	return (
		<footer
			className="fixed inset-x-0 bottom-0 w-full flex justify-center items-center z-40 pointer-events-none"
			aria-label="Pie de página"
		>
			<div className="pointer-events-auto flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 tracking-wide px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
				<span className="text-gray-700">2025 Marketplace UCT — Todos los derechos reservados</span>
				<a
					href="/ayuda" // O el enlace que corresponda, por ejemplo a una página de ayuda
					className="text-blue-700 hover:text-blue-900 underline"
				>
					Necesitas ayuda
				</a>
			</div>
		</footer>
	)
}