import { agregarCliente, buscarClientePorCelular } from './firebase-ecomerce.js';

// Referencias a elementos del DOM
const formRegistro = document.getElementById('formRegistro');
const formLogin = document.getElementById('formLogin');
const notification = document.getElementById('notification');

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    notification.textContent = mensaje;
    notification.className = `notification ${tipo}`;
    notification.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Función para validar número de celular
function validarCelular(celular) {
    // Remover espacios y guiones
    const celularLimpio = celular.replace(/[\s-]/g, '');
    
    // Validar que tenga entre 10 y 11 dígitos
    if (celularLimpio.length < 10 || celularLimpio.length > 11) {
        return false;
    }
    
    // Validar que solo contenga números
    return /^\d+$/.test(celularLimpio);
}

// Función para guardar sesión del cliente
function guardarSesion(cliente) {
    localStorage.setItem('clienteEcommerce', JSON.stringify(cliente));
    localStorage.setItem('sesionActiva', 'true');
}

// Manejar registro de nuevo cliente
formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const celular = document.getElementById('celular').value.trim();
    
    // Validaciones
    if (!nombre || !apellido || !celular) {
        mostrarNotificacion('Todos los campos son obligatorios', 'error');
        return;
    }
    
    if (!validarCelular(celular)) {
        mostrarNotificacion('El número de celular debe tener entre 10 y 11 dígitos', 'error');
        return;
    }
    
    try {
        // Verificar si el cliente ya existe
        const clienteExistente = await buscarClientePorCelular(celular);
        
        if (clienteExistente.success) {
            mostrarNotificacion('Este número de celular ya está registrado. Usa el formulario de ingreso.', 'error');
            return;
        }
        
        // Registrar nuevo cliente
        const resultado = await agregarCliente({
            nombre,
            apellido,
            celular
        });
        
        if (resultado.success) {
            mostrarNotificacion('¡Registro exitoso! Redirigiendo al catálogo...', 'success');
            
            // Guardar sesión
            guardarSesion({
                id: resultado.id,
                nombre,
                apellido,
                celular
            });
            
            // Limpiar formulario
            formRegistro.reset();
            
            // Redirigir al catálogo después de 2 segundos
            setTimeout(() => {
                window.location.href = 'catalogo.html';
            }, 2000);
            
        } else {
            mostrarNotificacion('Error al registrar cliente: ' + resultado.error, 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión. Intenta nuevamente.', 'error');
    }
});

// Manejar login de cliente existente
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const celular = document.getElementById('celularLogin').value.trim();
    
    if (!celular) {
        mostrarNotificacion('Ingresa tu número de celular', 'error');
        return;
    }
    
    if (!validarCelular(celular)) {
        mostrarNotificacion('Formato de celular inválido', 'error');
        return;
    }
    
    try {
        const resultado = await buscarClientePorCelular(celular);
        
        if (resultado.success) {
            mostrarNotificacion(`¡Bienvenido ${resultado.cliente.nombre}! Redirigiendo...`, 'success');
            
            // Guardar sesión
            guardarSesion(resultado.cliente);
            
            // Limpiar formulario
            formLogin.reset();
            
            // Redirigir al catálogo
            setTimeout(() => {
                window.location.href = 'catalogo.html';
            }, 2000);
            
        } else {
            mostrarNotificacion('Cliente no encontrado. Regístrate primero.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión. Intenta nuevamente.', 'error');
    }
});

// Verificar si ya hay una sesión activa al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const sesionActiva = localStorage.getItem('sesionActiva');
    const clienteData = localStorage.getItem('clienteEcommerce');
    
    if (sesionActiva === 'true' && clienteData) {
        const cliente = JSON.parse(clienteData);
        mostrarNotificacion(`Ya tienes sesión activa, ${cliente.nombre}. Redirigiendo al catálogo...`, 'success');
        
        setTimeout(() => {
            window.location.href = 'catalogo.html';
        }, 2000);
    }
});