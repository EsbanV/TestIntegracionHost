import { useState } from 'react';
import LoginFooter from '../../auth/ui/LoginFooter';
import './AboutPage.css';

export default function AboutPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: '📚',
      title: 'Recursos Educativos',
      description: 'Publicaciones de recursos y materiales educativos de alta calidad.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '💬',
      title: 'Mensajería Instantánea',
      description: 'Comunicación en tiempo real entre estudiantes y profesores.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '⭐',
      title: 'Sistema de Reputación',
      description: 'Calificaciones y reseñas para mantener la calidad del contenido.',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: '🎨',
      title: 'Interfaz Intuitiva',
      description: 'Diseño moderno y fácil de usar para todos los usuarios.',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const stats = [
    { value: '1000+', label: 'Estudiantes Activos', icon: '👥' },
    { value: '500+', label: 'Recursos Compartidos', icon: '📖' },
    { value: '50+', label: 'Profesores', icon: '👨‍🏫' },
    { value: '4.8/5', label: 'Calificación Promedio', icon: '⭐' }
  ];

  const team = [
    { name: 'Equipo de Desarrollo', role: 'Ingeniería de Software', description: 'Creando soluciones innovadoras' },
    { name: 'Equipo de Diseño', role: 'UX/UI Design', description: 'Diseñando experiencias excepcionales' },
    { name: 'Equipo de Soporte', role: 'Atención al Usuario', description: 'Siempre disponibles para ayudar' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent about-page-root">
      {/* Hero Section con animación de entrada */}
      <header className="text-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 sm:top-40 right-5 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-4 sm:-bottom-8 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 animate-fade-in-down">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4 md:mb-6 animate-gradient px-2">
            Acerca de Nosotros
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4">
            Bienvenido a <span className="font-semibold text-blue-600">Marketplace UCT</span>. Somos una plataforma innovadora 
            dedicada a conectar estudiantes y profesores para compartir recursos, ideas y oportunidades 
            en un entorno colaborativo y seguro.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20 relative z-10">
        {/* Estadísticas animadas */}
        <section className="mb-12 md:mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 sm:p-6 text-center transform transition-all duration-500 hover:scale-105 md:hover:scale-110 hover:shadow-2xl hover:-translate-y-2 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`text-3xl sm:text-4xl mb-2 sm:mb-3 transition-transform duration-300 ${hoveredCard === index ? 'scale-125 rotate-12' : ''}`}>
                  {stat.icon}
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Misión y Visión con efectos */}
        <section className="mb-12 md:mb-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl md:hover:rotate-1 animate-slide-in-left">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 animate-pulse flex-shrink-0">
                <span className="text-xl sm:text-2xl">🎯</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Nuestra Misión</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              Facilitar la colaboración y el intercambio de conocimientos dentro de la comunidad universitaria. 
              Creemos en el poder de la educación y la tecnología para transformar vidas, impulsar el aprendizaje 
              continuo y construir un futuro mejor para todos los miembros de nuestra comunidad académica.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl transform transition-all duration-500 hover:scale-105 hover:shadow-2xl md:hover:-rotate-1 animate-slide-in-right">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 animate-pulse animation-delay-1000 flex-shrink-0">
                <span className="text-xl sm:text-2xl">🚀</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Nuestra Visión</h2>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
              Ser la plataforma líder en intercambio académico, creando un ecosistema digital donde cada 
              estudiante y profesor pueda contribuir, aprender y crecer. Aspiramos a democratizar el acceso 
              al conocimiento y fomentar una cultura de colaboración sin fronteras.
            </p>
          </div>
        </section>

        {/* Características principales con cards mejoradas */}
        <section className="mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 animate-fade-in px-4">
            Características Principales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-lg md:rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Gradiente de fondo animado */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Contenido */}
                <div className="relative p-5 md:p-6 z-10">
                  <div className={`text-4xl md:text-5xl mb-3 md:mb-4 transition-all duration-500 ${hoveredFeature === index ? 'scale-125 rotate-12' : ''}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Borde animado */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg md:rounded-xl transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipo */}
        <section className="mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 animate-fade-in px-4">
            Nuestro Equipo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-lg md:rounded-xl shadow-lg p-6 md:p-8 text-center transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-3 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center text-2xl sm:text-3xl animate-bounce-slow">
                  {index === 0 ? '💻' : index === 1 ? '🎨' : '🤝'}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-2 md:mb-3 text-sm md:text-base">{member.role}</p>
                <p className="text-gray-600 text-xs md:text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valores */}
        <section className="mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 animate-fade-in px-4">
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: '🤝', title: 'Colaboración', desc: 'Trabajamos juntos para crecer' },
              { icon: '🎓', title: 'Excelencia', desc: 'Compromiso con la calidad' },
              { icon: '🔒', title: 'Seguridad', desc: 'Protegemos tu información' },
              { icon: '🌟', title: 'Innovación', desc: 'Siempre mejorando' }
            ].map((value, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg text-center transform transition-all duration-500 hover:scale-105 md:hover:scale-110 hover:shadow-2xl md:hover:rotate-3 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl mb-2 md:mb-3 animate-pulse">{value.icon}</div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">{value.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sección de contacto mejorada */}
        <section className="mb-8 md:mb-12">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl md:rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 text-center text-white transform transition-all duration-500 hover:scale-105 hover:shadow-3xl animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">¿Necesitas Ayuda?</h2>
            <p className="text-sm sm:text-base md:text-xl mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto px-2">
              Nuestro equipo de soporte está siempre disponible para resolver tus dudas y ayudarte 
              a aprovechar al máximo nuestra plataforma.
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center">
              <a
                href="mailto:soporte@uct.cl"
                className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:bg-gray-100 w-full sm:w-auto"
              >
                📧 soporte@uct.cl
              </a>
              <div className="text-sm sm:text-base md:text-lg">o visita nuestra página de soporte</div>
            </div>
          </div>
        </section>
      </main>

      <LoginFooter />
    </div>
  );
}