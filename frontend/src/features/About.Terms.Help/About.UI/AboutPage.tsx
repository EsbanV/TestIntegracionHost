import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, MessageSquare, Star, Palette, Users, ShieldCheck, Lightbulb, Rocket, LogIn, Zap 
} from 'lucide-react';

import loginBg from '@/assets/img/FondoClaro.png';
const BACKGROUND_IMAGE = loginBg;
const LogoMUCT = "/assets/img/logoMUCT.png";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoginFooter from './About.Components/footer';

/* ======================= FONDO AURORA + IMAGEN ======================= */

const AuroraBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    
    {/* Imagen que cubre la pantalla sin dejar huecos */}

    {/* Capa oscura */}
    <div className="absolute inset-0 bg-slate-950/60" />

    {/* Blobs */}
    <div className="absolute -top-[40%] left-1/2 h-[55vw] w-[55vw] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[110px] animate-pulse-slow" />
    <div className="absolute top-[15%] left-[10%] h-[30vw] w-[30vw] rounded-full bg-purple-500/20 blur-[120px] animate-blob" />
    <div className="absolute bottom-[10%] right-[10%] h-[40vw] w-[40vw] rounded-full bg-indigo-500/20 blur-[120px] animate-blob animation-delay-2000" />

    {/* Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
  </div>
);


/* ======================= TEXTO CON GRADIENTE ======================= */

const MagicText = ({ text }: { text: string }) => (
  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
    {text}
  </span>
);

/* ======================= TARJETAS BENTO ======================= */

const BentoCard = ({ icon, title, desc, className }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 ${className}`}
  >
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 group-hover:text-white transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-200 transition-colors">
      {desc}
    </p>
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
  </motion.div>
);

/* ======================= HEADER FLOTANTE ======================= */

const AboutHeader = () => (
  <motion.nav 
    initial={{ y: -100 }} 
    animate={{ y: 0 }} 
    transition={{ type: "spring", stiffness: 100 }}
    className="fixed top-6 left-0 right-0 z-50 mx-auto max-w-5xl px-6"
  >
    <div className="flex items-center justify-between rounded-full border border-white/10 bg-slate-900/70 px-6 py-3 backdrop-blur-xl shadow-2xl shadow-black/50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                          <img 
                
                  src={LogoMUCT} 
                  alt="MarketUCT" 
                  className="text-white w-9 h-9" 
                />
        </div>
        <span className="font-bold text-white tracking-tight hidden sm:block">
          Market<span className="text-blue-400">UCT</span>
        </span>
      </div>
      <Link to="/login">
        <button className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-6 font-medium text-white transition-all hover:bg-blue-700 hover:scale-105">
          <span className="mr-2">Ingresar</span> <LogIn size={16} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
        </button>
      </Link>
    </div>
  </motion.nav>
);

/* ======================= ABOUT PAGE ======================= */

export default function AboutPage() {
  return (    
    <div className="relative min-h-screen overflow-hidden bg-transparent font-sans text-slate-100 selection:bg-blue-500/30 ">
      {/* Fondo a pantalla completa por debajo del contenido */}
      <AuroraBackground />

      {/* Todo el contenido encima del fondo */}
      <div className="relative z-40">
        <AboutHeader />
        
        {/* HERO */}
        <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 text-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <Badge
              variant="outline"
              className="bg-blue-900/30 text-blue-300 border-blue-700/50 px-4 py-1.5 text-sm backdrop-blur-md uppercase tracking-widest"
            >
              ✨ La evolución del comercio estudiantil
            </Badge>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-tight">
              Tu Campus, <br /> <MagicText text="Tu Mercado." />
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              La plataforma definitiva para comprar, vender e intercambiar dentro de la comunidad UCT. Seguro, rápido y exclusivo.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Link to="/login">
                <Button className="h-14 px-8 text-lg rounded-full bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                  Comenzar Ahora <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:h-[500px]">
              <BentoCard 
                className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-900/40 to-slate-900/40"
                icon={<Zap size={32} />}
                title="Velocidad Instantánea"
                desc="Publica tus productos en segundos. Chat en tiempo real sin esperas. Todo fluye a la velocidad de la vida universitaria."
              />
              <BentoCard 
                className="md:col-span-1 md:row-span-1"
                icon={<ShieldCheck size={28} />}
                title="Comunidad Segura"
                desc="Acceso exclusivo con correo institucional. Olvídate de estafas externas."
              />
              <BentoCard 
                className="md:col-span-1 md:row-span-1"
                icon={<Star size={28} />}
                title="Reputación Real"
                desc="Sistema de valoración transparente. Gana confianza con cada venta."
              />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Usuarios Activos", value: "1.2k+" },
              { label: "Transacciones", value: "$5M+" },
              { label: "Productos", value: "850+" },
              { label: "Satisfacción", value: "99%" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-32 text-center px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">¿Listo para unirte?</h2>
            <p className="text-slate-400 text-lg">
              Forma parte de la economía circular de tu universidad hoy mismo.
            </p>
            <Link to="/login">
              <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]">
                <span className="mr-2">Crear mi cuenta gratis</span>
                <Users size={20} />
              </button>
            </Link>
          </div>
        </section>

        <LoginFooter />
      </div>
    </div>
  );
}
