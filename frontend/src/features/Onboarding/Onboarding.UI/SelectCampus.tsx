import React from 'react'
import styles from './SelectCampus.module.css'

type Option = { id: string; name: string }

interface SelectCampusProps {
	value: string | null
	onChange: (id: string | null) => void
	options?: Option[]
	loading?: boolean
	error?: string | null
}

export default function SelectCampus({ value, onChange, options = [], loading = false }: SelectCampusProps) {
	return (
		<div className={styles.field}>
			<label htmlFor="select-campus" className={styles.label}>
				Campus <span className={styles.required}>*</span>
			</label>
			{loading ? (
				<div className={styles.loading}>
					<div className={styles.spinner} />
					<span>Cargando campuses...</span>
				</div>
			) : (
				<div className={styles.selectWrapper}>
					<select
						id="select-campus"
						className={styles.select}
						value={value ?? ''}
						onChange={(e) => onChange(e.target.value || null)}
					>
						<option value="">Selecciona tu campus</option>
						{options.map((o) => (
							<option key={o.id} value={o.id}>{o.name}</option>
						))}
					</select>
					<svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>
			)}
			<p className={styles.helper}>Selecciona el campus donde estudias</p>
		</div>
	)
}
