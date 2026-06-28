document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('formCotizador');
    const listaEquiposContainer = document.getElementById('lista-equipos');
    const btnAgregarEquipo = document.getElementById('btnAgregarEquipo');
    
    let catalogoEquipos = [];

    // 1. Mostrar mensaje de búsqueda inicial
    if (listaEquiposContainer) {
        listaEquiposContainer.innerHTML = '<p style="color:#0056b3; font-weight:bold; margin-bottom: 10px;">Buscando equipos listados en el catálogo...</p>';
    }

    // 2. Cargar el JSON de equipos (con respaldo para pruebas locales)
    try {
        const response = await fetch('assets/json/equipos.json');
        if (response.ok) {
            catalogoEquipos = await response.json();
        } else {
            throw new Error("No se pudo leer el archivo JSON.");
        }
    } catch (error) {
        console.warn("Aviso: Cargando catálogo de respaldo local.", error);
        catalogoEquipos = [
            { "nombre": "Access Point U6-Lite", "precio": 150 },
            { "nombre": "Access Point U6-Pro", "precio": 200 },
            { "nombre": "Switch 16 PoE", "precio": 350 }
        ];
    }

    // 3. Limpiar mensaje y agregar la primera fila
    if (listaEquiposContainer) {
        listaEquiposContainer.innerHTML = '';
        agregarFilaEquipo();
    }

    // 4. Función central para crear una fila de equipo
    function agregarFilaEquipo() {
        const fila = document.createElement('div');
        fila.className = 'fila-equipo';

        const selectHTML = document.createElement('select');
        selectHTML.className = 'col-select';
        selectHTML.required = true;
        selectHTML.innerHTML = '<option value="" disabled selected>Selecciona un equipo...</option>';
        
        catalogoEquipos.forEach(equipo => {
            const option = document.createElement('option');
            option.value = equipo.precio;
            option.setAttribute('data-nombre', equipo.nombre);
            option.textContent = `${equipo.nombre} - $${equipo.precio}`;
            selectHTML.appendChild(option);
        });

        const inputCant = document.createElement('input');
        inputCant.type = 'number';
        inputCant.className = 'col-cant';
        inputCant.value = '1';
        inputCant.min = '1';
        inputCant.required = true;

        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.textContent = 'X';
        btnEliminar.title = 'Eliminar equipo';
        btnEliminar.onclick = function() {
            if(document.querySelectorAll('.fila-equipo').length > 1) {
                fila.remove();
            } else {
                alert("Debes cotizar al menos un equipo.");
            }
        };

        fila.appendChild(selectHTML);
        fila.appendChild(inputCant);
        fila.appendChild(btnEliminar);

        listaEquiposContainer.appendChild(fila);
    }

    // 5. Activar el botón de agregar
    if (btnAgregarEquipo) {
        btnAgregarEquipo.addEventListener('click', agregarFilaEquipo);
    }

    // 6. Lógica del formulario y generación de PDF
    // Función para convertir la imagen del logo a Base64
    function cargarLogo(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
            img.onerror = () => resolve(null); // Si falla, sigue sin logo
            img.src = url;
        });
    }

    // 6. Lógica del formulario: Paso 1 (Generar Vista Previa)
    let pdfBase64Global = ""; // Guardaremos el PDF aquí temporalmente

    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = document.getElementById('btnGenerarPreview');
            btn.innerText = "Generando documento...";
            btn.disabled = true;

            const nombre = document.getElementById('clienteNombre').value;
            const compania = document.getElementById('clienteCompania').value;
            const email = document.getElementById('clienteEmail').value;
            const requiereInstalacion = document.getElementById('incluirInstalacion').checked;
            const comentarios = document.getElementById('comentariosCliente').value;
            
            // --- FECHAS Y NÚMERO DE COTIZACIÓN ---
            const fechaCreacion = new Date();
            const fechaVigencia = new Date();
            fechaVigencia.setDate(fechaCreacion.getDate() + 15);
            
            const formatoFecha = (fecha) => fecha.toLocaleDateString('es-PA');
            const numCotizacion = Math.floor(Math.random() * 900000) + 100000; // Random 6 dígitos

            // --- INICIALIZAR EL PDF ---
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // 1. Cargar el logo (Asegúrate de que la imagen esté en esa ruta)
            const logoData = await cargarLogo('images/Sistec-fullcolor_odoo.JPG');
            if(logoData) {
                doc.addImage(logoData, 'JPEG', 20, 15, 45, 20); // Ajusta tamaño según necesites
            } else {
                doc.setFontSize(22);
                doc.text("SISTEC INT", 20, 25);
            }

            // 2. Información de la Empresa (Superior Derecha)
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text("Ciudad de Panamá, Ernesto Córdobas Campo,", 190, 20, { align: "right" });
            doc.text("urbanización PH colinas del lago calle 6, casa 193.", 190, 25, { align: "right" });
            doc.text("RUC: 8-823-2025 DV:72", 190, 30, { align: "right" });
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Cotización N°: ${numCotizacion}`, 190, 40, { align: "right" });
            doc.setFontSize(10);
            doc.text(`Fecha de creación: ${formatoFecha(fechaCreacion)}`, 190, 46, { align: "right" });
            doc.text(`Válida hasta: ${formatoFecha(fechaVigencia)}`, 190, 52, { align: "right" });

            // 3. Información del Cliente (Izquierda)
            doc.setFontSize(12);
            doc.text(`Cliente: ${nombre}`, 20, 45);
            doc.text(`Compañía: ${compania || 'No especificada'}`, 20, 52);
            doc.text(`Correo: ${email}`, 20, 59);
            
            doc.line(20, 65, 190, 65);
            doc.setFontSize(12);
            doc.text("Equipos y Servicios Solicitados:", 20, 75);

            // --- RECORRER FILAS MÚLTIPLES Y CALCULAR ITBMS ---
            let subtotalEquipos = 0;
            let itbmsTotal = 0;
            let startY = 85; 
            
            doc.setFontSize(10);
            const filas = document.querySelectorAll('.fila-equipo');
            filas.forEach(fila => {
                const select = fila.querySelector('.col-select');
                const cantidadInput = fila.querySelector('.col-cant');
                
                if(select.value) {
                    const precioUnitario = parseFloat(select.value);
                    const cantidad = parseInt(cantidadInput.value);
                    const nombreEquipo = select.options[select.selectedIndex].getAttribute('data-nombre');
                    
                    const subtotalFila = precioUnitario * cantidad;
                    const itbmsFila = subtotalFila * 0.07; // 7% ITBMS
                    
                    subtotalEquipos += subtotalFila;
                    itbmsTotal += itbmsFila;
                    
                    // Imprimir fila con ITBMS desglosado
                    doc.text(`- ${nombreEquipo} (x${cantidad}): $${subtotalFila.toFixed(2)} (ITBMS: $${itbmsFila.toFixed(2)})`, 25, startY);
                    startY += 8; 
                }
            });

            // Si el checkbox de inspección está marcado, agregarlo al final de la lista
            if(requiereInstalacion) {
                doc.setTextColor(0, 86, 179); // Azul oscuro para resaltar
                doc.text(`- Solicitud de inspección para instalación y configuración (Sin costo)`, 25, startY);
                doc.setTextColor(0, 0, 0); // Volver a negro
                startY += 8;
            }

            // --- CÁLCULOS FINALES ---
            const totalEstimado = subtotalEquipos + itbmsTotal; // Ya no sumamos los 100 de instalación
            
            startY += 5; 
            doc.line(20, startY, 190, startY);
            
            startY += 10;
            doc.setFontSize(11);
            doc.text(`Subtotal: $${subtotalEquipos.toFixed(2)}`, 190, startY, { align: "right" });
            
            startY += 8;
            doc.text(`ITBMS (7%): $${itbmsTotal.toFixed(2)}`, 190, startY, { align: "right" });
            
            startY += 8;
            doc.setFontSize(14);
            doc.text(`TOTAL: $${totalEstimado.toFixed(2)}`, 190, startY, { align: "right" });
            // --- NUEVO: IMPRIMIR COMENTARIOS EN EL PDF (SI EXISTEN) ---
            if (comentarios.trim() !== '') {
                startY += 15; // Bajar un poco después del total
                doc.setFontSize(11);
                doc.setTextColor(0, 86, 179); // Azul para resaltar el título
                doc.text("Requerimientos Adicionales / Comentarios:", 20, startY);
                
                startY += 6;
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50); // Gris oscuro para el texto
                
                // Dividir el texto en múltiples líneas para que no se salga del PDF
                const lineasComentarios = doc.splitTextToSize(comentarios, 170); 
                doc.text(lineasComentarios, 20, startY);
                
                // Ajustar la posición Y sumando la cantidad de líneas que tomó el texto
                startY += (lineasComentarios.length * 5) + 2; 
            }

            // --- NOTAS ACLARATORIAS ACTUALIZADAS ---
            startY += 20;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100); 
            doc.text("Notas Importantes:", 20, startY);
            startY += 6;
            doc.text("* Los precios están sujetos a cambios sin previo aviso.", 20, startY);
            startY += 5;
            doc.text("* Esta cotización es informativa y no representa un compromiso legal por parte de SISTEC INT.", 20, startY);
            startY += 5;
            doc.text("* La entrega es a domicilio en la ciudad de Panamá, según las áreas definidas en nuestros términos", 20, startY);
            startY += 5;
            doc.text("  y condiciones en: https://sistecint.com/TermsAndConditions.html", 20, startY);

            // --- MOSTRAR VISTA PREVIA EN LA MODAL ---
            pdfBase64Global = doc.output('datauristring'); // Guardar en variable global
            
            document.getElementById('pdfPreview').src = pdfBase64Global;
            document.getElementById('pdfModal').style.display = 'flex'; // Abrir modal
            
            btn.innerText = "Generar y Ver Cotización";
            btn.disabled = false;
        });
    }

    // 7. Lógica del Botón Cerrar Modal
    const btnCloseModal = document.getElementById('closeModal');
    if(btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            document.getElementById('pdfModal').style.display = 'none';
        });
    }

    // 8. Lógica Paso 2: Confirmar y Enviar (Dentro de la modal)
    const btnConfirmar = document.getElementById('btnConfirmarEnviar');
    if(btnConfirmar) {
        btnConfirmar.addEventListener('click', async function() {
            btnConfirmar.innerText = "Enviando...";
            btnConfirmar.disabled = true;

            const nombre = document.getElementById('clienteNombre').value;
            const email = document.getElementById('clienteEmail').value;

            try {
                const response = await fetch('enviar_cotizacion.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        email: email,
                        pdf: pdfBase64Global
                    })
                });

                if(response.ok) {
                    document.getElementById('pdfModal').style.display = 'none'; // Cerrar modal
                    document.getElementById('mensaje').style.display = 'block'; // Mensaje de éxito
                    form.reset();
                    if (listaEquiposContainer) {
                        listaEquiposContainer.innerHTML = '';
                        agregarFilaEquipo(); 
                    }
                } else {
                    alert('Hubo un error al procesar el envío.');
                }
            } catch (error) {
                console.error("Error:", error);
                alert('Hubo un error de conexión con el servidor.');
            }

            btnConfirmar.innerText = "Confirmar y Enviar por Correo";
            btnConfirmar.disabled = false;
        });
    }
});