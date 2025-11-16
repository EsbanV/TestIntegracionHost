import React from 'react'
import styles from './SelectCarrera.module.css'

type Option = { id: string; name: string }

interface SelectCarreraProps {
	value: string | null
	onChange: (id: string | null) => void
	options?: Option[]
	loading?: boolean
	disabled?: boolean
}

export default function SelectCarrera({ value, onChange, options = [], loading = false, disabled = false }: SelectCarreraProps) {
	return (
		<div className={styles.field}>
			<label htmlFor="select-carrera" className={styles.label}>
				Carrera <span className={styles.required}>*</span>
			</label>
			{loading ? (
				<div className={styles.loading}>
					<div className={styles.spinner} />
					<span>Cargando carreras...</span>
				</div>
			) : (
				<div className={styles.selectWrapper}>
					<select
						id="select-carrera"
						className={styles.select}
						value={value ?? ''}
						onChange={(e) => onChange(e.target.value || null)}
						disabled={disabled}
					>
						<option value="">
							{disabled ? 'Primero selecciona un campus' : 'Selecciona tu carrera'}
						</option>
						{options.map((o) => (
							<option key={o.id} value={o.id}>{o.name}</option>
						))}
					</select>
					<svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>
			)}
			<p className={`${styles.helper} ${disabled ? styles.disabledHelper : ''}`}>
				{disabled ? 'Disponible después de seleccionar campus' : 'Selecciona tu programa de estudio'}
			</p>
		</div>
	)
}
