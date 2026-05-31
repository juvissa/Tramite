document.addEventListener('DOMContentLoaded', async () => {

  try {
    const resp = await fetch('js/componentes/header.html');
    const html = await resp.text();
    document.body.insertAdjacentHTML('afterbegin', html);

    const pagina = document.body.dataset.pagina;
    const ruta = document.body.dataset.ruta;
    if (pagina) document.getElementById('encabezadoPagina').textContent = pagina;
    if (ruta) document.getElementById('encabezadoRuta').textContent = ruta;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre_completo, apellidos_completos')
      .ilike('gmail', user.email)
      .maybeSingle();

    if (perfil) {
      const primerApellido = perfil.apellidos_completos.split(' ')[0];
      document.getElementById('txtNombreUsuario').textContent =
        `${perfil.nombre_completo} ${primerApellido}`;
      document.getElementById('avatarIniciales').textContent =
        (perfil.nombre_completo.charAt(0) + primerApellido.charAt(0)).toUpperCase();
    }

    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
      document.getElementById('modalCerrarSesion').classList.add('activo');
    });

    document.getElementById('btnConfirmarCerrarSesion').addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });

    function cerrarModalSesion() {
      document.getElementById('modalCerrarSesion').classList.remove('activo');
    }

    document.getElementById('btnCancelarCerrarSesion').addEventListener('click', cerrarModalSesion);
    document.getElementById('modalCerrarSesion').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalCerrarSesion')) cerrarModalSesion();
    });

  } catch (err) {
    window.location.href = 'index.html';
  } finally {
    document.body.classList.add('visible');
    document.dispatchEvent(new Event('header:listo'));
  }

});
