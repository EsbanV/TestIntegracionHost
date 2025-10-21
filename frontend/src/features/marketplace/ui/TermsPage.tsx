import React from 'react';
import { Sidebar } from './components/Sidebar'

const TermsPage = () => (
    <div className="min-h-screen bg-gray-50 grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r bg-white">
            <Sidebar active="terminos" />
        </aside>
        <main className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-2xl font-normal text-gray-900 mb-6 text-center">
                    Términos y Condiciones
                </h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    Bienvenido a <strong>Marketplace UCT</strong>. Al acceder y utilizar nuestra plataforma, aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso. Por favor, léelos con atención. Si no estás de acuerdo con estos términos, no deberías utilizar nuestros servicios.
                </p>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">1. Aceptación de los Términos</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Al crear una cuenta o utilizar los servicios de MarketUCT, confirmas que has leído, entendido y aceptado estar vinculado por estos Términos y Condiciones. Si actúas en nombre de una entidad, declaras que tienes la autoridad para vincular a dicha entidad.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">2. Descripción del Servicio</h2>
                        <p className="text-gray-700 leading-relaxed">
                            MarketUCT es una plataforma que facilita la compra, venta e intercambio de bienes y servicios entre los miembros de la comunidad universitaria. No somos parte de ninguna transacción y no garantizamos la calidad, seguridad o legalidad de los artículos publicados.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">3. Obligaciones del Usuario</h2>
                        <p className="text-gray-700 leading-relaxed mb-2">
                            Como usuario, te comprometes a:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                            <li>Proporcionar información veraz, precisa y actualizada en tu perfil y publicaciones.</li>
                            <li>No publicar contenido ilegal, ofensivo, fraudulento o que infrinja los derechos de terceros.</li>
                            <li>Utilizar la plataforma de manera responsable y respetuosa con otros miembros de la comunidad.</li>
                            <li>No utilizar la plataforma para fines comerciales no autorizados o spam.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">4. Propiedad Intelectual</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Todo el contenido generado por los usuarios es propiedad de sus respectivos autores. Sin embargo, al publicar en MarketUCT, nos concedes una licencia no exclusiva y mundial para usar, mostrar y distribuir dicho contenido en el contexto de la plataforma. El logo y la marca MarketUCT son propiedad nuestra y no pueden ser utilizados sin permiso previo.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">5. Política de Privacidad</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Tu privacidad es fundamental para nosotros. Nuestra Política de Privacidad, que se incorpora por referencia en estos términos, explica cómo recopilamos, usamos y protegemos tu información personal. Te recomendamos leerla detenidamente.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">6. Limitación de Responsabilidad</h2>
                        <p className="text-gray-700 leading-relaxed">
                            MarketUCT no se hace responsable por pérdidas o daños resultantes del uso de la plataforma, incluyendo, entre otros, disputas entre usuarios, fallos en el servicio o la calidad de los productos. El uso del servicio es bajo tu propio riesgo.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">7. Modificaciones de los Términos</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Te notificaremos sobre cambios importantes a través de la plataforma o por correo electrónico. El uso continuado del servicio después de dichas modificaciones constituirá tu aceptación de los nuevos términos.
                        </p>
                    </div>

                    <div className="pt-4 border-t mt-6">
                        <p className="text-gray-600 text-sm">
                            Si tienes alguna pregunta sobre estos Términos y Condiciones, no dudes en <a href="/ayuda" className="text-violet-600 hover:underline">contactarnos</a>.
                            <br />
                            Última actualización: 23 de septiembre de 2025.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>
);

export default TermsPage;