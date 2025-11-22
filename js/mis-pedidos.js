// Importar funciones de Firebase
import { obtenerPedidos } from './firebase-ecomerce.js';

// Variables globales
let clienteActual = null;
let pedidosCliente = [];
let filtroActual = 'todos';

// Referencias DOM
const loginRequired = document.getElementById('loginRequired');
const ordersContainer = document.getElementById('ordersContainer');
const loadingOrders = document.getElementById('loadingOrders');
const noOrders = document.getElementById('noOrders');
const ordersList = document.getElementById('ordersList');
const cartCount = document.getElementById('cartCount');
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');
const notification = document.getElementById('notification');

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    crearFiltros();
    actualizarContadorCarrito();
});

// Verificar sesión del cliente
function verificarSesion() {
    const sesionActiva = localStorage.getItem('sesionEcommerce');
    
    if (!sesionActiva) {
        mostrarLoginRequerido();
        return;
    }
    
    try {
        clienteActual = JSON.parse(sesionActiva);
        actualizarInterfazSesion();
        cargarPedidosCliente();
    } catch (error) {
        console.error('Error al parsear sesión:', error);
        mostrarLoginRequerido();
    }
}

// Mostrar mensaje de login requerido
function mostrarLoginRequerido() {
    loginRequired.style.display = 'block';
    ordersContainer.style.display = 'none';
    loginLink.textContent = 'Registro';
    loginLink.href = 'registro.html';
    logoutLink.classList.add('hidden');
}

// Actualizar interfaz según sesión
function actualizarInterfazSesion() {
    loginRequired.style.display = 'none';
    ordersContainer.style.display = 'block';
    loginLink.textContent = `👋 ${clienteActual.nombre}`;
    loginLink.href = '#';
    logoutLink.classList.remove('hidden');
    
    // Event listener para cerrar sesión
    logoutLink.addEventListener('click', cerrarSesion);
}

// Crear filtros de estado
function crearFiltros() {
    const filtrosContainer = document.createElement('div');
    filtrosContainer.className = 'orders-filters';
    filtrosContainer.innerHTML = `
        <button class="filter-btn active" data-filter="todos">Todos</button>
        <button class="filter-btn" data-filter="Pendiente">⏳ Pendiente</button>
        <button class="filter-btn" data-filter="Preparado">✅ Listo para Retiro</button>
        <button class="filter-btn" data-filter="Entregado">📦 Entregado</button>
    `;
    
    // Insertar antes del container de pedidos
    ordersContainer.parentNode.insertBefore(filtrosContainer, ordersContainer);
    
    // Event listeners para filtros
    filtrosContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filtroActual = e.target.dataset.filter;
            aplicarFiltro();
        }
    });
}

// Cargar pedidos del cliente
async function cargarPedidosCliente() {
    try {
        loadingOrders.style.display = 'block';
        noOrders.style.display = 'none';
        ordersList.style.display = 'none';
        
        // Obtener todos los pedidos
        const resultado = await obtenerPedidos();
        
        // Verificar si la respuesta es exitosa
        if (!resultado.success) {
            throw new Error('Error al obtener pedidos de Firebase');
        }
        
        // Filtrar pedidos del cliente actual
        pedidosCliente = resultado.pedidos.filter(pedido => 
            pedido.cliente.id === clienteActual.id
        );
        
        // Ordenar por fecha (más recientes primero) - manejar timestamps de Firebase
        pedidosCliente.sort((a, b) => {
            let fechaA, fechaB;
            
            // Manejar timestamps de Firebase
            if (a.fechaPedido?.seconds) {
                fechaA = a.fechaPedido.seconds;
            } else {
                fechaA = new Date(a.fechaPedido).getTime() / 1000;
            }
            
            if (b.fechaPedido?.seconds) {
                fechaB = b.fechaPedido.seconds;
            } else {
                fechaB = new Date(b.fechaPedido).getTime() / 1000;
            }
            
            return fechaB - fechaA; // Más recientes primero
        });
        
        loadingOrders.style.display = 'none';
        
        if (pedidosCliente.length === 0) {
            noOrders.style.display = 'block';
        } else {
            mostrarPedidos();
        }
        
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        loadingOrders.style.display = 'none';
        mostrarNotificacion('Error al cargar tus pedidos. Intenta recargar la página.', 'error');
    }
}

// Mostrar pedidos
function mostrarPedidos() {
    ordersList.style.display = 'block';
    aplicarFiltro();
}

// Aplicar filtro de estado
function aplicarFiltro() {
    let pedidosFiltrados = pedidosCliente;
    
    if (filtroActual !== 'todos') {
        pedidosFiltrados = pedidosCliente.filter(pedido => pedido.estado === filtroActual);
    }
    
    if (pedidosFiltrados.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <div class="empty-orders-icon">🔍</div>
                <h3>No hay pedidos con este estado</h3>
                <p>Prueba con otro filtro o realiza un nuevo pedido.</p>
            </div>
        `;
    } else {
        renderizarPedidos(pedidosFiltrados);
    }
}

// Renderizar lista de pedidos
function renderizarPedidos(pedidos) {
    ordersList.innerHTML = '';
    
    pedidos.forEach(pedido => {
        const pedidoCard = crearTarjetaPedido(pedido);
        ordersList.appendChild(pedidoCard);
    });
}

// Crear tarjeta de pedido
function crearTarjetaPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // Formatear fecha del pedido - manejar tanto string ISO como Timestamp de Firebase
    let fechaPedido;
    if (pedido.fechaPedido?.seconds) {
        // Es un Timestamp de Firebase
        fechaPedido = new Date(pedido.fechaPedido.seconds * 1000);
    } else {
        // Es una string ISO
        fechaPedido = new Date(pedido.fechaPedido);
    }
    
    const fechaPedidoFormateada = fechaPedido.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Formatear fecha de retiro
    const fechaRetiro = new Date(pedido.fechaRetiro).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Determinar mensaje de estado
    let mensajeEstado = '';
    if (pedido.estado === 'Preparado') {
        mensajeEstado = `
            <div class="status-alert ready">
                <strong>🎉 ¡Tu pedido está listo!</strong><br>
                Puedes pasar a retirarlo en el horario acordado: ${fechaRetiro} a las ${pedido.horaRetiro}
            </div>
        `;
    } else if (pedido.estado === 'Pendiente') {
        mensajeEstado = `
            <div class="status-alert">
                <strong>⏳ Estamos preparando tu pedido</strong><br>
                Te notificaremos cuando esté listo para retirar
            </div>
        `;
    }
    
    // Crear lista de productos
    let productosHtml = '';
    pedido.productos.forEach(producto => {
        productosHtml += `
            <div class="product-item">
                <span class="product-name">${producto.nombre}</span>
                <span class="product-quantity">x${producto.cantidad}</span>
                <span class="product-price">$${producto.subtotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    card.innerHTML = `
        <div class="order-header">
            <div class="order-number">
                📋 Pedido #${pedido.id.slice(-8).toUpperCase()}
            </div>
            <div class="order-status status-${pedido.estado.toLowerCase()}">
                ${pedido.estado}
            </div>
        </div>
        
        <div class="order-details">
            <div class="detail-item">
                <div class="detail-label">Fecha del Pedido</div>
                <div class="detail-value">${fechaPedidoFormateada}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Fecha de Retiro</div>
                <div class="detail-value">${fechaRetiro}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Hora de Retiro</div>
                <div class="detail-value">${pedido.horaRetiro}</div>
            </div>
        </div>
        
        ${mensajeEstado}
        
        <div class="order-products">
            <h4>📦 Productos (${pedido.totalItems} items)</h4>
            <div class="product-list">
                ${productosHtml}
            </div>
        </div>
        
        ${pedido.comentarios ? `
            <div class="pickup-info">
                <h4>💬 Comentarios</h4>
                <p>${pedido.comentarios}</p>
            </div>
        ` : ''}
        
        <div class="pickup-info">
            <h4>📍 Información de Retiro</h4>
            <p><strong>Dirección:</strong> [Tu dirección aquí]</p>
            <p><strong>Horarios:</strong> Lunes a Sábado de 8:00 AM a 6:00 PM</p>
            <p><strong>Teléfono:</strong> [Tu teléfono aquí]</p>
        </div>
        
        <div class="order-total">
            Total: $${pedido.total.toLocaleString()}
        </div>
        
        <div class="order-actions">
            ${pedido.estado === 'Pendiente' ? `
                <button class="btn btn-secondary" onclick="repetirPedido('${pedido.id}')">
                    🔄 Repetir Pedido
                </button>
            ` : ''}
            <a href="catalogo.html" class="btn">
                🛒 Ver Más Productos
            </a>
        </div>
    `;
    
    return card;
}

// Función para repetir pedido
window.repetirPedido = function(pedidoId) {
    const pedido = pedidosCliente.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    // Agregar productos al carrito
    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    
    pedido.productos.forEach(producto => {
        const itemExistente = carrito.find(item => item.id === producto.id);
        if (itemExistente) {
            itemExistente.cantidad += producto.cantidad;
        } else {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: producto.cantidad,
                stock: 999 // Valor por defecto, se actualizará al ver catálogo
            });
        }
    });
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    
    mostrarNotificacion('Productos agregados al carrito. ¡Revisa tu carrito!', 'success');
    
    // Ir al carrito después de 2 segundos
    setTimeout(() => {
        window.location.href = 'carrito.html';
    }, 2000);
}

// Cerrar sesión
function cerrarSesion(e) {
    e.preventDefault();
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('sesionEcommerce');
        localStorage.removeItem('carrito');
        window.location.href = 'index.html';
    }
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.textContent = totalItems;
}

// Mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    notification.textContent = mensaje;
    notification.className = `notification ${tipo}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}