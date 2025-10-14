import LoginFooter from '../../auth/ui/LoginFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Acerca de Nosotros</h1>
        <p className="text-gray-600 mt-4">
          Bienvenido a Marketplace UCT. Somos una plataforma dedicada a conectar estudiantes y profesores
          para compartir recursos, ideas y oportunidades.
        </p>
      </header>

      <main className="max-w-4xl text-center">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Nuestra Misión</h2>
          <p className="text-gray-700 leading-relaxed mt-4">
            Nuestra misión es facilitar la colaboración y el intercambio de conocimientos dentro de la comunidad
            universitaria. Creemos en el poder de la educación y la tecnología para transformar vidas y construir
            un futuro mejor.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Características Principales</h2>
          <ul className="list-disc list-inside text-gray-700 mt-4">
            <li>Publicaciones de recursos y materiales educativos.</li>
            <li>Mensajería instantánea para facilitar la comunicación.</li>
            <li>Sistema de reputación basado en calificaciones.</li>
            <li>Interfaz intuitiva y fácil de usar.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Contáctanos</h2>
          <p className="text-gray-700 leading-relaxed mt-4">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos a través de nuestra página de
            soporte o enviándonos un correo electrónico a <a href="mailto:soporte@uct.cl" className="text-blue-600 hover:text-blue-800 underline">soporte@uct.cl</a>.
          </p>
        </section>
      </main>

      <LoginFooter />
    </div>
  );
}