import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, MessageSquare, Star, Palette, Users, ShieldCheck, Lightbulb, Rocket, LogIn 
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoginFooter from './About.Components/footer';

import LogoMUCT from "@/assets/img/logoMUCT.png";

// --- HEADER EXCLUSIVO PARA ABOUT ---
const AboutHeader = () => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ type: "spring", stiffness: 100, damping: 20 }}
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50"
  >
    <div className="flex items-center gap-2.5 cursor-default">
       {/* Isotipo */}
       <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-lg">
              <img 
                  src={LogoMUCT} 
                  alt="MarketUCT" 
                  className="h-8 w-auto object-contain" 
                />
                </span>
       </div>
       {/* Logotipo */}
       <span className="font-bold text-xl tracking-tight text-slate-900">
          Market<span className="text-yellow-600">UCT</span>
       </span>
    </div>
    
    <div className="flex items-center gap-4">
       <span className="text-sm text-slate-500 hidden sm:inline-block font-medium">
         ¿Ya tienes cuenta?
       </span>
       <Link to="/login">
          <Button className="gap-2 bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all rounded-full px-6 h-10 font-semibold">
             <LogIn size={18} /> Iniciar Sesión
          </Button>
       </Link>
    </div>
  </motion.nav>
);

// --- CONFIGURACIÓN DE ANIMACIONES ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Usamos el nuevo Header */}
      <AboutHeader />
      
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-28 pb-32 lg:pt-40">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
           <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[100px]" />
           <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={fadeIn}
            className="max-w-3xl mx-auto space-y-6"
          >
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-white border-slate-200 shadow-sm text-blue-700">
              🚀 La plataforma oficial de la comunidad
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Conectando la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Vida Universitaria</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              MarketUCT no es solo un marketplace. Es el punto de encuentro digital donde estudiantes y profesores intercambian recursos, ideas y oportunidades.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 text-base px-8 h-12 rounded-full">
                  Comenzar Ahora
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-base px-8 h-12 rounded-full">
                Saber más
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
             {stats.map((stat, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-4"
               >
                 <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2">{stat.value}</div>
                 <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Todo lo que necesitas en un solo lugar</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg">Herramientas diseñadas específicamente para mejorar tu experiencia académica y facilitar el intercambio.</p>
           </div>

           <motion.div 
             variants={staggerContainer}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
           >
             {features.map((feature, idx) => (
               <motion.div key={idx} variants={scaleIn}>
                 <Card className={`h-full border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white ${feature.color}`}>
                   <CardHeader>
                     <div className="mb-4 p-3 bg-white rounded-2xl w-fit shadow-sm border border-slate-100">
                        {feature.icon}
                     </div>
                     <CardTitle className="text-xl font-bold text-slate-900">{feature.title}</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <CardDescription className="text-slate-600 text-base leading-relaxed">
                       {feature.description}
                     </CardDescription>
                   </CardContent>
                 </Card>
               </motion.div>
             ))}
           </motion.div>
        </div>
      </section>

      {/* --- MISION & VALORES --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <motion.div 
                 initial={{ opacity: 0, x: -30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
               >
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    Nuestra misión es <span className="text-blue-400">democratizar</span> el acceso a recursos.
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-8">
                    Creemos que la educación no debería tener barreras. Facilitamos un entorno donde cada libro, apunte o herramienta pueda encontrar una segunda vida en manos de otro estudiante.
                  </p>
                  <Link to="/login">
                    <Button variant="secondary" size="lg" className="rounded-full font-bold text-slate-900">
                      Únete a la comunidad
                    </Button>
                  </Link>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {values.map((val, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors"
                    >
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
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <CardContent className="p-12 relative z-10">
                 <h2 className="text-3xl font-bold mb-4">¿Tienes dudas o sugerencias?</h2>
                 <p className="text-blue-100 mb-8 text-lg">
                   Nuestro equipo de soporte está siempre listo para ayudarte a sacar el máximo provecho de MarketUCT.
                 </p>
                 <a 
                   href="mailto:soporte@uct.cl" 
                   className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-700 bg-white rounded-full hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                 >
                   Contactar Soporte
                 </a>
              </CardContent>
           </Card>
        </div>
      </section>

      <LoginFooter />
    </div>
  );
}