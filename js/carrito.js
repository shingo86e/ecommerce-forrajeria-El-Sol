// Referencias a elementos del DOM
const loginRequired = document.getElementById('loginRequired');
const cartContainer = document.getElementById('cartContainer');
const emptyCart = document.getElementById('emptyCart');
const cartContent = document.getElementById('cartContent');
const cartItems = document.getElementById('cartItems');
const subtotal = document.getElementById('subtotal');
const total = document.getElementById('total');
const totalItems = document.getElementById('totalItems');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartCount = document.getElementById('cartCount');
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');
const notification = document.getElementById('notification');

// Variables globales
let clienteSesion = null;
let carrito = [];

// Función para obtener sesión del cliente
function obtenerSesion() {
    const sesionActiva = localStorage.getItem('sesionActiva');
    const clienteData = localStorage.getItem('clienteEcommerce');
    
    if (sesionActiva === 'true' && clienteData) {
        return JSON.parse(clienteData);
    }
    return null;
}

// Función para obtener carrito
function obtenerCarrito() {
    const carritoData = localStorage.getItem('carrito');
    return carritoData ? JSON.parse(carritoData) : [];
}

// Función para guardar carrito
function guardarCarrito(carritoData) {
    localStorage.setItem('carrito', JSON.stringify(carritoData));
    actualizarContadorCarrito();
}

// Función para actualizar contador del carrito
function actualizarContadorCarrito() {
    const carritoData = obtenerCarrito();
    const totalProductos = carritoData.reduce((total, item) => total + item.cantidad, 0);
    cartCount.textContent = totalProductos;
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
    
    if (clienteSesion) {
        loginRequired.style.display = 'none';
        cartContainer.style.display = 'block';
        loginLink.textContent = `👋 ${clienteSesion.nombre}`;
        loginLink.href = '#';
        logoutLink.classList.remove('hidden');
        cargarCarrito();
    } else {
        loginRequired.style.display = 'block';
        cartContainer.style.display = 'none';
        loginLink.textContent = 'Registro';
        loginLink.href = 'registro.html';
        logoutLink.classList.add('hidden');
    }
}

// Función para cargar y mostrar el carrito
function cargarCarrito() {
    carrito = obtenerCarrito();
    
    if (carrito.length === 0) {
        mostrarCarritoVacio();
    } else {
        mostrarCarritoConProductos();
    }
    
    actualizarContadorCarrito();
}

// Función para mostrar carrito vacío
function mostrarCarritoVacio() {
    emptyCart.style.display = 'block';
    cartContent.style.display = 'none';
}

// Función para mostrar carrito con productos
function mostrarCarritoConProductos() {
    emptyCart.style.display = 'none';
    cartContent.style.display = 'block';
    
    renderizarItems();
    calcularTotales();
}

// Función para renderizar items del carrito
function renderizarItems() {
    cartItems.innerHTML = '';
    
    carrito.forEach((item, index) => {
        const itemElement = crearElementoItem(item, index);
        cartItems.appendChild(itemElement);
    });
}

// Función para crear elemento de item
function crearElementoItem(item, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    
    // Determinar la imagen a mostrar
    let imagenHtml = '';
    if (item.imagen && item.imagen.trim() !== '') {
        imagenHtml = `
            <img src="${item.imagen}" alt="${item.nombre}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            <div class="fallback-icon" style="display: none; width: 100%; height: 100%; background: linear-gradient(45deg, #f8f9fa, #e9ecef); align-items: center; justify-content: center; font-size: 2rem; color: #6c757d;">📦</div>
        `;
    } else {
        imagenHtml = '📦';
    }
    
    itemDiv.innerHTML = `
        <div class="item-image">${imagenHtml}</div>
        <div class="item-info">
            <div class="item-name">${item.nombre}</div>
            <div class="item-price">$${item.precio.toLocaleString()} c/u</div>
        </div>
        <div class="item-controls">
            <div class="quantity-controls-cart">
                <button class="quantity-btn-cart" onclick="cambiarCantidad(${index}, -1)">-</button>
                <div class="quantity-display">${item.cantidad}</div>
                <button class="quantity-btn-cart" onclick="cambiarCantidad(${index}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="eliminarItem(${index})" title="Eliminar producto">
                🗑️
            </button>
        </div>
    `;
    
    return itemDiv;
}

// Función para cambiar cantidad
window.cambiarCantidad = function(index, cambio) {
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
        eliminarItem(index);
        return;
    }
    
    if (nuevaCantidad > item.stock) {
        mostrarNotificacion(`Stock máximo: ${item.stock} unidades`, 'error');
        return;
    }
    
    carrito[index].cantidad = nuevaCantidad;
    guardarCarrito(carrito);
    cargarCarrito();
}

// Función para eliminar item
window.eliminarItem = function(index) {
    const item = carrito[index];
    
    if (confirm(`¿Eliminar ${item.nombre} del carrito?`)) {
        carrito.splice(index, 1);
        guardarCarrito(carrito);
        cargarCarrito();
        mostrarNotificacion(`${item.nombre} eliminado del carrito`, 'success');
    }
}

// Función para calcular totales
function calcularTotales() {
    const subtotalValue = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const totalValue = subtotalValue; // En el futuro se pueden agregar impuestos
    const totalProductos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    subtotal.textContent = `$${subtotalValue.toLocaleString()}`;
    total.textContent = `$${totalValue.toLocaleString()}`;
    totalItems.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;
}

// Función para proceder al checkout
function procederCheckout() {
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'error');
        return;
    }
    
    // Verificar stock antes de proceder
    let stockProblema = false;
    carrito.forEach(item => {
        if (item.cantidad > item.stock) {
            mostrarNotificacion(`Stock insuficiente para ${item.nombre}`, 'error');
            stockProblema = true;
        }
    });
    
    if (stockProblema) {
        return;
    }
    
    // Guardar carrito actualizado y redirigir al checkout
    guardarCarrito(carrito);
    window.location.href = 'checkout.html';
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('clienteEcommerce');
    localStorage.removeItem('carrito');
    window.location.reload();
}

// Función para vaciar carrito
function vaciarCarrito() {
    if (carrito.length === 0) return;
    
    if (confirm('¿Estás seguro que quieres vaciar todo el carrito?')) {
        localStorage.removeItem('carrito');
        carrito = [];
        cargarCarrito();
        mostrarNotificacion('Carrito vaciado', 'success');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    actualizarInterfazSesion();
    
    // Checkout button
    checkoutBtn.addEventListener('click', procederCheckout);
    
    // Logout
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('¿Cerrar sesión?')) {
            cerrarSesion();
        }
    });
    
    // Actualizar carrito cada segundo (por si se modifica desde otra pestaña)
    setInterval(() => {
        if (clienteSesion) {
            const carritoActualizado = obtenerCarrito();
            if (JSON.stringify(carritoActualizado) !== JSON.stringify(carrito)) {
                cargarCarrito();
            }
        }
    }, 1000);
});

// Agregar botón para vaciar carrito (opcional)
document.addEventListener('DOMContentLoaded', () => {
    const summaryCard = document.querySelector('.summary-card');
    if (summaryCard && clienteSesion) {
        const vaciarBtn = document.createElement('button');
        vaciarBtn.textContent = 'Vaciar Carrito';
        vaciarBtn.className = 'btn btn-danger';
        vaciarBtn.style.width = '100%';
        vaciarBtn.style.marginTop = '0.5rem';
        vaciarBtn.addEventListener('click', vaciarCarrito);
        
        summaryCard.appendChild(vaciarBtn);
    }
});