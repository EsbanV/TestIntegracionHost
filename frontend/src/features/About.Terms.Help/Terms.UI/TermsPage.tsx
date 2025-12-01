import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
      // Added px-4 for mobile safety
      className="max-w-4xl mx-auto py-8 space-y-8 px-4"
    >
      {/* Encabezado de la Página */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Términos y Condiciones</h1>
        <p className="text-muted-foreground">Última actualización: 23 de septiembre de 2025</p>
      </div>

      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="bg-muted/30 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <CardTitle className="text-foreground">Acuerdo de Usuario</CardTitle>
              <CardDescription className="text-muted-foreground">
                Por favor lee atentamente las reglas de nuestra comunidad
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 px-6 md:px-8">
          <div className="text-foreground/90 space-y-8 leading-relaxed">
            
            <p>
              Bienvenido a <strong className="text-foreground">Marketplace UCT</strong>. Al acceder y utilizar nuestra plataforma, aceptas cumplir y estar sujeto a los siguientes términos. Si no estás de acuerdo, te rogamos no utilizar nuestros servicios.
            </p>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> 
                1. Aceptación de los Términos
              </h3>
              <p className="text-muted-foreground">
                Al crear una cuenta en MarketUCT, confirmas que has leído, entendido y aceptado estar vinculado por estos términos. Si actúas en nombre de una entidad, declaras tener la autoridad para hacerlo.
              </p>
            </section>

            <Separator className="bg-border" />

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                2. Descripción del Servicio
              </h3>
              <div className="text-muted-foreground">
                MarketUCT es una plataforma que facilita la compra, venta e intercambio entre miembros de la comunidad universitaria. 
                <div className="block mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                  Nota: No somos parte de ninguna transacción y no garantizamos la calidad, seguridad o legalidad de los artículos publicados.
                </div>
              </div>
            </section>

            <Separator className="bg-border" />

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                3. Obligaciones del Usuario
              </h3>
              <p className="text-muted-foreground">Te comprometes a:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-primary text-muted-foreground">
                <li>Proporcionar información veraz y actualizada.</li>
                <li>No publicar contenido ilegal, ofensivo o fraudulento.</li>
                <li>Respetar a otros miembros de la comunidad.</li>
                <li>No usar la plataforma para spam o fines no autorizados.</li>
              </ul>
            </section>

            <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center border border-border">
              Si tienes dudas, contáctanos en <a href="/ayuda" className="text-primary hover:underline font-medium">Centro de Ayuda</a>.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}