import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'
import { InlineSpinner } from '@/components/ui/Spinner'
import styles from './Onboarding.module.css'

interface OnboardingContactPageProps {
	campusId?: string
	carreraId?: string
}

export default function OnboardingContactPage({ campusId, carreraId }: OnboardingContactPageProps) {
	const navigate = useNavigate()
	const { user, login } = useAuth()
	const [telefono, setTelefono] = useState('')
	const [direccion, setDireccion] = useState('')
	const [fotoPerfil, setFotoPerfil] = useState<File | null>(null)
	const [fotoPreview, setFotoPreview] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [uploadingPhoto, setUploadingPhoto] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validar tipo de archivo
		if (!file.type.startsWith('image/')) {
			setError('Por favor selecciona una imagen válida')
			return
		}

		// Validar tamaño (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError('La imagen no debe superar los 5MB')
			return
		}

		setFotoPerfil(file)
		
		// Crear preview
		const reader = new FileReader()
		reader.onloadend = () => {
			setFotoPreview(reader.result as string)
		}
		reader.readAsDataURL(file)
		setError(null)
	}

	const handleRemovePhoto = () => {
		setFotoPerfil(null)
		setFotoPreview(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	async function uploadPhoto(file: File): Promise<string> {
		const formData = new FormData()
		formData.append('file', file)

		const token = localStorage.getItem('app_jwt_token') || localStorage.getItem('token')
		
		const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: formData
		})

		if (!response.ok) {
			throw new Error('Error al subir la foto')
		}

		const data = await response.json()
		return data.url || data.fileUrl
	}

	async function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault()
		
		setLoading(true)
		setError(null)

		try {
			const token = localStorage.getItem('app_jwt_token') || localStorage.getItem('token')
			
			if (!token) {
				throw new Error('No se encontró el token de sesión')
			}

			let fotoUrl = null

			// Si hay una foto seleccionada, subirla primero
			if (fotoPerfil) {
				setUploadingPhoto(true)
				try {
					fotoUrl = await uploadPhoto(fotoPerfil)
				} catch (err) {
					console.error('Error subiendo foto:', err)
					setError('No se pudo subir la foto, pero continuaremos con los demás datos')
				} finally {
					setUploadingPhoto(false)
				}
			}

			// Construir el payload solo con campos que tienen valor
			const payload: any = {}
			if (telefono.trim()) payload.telefono = telefono.trim()
			if (direccion.trim()) payload.direccion = direccion.trim()
			if (fotoUrl) payload.fotoPerfil = fotoUrl

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
						...user,
						telefono: data.user.telefono,
						direccion: data.user.direccion,
						fotoPerfil: data.user.fotoPerfil
					} as any)
				}
			}

			// Redirigir al home
			navigate('/home')
		} catch (err: any) {
			console.error('Error:', err)
			setError(err.message || 'Hubo un problema al guardar tu información')
		} finally {
			setLoading(false)
		}
	}

	function handleSkip() {
		// Omitir esta página y ir directo al home
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
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</motion.div>
					<h1 className={styles.title}>Información de contacto</h1>
					<p className={styles.subtitle}>Completa tu perfil con datos adicionales (opcional)</p>
				</motion.div>

				<motion.form 
					onSubmit={handleSubmit} 
					className={styles.form}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4, duration: 0.4 }}
				>
					{/* Foto de Perfil */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.5, duration: 0.3 }}
					>
						<div className={styles.field}>
							<label className={styles.label}>Foto de perfil</label>
							<div className={styles.photoUpload}>
								{fotoPreview ? (
									<div className={styles.photoPreview}>
										<img src={fotoPreview} alt="Preview" className={styles.photoPreviewImg} />
										<button
											type="button"
											onClick={handleRemovePhoto}
											className={styles.photoRemove}
											disabled={loading}
										>
											<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
											</svg>
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className={styles.photoButton}
										disabled={loading}
									>
										<svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<span>Seleccionar foto</span>
									</button>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handlePhotoChange}
									className={styles.photoInput}
									disabled={loading}
								/>
							</div>
							<p className={styles.helper}>Formatos: JPG, PNG. Tamaño máximo: 5MB</p>
						</div>
					</motion.div>

					{/* Teléfono */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.6, duration: 0.3 }}
					>
						<div className={styles.field}>
							<label htmlFor="telefono" className={styles.label}>
								Teléfono
							</label>
							<input
								id="telefono"
								type="tel"
								className={styles.input}
								value={telefono}
								onChange={(e) => setTelefono(e.target.value)}
								placeholder="+56 9 1234 5678"
								disabled={loading}
							/>
							<p className={styles.helper}>Tu número de contacto (opcional)</p>
						</div>
					</motion.div>

					{/* Dirección */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.7, duration: 0.3 }}
					>
						<div className={styles.field}>
							<label htmlFor="direccion" className={styles.label}>
								Dirección
							</label>
							<input
								id="direccion"
								type="text"
								className={styles.input}
								value={direccion}
								onChange={(e) => setDireccion(e.target.value)}
								placeholder="Calle, número, comuna"
								disabled={loading}
							/>
							<p className={styles.helper}>Para coordinar entregas (opcional)</p>
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
						transition={{ delay: 0.8, duration: 0.3 }}
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
							disabled={loading}
							whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
							whileTap={!loading ? { scale: 0.98 } : {}}
						>
							<span className="flex items-center gap-2 justify-center">
								{(loading || uploadingPhoto) && <InlineSpinner size="sm" color="white" />}
								{uploadingPhoto ? 'Subiendo foto...' : loading ? 'Guardando...' : 'Finalizar'}
							</span>
						</motion.button>
					</motion.div>

					<motion.div 
						className={styles.progress}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.9, duration: 0.4 }}
					>
						<motion.div 
							className={styles.progressDot}
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
						<motion.div 
							className={`${styles.progressDot} ${styles.active}`}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.2, type: "spring", stiffness: 300 }}
						/>
					</motion.div>
				</motion.form>
			</motion.div>
		</div>
	)
}
