// Importa las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase (la misma que el sistema de gestión), Contiene las claves de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAAvvcsLskBSfmgBSco3FxrnaNZCd0MJfk",
  authDomain: "forrajeriaelsol-44bd0.firebaseapp.com",
  projectId: "forrajeriaelsol-44bd0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig); //Inicia la conexión con Firebase
export const auth = getAuth(app);
export const db = getFirestore(app); //Exporta la conexión a la base de datos para usarla en otros archivos

// Referencias a las colecciones del ecommerce
export const clientesEcommerceRef = collection(db, 'clientes-ecommerce');// Referencia a la colección donde guardaremos los clientes del ecommerce
export const pedidosEcommerceRef = collection(db, 'pedidos-ecommerce');//Referencia a la colección de pedidos del ecommerce
export const productosRef = collection(db, 'productos'); // Referencia a la colección de productos existente (solo para leerla)

// Funciones auxiliares para el ecommerce

// Función para agregar un nuevo cliente
export async function agregarCliente(clienteData) {// Es asíncrona porque espera respuesta de Firebase
    try {
        const docRef = await addDoc(clientesEcommerceRef, {//addDoc Agrega un nuevo documento a la colección
            ...clienteData,//Copia todos los datos del cliente (nombre, apellido, celular)
            fechaRegistro: new Date(),//Agrega la fecha actual
            activo: true //Marca al cliente como activo
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error agregando cliente:", error);
        return { success: false, error: error.message };
    } //try/catch - Maneja errores si algo sale mal
}

// Función para buscar cliente por celular
export async function buscarClientePorCelular(celular) {
    try {
        const q = query(clientesEcommerceRef, where("celular", "==", celular)); //Crea una consulta específica a la base de datos
        const querySnapshot = await getDocs(q);//where("celular", "==", celular) - Busca donde el campo celular sea igual al número ingresado
        //getDocs(q) - Ejecuta la consulta y obtiene los resultados
        if (!querySnapshot.empty) {//querySnapshot.empty - Verifica si encontró algún cliente
            const clienteDoc = querySnapshot.docs[0];
            return { 
                success: true, 
                cliente: { 
                    id: clienteDoc.id, 
                    ...clienteDoc.data() //clienteDoc.data() - Obtiene todos los datos del cliente encontrado
                } 
            };
        } else {
            return { success: false, message: "Cliente no encontrado" };
        }
    } catch (error) {
        console.error("Error buscando cliente:", error);
        return { success: false, error: error.message };
    }
}

// Función para obtener productos con stock
export async function obtenerProductosConStock() {
    try {
        console.log('Iniciando carga de productos...');
        
        // Primero obtener todos los productos y filtrar en memoria para evitar el índice
        const querySnapshot = await getDocs(productosRef);
        
        const todosLosProductos = [];
        querySnapshot.forEach((doc) => {
            todosLosProductos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Productos totales en Firebase:', todosLosProductos.length);
        
        // Filtrar productos con stock > 0 en memoria
        const productos = todosLosProductos.filter(producto => {
            const stock = parseInt(producto.stock) || 0;
            return stock > 0;
        }).sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar por nombre
        
        console.log('Productos con stock > 0:', productos.length);
        console.log('Productos filtrados:', productos);
        
        return { success: true, productos };
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return { success: false, error: error.message };
    }
}

// Función para crear un pedido
export async function crearPedido(pedidoData) {
    try {
        const numeroPedido = `ECM-${Date.now()}`;//Date.now() - Obtiene el timestamp actual (número único)
        //ECM-${Date.now()} - Crea un número de pedido único como "ECM-1700567890123"
        const docRef = await addDoc(pedidosEcommerceRef, {
            ...pedidoData,// ...pedidoData - Copia todos los datos del pedido (cliente, productos, horario, etc.)
            fechaPedido: new Date(), //fechaPedido: new Date() - Guarda cuándo se hizo el pedido
            estado: 'Pendiente', //estado: 'Pendiente' - Todo pedido nuevo empieza como "Pendiente"
            numeroPedido: numeroPedido //Retorna el ID del documento y el número de pedido para mostrárselo al cliente
        });
        return { success: true, id: docRef.id, numeroPedido: numeroPedido };
    } catch (error) {
        console.error("Error creando pedido:", error);
        return { success: false, error: error.message };
    }
}

// Función para obtener pedidos (para el panel administrativo)
export async function obtenerPedidos(filtroEstado = null) {
    try {
        // Obtener todos los pedidos y filtrar en memoria
        const querySnapshot = await getDocs(pedidosEcommerceRef);
        
        let pedidos = [];
        querySnapshot.forEach((doc) => {
            pedidos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Filtrar por estado si se especifica
        if (filtroEstado) {
            pedidos = pedidos.filter(pedido => pedido.estado === filtroEstado);
        }
        
        // Ordenar por fecha más reciente primero
        pedidos.sort((a, b) => {
            const fechaA = a.fechaPedido?.seconds || 0;
            const fechaB = b.fechaPedido?.seconds || 0;
            return fechaB - fechaA;
        });
        
        return { success: true, pedidos };
    } catch (error) {
        console.error("Error obteniendo pedidos:", error);
        return { success: false, error: error.message };
    }
}

// Función para actualizar estado del pedido
export async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        await updateDoc(doc(db, 'pedidos-ecommerce', pedidoId), { //updateDoc() - Actualiza un documento existente en Firebase
            //doc(db, 'pedidos-ecommerce', pedidoId) - Especifica qué documento actualizar
            estado: nuevoEstado, //estado: nuevoEstado - Cambia el estado ("Pendiente" → "Preparado" → "Entregado")
            fechaActualizacion: new Date() //fechaActualizacion: new Date() - Guarda cuándo se actualizó el estado
        });
        return { success: true };
    } catch (error) {
        console.error("Error actualizando estado del pedido:", error);
        return { success: false, error: error.message };
    }
}

// Función para escuchar cambios en tiempo real (opcional)
export function escucharPedidos(callback, filtroEstado = null) {
    let q;
    if (filtroEstado) { //Si se pasa un filtro, escucha solo pedidos con ese estado
        q = query(pedidosEcommerceRef, 
            where("estado", "==", filtroEstado), 
            orderBy("fechaPedido", "desc"));
    } else {
        q = query(pedidosEcommerceRef, orderBy("fechaPedido", "desc"));
    }
    
    return onSnapshot(q, (querySnapshot) => { //onSnapshot() - Escucha cambios en tiempo real en Firebase
        const pedidos = [];
        querySnapshot.forEach((doc) => {
            pedidos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        callback(pedidos);//callback - Función que se ejecuta cada vez que hay cambios
    });
}