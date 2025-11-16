import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SelectCampus from './Onboarding.UI/SelectCampus'
import SelectCarrera from './Onboarding.UI/SelectCarrera'
import OnboardingNamePage from './Onboarding.UI/OnboardingNamePage'
import SuccessModal from './Onboarding.UI/SuccessModal'
import { campuses as mockCampuses, carreras as mockCarreras } from './Onboarding.Utils/mocks'
import styles from './Onboarding.UI/Onboarding.module.css'

export default function Onboarding() {
	const navigate = useNavigate()
	const [step, setStep] = useState<'campus-carrera' | 'nombre'>('campus-carrera')
	const [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([])
	const [carreras, setCarreras] = useState<Array<{ id: string; name: string; campusId: string }>>([])
	const [campusId, setCampusId] = useState<string | null>(null)
	const [carreraId, setCarreraId] = useState<string | null>(null)
	const [loadingCampuses, setLoadingCampuses] = useState(false)
	const [loadingCarreras, setLoadingCarreras] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)

	useEffect(() => {
		// Simula fetch de campuses
		setLoadingCampuses(true)
		setTimeout(() => {
			setCampuses(mockCampuses)
			setLoadingCampuses(false)
		}, 200)
	}, [])

	useEffect(() => {
		if (!campusId) {
			setCarreras([])
			setCarreraId(null)
			return
		}
		setLoadingCarreras(true)
		setTimeout(() => {
			setCarreras(mockCarreras.filter((c: any) => c.campusId === campusId))
			setLoadingCarreras(false)
		}, 200)
	}, [campusId])

	function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault()
		// Ir a la página de nombre
		setStep('nombre')
	}

	function handleSkip() {
		// Si omite, ir directo al home
		navigate('/home')
	}

	function handleCloseModal() {
		setShowSuccessModal(false)
		// Aquí podrías redirigir al usuario: navigate('/home')
	}

	const selectedCampus = campuses.find(c => c.id === campusId)
	const selectedCarrera = carreras.find(c => c.id === carreraId)

	// Si ya pasó al step de nombre, mostrar ese componente
	if (step === 'nombre') {
		return <OnboardingNamePage campusId={campusId || undefined} carreraId={carreraId || undefined} />
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
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</motion.div>
					<h1 className={styles.title}>Configura tu perfil</h1>
					<p className={styles.subtitle}>Selecciona tu campus y carrera para personalizar tu experiencia</p>
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
						<SelectCampus value={campusId} onChange={setCampusId} options={campuses} loading={loadingCampuses} />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: campusId ? 1 : 0.5, x: 0 }}
						transition={{ delay: 0.6, duration: 0.3 }}
					>
						<SelectCarrera value={carreraId} onChange={setCarreraId} options={carreras.map(c => ({ id: c.id, name: c.name }))} loading={loadingCarreras} disabled={!campusId} />
					</motion.div>

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
							whileHover={{ scale: 1.02, y: -2 }}
							whileTap={{ scale: 0.98 }}
						>
							Omitir
						</motion.button>
						<motion.button 
							type="submit" 
							className={`${styles.button} ${styles.buttonPrimary}`} 
							disabled={!campusId || !carreraId}
							whileHover={!campusId || !carreraId ? {} : { scale: 1.02, y: -2 }}
							whileTap={!campusId || !carreraId ? {} : { scale: 0.98 }}
							animate={campusId && carreraId ? { 
								boxShadow: ["0 4px 12px rgba(233, 123, 28, 0.25)", "0 4px 16px rgba(233, 123, 28, 0.35)", "0 4px 12px rgba(233, 123, 28, 0.25)"]
							} : {}}
							transition={{ duration: 2, repeat: Infinity }}
						>
							Continuar
						</motion.button>
					</motion.div>

					<motion.div 
						className={styles.progress}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.8, duration: 0.4 }}
					>
						<motion.div 
							className={`${styles.progressDot} ${styles.active}`}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
						/>
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
					</motion.div>
				</motion.form>
			</motion.div>

			<SuccessModal 
				isOpen={showSuccessModal}
				onClose={handleCloseModal}
				campusName={selectedCampus?.name}
				carreraName={selectedCarrera?.name}
			/>
		</div>
	)
}
