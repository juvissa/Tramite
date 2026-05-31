document.addEventListener('header:listo', async () => {

  const resp = await fetch('js/componentes/lateral.html');
  const html = await resp.text();
  document.querySelector('.contenido-principal').insertAdjacentHTML('beforebegin', html);

  const moduloActivo = document.body.dataset.moduloActivo;
  if (moduloActivo) {
    const item = document.querySelector(`.sidebar-item[data-modulo="${moduloActivo}"]`);
    if (item) item.classList.add('activo');
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .ilike('gmail', user.email)
    .maybeSingle();

  if (perfil) {
    document.querySelectorAll('.sidebar-item[data-roles]').forEach(item => {
      const rolesPermitidos = item.dataset.roles.split(',').map(Number);
      if (!rolesPermitidos.includes(perfil.rol)) {
        item.style.display = 'none';
      }
    });
  }

  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const modulo = item.dataset.modulo;
      if (modulo && modulo !== moduloActivo) {
        window.location.href = `${modulo}.html`;
      }
    });
  });

  document.dispatchEvent(new Event('lateral:listo'));

});
