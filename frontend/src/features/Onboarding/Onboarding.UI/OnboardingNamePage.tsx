import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'
import { InlineSpinner } from '@/components/ui/Spinner'
import styles from './Onboarding.module.css'

interface OnboardingNameProps {
	campusId?: string
	carreraId?: string
	onNext?: () => void
}

export default function OnboardingNamePage({ campusId, carreraId, onNext }: OnboardingNameProps) {
	const navigate = useNavigate()
	const { user, login } = useAuth()
	const [usuario, setUsuario] = useState(user?.usuario || '')
	const [apellido, setApellido] = useState(user?.apellido || '')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault()
		if (!usuario.trim()) {
			setError('El nombre de usuario es requerido')
			return
		}

		setLoading(true)
		setError(null)

		try {
			const token = localStorage.getItem('app_jwt_token') || localStorage.getItem('token')
			
			if (!token) {
				throw new Error('No se encontró el token de sesión')
			}
			
			// Construir el payload con los campos que el backend acepta
			const payload: any = {}
			if (usuario !== user?.usuario) payload.usuario = usuario
			if (apellido) payload.apellido = apellido
			if (campusId) payload.campus = campusId
			
			// Solo hacer la petición si hay cambios
			if (Object.keys(payload).length > 0) {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify(payload)
				})

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.message || 'Error al actualizar el perfil')
				}

				const data = await response.json()
				
				// Actualizar el contexto de usuario con los datos actualizados
				if (data.user && token) {
					login(token, {
						id: data.user.id,
						nombre: data.user.nombre,
						correo: data.user.correo,
						apellido: data.user.apellido,
						campus: data.user.campus,
						usuario: data.user.usuario,
						role: data.user.role
					})
				}
			}

			// Si hay callback onNext, ir a la siguiente página del onboarding
			// Si no, redirigir al home
			if (onNext) {
				onNext()
			} else {
				navigate('/home')
			}
		} catch (err: any) {
			console.error('Error:', err)
			setError(err.message || 'Hubo un problema al guardar tu información')
		} finally {
			setLoading(false)
		}
	}

	function handleSkip() {
		// Si omite, usar el nombre de Google que ya tiene
		navigate('/home')
	}

	return (
		<div className={styles.container}>
			<motion.div 
				className={styles.card}
				initial={{ opacity: 0, y: 20, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			>
				<motion.div 
					className={styles.header}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.4 }}
				>
					<motion.div 
						className={styles.icon}
						initial={{ scale: 0, rotate: -180 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
					>
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</motion.div>
					<h1 className={styles.title}>Completa tu perfil</h1>
					<p className={styles.subtitle}>Tu nombre es <strong>{user?.nombre}</strong>. Agrega un nombre de usuario único</p>
				</motion.div>

				<motion.form 
					onSubmit={handleSubmit} 
					className={styles.form}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4, duration: 0.4 }}
				>
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.5, duration: 0.3 }}
					>
					<div className={styles.field}>
						<label htmlFor="usuario" className={styles.label}>
							Nombre de usuario <span className={styles.required}>*</span>
						</label>
						<input
							id="usuario"
							type="text"
							className={styles.input}
							value={usuario}
							onChange={(e) => setUsuario(e.target.value)}
							placeholder="Ej: juan_perez"
							disabled={loading}
							autoFocus
						/>
						<p className={styles.helper}>Este será tu identificador único en la plataforma</p>
					</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.6, duration: 0.3 }}
					>
						<div className={styles.field}>
							<label htmlFor="apellido" className={styles.label}>
								Apellido
							</label>
							<input
								id="apellido"
								type="text"
								className={styles.input}
								value={apellido}
								onChange={(e) => setApellido(e.target.value)}
								placeholder="Tu apellido (opcional)"
								disabled={loading}
							/>
							<p className={styles.helper}>Opcional - Puedes agregarlo después</p>
						</div>
					</motion.div>

					{error && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className={styles.error}
						>
							{error}
						</motion.div>
					)}

					<motion.div 
						className={styles.actions}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7, duration: 0.3 }}
					>
						<motion.button 
							type="button" 
							className={`${styles.button} ${styles.buttonSecondary}`}
							onClick={handleSkip}
							disabled={loading}
							whileHover={{ scale: 1.02, y: -2 }}
							whileTap={{ scale: 0.98 }}
						>
							Omitir
						</motion.button>
						<motion.button 
							type="submit" 
							className={`${styles.button} ${styles.buttonPrimary}`} 
							disabled={!usuario.trim() || loading}
							whileHover={usuario.trim() && !loading ? { scale: 1.02, y: -2 } : {}}
							whileTap={usuario.trim() && !loading ? { scale: 0.98 } : {}}
							animate={usuario.trim() && !loading ? { 
								boxShadow: ["0 4px 12px rgba(233, 123, 28, 0.25)", "0 4px 16px rgba(233, 123, 28, 0.35)", "0 4px 12px rgba(233, 123, 28, 0.25)"]
							} : {}}
							transition={{ duration: 2, repeat: Infinity }}
						>
							<span className="flex items-center gap-2 justify-center">
								{loading && <InlineSpinner size="sm" color="white" />}
								{loading ? 'Guardando...' : 'Continuar'}
							</span>
						</motion.button>
					</motion.div>

					<motion.div 
						className={styles.progress}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8, duration: 0.4 }}
					>
						<motion.div 
							className={styles.progressDot}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
						/>
						<motion.div 
							className={`${styles.progressDot} ${styles.active}`}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.0, type: "spring", stiffness: 300 }}
						/>
						<motion.div 
							className={styles.progressDot}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.1, type: "spring", stiffness: 300 }}
						/>
					</motion.div>
				</motion.form>
			</motion.div>
		</div>
	)
}
