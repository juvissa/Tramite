class Tabla {
  constructor(config) {
    this.columnas = config.columnas || [];
    this.titulo = config.titulo || '';
    this.textoBoton = config.textoBoton || 'Nuevo';
    this.onNuevo = config.onNuevo || (() => {});

    this.contenedor = document.createElement('div');
    this.contenedor.className = 'tabla-contenedor';

    const headerEl = document.createElement('div');
    headerEl.className = 'tabla-encabezado';

    if (config.headerHTML) {
      headerEl.innerHTML = config.headerHTML;
    } else {
      headerEl.innerHTML = `
        <h2 class="tabla-titulo">${this.titulo}</h2>
        <button class="btn-filled-md tabla-btn-nuevo">${this.textoBoton}</button>
      `;
      headerEl.querySelector('.tabla-btn-nuevo').addEventListener('click', this.onNuevo);
    }

    this.contenedor.appendChild(headerEl);

    const wrapper = document.createElement('div');
    wrapper.className = 'tabla-wrapper';
    wrapper.innerHTML = `
      <table class="tabla">
        <thead>
          <tr>${this.columnas.map(c => `<th>${c.titulo}</th>`).join('')}</tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    this.contenedor.appendChild(wrapper);
    this.tbody = wrapper.querySelector('tbody');
  }

  actualizar(datos) {
    this.tbody.innerHTML = datos.map(fila => {
      const celdas = this.columnas.map(col => {
        const valor = fila[col.clave];
        const contenido = col.render ? col.render(valor, fila) : (valor ?? '');
        return `<td>${contenido}</td>`;
      }).join('');
      return `<tr>${celdas}</tr>`;
    }).join('');
  }

  obtenerElemento() {
    return this.contenedor;
  }
}
