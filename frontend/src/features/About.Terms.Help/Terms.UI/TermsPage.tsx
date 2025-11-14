import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area" // Asegúrate de tener este componente o usa un div
import { FileText, ShieldCheck, AlertCircle, Gavel } from "lucide-react"

export default function TermsPage() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto py-8 space-y-8"
    >
      {/* Encabezado de la Página */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Términos y Condiciones</h1>
        <p className="text-slate-500">Última actualización: 23 de septiembre de 2025</p>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <CardTitle>Acuerdo de Usuario</CardTitle>
              <CardDescription>
                Por favor lee atentamente las reglas de nuestra comunidad
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 px-6 md:px-8">
          <div className="prose prose-slate max-w-none text-slate-600 space-y-8">
            
            <p className="leading-relaxed">
              Bienvenido a <strong>Marketplace UCT</strong>. Al acceder y utilizar nuestra plataforma, aceptas cumplir y estar sujeto a los siguientes términos. Si no estás de acuerdo, te rogamos no utilizar nuestros servicios.
            </p>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" /> 
                1. Aceptación de los Términos
              </h3>
              <p>
                Al crear una cuenta en MarketUCT, confirmas que has leído, entendido y aceptado estar vinculado por estos términos. Si actúas en nombre de una entidad, declaras tener la autoridad para hacerlo.
              </p>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-blue-500" />
                2. Descripción del Servicio
              </h3>
              <p>
                MarketUCT es una plataforma que facilita la compra, venta e intercambio entre miembros de la comunidad universitaria. 
                <span className="block mt-2 p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800 text-sm font-medium">
                  Nota: No somos parte de ninguna transacción y no garantizamos la calidad, seguridad o legalidad de los artículos publicados.
                </span>
              </p>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                3. Obligaciones del Usuario
              </h3>
              <p>Te comprometes a:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-blue-500">
                <li>Proporcionar información veraz y actualizada.</li>
                <li>No publicar contenido ilegal, ofensivo o fraudulento.</li>
                <li>Respetar a otros miembros de la comunidad.</li>
                <li>No usar la plataforma para spam o fines no autorizados.</li>
              </ul>
            </section>

            {/* ... Puedes agregar más secciones (4, 5, 6) aquí siguiendo el mismo patrón ... */}

            <div className="mt-8 p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center border border-slate-100">
              Si tienes dudas, contáctanos en <a href="/ayuda" className="text-blue-600 hover:underline font-medium">Centro de Ayuda</a>.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}