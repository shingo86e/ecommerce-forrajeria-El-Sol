// Función para obtener datos de sesión
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
    const carrito = localStorage.getItem('carrito');
    return carrito ? JSON.parse(carrito) : [];
}

// Función para actualizar contador del carrito
function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('clienteEcommerce');
    localStorage.removeItem('carrito');
    
    // Recargar la página para actualizar la interfaz
    window.location.reload();
}

// Función para actualizar interfaz según el estado de sesión
function actualizarInterfazSesion() {
    const cliente = obtenerSesion();
    const userWelcome = document.getElementById('userWelcome');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const registerBtn = document.getElementById('registerBtn');
    const catalogBtn = document.getElementById('catalogBtn');
    
    if (cliente) {
        // Usuario logueado
        userWelcome.innerHTML = `
            <strong>¡Hola ${cliente.nombre} ${cliente.apellido}!</strong> 
            Ya puedes realizar pedidos. 
            <a href="catalogo.html" style="color: #155724; text-decoration: underline;">Ver productos disponibles</a>
        `;
        userWelcome.style.display = 'block';
        
        // Cambiar navegación
        loginLink.textContent = `👋 ${cliente.nombre}`;
        loginLink.href = '#';
        logoutLink.style.display = 'inline-block';
        
        // Cambiar botones principales
        if (registerBtn) {
            registerBtn.textContent = 'Mi Cuenta';
            registerBtn.href = '#';
        }
        
        if (catalogBtn) {
            catalogBtn.textContent = 'Hacer Pedido';
            catalogBtn.className = 'btn'; // Cambiar a botón principal
        }
        
    } else {
        // Usuario no logueado
        userWelcome.style.display = 'none';
        loginLink.textContent = 'Registro';
        loginLink.href = 'registro.html';
        logoutLink.style.display = 'none';
    }
}

// Eventos del DOM
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar interfaz según sesión
    actualizarInterfazSesion();
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
    
    // Event listener para cerrar sesión
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('¿Estás seguro que quieres cerrar sesión?')) {
                cerrarSesion();
            }
        });
    }
    
    // Event listener para "Mi Cuenta" (cuando está logueado)
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            const cliente = obtenerSesion();
            if (cliente && registerBtn.textContent === 'Mi Cuenta') {
                e.preventDefault();
                mostrarInfoCuenta(cliente);
            }
        });
    }
});

// Función para mostrar información de la cuenta
function mostrarInfoCuenta(cliente) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 400px; width: 90%;">
            <h3>👤 Mi Cuenta</h3>
            <p><strong>Nombre:</strong> ${cliente.nombre} ${cliente.apellido}</p>
            <p><strong>Celular:</strong> ${cliente.celular}</p>
            <p><strong>Registrado:</strong> ${cliente.fechaRegistro ? new Date(cliente.fechaRegistro.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
            
            <div style="margin-top: 1.5rem;">
                <button onclick="window.location.href='catalogo.html'" class="btn" style="margin-right: 0.5rem;">Hacer Pedido</button>
                <button onclick="this.closest('div').parentElement.remove()" class="btn btn-secondary">Cerrar</button>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button onclick="cerrarSesionModal()" style="color: #dc3545; background: none; border: none; text-decoration: underline; cursor: pointer;">Cerrar Sesión</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Función global temporal para cerrar sesión desde el modal
    window.cerrarSesionModal = () => {
        modal.remove();
        cerrarSesion();
    };
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Actualizar contador del carrito periódicamente (por si se modifica desde otra pestaña)
setInterval(actualizarContadorCarrito, 1000);