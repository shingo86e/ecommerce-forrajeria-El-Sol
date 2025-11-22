import { obtenerProductosConStock } from './firebase-ecomerce.js';

// Referencias a elementos del DOM
const loadingMessage = document.getElementById('loadingMessage');
const productsGrid = document.getElementById('productsGrid');
const noProducts = document.getElementById('noProducts');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const clearFilters = document.getElementById('clearFilters');
const notification = document.getElementById('notification');
const loginRequired = document.getElementById('loginRequired');
const cartCount = document.getElementById('cartCount');
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');

// Variables globales
let todosLosProductos = [];
let productosFiltrados = [];
let clienteSesion = null;

// Función para obtener sesión del cliente
function obtenerSesion() {
    const sesionActiva = localStorage.getItem('sesionEcommerce');
    
    if (sesionActiva) {
        return JSON.parse(sesionActiva);
    }
    return null;
}

// Función para obtener carrito
function obtenerCarrito() {
    const carrito = localStorage.getItem('carrito');
    return carrito ? JSON.parse(carrito) : [];
}

// Función para guardar carrito
function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

// Función para actualizar contador del carrito
function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    cartCount.textContent = totalItems;
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    notification.textContent = mensaje;
    notification.className = `notification ${tipo}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Función para actualizar interfaz según sesión
function actualizarInterfazSesion() {
    clienteSesion = obtenerSesion();
    const misPedidosLink = document.getElementById('misPedidosLink');
    
    if (clienteSesion) {
        loginRequired.style.display = 'none';
        loginLink.textContent = `👋 ${clienteSesion.nombre}`;
        loginLink.href = '#';
        logoutLink.classList.remove('hidden');
        misPedidosLink.classList.remove('hidden');
    } else {
        loginRequired.style.display = 'block';
        loginLink.textContent = 'Registro';
        loginLink.href = 'registro.html';
        logoutLink.classList.add('hidden');
        misPedidosLink.classList.add('hidden');
    }
}

// Función para cargar productos desde Firebase
async function cargarProductos() {
    try {
        console.log('Iniciando carga de productos en catálogo...');
        loadingMessage.style.display = 'block';
        productsGrid.style.display = 'none';
        noProducts.style.display = 'none';
        
        const resultado = await obtenerProductosConStock();
        console.log('Resultado de obtenerProductosConStock:', resultado);
        
        if (resultado.success && resultado.productos.length > 0) {
            console.log('Productos obtenidos exitosamente:', resultado.productos);
            todosLosProductos = resultado.productos;
            productosFiltrados = [...todosLosProductos];
            mostrarProductos();
        } else {
            console.log('No se encontraron productos o error:', resultado);
            mostrarSinProductos();
        }
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarNotificacion('Error al cargar productos. Intenta recargar la página.', 'error');
        mostrarSinProductos();
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Función para mostrar productos en el grid
function mostrarProductos() {
    if (productosFiltrados.length === 0) {
        mostrarSinProductos();
        return;
    }
    
    productsGrid.innerHTML = '';
    
    productosFiltrados.forEach(producto => {
        const productCard = crearCardProducto(producto);
        productsGrid.appendChild(productCard);
    });
    
    productsGrid.style.display = 'grid';
    noProducts.style.display = 'none';
}

// Función para crear card de producto
function crearCardProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Determinar la imagen a mostrar
    let imagenHtml = '';
    if (producto.imagen && producto.imagen.trim() !== '') {
        imagenHtml = `
            <img src="${producto.imagen}" alt="${producto.nombre}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            <div class="fallback-icon" style="display: none; width: 100%; height: 100%; background: linear-gradient(45deg, #f8f9fa, #e9ecef); align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">📦</div>
        `;
    } else {
        imagenHtml = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">📦</div>';
    }
    
    card.innerHTML = `
        <div class="product-image">
            ${imagenHtml}
        </div>
        <div class="product-info">
            <div class="product-name">${producto.nombre}</div>
            <div class="product-price">$${producto.precio.toLocaleString()}</div>
            <div class="product-stock">📦 Stock: ${producto.stock} unidades</div>
            
            ${clienteSesion ? `
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="cambiarCantidad('${producto.id}', -1)">-</button>
                    <input type="number" class="quantity-input" id="qty-${producto.id}" value="1" min="1" max="${producto.stock}">
                    <button class="quantity-btn" onclick="cambiarCantidad('${producto.id}', 1)">+</button>
                </div>
                <button class="btn" onclick="agregarAlCarrito('${producto.id}')">
                    🛒 Agregar al Carrito
                </button>
            ` : `
                <div style="text-align: center; color: #6c757d; font-style: italic;">
                    Inicia sesión para agregar al carrito
                </div>
            `}
        </div>
    `;
    
    return card;
}

// Función para mostrar mensaje cuando no hay productos
function mostrarSinProductos() {
    productsGrid.style.display = 'none';
    noProducts.style.display = 'block';
}

// Función para cambiar cantidad
window.cambiarCantidad = function(productoId, cambio) {
    const input = document.getElementById(`qty-${productoId}`);
    const producto = todosLosProductos.find(p => p.id === productoId);
    
    let nuevaCantidad = parseInt(input.value) + cambio;
    
    if (nuevaCantidad < 1) nuevaCantidad = 1;
    if (nuevaCantidad > producto.stock) nuevaCantidad = producto.stock;
    
    input.value = nuevaCantidad;
}

// Función para agregar al carrito
window.agregarAlCarrito = function(productoId) {
    if (!clienteSesion) {
        mostrarNotificacion('Debes iniciar sesión para agregar productos', 'error');
        return;
    }
    
    const producto = todosLosProductos.find(p => p.id === productoId);
    const cantidad = parseInt(document.getElementById(`qty-${productoId}`).value);
    
    if (!producto || cantidad <= 0) return;
    
    const carrito = obtenerCarrito();
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (nuevaCantidad <= producto.stock) {
            itemExistente.cantidad = nuevaCantidad;
            mostrarNotificacion(`Cantidad actualizada: ${producto.nombre}`, 'success');
        } else {
            mostrarNotificacion(`Stock insuficiente. Máximo ${producto.stock} unidades`, 'error');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            stock: producto.stock,
            imagen: producto.imagen || null // Agregar imagen al carrito
        });
        mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
    }
    
    guardarCarrito(carrito);
    
    // Resetear cantidad a 1
    document.getElementById(`qty-${productoId}`).value = 1;
}

// Función para filtrar productos
function filtrarProductos() {
    const termino = searchInput.value.toLowerCase().trim();
    
    productosFiltrados = todosLosProductos.filter(producto => 
        producto.nombre.toLowerCase().includes(termino)
    );
    
    ordenarProductos();
    mostrarProductos();
}

// Función para ordenar productos
function ordenarProductos() {
    const criterio = sortSelect.value;
    
    productosFiltrados.sort((a, b) => {
        switch (criterio) {
            case 'nombre':
                return a.nombre.localeCompare(b.nombre);
            case 'precio-asc':
                return a.precio - b.precio;
            case 'precio-desc':
                return b.precio - a.precio;
            case 'stock':
                return b.stock - a.stock;
            default:
                return 0;
        }
    });
}

// Función para limpiar filtros
function limpiarFiltros() {
    searchInput.value = '';
    sortSelect.value = 'nombre';
    productosFiltrados = [...todosLosProductos];
    ordenarProductos();
    mostrarProductos();
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionEcommerce');
    localStorage.removeItem('carrito');
    window.location.reload();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazSesion();
    actualizarContadorCarrito();
    cargarProductos();
    
    // Filtros
    searchInput.addEventListener('input', filtrarProductos);
    sortSelect.addEventListener('change', () => {
        ordenarProductos();
        mostrarProductos();
    });
    clearFilters.addEventListener('click', limpiarFiltros);
    
    // Logout
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Cerrar sesión?')) {
            cerrarSesion();
        }
    });
});