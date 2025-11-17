import React from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, Package, Tag, MapPin, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

// Hook
import { useCreatePublication } from '@/features/CrearPublicacion/crearPublicacion.hooks';
import { CATEGORY_MAP, CAMPUS_OPTIONS } from '@/features/CrearPublicacion/crearPublicacion.types';

// Componentes UI
import { 
  Label, Input, Textarea, Select, ImageGalleryPanel, FeedbackMessages 
} from '@/features/CrearPublicacion/CrearPublicacion.Components';

export default function CreateProductPage() {
  
  // Lógica extraída al Hook
  const {
    formData, images, isLoading, error, success,
    handleChange, handleImageUpload, removeImage, handleSubmit, handleCancel
  } = useCreatePublication();

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vender Producto</h1>
          <p className="text-slate-500 mt-2">Publica tu artículo en el marketplace universitario.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              
              {/* Info Principal */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <FileText className="text-slate-400" size={20} />
                   <h2 className="text-lg font-semibold text-slate-800">Detalles Principales</h2>
                </div>
                
                <div>
                   <Label>Título</Label>
                   <Input 
                     name="titulo" 
                     placeholder="Ej: Calculadora Casio fx-570" 
                     value={formData.titulo} 
                     onChange={handleChange}
                     disabled={isLoading}
                   />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label>Precio (CLP)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input 
                        name="precio" 
                        type="number" 
                        placeholder="5000" 
                        className="pl-9" 
                        value={formData.precio} 
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Stock Disponible</Label>
                    <div className="relative">
                       <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                       <Input 
                          name="stock" 
                          type="number" 
                          placeholder="1" 
                          className="pl-9" 
                          value={formData.stock}
                          onChange={handleChange}
                          disabled={isLoading}
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles Adicionales */}
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <Tag className="text-slate-400" size={20} />
                   <h2 className="text-lg font-semibold text-slate-800">Categorización</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label>Categoría</Label>
                    <Select name="categoria" value={formData.categoria} onChange={handleChange} disabled={isLoading}>
                      <option value="">Seleccionar...</option>
                      {Object.keys(CATEGORY_MAP).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Campus de Entrega</Label>
                    <div className="relative">
                      <Select name="campus" value={formData.campus} onChange={handleChange} disabled={isLoading} className="pl-10">
                          <option value="">Cualquiera</option>
                          {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </Select>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea 
                    name="descripcion" 
                    placeholder="Describe el estado del producto, detalles importantes o motivos de venta..." 
                    value={formData.descripcion}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <div className="flex justify-end mt-1">
                     <span className={clsx("text-xs font-medium", formData.descripcion.length > 900 ? "text-amber-500" : "text-slate-400")}>
                        {formData.descripcion.length}/1000
                     </span>
                  </div>
                </div>
              </div>

            </form>
          </motion.div>

          {/* COLUMNA DERECHA: IMÁGENES Y ACCIONES */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
             <ImageGalleryPanel 
                images={images} 
                isLoading={isLoading} 
                onRemove={removeImage} 
                onUpload={handleImageUpload} 
             />

              <div className="mt-8 space-y-3">
                  <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Publicar Ahora"}
                  </button>
                  <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-800 transition-all"
                  >
                      Cancelar
                  </button>
              </div>

              <FeedbackMessages error={error} success={success} />
          </motion.div>

        </div>
      </div>
    </div>
  );
}