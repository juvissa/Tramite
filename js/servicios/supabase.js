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
