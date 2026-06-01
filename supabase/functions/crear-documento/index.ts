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
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const {
      tipo, tipo_documento, fecha, prioridad, autor_id, remitente_id, area_id,
      destinatario, cargo_destinatario, asunto, cuerpo_documento,
    } = body

    if (!tipo || !tipo_documento ||
        !fecha || !prioridad || !autor_id || !remitente_id ||
        !asunto || !cuerpo_documento) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o sesión expirada' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { data: perfil, error: perfilError } = await adminClient
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil) {
      return new Response(
        JSON.stringify({ error: 'Usuario sin perfil' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    if (perfil.rol !== 1 && perfil.rol !== 2 && perfil.rol !== 3) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para crear documentos' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const anio = new Date(fecha + 'T12:00:00').getFullYear()

    const { data: counter } = await adminClient
      .from('contadores_documentos')
      .select('id, ultimo_contador')
      .eq('tipo_documento', tipo_documento)
      .eq('anio', anio)
      .maybeSingle()

    let nuevoContador = 1

    if (!counter) {
      const { error: insertError } = await adminClient
        .from('contadores_documentos')
        .insert({
          tipo_documento,
          anio,
          ultimo_contador: 1,
        })

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Error al crear el contador' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      const { data: updated, error: updateError } = await adminClient
        .from('contadores_documentos')
        .update({ ultimo_contador: counter.ultimo_contador + 1 })
        .eq('id', counter.id)
        .select('ultimo_contador')
        .single()

      if (updateError || !updated) {
        return new Response(
          JSON.stringify({ error: 'Error al actualizar el contador' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }

      nuevoContador = updated.ultimo_contador
    }

    const numeroDocumento = `${String(nuevoContador).padStart(3, '0')}-${anio}-${PREFIJO_US}-${PREFIJO_HSJCH}`

    const { data: doc, error: insertError } = await adminClient
      .from('documentos')
      .insert({
        tipo,
        tipo_documento,
        numero_documento: numeroDocumento,
        contador: nuevoContador,
        fecha,
        prioridad,
        autor_id,
        remitente_id,
        area_id: area_id || null,
        destinatario: destinatario || null,
        cargo_destinatario: cargo_destinatario || null,
        asunto,
        cuerpo_documento,
        creado_por: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Error al crear el documento' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: doc.id, numero_documento: numeroDocumento }),
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
