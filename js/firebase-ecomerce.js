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
        const q = query(productosRef, where("stock", ">", 0), orderBy("nombre"));
        //where("stock", ">", 0) - Solo trae productos que tengan stock mayor a 0
        //orderBy("nombre") - Los ordena alfabéticamente por nombre
        const querySnapshot = await getDocs(q);
        
        const productos = [];//productos = [] - Crea un array vacío para guardar los productos
        querySnapshot.forEach((doc) => {//querySnapshot.forEach() - Recorre todos los productos encontrados
            productos.push({
                id: doc.id, //doc.id - Obtiene el ID único del producto
                ...doc.data() //doc.data() - Obtiene todos los datos del producto (nombre, precio, stock)
            });
        });
        
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
export async function obtenerPedidos(filtroEstado = null) { //filtroEstado = null - Parámetro opcional para filtrar por estado ("Pendiente", "Preparado", etc.)
    try {
        let q;
        if (filtroEstado) { //if (filtroEstado) - Si se pasa un filtro, busca solo pedidos con ese estado
            q = query(pedidosEcommerceRef, 
                where("estado", "==", filtroEstado), 
                orderBy("fechaPedido", "desc")); // orderBy("fechaPedido", "desc") - Ordena por fecha, más recientes primero
        } else {
            q = query(pedidosEcommerceRef, orderBy("fechaPedido", "desc"));
        }
        
        const querySnapshot = await getDocs(q); //Esta función la usarás en el panel administrativo para ver todos los pedidos
        const pedidos = [];
        querySnapshot.forEach((doc) => {
            pedidos.push({
                id: doc.id,
                ...doc.data()
            });
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