-- ============================================
-- SCRIPT DE LIMPIEZA — TRÁMITES
-- Elimina datos de pruebas/inconsistentes
-- Orden: hijos → padres (evita FK violations)
-- ============================================

BEGIN;

DELETE FROM documentos_archivos;
DELETE FROM documentos;
DELETE FROM contadores_documentos;

COMMIT;

-- ============================================
-- LIMPIEZA DE STORAGE (bucket "documentos")
-- ============================================
-- Ejecutar en la consola del navegador estando
-- logueado en el dashboard:
-- ============================================

/*
const { createClient } = require('@supabase/supabase-js')

// O usa window.supabase si estás en el dashboard
const supabase = window.supabase

const bucket = supabase.storage.from('documentos')
const carpetas = ['emitidos', 'derivados', 'temp', 'firmas']

async function limpiarStorage() {
  for (const carpeta of carpetas) {
    const { data: items } = await bucket.list(carpeta, { limit: 1000 })
    if (!items?.length) continue

    for (const item of items) {
      const ruta = `${carpeta}/${item.name}`
      if (item.id) {
        // Archivo suelto
        await bucket.remove([ruta])
      } else {
        // Subcarpeta — listar archivos dentro
        const { data: archivos } = await bucket.list(ruta, { limit: 1000 })
        if (archivos?.length) {
          const rutas = archivos.map(a => `${ruta}/${a.name}`)
          await bucket.remove(rutas)
        }
      }
    }
  }
  console.log('Storage limpio')
}

limpiarStorage()
*/
