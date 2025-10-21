import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
import LogoMUCT from '../../../assets/img/logoMUCT.png'
import UserDefault from '../../../assets/img/user_default.png'
import { LogoutUser } from '../../auth/use-cases/LogoutUser'

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const body = document.body
    if (open) {
      const prev = (body as any).style.overflow
      body.setAttribute('data-prev-overflow', prev)
      ;(body as any).style.overflow = 'hidden'
      setTimeout(() => { searchInputRef.current?.focus() }, 0)
    } else {
      const prev = body.getAttribute('data-prev-overflow') || ''
      ;(body as any).style.overflow = prev
      body.removeAttribute('data-prev-overflow')
    }
    return () => {
      ;(body as any).style.overflow = body.getAttribute('data-prev-overflow') || ''
      body.removeAttribute('data-prev-overflow')
    }
  }, [open])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const toggle = document.getElementById('menu-toggle-btn')
        if (toggle && toggle.contains(e.target as Node)) return
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleLogout = () => {
    try {
      const logoutUseCase = new LogoutUser()
      logoutUseCase.execute()
      
      // Cerrar menú móvil si está abierto
      setOpen(false)
      
      // Redireccionar al login
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('Hubo un error al cerrar sesión. Por favor, intenta nuevamente.')
    }
  }

  return (
    <header className={styles.headerRoot}>
      <div className={styles.headerInner}>
        <button
          id="menu-toggle-btn"
          type="button"
          className={styles.menuToggle}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="mobile-menu-panel"
          data-open={open}
          onClick={() => setOpen(o => !o)}
        >
          <span className={styles.burger} />
        </button>

        <div className={styles.logoArea}>      
          <div className={styles.logoPlaceholder} aria-hidden="true">
            <img
              src={LogoMUCT}
              alt="Marketplace UCT"
              className={styles.logoImg}
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <span>Marketplace UCT</span>
        </div>

        <nav className={styles.nav} aria-label="Principal">
          <ul className={styles.navList}>
            <li><NavLink className={styles.navLink} to="/home">Inicio</NavLink></li>
            <li><NavLink className={styles.navLink} to="/crear">Crear Publicación</NavLink></li>
            <li><NavLink className={styles.navLink} to="/mis-publicaciones">Mis Publicaciones</NavLink></li>
            <li><NavLink className={styles.navLink} to='/Ayuda'>Ayuda</NavLink></li>
            <li><NavLink className={styles.navLink} to="/about">Acerca de</NavLink></li>
          </ul>
        </nav>

        <div className={styles.actions}>
          <NavLink to="/perfil" className={styles.profileLink} aria-label="Perfil usuario">
            <img 
              src={UserDefault} 
              alt="Usuario" 
              className={styles.profileAvatar}
            />
            <span>Perfil</span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <span className={styles.logoutAvatar} aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu-panel"
        ref={panelRef}
        className={`${styles.mobilePanel} ${open ? styles.panelOpen : ''}`}
      >
        <div className={styles.mobilePanelInner}>
          <nav aria-label="Menú móvil principal">
            <ul className={styles.mobileNavList}>
              <li><NavLink to="/home" onClick={() => setOpen(false)}>Inicio</NavLink></li>
              <li><NavLink to="/crear" onClick={() => setOpen(false)}>Crear Publicación</NavLink></li>
              <li><NavLink to="/mis-publicaciones" onClick={() => setOpen(false)}>Mis Publicaciones</NavLink></li>
              <li><NavLink to="/ayuda" onClick={() => setOpen(false)}>Ayuda</NavLink></li>
              <li><NavLink to="/about" onClick={() => setOpen(false)}>Acerca de</NavLink></li>
            </ul>
          </nav>
          <div className="mobileSearch">
            <form className={styles.searchBar} role="search" onSubmit={(e) => { e.preventDefault(); setOpen(false) }}>
              <span className={styles.searchIcon} aria-hidden="true">🔍</span>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Buscar publicaciones..."
                aria-label="Buscar"
                name="q"
                autoComplete="off"
                ref={searchInputRef}
              />
            </form>
          </div>
          <div className={styles.mobilePanelFooter}>
            <NavLink to="/perfil" className={styles.profileLink} aria-label="Perfil usuario" onClick={() => setOpen(false)}>
              <img 
                src={UserDefault} 
                alt="Usuario" 
                className={styles.profileAvatar}
              />
              <span>Perfil</span>
            </NavLink>
            
            <button
              onClick={handleLogout}
              className={styles.logoutButtonMobile}
              aria-label="Cerrar sesión"
            >
              <span className={styles.logoutAvatar} aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
