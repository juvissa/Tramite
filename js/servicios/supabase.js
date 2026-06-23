/**
 * Inicialización del cliente Supabase
 * Se carga como script clásico (no ES module) para que `window.supabase`
 * esté disponible inmediatamente para los scripts que dependen de él.
 *
 * Requiere:
 *   1. CDN de supabase-js cargado antes: https://unpkg.com/@supabase/supabase-js@2
 *   2. CONFIGURACION disponible globalmente (aplicacion.js cargado antes)
 */

if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
  console.error('[Supabase] La librería de Supabase no se ha cargado. Asegúrate de incluir el CDN antes de este script.');
} else if (typeof CONFIGURACION === 'undefined') {
  console.error('[Supabase] CONFIGURACION no está definida. Asegúrate de cargar aplicacion.js antes.');
} else {
  var supabase = window.supabase.createClient(
    CONFIGURACION.supabase.url,
    CONFIGURACION.supabase.anonKey
  );
}

/* ════════════════════════════════════════════
   AUTORIZACIÓN POR ROL
   ════════════════════════════════════════════ */
const MODULO_ROLES = {
  dashboard: [1, 2],
  usuarios: [1, 2],
  'registrar-tramite': [1, 2, 3],
  documentos: [1, 2, 3],
  area: [1, 2],
  reportes: [1, 2],
  inventario: [1, 2, 3],
}

async function verificarAcceso(modulo) {
  try {
    if (!window.supabase) return false
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = 'index.html'
      return false
    }
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .single()
    if (!perfil || !MODULO_ROLES[modulo].includes(perfil.rol)) {
      window.location.href = 'documentos.html'
      return false
    }
    return true
  } catch (err) {
    window.location.href = 'index.html'
    return false
  }
}
