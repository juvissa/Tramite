(function () {
  'use strict'

  let supabase
  let sesion = null
  let perfilActual = null
  let areas = []
  let adjuntosSeleccionados = []
  let datePicker = null

  const TIPOS_DOCUMENTO = [
    { id: 'CARTA', nombre: 'Carta Nº' },
    { id: 'MEMORANDUM', nombre: 'Memorándum Nº' },
    { id: 'OFICIO', nombre: 'Oficio Nº' },
    { id: 'SOLICITUD', nombre: 'Solicitud Nº' },
    { id: 'INFORME', nombre: 'Informe Nº' },
    { id: 'NOTAS', nombre: 'Notas Nº' },
  ]

  document.addEventListener('DOMContentLoaded', inicializar)

  async function inicializar() {
    supabase = window.supabase
    if (!supabase) return

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      window.location.href = 'index.html'
      return
    }
    sesion = session

    const { data: perfil, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, apellidos_completos, gmail, rol')
      .eq('id', session.user.id)
      .single()

    if (errorPerfil || !perfil) {
      window.location.href = 'index.html'
      return
    }
    perfilActual = perfil

    await Promise.all([
      cargarAreas(),
    ])

    const nombreCompleto = `${perfil.nombre_completo || ''} ${perfil.apellidos_completos || ''}`.trim()
    document.getElementById('campoAutor').value = nombreCompleto
    document.getElementById('campoRemitente').value = nombreCompleto

    inicializarDatePicker()
    inicializarDesplegableTipoDoc()
    inicializarDesplegableArea()
    inicializarFileInput()
    inicializarBotones()
  }

  async function cargarAreas() {
    const { data } = await supabase
      .from('areas')
      .select('id, nombre, responsable, cargo')
      .order('nombre', { ascending: true })

    if (data) areas = data
  }

  function inicializarDatePicker() {
    datePicker = new DatePicker('campoFecha', {
      placeholder: 'dd/mm/aaaa',
      timezone: CONFIGURACION.formato.zonaHoraria,
      onChange: (fechaISO) => {},
    })
  }

  /* ─── DESPLEGABLE TIPO DOCUMENTO ─── */
  function inicializarDesplegableTipoDoc() {
    const dropdown = document.getElementById('dropdownTipoDoc')
    dropdown.innerHTML = ''

    TIPOS_DOCUMENTO.forEach((td) => {
      const opt = document.createElement('div')
      opt.className = 'filtro-option'
      opt.dataset.value = td.id
      opt.textContent = td.nombre
      dropdown.appendChild(opt)
    })

    const trigger = document.getElementById('triggerTipoDoc')
    const text = trigger.querySelector('.filtro-select-text')
    const wrapper = document.getElementById('wrapperTipoDoc')

    dropdown.addEventListener('click', async (e) => {
      const opt = e.target.closest('.filtro-option')
      if (!opt) return

      dropdown.querySelectorAll('.filtro-option').forEach((o) => o.classList.remove('seleccionada'))
      opt.classList.add('seleccionada')
      text.textContent = opt.textContent
      trigger.dataset.value = opt.dataset.value
      wrapper.classList.remove('abierto')

      await generarNumeroDocumento(opt.dataset.value)
    })

    trigger.addEventListener('click', () => {
      wrapper.classList.toggle('abierto')
    })

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('abierto')
      }
    })
  }

  async function generarNumeroDocumento(tipoDocumento) {
    const campo = document.getElementById('campoNumero')
    campo.value = 'Generando...'

    try {
      const res = await fetch(
        `${CONFIGURACION.supabase.url}/functions/v1/generar-numero-documento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sesion.access_token}`,
          },
          body: JSON.stringify({ tipo_documento: tipoDocumento }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar número')
      }

      campo.value = data.numero_documento
    } catch (err) {
      campo.value = 'Error al generar'
    }
  }

  /* ─── DESPLEGABLE ÁREA ─── */
  function inicializarDesplegableArea() {
    const dropdown = document.getElementById('dropdownArea')
    dropdown.innerHTML = ''

    areas.forEach((area) => {
      const opt = document.createElement('div')
      opt.className = 'filtro-option'
      opt.dataset.value = area.id
      opt.textContent = area.nombre
      dropdown.appendChild(opt)
    })

    const trigger = document.getElementById('triggerArea')
    const text = trigger.querySelector('.filtro-select-text')
    const wrapper = document.getElementById('wrapperArea')

    dropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.filtro-option')
      if (!opt) return

      dropdown.querySelectorAll('.filtro-option').forEach((o) => o.classList.remove('seleccionada'))
      opt.classList.add('seleccionada')
      text.textContent = opt.textContent
      trigger.dataset.value = opt.dataset.value
      wrapper.classList.remove('abierto')

      const area = areas.find((a) => a.id === opt.dataset.value)
      if (area) {
        document.getElementById('campoDestinatario').value = area.responsable || ''
        document.getElementById('campoCargo').value = area.cargo || ''
      }
    })

    trigger.addEventListener('click', () => {
      wrapper.classList.toggle('abierto')
    })

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('abierto')
      }
    })
  }

  /* ─── FILE INPUT ─── */
  function inicializarFileInput() {
    const input = document.getElementById('campoAdjuntos')
    const nombreSpan = document.getElementById('adjuntosNombre')
    const lista = document.getElementById('adjuntosLista')

    input.addEventListener('change', () => {
      adjuntosSeleccionados = Array.from(input.files)
      renderizarAdjuntos()
    })

    function renderizarAdjuntos() {
      lista.innerHTML = ''
      if (adjuntosSeleccionados.length === 0) {
        nombreSpan.textContent = 'Ningún archivo seleccionado'
        return
      }
      nombreSpan.textContent = `${adjuntosSeleccionados.length} archivo(s) seleccionado(s)`

      adjuntosSeleccionados.forEach((file, index) => {
        const chip = document.createElement('div')
        chip.className = 'adjunto-chip'
        chip.innerHTML = `
          <i class="ph ph-file-pdf"></i>
          <span>${file.name}</span>
          <i class="ph ph-x" data-index="${index}"></i>
        `
        chip.querySelector('.ph-x').addEventListener('click', () => {
          adjuntosSeleccionados.splice(index, 1)
          const dt = new DataTransfer()
          adjuntosSeleccionados.forEach((f) => dt.items.add(f))
          input.files = dt.files
          renderizarAdjuntos()
        })
        lista.appendChild(chip)
      })
    }
  }

  /* ─── BOTONES ─── */
  function inicializarBotones() {
    document.getElementById('btnCancelarTramite').addEventListener('click', () => {
      limpiarFormulario()
    })

    document.getElementById('btnGuardarTramite').addEventListener('click', guardarTramite)
  }

  function limpiarFormulario() {
    document.getElementById('campoNumero').value = ''
    document.getElementById('campoAsunto').value = ''
    document.getElementById('campoCuerpo').value = ''

    const triggerTipo = document.getElementById('triggerTipoDoc')
    triggerTipo.querySelector('.filtro-select-text').textContent = 'Seleccione un tipo'
    delete triggerTipo.dataset.value
    document.getElementById('dropdownTipoDoc').querySelectorAll('.filtro-option').forEach((o) => o.classList.remove('seleccionada'))

    const triggerArea = document.getElementById('triggerArea')
    triggerArea.querySelector('.filtro-select-text').textContent = 'Seleccione un área'
    delete triggerArea.dataset.value
    document.getElementById('dropdownArea').querySelectorAll('.filtro-option').forEach((o) => o.classList.remove('seleccionada'))

    document.getElementById('campoDestinatario').value = ''
    document.getElementById('campoCargo').value = ''

    const fileInput = document.getElementById('campoAdjuntos')
    fileInput.value = ''
    adjuntosSeleccionados = []
    document.getElementById('adjuntosNombre').textContent = 'Ningún archivo seleccionado'
    document.getElementById('adjuntosLista').innerHTML = ''

    document.querySelectorAll('.input-error').forEach((el) => el.textContent = '')
  }

  function mostrarError(id, mensaje) {
    const el = document.getElementById(id)
    if (el) el.textContent = mensaje
  }

  function limpiarErrores() {
    document.querySelectorAll('.input-error').forEach((el) => el.textContent = '')
  }

  async function guardarTramite() {
    limpiarErrores()

    const tipoDocumento = document.getElementById('triggerTipoDoc').dataset.value
    const asunto = document.getElementById('campoAsunto').value.trim()
    const cuerpo = document.getElementById('campoCuerpo').value.trim()
    const prioridad = document.getElementById('campoPrioridad').value
    const fecha = datePicker ? datePicker.obtenerValor() : new Date().toISOString().split('T')[0]
    const destinatario = document.getElementById('campoDestinatario').value.trim()
    const cargo = document.getElementById('campoCargo').value.trim()
    const areaId = document.getElementById('triggerArea').dataset.value || null

    let valido = true
    if (!tipoDocumento) { mostrarError('errorAsunto', 'Seleccione un tipo de documento'); valido = false }
    if (!asunto) { mostrarError('errorAsunto', 'El asunto es obligatorio'); valido = false }
    if (!cuerpo) { mostrarError('errorCuerpo', 'El cuerpo del documento es obligatorio'); valido = false }

    if (!valido) return

    const btn = document.getElementById('btnGuardarTramite')
    const spinner = document.getElementById('spinnerTramite')
    const texto = document.getElementById('textoGuardarTramite')
    btn.disabled = true
    spinner.style.display = 'inline-block'
    texto.textContent = 'Guardando...'

    let archivosSubidos = []

    try {
      // ─── 1. Subir archivos a temp/ (primero, antes de crear el documento) ───
      if (adjuntosSeleccionados.length > 0) {
        const resultado = await subirArchivosTemp()
        if (!resultado.exito) {
          throw new Error(resultado.error || 'Error al subir los archivos adjuntos')
        }
        archivosSubidos = resultado.archivos
      }

      // ─── 2. Crear documento (Edge Function atómica) ───
      const res = await fetch(
        `${CONFIGURACION.supabase.url}/functions/v1/crear-documento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sesion.access_token}`,
          },
          body: JSON.stringify({
            tipo: 'emitido',
            tipo_documento: tipoDocumento,
            fecha,
            prioridad,
            autor_id: perfilActual.id,
            remitente_id: perfilActual.id,
            area_id: areaId,
            destinatario: destinatario || null,
            cargo_destinatario: cargo || null,
            asunto,
            cuerpo_documento: cuerpo,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el trámite')
      }

      // ─── 3. Mover archivos de temp/ a emitidos/{idDocumento}/ ───
      for (const archivo of archivosSubidos) {
        const nombre = archivo.ruta.split('/').pop()
        const destinoRuta = `emitidos/${data.id}/${nombre}`

        const { error: copyError } = await supabase.storage
          .from('documentos')
          .copy(archivo.ruta, destinoRuta)

        if (copyError) {
          console.warn('No se pudo mover el archivo, se usará ruta temp:', copyError.message)
        } else {
          await supabase.storage.from('documentos').remove([archivo.ruta])
          archivo.ruta = destinoRuta
          archivo.url = supabase.storage.from('documentos').getPublicUrl(destinoRuta).data.publicUrl
        }
      }

      // ─── 4. Insertar registros en documentos_archivos ───
      for (const archivo of archivosSubidos) {
        const { error: insertError } = await supabase
          .from('documentos_archivos')
          .insert({
            documento_id: data.id,
            nombre_archivo: archivo.nombre_original,
            ruta_archivo: archivo.ruta,
            url_archivo: archivo.url,
            tipo_archivo: archivo.tipo,
            tamano_bytes: archivo.tamano,
            subido_por: perfilActual.id,
          })

        if (insertError) {
          console.warn('Error al registrar archivo en BD:', insertError)
        }
      }

      // ─── 5. Generar y subir Word ───
      try {
        const tipoObj = TIPOS_DOCUMENTO.find(t => t.id === tipoDocumento)
        const wordInfo = await generarYSubirWord({
          tipo_documento: tipoObj ? tipoObj.nombre : tipoDocumento,
          numero_documento: data.numero_documento,
          fecha,
          destinatario,
          cargo,
          asunto,
          cuerpo,
        }, data.id, supabase)

        await supabase.from('documentos_archivos').insert({
          documento_id: data.id,
          nombre_archivo: `${data.numero_documento}.docx`,
          ruta_archivo: wordInfo.ruta,
          url_archivo: wordInfo.url,
          tipo_archivo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          tamano_bytes: 0,
          subido_por: perfilActual.id,
        })
      } catch (wordErr) {
        console.warn('Error al generar Word:', wordErr.message)
      }

      // ─── Éxito ───
      texto.textContent = '¡Guardado!'
      spinner.style.display = 'none'
      document.getElementById('campoNumero').value = data.numero_documento || ''

      setTimeout(() => {
        limpiarFormulario()
        btn.disabled = false
        texto.textContent = 'Guardar Trámite'
      }, 1500)

    } catch (err) {
      if (archivosSubidos.length > 0) {
        await limpiarArchivosStorage(archivosSubidos)
      }

      btn.disabled = false
      spinner.style.display = 'none'
      texto.textContent = 'Guardar Trámite'
      mostrarError('errorCuerpo', err.message || 'Error al guardar el trámite')
    }
  }

  async function subirArchivosTemp() {
    const operacionId = Date.now()
    const archivos = []

    for (const file of adjuntosSeleccionados) {
      const nombreSanitizado = sanitizarNombre(file.name)
      const ruta = `temp/${operacionId}/${nombreSanitizado}`

      const { error } = await supabase.storage
        .from('documentos')
        .upload(ruta, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/pdf',
        })

      if (error) {
        // Limpiar archivos ya subidos antes de fallar
        for (const a of archivos) {
          await supabase.storage.from('documentos').remove([a.ruta])
        }
        return { exito: false, error: `${file.name}: ${error.message}` }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(ruta)

      archivos.push({
        ruta,
        url: publicUrl,
        nombre_original: file.name,
        tipo: file.type || 'application/pdf',
        tamano: file.size,
      })
    }

    return { exito: true, archivos }
  }

  async function limpiarArchivosStorage(archivos) {
    const rutas = archivos.map(a => a.ruta)
    const { error } = await supabase.storage.from('documentos').remove(rutas)
    if (error) {
      console.warn('No se pudieron limpiar archivos huérfanos:', error.message)
    }
  }

  function sanitizarNombre(nombre) {
    const sinAcentos = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return sinAcentos.replace(/[^a-zA-Z0-9._-]/g, '_')
  }
})()
