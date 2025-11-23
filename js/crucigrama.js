const tamano = 13;
const tablero = document.getElementById("tablero");
const mensaje = document.getElementById("mensaje");
const contenedorTeclado = document.getElementById("teclado");
const definicionActual = document.getElementById("definicion");
const botonAnterior = document.getElementById("boton-anterior");
const botonSiguiente = document.getElementById("boton-siguiente");
const listaHorizontales = document.getElementById("lista-definiciones-horizontales");
const listaVerticales = document.getElementById("lista-definiciones-verticales");

const casillas = Array.from({ length: tamano }, () => Array(tamano));

let crucigrama = null;
let tableroCompleto = [];
let tableroUsuario = Array.from({ length: tamano }, () => Array(tamano).fill(""));
let palabrasHorizontales = [];
let palabrasVerticales = [];
let todasLasPalabras = [];
let palabraActual = null;
let indicePalabraActual = 0;
let casillaActiva = null;

function crearTablero() {
    tablero.innerHTML = "";
    for (let i = 0; i < tamano; i++) {
        const fila = document.createElement("div");
        fila.classList.add("fila", "fila-crucigrama");

        for (let j = 0; j < tamano; j++) {
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.classList.add("casilla");
            input.dataset.fila = i;
            input.dataset.columna = j;

            input.addEventListener("input", (e) => {
                const valor = e.target.value.toUpperCase();
                e.target.value = valor;
                tableroUsuario[i][j] = valor;
                validarPalabra(palabraActual);
                
                if (valor && palabraActual) {
                    moverASiguienteCasilla();
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !e.target.value) {
                    moverACasillaAnterior();
                } else if (e.key === "ArrowRight") {
                    moverEnDireccion(0, 1);
                } else if (e.key === "ArrowLeft") {
                    moverEnDireccion(0, -1);
                } else if (e.key === "ArrowDown") {
                    moverEnDireccion(1, 0);
                } else if (e.key === "ArrowUp") {
                    moverEnDireccion(-1, 0);
                }
            });

            input.addEventListener("focus", () => {
                casillaActiva = input;
                const fila = parseInt(input.dataset.fila);
                const col = parseInt(input.dataset.columna);
                seleccionarPalabraPorCasilla(fila, col);
            });

            input.addEventListener("click", () => {
                const fila = parseInt(input.dataset.fila);
                const col = parseInt(input.dataset.columna);
                cambiarDireccionPalabra(fila, col);
            });

            casillas[i][j] = input;
            fila.appendChild(input);
        }
        tablero.appendChild(fila);
    }
}

function mostrarTablero() {
    for (let i = 0; i < tamano; i++) {
        for (let j = 0; j < tamano; j++) {
            const input = casillas[i][j];
            const celda = tableroCompleto[i][j];

            if (celda === '#') {
                input.classList.add("casilla-negra");
                input.disabled = true;
                input.value = '';
            } else {
                input.classList.remove("casilla-negra");
                input.disabled = false;
                input.value = tableroUsuario[i][j];
            }
        }
    }
}

function cargarCrucigrama() {
    fetch("json/crucigramas.json")
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error(`Error al cargar: ${respuesta.status}`);
            }
            return respuesta.json();
        })
        .then(crucigramas => {
            const id = Math.floor(Math.random() * crucigramas.length);
            crucigrama = crucigramas[id];
            
            tableroCompleto = crucigrama.tablero;
            
            for (let i = 0; i < tamano; i++) {
                for (let j = 0; j < tamano; j++) {
                    tableroUsuario[i][j] = tableroCompleto[i][j] === '#' ? '#' : '';
                }
            }
            
            procesarPalabras();
            mostrarTablero();
            crearListasDefiniciones();
            crearTeclado();
            
            if (todasLasPalabras.length > 0) {
                seleccionarPalabra(0);
            }
        })
        .catch(error => {
            mensaje.textContent = "Error al cargar el crucigrama";
        });
}

function procesarPalabras() {
    palabrasHorizontales = crucigrama.palabras.filter(p => p.direccion === "horizontal");
    palabrasVerticales = crucigrama.palabras.filter(p => p.direccion === "vertical");
    
    palabrasHorizontales.sort((a, b) => {
        if (a.fila !== b.fila) return a.fila - b.fila;
        return a.columna - b.columna;
    });
    
    palabrasVerticales.sort((a, b) => {
        if (a.columna !== b.columna) return a.columna - b.columna;
        return a.fila - b.fila;
    });
    
    palabrasHorizontales.forEach((p, i) => p.numero = i + 1);
    palabrasVerticales.forEach((p, i) => p.numero = i + 1);
    
    todasLasPalabras = [...palabrasHorizontales, ...palabrasVerticales];
}

function crearListasDefiniciones() {
    listaHorizontales.innerHTML = "";
    listaVerticales.innerHTML = "";
    
    palabrasHorizontales.forEach((palabra, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${palabra.numero}.</strong> ${palabra.definicion}`;
        li.dataset.index = index;
        li.dataset.tipo = "horizontal";
        li.addEventListener("click", () => {
            const idx = todasLasPalabras.findIndex(p => 
                p.direccion === "horizontal" && p.numero === palabra.numero
            );
            seleccionarPalabra(idx);
        });
        listaHorizontales.appendChild(li);
    });
    
    palabrasVerticales.forEach((palabra, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${palabra.numero}.</strong> ${palabra.definicion}`;
        li.dataset.index = index;
        li.dataset.tipo = "vertical";
        li.addEventListener("click", () => {
            const idx = todasLasPalabras.findIndex(p => 
                p.direccion === "vertical" && p.numero === palabra.numero
            );
            seleccionarPalabra(idx);
        });
        listaVerticales.appendChild(li);
    });
}

function seleccionarPalabra(index) {
    if (index < 0 || index >= todasLasPalabras.length) return;
    
    indicePalabraActual = index;
    palabraActual = todasLasPalabras[index];
    
    const tipo = palabraActual.direccion === "horizontal" ? "H" : "V";
    definicionActual.innerHTML = `<strong>${tipo}${palabraActual.numero}.</strong> ${palabraActual.definicion}`;
    
    resaltarPalabra();
    
    actualizarListasDefiniciones();
    
    enfocarPrimeraCasillaVacia();
}

function resaltarPalabra() {
    for (let i = 0; i < tamano; i++) {
        for (let j = 0; j < tamano; j++) {
            casillas[i][j].classList.remove("casilla-activa", "casilla-palabra-activa");
        }
    }
    
    if (!palabraActual) return;
    
    const { fila, columna, palabra, direccion } = palabraActual;
    
    for (let i = 0; i < palabra.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        
        if (f < tamano && c < tamano) {
            casillas[f][c].classList.add("casilla-palabra-activa");
        }
    }
    
    if (casillaActiva) {
        casillaActiva.classList.add("casilla-activa");
    }
}

function actualizarListasDefiniciones() {
    document.querySelectorAll(".lista-definiciones li").forEach(li => {
        li.classList.remove("definicion-activa");
    });
    
    if (!palabraActual) return;
    
    const lista = palabraActual.direccion === "horizontal" ? listaHorizontales : listaVerticales;
    const items = lista.querySelectorAll("li");
    items.forEach(li => {
        const tipo = li.dataset.tipo;
        const numero = palabraActual.numero;
        const texto = li.textContent;
        
        if (tipo === palabraActual.direccion && texto.startsWith(`${numero}.`)) {
            li.classList.add("definicion-activa");
        }
    });
}

function enfocarPrimeraCasillaVacia() {
    if (!palabraActual) return;
    
    const { fila, columna, palabra, direccion } = palabraActual;
    
    for (let i = 0; i < palabra.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        
        if (f < tamano && c < tamano && !tableroUsuario[f][c]) {
            casillas[f][c].focus();
            return;
        }
    }
    
    casillas[fila][columna].focus();
}

function seleccionarPalabraPorCasilla(fila, col) {
    const palabrasEnCasilla = todasLasPalabras.filter(p => {
        const { fila: f, columna: c, palabra, direccion } = p;
        
        for (let i = 0; i < palabra.length; i++) {
            const pf = direccion === "horizontal" ? f : f + i;
            const pc = direccion === "horizontal" ? c + i : c;
            
            if (pf === fila && pc === col) return true;
        }
        return false;
    });
    
    if (palabrasEnCasilla.length > 0) {
        const yaActiva = palabrasEnCasilla.find(p => p === palabraActual);
        if (!yaActiva) {
            const idx = todasLasPalabras.indexOf(palabrasEnCasilla[0]);
            seleccionarPalabra(idx);
        }
    }
}

function cambiarDireccionPalabra(fila, col) {
    const palabrasEnCasilla = todasLasPalabras.filter(p => {
        const { fila: f, columna: c, palabra, direccion } = p;
        
        for (let i = 0; i < palabra.length; i++) {
            const pf = direccion === "horizontal" ? f : f + i;
            const pc = direccion === "horizontal" ? c + i : c;
            
            if (pf === fila && pc === col) return true;
        }
        return false;
    });
    
    if (palabrasEnCasilla.length > 1) {
        const otraPalabra = palabrasEnCasilla.find(p => p !== palabraActual);
        if (otraPalabra) {
            const idx = todasLasPalabras.indexOf(otraPalabra);
            seleccionarPalabra(idx);
        }
    }
}

function moverASiguienteCasilla() {
    if (!palabraActual || !casillaActiva) return;
    
    const { fila, columna, palabra, direccion } = palabraActual;
    const filaActual = parseInt(casillaActiva.dataset.fila);
    const colActual = parseInt(casillaActiva.dataset.columna);
    
    let posicion = -1;
    for (let i = 0; i < palabra.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        
        if (f === filaActual && c === colActual) {
            posicion = i;
            break;
        }
    }
    
    if (posicion >= 0 && posicion < palabra.length - 1) {
        const f = direccion === "horizontal" ? fila : fila + posicion + 1;
        const c = direccion === "horizontal" ? columna + posicion + 1 : columna;
        
        if (f < tamano && c < tamano) {
            casillas[f][c].focus();
        }
    }
}

function moverACasillaAnterior() {
    if (!palabraActual || !casillaActiva) return;
    
    const { fila, columna, palabra, direccion } = palabraActual;
    const filaActual = parseInt(casillaActiva.dataset.fila);
    const colActual = parseInt(casillaActiva.dataset.columna);
    
    let posicion = -1;
    for (let i = 0; i < palabra.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        
        if (f === filaActual && c === colActual) {
            posicion = i;
            break;
        }
    }
    
    if (posicion > 0) {
        const f = direccion === "horizontal" ? fila : fila + posicion - 1;
        const c = direccion === "horizontal" ? columna + posicion - 1 : columna;
        
        if (f >= 0 && c >= 0) {
            casillas[f][c].focus();
        }
    }
}

function moverEnDireccion(deltaFila, deltaCol) {
    if (!casillaActiva) return;
    
    const filaActual = parseInt(casillaActiva.dataset.fila);
    const colActual = parseInt(casillaActiva.dataset.columna);
    
    const nuevaFila = filaActual + deltaFila;
    const nuevaCol = colActual + deltaCol;
    
    if (nuevaFila >= 0 && nuevaFila < tamano && nuevaCol >= 0 && nuevaCol < tamano) {
        const input = casillas[nuevaFila][nuevaCol];
        if (!input.disabled) {
            input.focus();
        }
    }
}

function validarPalabra(palabra) {
    if (!palabra) return;
    
    const { fila, columna, palabra: texto, direccion } = palabra;
    let correcta = true;
    let completa = true;
    
    for (let i = 0; i < texto.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        const valor = tableroUsuario[f][c];
        
        if (!valor) {
            completa = false;
            correcta = false;
        } else if (valor !== texto[i]) {
            correcta = false;
        }
    }
    
    for (let i = 0; i < texto.length; i++) {
        const f = direccion === "horizontal" ? fila : fila + i;
        const c = direccion === "horizontal" ? columna + i : columna;
        const input = casillas[f][c];
        
        input.classList.remove("casilla-correcta", "casilla-incorrecta");
        
        if (completa) {
            if (correcta) {
                input.classList.add("casilla-correcta");
            } else {
                input.classList.add("casilla-incorrecta");
            }
        }
    }
    
    if (completa && correcta) {
        verificarVictoria();
    }
}

function verificarVictoria() {
    let todasCorrectas = true;
    
    for (const p of todasLasPalabras) {
        const { fila, columna, palabra: texto, direccion } = p;
        for (let i = 0; i < texto.length; i++) {
            const f = direccion === "horizontal" ? fila : fila + i;
            const c = direccion === "horizontal" ? columna + i : columna;
            if (tableroUsuario[f][c] !== texto[i]) {
                todasCorrectas = false;
                break;
            }
        }
        if (!todasCorrectas) break;
    }
    
    if (todasCorrectas) {
        mensaje.textContent = "¡Felicidades! Has completado el crucigrama.";
        mensaje.classList.add("exito");
    }
}

function crearTeclado() {
    contenedorTeclado.innerHTML = "";
    const letras = "QWERTYUIOPASDFGHJKLÑZXCVBNM";
    
    letras.split("").forEach(letra => {
        const boton = document.createElement("button");
        boton.textContent = letra;
        boton.classList.add("tecla");
        boton.addEventListener("click", () => {
            if (casillaActiva && !casillaActiva.disabled) {
                casillaActiva.value = letra;
                const evento = new Event("input");
                casillaActiva.dispatchEvent(evento);
                casillaActiva.focus();
            }
        });
        contenedorTeclado.appendChild(boton);
    });
    
    // Botón de borrar
    const botonBorrar = document.createElement("button");
    botonBorrar.textContent = "⌫";
    botonBorrar.classList.add("tecla", "tecla-borrar");
    botonBorrar.addEventListener("click", () => {
        if (casillaActiva && !casillaActiva.disabled) {
            casillaActiva.value = "";
            const evento = new Event("input");
            casillaActiva.dispatchEvent(evento);
            casillaActiva.focus();
            moverACasillaAnterior();
        }
    });
    contenedorTeclado.appendChild(botonBorrar);
}

crearTablero();
cargarCrucigrama();

botonAnterior.addEventListener("click", () => {
    let nuevoIndice = indicePalabraActual - 1;
    if (nuevoIndice < 0) nuevoIndice = todasLasPalabras.length - 1;
    seleccionarPalabra(nuevoIndice);
});

botonSiguiente.addEventListener("click", () => {
    let nuevoIndice = indicePalabraActual + 1;
    if (nuevoIndice >= todasLasPalabras.length) nuevoIndice = 0;
    seleccionarPalabra(nuevoIndice);
});