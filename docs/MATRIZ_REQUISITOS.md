# GeoIstmo · Avance 3 · Matriz de requisitos

**Fuentes:** **CAL** = calendario de avances (imagen) · **A2** = documento `GeoIstmo_A2_v1.1_2026-10-25` (sección o frame) · **ENC** = enunciado del encargo del Avance 3 (no atribuido al profesor).

Los códigos RF y RNF son los que **cita** el Avance 2. Su redacción completa está en el Avance 1, que no se tuvo a la vista (ver X1 en `ANALISIS_Y_ARQUITECTURA.md`).

**Estado:** ✅ Implementado · 🟡 Parcialmente implementado · ⏳ Pendiente (con el avance previsto).

Las pruebas `A01`… `U01` son las automáticas de `tests/api.test.js` (`npm test`). **N** = comprobado en el recorrido con navegador (ver `PRUEBAS.md`).

## 1. Requisitos obligatorios del Avance 3 (calendario)

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 1 | Versión alfa con **navegación completa** | CAL A3 | Aplicación de una sola página con enrutador (`public/js/app.js`), menú propio por rol y rutas protegidas | N: recorrido por las opciones de los tres menús; U01 | ✅ |
| 2 | **Acceso de usuarios** | CAL A3 | Registro, ingreso por rol y cierre de sesión (`server/services/auth.js`) | A01–A11, N | ✅ |
| 3 | **Motor de contenidos** | CAL A3 | Módulos → temas → lecciones → autoevaluación en la base de datos, con bloqueos (`server/services/contenido.js`) | C01–C04, M04, N | ✅ |
| 4 | **Primeras actividades** | CAL A3 | Misión del día (3 retos) y autoevaluaciones de tema (`server/services/actividades.js`, `public/js/views/actividad.js`) | T01–T09, N | ✅ |
| 5 | Desarrollo en un lenguaje elegido por el equipo | CAL A3 | JavaScript (Node.js + navegador) | Código fuente | ✅ |
| 6 | Documento guardado con nombre que indica fecha y versión | CAL, lista de verificación | `GeoIstmo_A3_v0.3_2026-10-25.zip` | Nombre del archivo | ✅ |

## 2. Requisitos funcionales citados en el Avance 2

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 7 | RF-01 · Registro de usuarios | A2 ficha 1 (00-01), 00-04 a 00-06 | `/registro` con código de sección; siempre crea estudiantes | A05, A06, A07; N (validación y «Cuenta creada») | ✅ |
| 8 | RF-02 · Acceso con usuario y contraseña | A2 ficha 1 | Ingreso con pestañas Estudiante · Docente · Administrador; ver contraseña; «Mantener sesión iniciada» | A01, A02, A03; N | ✅ |
| 9 | RF-03 · Menú principal con módulos y avance | A2 ficha 2 (01-04) | Inicio del estudiante: misión, «Continúa», ruta de módulos, álbum y nivel | N | ✅ |
| 10 | RF-06 · Mapa interactivo con la división político-administrativa | A2 ficha 4 (05-03) | No implementado en la alfa | — | ⏳ A4 |
| 11 | RF-07 · Actividades interactivas | A2 ficha 3 (02-02) | Relacionar (arrastrar o con clics), selección múltiple y verdadero o falso (botones o ← →) | T02–T04, N | ✅ |
| 12 | RF-08 · Calificación automática | A2 ficha 3 | El servidor corrige, calcula el porcentaje (puntaje parcial en relacionar) y el XP | T02, T04, T07, T08 | ✅ |
| 13 | RF-09 · Respuesta inmediata | A2 ficha 3, 2.6 (02-06, 02-07) | Mensaje verde ✓ o rojo ✕ con texto, explicación y respuesta correcta | T02; N | ✅ |
| 14 | RF-10 · Resultados del estudiante | A2 ficha 2 | «Mis notas» con el mejor intento por actividad y promedio | T08, T09; N | ✅ |
| 15 | RF-12 · Continuar donde quedó | A2 ficha 2 | Tarjeta «Continúa · Módulo N» con el primer tema pendiente | N | ✅ |
| 16 | RF-13 · Reportes de avance del grupo | A2 ficha 5 (09-05) | Panel del docente (actividad diaria y racha) y «Resultados» por tema. La **calificación de entregas** queda pendiente | D01, D03; N | 🟡 A4 (entregas) |
| 17 | RF-14 · El administrador maneja usuarios, contenidos y banco de preguntas | A2 ficha 6 (10-01) | Usuarios, secciones y catálogo: módulos, temas, publicar/ocultar y CRUD de preguntas de selección y V/F | M01–M04; N | 🟡 Editor de lecciones y de «relacionar»: A4 |

## 3. Requisitos no funcionales citados en el Avance 2

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 18 | RNF-01 · Llegar a una actividad en máximo 3 clics | A2 4.3 | Inicio → «Empezar misión» → «Jugar» = 2 clics | N (ruta medida en el recorrido) | ✅ |
| 19 | RNF-02 · Interfaz clara y usable | A2 ficha 2 | Guía de estilo aplicada; un concepto por pantalla; progreso visible | N; prueba con usuarios pendiente | 🟡 Validación A4 |
| 20 | RNF-04 · Acceso según el rol | A2 ficha 1, 5 | `requerirRol()` en el servidor; el docente solo ve sus secciones | P01, P02; N (URL de otro rol) | ✅ |
| 21 | RNF-05 · WCAG 2.1 AA; el color nunca comunica solo | A2 5.2, 5.6 | Estados con ícono y texto; contrastes corregidos; foco visible; botones ≥ 44 px; alternativa por teclado o clic en los retos; textos alternativos | Revisión manual; WAVE/Lighthouse pendientes | 🟡 Auditoría A4 |
| 22 | RNF-07 · Diseño adaptable | A2 OE5, cambio C1 | Solo CSS (C1); referencia 1440 × 900 | N: 1024 px y 390 px sin desplazamiento horizontal | ✅ (según C1) |
| 23 | RNF-09 · Mantener contenidos sin tocar el código | A2 4.2 | Catálogo curricular del administrador sobre la base de datos | M04; N | 🟡 Lecciones: A4 |

## 4. Diseño instruccional y gamificación del Avance 2

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 24 | Siete módulos en el orden del Avance 1 | A2 2.3 | Los 7 módulos y sus 22 temas cargados | C01; N | ✅ |
| 25 | Contenido de los módulos | A2 2.3 | Módulos 1 y 2 completos; 3 a 7 «En preparación» | C03; N | 🟡 Resto: A4 |
| 26 | Módulos abiertos por el docente; «Esperando al docente» en lugar de un error | A2 2.1, 2.3 (04-02, 09-02, 09-03, 09-11) | Abrir, cerrar o programar por sección; el estudiante ve el estado y la fecha | D02, C01, C02; N | ✅ |
| 27 | Lección en 5 momentos (Activar, Explorar, Practicar, Autoevaluar, Retroalimentar) | A2 2.4 | Explorar (lecciones), Autoevaluar y Retroalimentar. «Apuesta» (Activar) y «Reto» de tema, pendientes | C04, T08 | 🟡 A4 |
| 28 | Misión del día: relacionar → capitales → V o F | A2 3.2 | Implementada con las preguntas del prototipo (Densidad, Natalidad, Migración; capital de Chiriquí; el Canal) | T07; N | ✅ |
| 29 | Tres vidas y combo visibles | A2 2.5 | Corazones y combo en la barra del reto | T02, T05; N | ✅ |
| 30 | Pista (−5 XP) y cronómetro | A2 2.5, 02-02 | No implementados | — | ⏳ A4 |
| 31 | Máximo 10 preguntas; el reintento no borra el mejor resultado | A2 2.5 | Autoevaluaciones de 4 preguntas; se guarda el mejor intento | T09 | ✅ |
| 32 | Rangos Dominado · Logrado · En proceso · Por reforzar | A2 2.6 | `banda()` con 90/80/60 (provisional, D3) | T08, T09, D03 | ✅ |
| 33 | Por debajo de 80 %: sugerir repaso; reto de refuerzo y aviso al docente | A2 2.6 | Mensaje de repaso y lista «Para reforzar» del docente. El reto de refuerzo automático, pendiente | T09, D01 | 🟡 A4 |
| 34 | Racha, XP, insignias de lugar, niveles | A2 2.7 | Racha diaria, XP con libro sin duplicados, álbum de 8 insignias (Volcán Barú incluido) y 4 niveles | T07; N | ✅ |
| 35 | Pasaporte y liga de la sección | A2 2.7 | No implementados | — | ⏳ A4 |
| 36 | Texto alternativo e imágenes optimizadas | A2 2.8 | `alt` en imágenes informativas; copias reducidas cuando hacía falta | U01; revisión del código | ✅ |
| 37 | Autor y licencia de cada foto | A2 2.8 | Pendiente del equipo (no consta en los materiales) | — | ⏳ A5 |

## 5. Guía de estilo del Avance 2

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 38 | Nombre, lema y logotipo | A2 5.1 | Logotipo e ilustración extraídos de los SVG; lema en el ingreso | N | ✅ |
| 39 | Paleta de 16 colores | A2 5.2 | Variables CSS con los códigos exactos | `public/css/estilos.css` (`:root`) | ✅ |
| 40 | Tipografía Lora, Karla y Brawler | A2 5.3 | Fuentes servidas localmente (licencia OFL) | N | ✅ |
| 41 | Componentes y estados (botones, módulos, misión, retroalimentación, etiquetas, interruptor, insignias, menú de 260 px con opción activa en lima) | A2 5.4 | Implementados en CSS; módulos completado, en curso y bloqueado (beige, borde punteado y candado) | N | ✅ |
| 42 | Voz y tono (tuteo, nunca culpar, explicar los bloqueos) | A2 5.5 | Mensajes como «Casi. La respuesta es David», «Esperando al docente» | N | ✅ |
| 43 | Ajustes de contraste | A2 5.6 | `#A13A28` y `#1F7A7A`; ámbar nunca como texto | `estilos.css` | ✅ |

## 6. Requisitos del encargo del Avance 3

| # | Requisito | Fuente | Implementación | Cómo se comprueba | Estado |
|---|---|---|---|---|---|
| 44 | Tres roles con permisos validados en el servidor | ENC 4 | Ver 20 | P01, P02, A09 | ✅ |
| 45 | Contraseñas con hash; sin texto plano ni claves en el código | ENC 8 | bcrypt; no hay secretos | A04, M02 | ✅ |
| 46 | Consultas seguras y validación de entradas | ENC 8 | Sentencias preparadas; validación en el servidor y en el formulario | M02 (texto malicioso), A06, M01, T03 | ✅ |
| 47 | Persistencia de resultados y progreso | ENC 7 | Tablas de intentos, respuestas, lecciones, XP, misión e insignias | T07–T09 | ✅ |
| 48 | Mensajes de éxito, error, espera y validación | ENC 5 | Avisos, mensajes junto a cada campo, botones «Entrando…» y «Guardando…», indicador de carga | N | ✅ |
| 49 | Sin botones decorativos | ENC 7 | Lo pendiente se muestra sin enlace y con la marca «A4» | N | ✅ |
| 50 | Datos de demostración reproducibles | ENC 2, 8 | `npm run seed` | Se ejecutó en el entorno limpio (ver `PRUEBAS.md`) | ✅ |
| 51 | README e instalación en Windows | ENC 9 | `README.md`, `iniciar.bat`, `reiniciar-datos.bat` | Instalación limpia en Linux; en Windows no se pudo ejecutar (ver `PRUEBAS.md`) | 🟡 Probar en un equipo con Windows |

## 7. Resumen

| Estado | Cantidad |
|---|---|
| ✅ Implementado | 38 |
| 🟡 Parcialmente implementado | 9 |
| ⏳ Pendiente | 4 |
| **Total** | **51** |

Los cuatro requisitos obligatorios del calendario para el Avance 3 (filas 1 a 4) están implementados y probados.
