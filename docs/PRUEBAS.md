# GeoIstmo · Avance 3 · Informe de pruebas

Fecha: 25 de octubre de 2026 · Versión: 0.3 alfa · Entorno de ejecución: Linux, Node.js 22.23.4, Chromium (Playwright).

> **Límite del entorno:** las pruebas se ejecutaron en Linux. **No se pudo probar en Windows**, ni el archivo `iniciar.bat`. El código no usa nada propio de un sistema operativo: rutas con `path`, SQLite integrado en Node.js y sin módulos nativos que compilar. Aun así, conviene que una persona del equipo siga el README en un equipo con Windows antes de entregar.

## 1. Resumen

| Prueba | Cómo se ejecutó | Resultado |
|---|---|---|
| Instalación limpia desde el ZIP | Extraer en una carpeta vacía → `npm install` → `npm run init-db` | ✅ 66 paquetes instalados; base creada con las 10 cuentas de demostración |
| Base de datos creada y consultable | Consulta directa al archivo `data/geoistmo.db` | ✅ 10 usuarios, 2 secciones, 7 módulos, 22 temas, 10 lecciones, 10 actividades, 41 preguntas, 8 insignias; hashes `$2b$12$…` |
| Pruebas funcionales de la API | `npm test` | ✅ **34 de 34** |
| Recorrido en navegador de los 3 roles | `node tests/navegador/recorrido.mjs` contra la copia limpia | ✅ **24 de 24** comprobaciones, sin errores de JavaScript |
| Persistencia | Consulta a la base después del recorrido | ✅ 14 intentos, 17 respuestas, misiones y 5 registros de auditoría guardados |
| Diseño adaptable | Navegador a 1440, 1024 y 390 px de ancho | ✅ Sin desplazamiento horizontal |
| Mensaje de puerto ocupado | Arranque con el puerto 3000 en uso (ocurrió durante las pruebas) | ✅ «El puerto 3000 ya está en uso. Cambia PORT en el archivo .env.» |

## 2. Pruebas automáticas de la API (`tests/api.test.js`)

Cada prueba usa una base SQLite **nueva en memoria** con los datos de demostración, así que no modifica `data/geoistmo.db`.

| Código | Qué comprueba |
|---|---|
| A01 | Ingreso correcto de los 3 roles; cookie `HttpOnly` y `SameSite=Lax` |
| A02 | Clave errónea, rol equivocado y cuenta inexistente dan el mismo mensaje (401) |
| A03 | Campos vacíos (400) y bloqueo tras 5 intentos fallidos (429) |
| A04 | Todas las contraseñas están guardadas como hash bcrypt |
| A05 | Registro con código de sección y luego ingreso |
| A06 | Registro con datos inválidos, código inexistente o correo repetido |
| A07 | El registro público no permite elegir el rol administrador |
| A08 | Cerrar sesión invalida la sesión: las rutas privadas responden 401 |
| A09 | Suspender una cuenta cierra su sesión e impide volver a entrar |
| A10 | Petición sin cabecera anti-CSRF → 403 |
| A11 | Detrás de un proxy (GitHub Codespaces) se acepta el origen de `X-Forwarded-Host`; un origen ajeno sigue rechazado |
| P01 | Matriz de acceso: cada rol recibe 403 en las rutas de los otros; sin sesión, 401 |
| P02 | Un docente no puede ver ni cambiar la sección de otro docente |
| C01 | Estados de módulos y temas: completado, en curso, disponible y bloqueado |
| C02 | Tema de un módulo cerrado o fuera de secuencia → 403; identificador inválido → 400 o 404 |
| C03 | Tema sin contenido → «en preparación» (409) |
| C04 | El detalle del tema no envía respuestas |
| T01 | Iniciar una actividad no revela la respuesta correcta |
| T02 | Acierto y error: vidas, combo, explicación; no se puede responder dos veces |
| T03 | Respuestas con formato inválido → 400 |
| T04 | «Relaciona conceptos» con puntaje parcial (2 de 4 parejas = 0,5) |
| T05 | Sin vidas: el intento termina y no suma XP |
| T06 | No se puede responder el intento de otro estudiante |
| T07 | Misión completa: +45 XP, racha de 4 a 5, insignia Volcán Barú; repetir no paga de nuevo |
| T08 | La autoevaluación exige leer las lecciones; aprobar completa el tema y abre el siguiente |
| T09 | Un 50 % no completa el tema; se conserva el mejor intento |
| D01 | El panel del docente refleja la actividad real («Para reforzar», % que jugó hoy) |
| D02 | Abrir, cerrar y programar módulos (fecha pasada rechazada; al llegar la fecha se abre solo) |
| D03 | Resultados por tema solo de los estudiantes del docente |
| M01 | Crear, editar y restablecer usuarios con validación; el administrador no puede degradarse |
| M02 | Filtro por rol; búsqueda resistente a inyección SQL; la respuesta no incluye hashes |
| M03 | Crear secciones (código único) y asignar docente |
| M04 | Catálogo: crear y eliminar temas, agregar preguntas y ocultar actividades; el estudiante ve el cambio |
| U01 | La interfaz, sus módulos JS, el CSS, las fuentes y todas las imágenes se sirven sin rutas rotas |

Salida de la última ejecución en la instalación limpia:

```
# tests 34
# pass 34
# fail 0
```

## 3. Recorrido en navegador (`tests/navegador/recorrido.mjs`)

Es opcional, porque necesita Playwright, que no es una dependencia del proyecto. Se ejecutó contra la copia limpia con la base recién sembrada.

```
ok - relacionar: acierto
ok - relacionar: error con parejas correctas
ok - relacionar: 1 de 2 = 50 %
ok - capitales: 4 de 5 = 80 %
ok - insignia Volcán Barú desbloqueada
ok - racha pasa de 4 a 5
ok - inicio muestra 3/3
ok - estudiante en /admin/usuarios es devuelto a su inicio
ok - API admin responde 403 al estudiante
ok - cerrar sesión vuelve al ingreso del estudiante
ok - ruta privada sin sesión redirige al ingreso
ok - panel docente lista estudiantes de 12.º A
ok - panel docente NO lista estudiantes de otra sección
ok - docente abre el Módulo 3
ok - docente programa el Módulo 4
ok - docente en /estudiante vuelve a su panel
ok - cerrar sesión del docente vuelve a su ingreso (C3)
ok - estudiante ve la fecha del módulo programado
ok - Módulo 3 muestra temas «En preparación»
ok - la actividad reciente registra la acción del docente
ok - administrador crea un docente
ok - filtro por rol docente
ok - búsqueda por nombre
ok - administrador agrega una pregunta al banco

Recorrido completo sin fallos.
```

También se revisaron visualmente las capturas de: ingreso con validación y error, inicio, misión, los tres retos con acierto y error, misión completa, módulos, temas, lección, autoevaluación, notas, insignias, registro, panel del docente, módulos del docente, programar apertura, resultados, resumen del administrador, crear usuario con validación, contraseña temporal, secciones, catálogo y editor de preguntas.

Para ejecutarlo:

```powershell
npm run seed
npm start                                   # en una ventana
npm install --no-save playwright            # en otra ventana, una sola vez
npx playwright install chromium
node tests/navegador/recorrido.mjs
```

## 4. Errores encontrados y corregidos

| N.º | Error | Cómo se detectó | Corrección |
|---|---|---|---|
| E1 | Las autoevaluaciones mezclan preguntas de selección y de V/F, y el motor corregía según el tipo de la **actividad**: las de V/F daban error 500. | Pruebas T08 y T09 | El tipo se decide **por pregunta** (`tipoDe()` en `actividades.js`); la interfaz recibe `tipo` en cada pregunta. |
| E2 | Los escuchadores de eventos se acumulaban al volver a una pantalla, porque las vistas los colgaban del contenedor principal compartido. | Revisión del código | Cada vista recibe un contenedor nuevo y hay limpieza (`alSalir`) para los atajos de teclado. |
| E3 | Los íconos dentro de los botones crecían sin límite. | Captura del inicio | Tamaño fijo de los SVG en botones, fichas y enlaces. |
| E4 | El paso «Insignia del día» de la misión heredaba los estilos del álbum por compartir la clase `insignia`. | Captura del inicio | Clase renombrada a `premio`. |
| E5 | Mostrar errores en campos de opción única (radio) provocaba una excepción. | Revisión del editor de preguntas | `mostrarErrores()` maneja `RadioNodeList`. |
| E6 | `npm test` con una carpeta como argumento no encontraba las pruebas en Node 22. | Ejecución de `npm test` | Patrón `"tests/**/*.test.js"`, que funciona igual en Windows. |
| E7 | El hash ficticio del ingreso tenía un costo distinto al real, así que el tiempo de respuesta podía revelar si un correo existe. | Revisión de seguridad | Mismo costo que la configuración (`config.bcryptRounds`). |
| E8 | En el recorrido en navegador combinado faltaba el reto 1, y la misión no se completaba en una base nueva. | Ejecución en la instalación limpia | Se agregó el reto 1 al guion (defecto del guion, no de la aplicación). |
| E9 | Una ejecución del recorrido usó un servidor anterior que seguía abierto con la base vieja. | Mensaje «puerto en uso» en el registro | Se detuvo el proceso correcto y se repitió con la base recién creada. Se recomienda cerrar GeoIstmo antes de `npm run seed`. |
| E10 | En los avisos, el texto con negrita se partía en columnas (el aviso usaba un contenedor flexible). | Captura de «Contraseña temporal» | El ícono del aviso se posiciona aparte y el texto fluye normal. |
| E11 | Al ejecutar detrás del proxy de GitHub Codespaces, la verificación de origen habría rechazado el inicio de sesión (el host público llega en `X-Forwarded-Host`). | Revisión al preparar la guía de GitHub | Se acepta también `X-Forwarded-Host`; prueba A11. Se agregó `.devcontainer/devcontainer.json` con Node 22. |

## 5. Lo que no se probó (y debe hacerse en el Avance 4)

- Instalación y `iniciar.bat` en **Windows** (ver la nota inicial).
- Prueba de usabilidad con 3 a 5 personas y cuestionario SUS (plan del A2, 6.4).
- Auditoría de accesibilidad con WAVE y Lighthouse. En la alfa se aplicaron las reglas del A2 (contraste, foco visible, botones de 44 px, teclado en los retos, textos alternativos), pero sin medirlas con herramientas.
- Navegadores distintos de Chromium (Firefox, Safari).
- Carga con muchos usuarios simultáneos.
- Revisión del contenido por el experto (R4).
