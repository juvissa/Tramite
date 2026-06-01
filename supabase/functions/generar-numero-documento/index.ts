import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const PREFIJO_US = 'US'
const PREFIJO_HSJCH = 'HSJCH'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { tipo_documento } = await req.json()
    if (!tipo_documento) {
      return new Response(
        JSON.stringify({ error: 'Falta tipo_documento' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const anio = new Date().getFullYear()

    const { data: counter } = await adminClient
      .from('contadores_documentos')
      .select('ultimo_contador')
      .eq('tipo_documento', tipo_documento)
      .eq('anio', anio)
      .maybeSingle()

    const siguiente = counter ? counter.ultimo_contador + 1 : 1

    const numeroDocumento = `${String(siguiente).padStart(3, '0')}-${anio}-${PREFIJO_US}-${PREFIJO_HSJCH}`

    return new Response(
      JSON.stringify({
        contador: siguiente,
        anio,
        numero_documento: numeroDocumento,
        ya_existe: !!counter,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error interno del servidor'
    return new Response(
      JSON.stringify({ error: mensaje }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
