import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, MessageSquare, Star, Palette, Users, ShieldCheck, Lightbulb, Rocket, LogIn, Zap 
} from 'lucide-react';

import loginBg from '@/assets/img/FondoOscuro.png';
const BACKGROUND_IMAGE = loginBg;

// UI Components
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoginFooter from './About.Components/footer';

/* ======================= FONDO AURORA (Optimizado) ======================= */

const AuroraBackground = () => (
  // FIX: El div contenedor es fixed, ocupando el 100% del viewport
  // Le damos un background-color sólido inicial y z-index negativo.
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950">
    {/* 1. IMAGEN DE FONDO (Fixed para cubrir todo el viewport) */}
    <img
      src={BACKGROUND_IMAGE}
      alt="Fondo MarketUCT"
      // FIXED positioning es crucial para que cubra toda la pantalla y no scrollee
      className="w-full h-full object-cover" 
      style={{ position: 'fixed', top: 0, left: 0 }}
    />

    {/* 2. Capa oscura y Blur */}
    <div className="absolute inset-0 bg-slate-950/70" />

    {/* Blobs / auroras */}
    <div className="absolute -top-[50%] left-1/2 h-[50vw] w-[50vw] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[100px] animate-pulse-slow" />
    <div className="absolute top-[20%] left-[10%] h-[30vw] w-[30vw] rounded-full bg-purple-500/20 blur-[120px] animate-blob" />
    <div className="absolute bottom-[10%] right-[10%] h-[40vw] w-[40vw] rounded-full bg-indigo-500/20 blur-[120px] animate-blob animation-delay-2000" />

    {/* Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
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
    initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }}
    className="fixed top-6 left-0 right-0 z-50 mx-auto max-w-5xl px-6"
  >
    <div className="flex items-center justify-between rounded-full border border-white/10 bg-slate-900/70 px-6 py-3 backdrop-blur-xl shadow-2xl shadow-black/50">
       <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">M</div>
          <span className="font-bold text-white tracking-tight hidden sm:block">Market<span className="text-blue-400">UCT</span></span>
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
  
  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: 'Recursos Educativos',
      description: 'Comparte y encuentra materiales de estudio de alta calidad creados por la comunidad.',
      color: 'bg-blue-50 border-blue-100'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-indigo-600" />,
      title: 'Chat en Tiempo Real',
      description: 'Conecta instantáneamente con vendedores y compradores para cerrar tratos rápidos.',
      color: 'bg-indigo-50 border-indigo-100'
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      title: 'Reputación Transparente',
      description: 'Sistema de valoraciones confiable para asegurar una comunidad segura y honesta.',
      color: 'bg-yellow-50 border-yellow-100'
    },
    {
      icon: <Palette className="w-8 h-8 text-pink-600" />,
      title: 'Diseño Intuitivo',
      description: 'Una interfaz moderna y fácil de usar, pensada para la vida universitaria.',
      color: 'bg-pink-50 border-pink-100'
    }
  ];

  const stats = [
    { value: '1000+', label: 'Estudiantes' },
    { value: '500+', label: 'Publicaciones' },
    { value: '4.8', label: 'Calificación' },
    { value: '24/7', label: 'Disponible' },
  ];

  const values = [
    { icon: <Users size={24} />, title: "Colaboración", desc: "Crecemos juntos compartiendo conocimiento." },
    { icon: <ShieldCheck size={24} />, title: "Seguridad", desc: "Tu confianza es nuestra prioridad #1." },
    { icon: <Lightbulb size={24} />, title: "Innovación", desc: "Siempre buscando mejores soluciones." },
    { icon: <Rocket size={24} />, title: "Excelencia", desc: "Calidad en cada detalle de la plataforma." }
  ];

  return (
    // ✅ FIX: Quitamos bg-slate-950 de aquí para que la imagen no esté cubierta por un color sólido
    // La AuroraBackground con fixed position se encargará de ser el fondo.
    <div className="relative min-h-screen font-sans text-slate-100 selection:bg-blue-500/30 overflow-hidden"> 
      <AuroraBackground />

      {/* Todo el contenido envuelto en z-10 para estar sobre el fondo */}
      <div className="relative z-10">
        <AboutHeader />
        
        {/* HERO */}
        <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 text-center px-4">
          {/* ... (Contenido del Hero) ... */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
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
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                  Comenzar Ahora <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* --- STATS SECTION --- */}
        <section className="py-10 border-y border-white/5 bg-white/5 backdrop-blur-sm"> 
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
             {stats.map((stat, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-4"
               >
                 <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                 <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
               </motion.div>
             ))}
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Todo lo que necesitas</h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">Herramientas diseñadas para mejorar tu experiencia académica.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, idx) => (
                  <motion.div key={idx} initial="hidden" whileInView="visible" variants={scaleIn} viewport={{ once: true }}>
                    <Card className={`h-full border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/5 border-white/10`}>
                      <CardHeader>
                        <div className="mb-4 p-3 bg-white/10 rounded-2xl w-fit shadow-sm border border-white/10">
                           {feature.icon}
                        </div>
                        <CardTitle className="text-xl font-bold text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-400 text-base leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
             </div>
          </div>
        </section>

        {/* --- MISION & VALORES --- */}
        <section className="py-24 bg-white/5 border-t border-white/10">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                 <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                      Nuestra misión es <span className="text-blue-400">democratizar</span> el acceso a recursos.
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed mb-8">
                      Creemos que la educación no debería tener barreras.
                    </p>
                    <Link to="/login">
                      <Button variant="secondary" size="lg" className="rounded-full font-bold text-slate-900">
                        Únete a la comunidad
                      </Button>
                    </Link>
                 </motion.div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {values.map((val, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                         <div className="text-blue-400 mb-3">{val.icon}</div>
                         <h4 className="font-bold text-lg mb-1">{val.title}</h4>
                         <p className="text-sm text-slate-400">{val.desc}</p>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* --- CONTACTO CTA --- */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
             <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-2xl text-white overflow-hidden relative">
                <CardContent className="p-12 relative z-10">
                   <h2 className="text-3xl font-bold mb-4">¿Tienes dudas o sugerencias?</h2>
                   <p className="text-blue-100 mb-8 text-lg">
                     Nuestro equipo de soporte está siempre listo para ayudarte.
                   </p>
                   <a 
                     href="mailto:soporte@uct.cl" 
                     className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-700 bg-white rounded-full hover:bg-blue-50 transition-all shadow-lg"
                   >
                     Contactar Soporte
                   </a>
                </CardContent>
             </Card>
          </div>
        </section>

        {/* Footer (Asumiendo que es el LoginFooter simplificado) */}
        <div className="text-center py-6 border-t border-white/10 bg-white/5">
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
               © {new Date().getFullYear()} MarketUCT • Hecho por estudiantes
             </p>
        </div>
      </div>
    </div>
  );
}