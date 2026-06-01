(function () {
  'use strict'

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

  function formatearFechaLarga(fechaISO) {
    if (!fechaISO) return ''
    const [anio, mes, dia] = fechaISO.split('-')
    return `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} del ${anio}`
  }

  async function generarWord(datos) {
    const {
      tipo_documento: tipoDoc,
      numero_documento: numDoc,
      fecha,
      destinatario,
      cargo,
      asunto,
      cuerpo,
    } = datos

    const resp = await fetch('assets/plantillas/Plantilla - Emitir.docx')
    const buffer = await resp.arrayBuffer()

    const zip = new PizZip(buffer)
    const doc = new window.docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render({
      FECHA_LARGA: formatearFechaLarga(fecha),
      TIPO_DOC: tipoDoc,
      NUM_DOC: numDoc,
      DESTINATARIO: destinatario || '',
      CARGO: cargo || '',
      ASUNTO: asunto || '',
      CUERPO: cuerpo || '',
    })

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    return blob
  }

  async function generarYSubirWord(datos, idDocumento, supabase) {
    const blob = await generarWord(datos)
    const nombre = `emitidos/${idDocumento}/${datos.numero_documento}.docx`

    const { error } = await supabase.storage
      .from('documentos')
      .upload(nombre, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

    if (error) throw new Error(`Error al subir Word: ${error.message}`)

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(nombre)

    return { ruta: nombre, url: publicUrl }
  }

  window.generarYSubirWord = generarYSubirWord
})()
