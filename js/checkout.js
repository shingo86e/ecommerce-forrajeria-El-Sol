// Importar funciones de Firebase
import { crearPedido } from './firebase-ecomerce.js';

// Variables globales
let carritoActual = [];
let clienteActual = null;

// Inicializar la página al cargar
document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarCarrito();
    configurarEventos();
    configurarFechaHora();
    actualizarNavegacion();
});

// Actualizar navegación según sesión
function actualizarNavegacion() {
    const misPedidosLink = document.getElementById('misPedidosLink');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (clienteActual) {
        misPedidosLink.classList.remove('hidden');
        loginLink.textContent = `👋 ${clienteActual.nombre}`;
        loginLink.href = '#';
        logoutLink.classList.remove('hidden');
    } else {
        misPedidosLink.classList.add('hidden');
        loginLink.textContent = 'Registro';
        loginLink.href = 'registro.html';
        logoutLink.classList.add('hidden');
    }
}

// Verificar que el usuario esté logueado
function verificarSesion() {
    const sesionActiva = localStorage.getItem('sesionEcommerce');
    
    if (!sesionActiva) {
        window.location.href = 'registro.html';
        return;
    }
    
    try {
        clienteActual = JSON.parse(sesionActiva);
        mostrarDatosCliente();
        actualizarNavegacion();
    } catch (error) {
        console.error('Error al parsear sesión:', error);
        window.location.href = 'registro.html';
    }
}

// Mostrar datos del cliente logueado
function mostrarDatosCliente() {
    if (!clienteActual) return;
    
    document.getElementById('nombreCliente').textContent = clienteActual.nombre || 'No disponible';
    document.getElementById('telefonoCliente').textContent = clienteActual.celular || 'No disponible';
    document.getElementById('emailCliente').textContent = clienteActual.email || 'No especificado';
}

// Cargar carrito desde localStorage
function cargarCarrito() {
    const carrito = localStorage.getItem('carrito');
    if (!carrito) {
        mostrarCarritoVacio();
        return;
    }
    
    carritoActual = JSON.parse(carrito);
    
    if (carritoActual.length === 0) {
        mostrarCarritoVacio();
        return;
    }
    
    mostrarResumenPedido();
}

// Mostrar mensaje de carrito vacío
function mostrarCarritoVacio() {
    document.getElementById('orderSummary').innerHTML = `
        <div class="order-summary-card">
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>Carrito vacío</h3>
                <p>No tienes productos en tu carrito.</p>
                <a href="catalogo.html" class="btn">Ver Productos</a>
            </div>
        </div>
    `;
    
    document.getElementById('checkoutForm').style.display = 'none';
}

// Mostrar resumen del pedido
function mostrarResumenPedido() {
    const contenedorResumen = document.getElementById('orderSummary');
    let subtotal = 0;
    
    let htmlItems = '';
    carritoActual.forEach(item => {
        const totalItem = item.precio * item.cantidad;
        subtotal += totalItem;
        
        htmlItems += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${item.nombre}</div>
                    <div class="order-item-details">${item.cantidad} x $${item.precio.toLocaleString()}</div>
                </div>
                <div class="order-item-price">$${totalItem.toLocaleString()}</div>
            </div>
        `;
    });
    
    const totalItems = carritoActual.reduce((sum, item) => sum + item.cantidad, 0);
    
    contenedorResumen.innerHTML = `
        <div class="order-summary-card">
            <h3>Resumen del Pedido</h3>
            
            <div style="margin-bottom: 1rem;">
                ${htmlItems}
            </div>
            
            <div class="order-totals">
                <div class="total-row">
                    <span>Subtotal (${totalItems} items):</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>
                <div class="total-row final-total">
                    <span>Total:</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="order-actions">
                <button type="submit" form="checkoutForm" class="submit-btn" id="confirmarPedido">
                    <i class="fas fa-check"></i> Confirmar Pedido
                </button>
                <a href="carrito.html" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Volver al Carrito
                </a>
            </div>
        </div>
    `;
}

// Configurar eventos del formulario
function configurarEventos() {
    const formulario = document.getElementById('checkoutForm');
    formulario.addEventListener('submit', procesarPedido);
    
    // Validación en tiempo real de la fecha
    const fechaInput = document.getElementById('fechaRetiro');
    fechaInput.addEventListener('change', validarFecha);
    
    // Validación en tiempo real de la hora
    const horaInput = document.getElementById('horaRetiro');
    horaInput.addEventListener('change', validarHora);
}

// Configurar fecha y hora mínimas
function configurarFechaHora() {
    const ahora = new Date();
    const fechaInput = document.getElementById('fechaRetiro');
    const horaInput = document.getElementById('horaRetiro');
    
    // Fecha mínima: mañana
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    const fechaMinima = manana.toISOString().split('T')[0];
    fechaInput.min = fechaMinima;
    
    // Fecha máxima: 30 días desde hoy
    const fechaMaxima = new Date(ahora);
    fechaMaxima.setDate(fechaMaxima.getDate() + 30);
    fechaInput.max = fechaMaxima.toISOString().split('T')[0];
    
    // Configurar horarios de la forrajería (8:00 AM - 6:00 PM)
    horaInput.min = '08:00';
    horaInput.max = '18:00';
}

// Validar fecha seleccionada
function validarFecha() {
    const fechaInput = document.getElementById('fechaRetiro');
    const fechaSeleccionada = new Date(fechaInput.value);
    const ahora = new Date();
    
    // Verificar que no sea domingo (día 0)
    if (fechaSeleccionada.getDay() === 0) {
        mostrarError(fechaInput, 'Los domingos estamos cerrados. Por favor selecciona otro día.');
        return false;
    }
    
    // Verificar que sea al menos mañana
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < manana) {
        mostrarError(fechaInput, 'La fecha debe ser al menos mañana.');
        return false;
    }
    
    limpiarError(fechaInput);
    return true;
}

// Validar hora seleccionada
function validarHora() {
    const horaInput = document.getElementById('horaRetiro');
    const horaSeleccionada = horaInput.value;
    
    if (!horaSeleccionada) {
        mostrarError(horaInput, 'Por favor selecciona una hora.');
        return false;
    }
    
    const [horas, minutos] = horaSeleccionada.split(':').map(Number);
    
    // Verificar horario de atención
    if (horas < 8 || horas > 18) {
        mostrarError(horaInput, 'Nuestro horario de atención es de 8:00 AM a 6:00 PM.');
        return false;
    }
    
    limpiarError(horaInput);
    return true;
}

// Mostrar mensaje de error en campo
function mostrarError(campo, mensaje) {
    campo.classList.add('error');
    
    let errorDiv = campo.parentNode.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        campo.parentNode.appendChild(errorDiv);
    }
    
    errorDiv.textContent = mensaje;
    errorDiv.classList.add('show');
}

// Limpiar mensaje de error
function limpiarError(campo) {
    campo.classList.remove('error');
    const errorDiv = campo.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// Validar formulario completo
function validarFormulario() {
    let esValido = true;
    
    // Validar fecha
    const fechaInput = document.getElementById('fechaRetiro');
    if (!fechaInput.value || !validarFecha()) {
        esValido = false;
    }
    
    // Validar hora
    const horaInput = document.getElementById('horaRetiro');
    if (!horaInput.value || !validarHora()) {
        esValido = false;
    }
    
    // Validar comentarios (opcional, pero si hay contenido validar longitud)
    const comentarios = document.getElementById('comentarios');
    if (comentarios.value && comentarios.value.length > 500) {
        mostrarError(comentarios, 'Los comentarios no pueden exceder 500 caracteres.');
        esValido = false;
    } else {
        limpiarError(comentarios);
    }
    
    return esValido;
}

// Procesar el pedido
async function procesarPedido(e) {
    e.preventDefault();
    
    if (!validarFormulario()) {
        mostrarNotificacion('Por favor corrige los errores en el formulario.', 'error');
        return;
    }
    
    if (carritoActual.length === 0) {
        mostrarNotificacion('No hay productos en el carrito.', 'error');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const fechaRetiro = document.getElementById('fechaRetiro').value;
        const horaRetiro = document.getElementById('horaRetiro').value;
        const comentarios = document.getElementById('comentarios').value || '';
        
        // Calcular total
        const total = carritoActual.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const totalItems = carritoActual.reduce((sum, item) => sum + item.cantidad, 0);
        
        // Validar datos del cliente
        if (!clienteActual.celular) {
            mostrarNotificacion('Error: datos del cliente incompletos. Por favor vuelve a iniciar sesión.', 'error');
            return;
        }
        
        // Crear objeto del pedido
        const nuevoPedido = {
            cliente: {
                id: clienteActual.id || '',
                nombre: clienteActual.nombre || '',
                apellido: clienteActual.apellido || '', // Agregar apellido
                telefono: clienteActual.celular || '', // Usar celular como telefono
                email: clienteActual.email || ''
            },
            productos: carritoActual.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad
            })),
            fechaRetiro: fechaRetiro,
            horaRetiro: horaRetiro,
            fechaHoraRetiro: `${fechaRetiro} ${horaRetiro}`, // Formato combinado para el admin
            comentarios: comentarios,
            total: total,
            totalItems: totalItems,
            fechaPedido: new Date().toISOString(),
            estado: 'Pendiente'
        };
        
        // Guardar en Firebase
        const pedidoId = await crearPedido(nuevoPedido);
        
        // Limpiar carrito
        localStorage.removeItem('carrito');
        
        // Mostrar confirmación
        mostrarConfirmacion(pedidoId, nuevoPedido);
        
    } catch (error) {
        console.error('Error al crear pedido:', error);
        mostrarNotificacion('Error al procesar el pedido. Por favor intenta nuevamente.', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar overlay de loading
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (mostrar) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Mostrar confirmación del pedido
function mostrarConfirmacion(pedidoId, pedido) {
    document.getElementById('checkoutContent').style.display = 'none';
    document.getElementById('confirmationSection').classList.add('show');
    
    // Formatear fecha para mostrar
    const fechaFormateada = new Date(pedido.fechaRetiro).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Formatear hora
    const [horas, minutos] = pedido.horaRetiro.split(':');
    const horaFormateada = `${horas}:${minutos}`;
    
    document.getElementById('numeroPedido').textContent = String(pedidoId).slice(-8).toUpperCase();
    document.getElementById('fechaRetiroConfirm').textContent = `${fechaFormateada} a las ${horaFormateada}`;
    document.getElementById('totalConfirm').textContent = `$${pedido.total.toLocaleString()}`;
    
    // Mostrar productos en la confirmación
    let productosHtml = '';
    pedido.productos.forEach(producto => {
        productosHtml += `
            <div class="detail-row">
                <span>${producto.nombre} x${producto.cantidad}</span>
                <span>$${producto.subtotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    document.getElementById('productosConfirm').innerHTML = productosHtml;
    
    // Si hay comentarios, mostrarlos
    if (pedido.comentarios) {
        document.getElementById('comentariosConfirm').textContent = pedido.comentarios;
        document.getElementById('comentariosConfirm').parentElement.style.display = 'block';
    }
}

// Mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `notification ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${mensaje}
    `;
    
    document.body.appendChild(notificacion);
    
    // Posicionar la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.zIndex = '10000';
    notificacion.style.maxWidth = '400px';
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.parentNode.removeChild(notificacion);
        }
    }, 5000);
}

// Función para volver al catálogo desde la confirmación
function volverAlCatalogo() {
    window.location.href = 'catalogo.html';
}

// Función para ir a ver más productos
function verMasProductos() {
    window.location.href = 'catalogo.html';
}

// Exponer funciones globales para los botones
window.volverAlCatalogo = volverAlCatalogo;
window.verMasProductos = verMasProductos;