# GeoIstmo · versión alfa (Avance 3)

**«Explora, comprende y aprende»**

GeoIstmo es un software educativo web para la asignatura **Geografía Humana, Económica y Política de 12.º grado (MEDUCA, Panamá)**. Esta es la **versión alfa** que pide el calendario del Avance 3 (entrega del 28 de octubre de 2026): navegación, acceso de usuarios, motor de contenidos y primeras actividades. Convierte en una aplicación real el diseño y el prototipo de Figma del Avance 2 (`GeoIstmo_A2_v1.1_2026-10-25`).

> Asignatura: Informática Educativa · Universidad de Panamá · Fase 3 del modelo ADDIE (Desarrollo y Programación, parte 1).

---

## 1. Qué incluye esta versión

| Componente | Estado en la alfa |
|---|---|
| Registro de estudiantes con el código de sección del docente | Funciona |
| Inicio de sesión por rol (estudiante, docente, administrador) y cierre de sesión | Funciona |
| Permisos validados en el servidor (cambiar la URL no abre nada) | Funciona |
| Base de datos SQLite con usuarios, contenidos, intentos, respuestas y progreso | Funciona |
| Motor de contenidos: 7 módulos → temas → lecciones → autoevaluación, con bloqueos | Funciona |
| Contenido educativo completo de los **Módulos 1 y 2** (7 temas, 10 lecciones, 28 preguntas) | Contenido de demostración, **pendiente de revisión del experto** |
| Módulos 3 a 7: estructura de temas cargada, sin lecciones | «En preparación» |
| Misión del día con 3 retos: **Relaciona conceptos**, **Ubica la capital**, **Verdadero o falso** | Funciona |
| Retroalimentación, vidas, combo, XP, racha, niveles e insignias de lugar | Funciona |
| Panel del docente, apertura/cierre/programación de módulos y resultados de su sección | Funciona |
| Panel del administrador: usuarios, roles, secciones y catálogo curricular (temas y preguntas) | Funciona |
| Mapa interactivo, noticias, debates, aula con tareas, liga, avisos | **Pendiente (Avance 4)** — ver `docs/PENDIENTES.md` |

En el menú, las opciones que todavía no existen aparecen en gris con la marca **A4** y no se pueden pulsar.

## 2. Tecnologías

Todas son gratuitas, funcionan en Windows y **no requieren cuentas, claves ni servicios externos**.

| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend | HTML, CSS y JavaScript (módulos ES) sin compilación | Se abre en cualquier navegador; fácil de leer y modificar para estudiantes |
| Backend | Node.js + Express 5 | Un solo lenguaje (JavaScript) en todo el proyecto |
| Base de datos | SQLite mediante el módulo integrado `node:sqlite` | Un archivo local; no hay que instalar un servidor de base de datos ni compilar nada |
| Autenticación | Sesiones con cookie `HttpOnly` + `SameSite=Lax`; contraseñas con **bcrypt** | Seguro y sin dependencias nativas |
| Pruebas | `node:test` (incluido en Node.js) | No requiere instalar herramientas extra |

Dependencias de npm: solo **express** y **bcryptjs**.

## 3. Instalación en Windows (paso a paso)

### 3.1 Instalar Node.js (una sola vez)

1. Entre a <https://nodejs.org> y descargue la versión **LTS** (22 o superior; se probó con la 22.23).
2. Ejecute el instalador y acepte las opciones por defecto.
3. Abra **PowerShell** (tecla Windows → escriba «PowerShell») y compruebe:
   ```powershell
   node -v
   npm -v
   ```
   Debe ver `v22.x.x` o superior. Si ve un número menor que 22.13, actualice Node.js.

### 3.2 Opción rápida: doble clic

1. Extraiga el ZIP `GeoIstmo_A3_v0.3_2026-10-25.zip` en una carpeta, por ejemplo `C:\GeoIstmo`.
2. Haga **doble clic en `iniciar.bat`**. La primera vez instala las dependencias (requiere internet), crea la base de datos y abre el navegador en <http://localhost:3000>.
3. Para detener el programa, cierre la ventana negra o pulse `Ctrl + C`.

### 3.3 Opción manual (PowerShell)

```powershell
cd C:\GeoIstmo\geoistmo
npm install          # 1. instala las dependencias (express y bcryptjs)
npm run init-db      # 2. crea data\geoistmo.db con los datos de demostración
npm start            # 3. inicia el servidor
```

Luego abra **<http://localhost:3000>** en Chrome, Edge o Firefox.

> Si PowerShell muestra «la ejecución de scripts está deshabilitada» al usar `npm`, ejecute los mismos comandos en **Símbolo del sistema (cmd)** o use `npm.cmd install`.

### 3.4 Configuración (opcional)

Copie `.env.example` como `.env` para cambiar el puerto u otros valores. **El sistema funciona sin `.env`**: no hay claves secretas que configurar.

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `PORT` | 3000 | Puerto del servidor |
| `DB_PATH` | `data/geoistmo.db` | Ubicación del archivo de base de datos |
| `BCRYPT_ROUNDS` | 12 | Costo del hash de contraseñas |
| `SESSION_HOURS` | 8 | Duración de la sesión normal |
| `SESSION_REMEMBER_DAYS` | 14 | Duración con «Mantener sesión iniciada» |
| `COOKIE_SECURE` | false | Ponga `true` solo si publica el sitio con HTTPS |

### 3.5 Volver a los datos de demostración

```powershell
npm run seed
```
o doble clic en `reiniciar-datos.bat`. **Borra** todos los cambios y vuelve a crear la base.

## 4. Credenciales de demostración

Son cuentas **ficticias** con el dominio reservado `.test` (no son correos reales). Se crean al inicializar la base y sus contraseñas se guardan con **hash bcrypt**, nunca en texto plano.

| Rol | Pestaña de ingreso | Correo | Contraseña |
|---|---|---|---|
| Administrador | Administrador | `admin@geoistmo.test` | `Admin2026!` |
| Docente (12.º A) | Docente | `docente@geoistmo.test` | `Docente2026!` |
| Docente (12.º B) | Docente | `docente2@geoistmo.test` | `Docente2026!` |
| Estudiante (12.º A, con progreso y racha de 4 días) | Estudiante | `sergio@geoistmo.test` | `Estudiante2026!` |
| Estudiante (12.º A, sin actividad) | Estudiante | `carlos@geoistmo.test` | `Estudiante2026!` |
| Otros estudiantes de 12.º A | Estudiante | `marta@`, `luis@`, `ana@`, `sofia@geoistmo.test` | `Estudiante2026!` |
| Estudiante (12.º B) | Estudiante | `laura@geoistmo.test` | `Estudiante2026!` |

Códigos de sección para **crear cuenta**: `G3O-12A-2026` (12.º A) y `G3O-12B-2026` (12.º B).

En cada pantalla de ingreso hay un botón **«Usar esta cuenta»** que rellena la cuenta de demostración del rol.

**Crear más usuarios de demostración:** entre como administrador → *Usuarios* → *Crear usuario*. Los estudiantes también pueden registrarse solos con un código de sección. Las cuentas de demostración están definidas en `server/db/seed.js` (`CREDENCIALES_DEMO`).

## 5. Recorrido sugerido para la presentación (≈ 6 minutos)

1. **Estudiante** (`sergio@…`): Inicio → *Empezar misión* → los 3 retos (prueba un error para ver la retroalimentación) → **insignia Volcán Barú** y racha de 4 a 5 días.
2. *Módulos* → Módulo 2 → Tema 3 → leer la lección → **autoevaluación** → *Mis notas*.
3. Intentar abrir `http://localhost:3000/admin/usuarios` con la cuenta de estudiante: el sistema lo devuelve a su inicio.
4. **Docente**: *Panel* (ve que Sergio completó la misión) → *Módulos y temas* → **abrir** el Módulo 3 o **programarlo** → *Resultados*.
5. **Estudiante**: el Módulo 3 ya aparece abierto, con sus temas «En preparación».
6. **Administrador**: *Resumen* (la actividad reciente muestra lo que hizo el docente) → *Usuarios* → crear un usuario → *Catálogo curricular* → agregar una pregunta.

## 6. Pruebas

```powershell
npm test
```

Ejecuta **34 pruebas funcionales** de la API sobre una base de datos en memoria (no toca `data\geoistmo.db`): autenticación, permisos por rol, motor de contenidos, actividades, misión del día, docente, administrador y recursos gráficos sin rutas rotas. Resultado esperado: `# pass 34  # fail 0`.

**Recorrido en navegador (opcional):** `tests/navegador/recorrido.mjs` repite con Playwright el uso real de los tres roles (24 comprobaciones). Requiere instalar Playwright aparte; las instrucciones están en el propio archivo y en `docs/PRUEBAS.md`.

El detalle de lo probado y los errores encontrados y corregidos está en **`docs/PRUEBAS.md`**.

## 6 bis. Ejecutar en GitHub Codespaces (sin instalar nada)

El proyecto incluye `.devcontainer/devcontainer.json`, que prepara un entorno con Node.js 22, instala las dependencias y crea la base de datos automáticamente.

1. Suba el proyecto a un repositorio de GitHub.
2. En el repositorio: botón verde **Code** → pestaña **Codespaces** → **Create codespace on main**.
3. Espere a que termine la preparación (la primera vez tarda unos minutos).
4. En la terminal de abajo escriba `npm start`.
5. Se abrirá la aplicación en una pestaña nueva. Si no se abre: pestaña **Ports** → puerto **3000** → ícono del globo (*Open in Browser*).

Las cuentas personales de GitHub incluyen horas gratuitas de Codespaces al mes. Detenga el codespace cuando termine (**Code → Codespaces → … → Stop codespace**) para no gastarlas.

## 7. Estructura del proyecto

```
geoistmo/
├─ .devcontainer/                      Configuración para GitHub Codespaces
├─ iniciar.bat / reiniciar-datos.bat   Lanzadores para Windows
├─ package.json · .env.example
├─ server/                             BACKEND
│  ├─ index.js                         Arranque del servidor
│  ├─ app.js                           Rutas de la API y control de acceso por rol
│  ├─ config.js                        Configuración (.env)
│  ├─ db/                              ACCESO A DATOS
│  │  ├─ schema.sql                    Estructura de la base de datos (17 tablas)
│  │  ├─ connection.js                 Conexión SQLite y transacciones
│  │  ├─ seed.js · seed-content.js     Datos de demostración y contenido educativo
│  │  └─ init.js                       Crear o reiniciar la base
│  ├─ middleware/                      AUTENTICACIÓN Y SEGURIDAD (sesión, rol, CSRF, límite de intentos)
│  ├─ services/                        LÓGICA DE NEGOCIO
│  │  ├─ auth.js                       Registro e inicio de sesión
│  │  ├─ contenido.js                  Motor de contenidos y bloqueos
│  │  ├─ actividades.js                Corrección, vidas, combo, XP, misión del día
│  │  ├─ progreso.js                   Racha, niveles, insignias, rangos de calificación
│  │  ├─ docente.js · admin.js         Funciones de cada rol
│  ├─ routes/                          Rutas HTTP por rol
│  └─ util/errores.js                  Errores y validación de entradas
├─ public/                             FRONTEND
│  ├─ index.html · css/estilos.css     Guía de estilo del Avance 2 en CSS
│  ├─ js/app.js                        Enrutador y menús por rol
│  ├─ js/api.js · js/ui.js             Cliente de la API y utilidades
│  ├─ js/views/                        Pantallas: acceso, estudiante, actividad, docente, admin
│  ├─ assets/img/                      Imágenes extraídas de los SVG del prototipo
│  └─ fonts/                           Lora, Karla y Brawler (licencia OFL), servidas localmente
├─ recursos/
│  ├─ imagenes-originales/             Las 14 imágenes de los SVG, sin modificar
│  └─ referencia-prototipo/            Vista reducida de las 99 pantallas del prototipo
├─ tests/api.test.js                   Pruebas funcionales
├─ data/                               Aquí se crea geoistmo.db (no se incluye en el ZIP)
└─ docs/                               Documentación del avance
```

## 8. Documentación del Avance 3

| Archivo | Contenido |
|---|---|
| `docs/ANALISIS_Y_ARQUITECTURA.md` | Análisis de los tres materiales, contradicciones y decisiones, arquitectura, modelo de datos y seguridad |
| `docs/MATRIZ_REQUISITOS.md` | Matriz: requisito, fuente, implementación, forma de comprobarlo y estado |
| `docs/PRUEBAS.md` | Pruebas ejecutadas, resultados y errores corregidos |
| `docs/PENDIENTES.md` | Funcionalidades que se dejan para el Avance 4 y el Avance 5 |
| `docs/RECURSOS.md` | Inventario del ZIP de SVG, qué recurso se usa en cada pantalla y sustitutos |

## 9. Problemas frecuentes

| Problema | Solución |
|---|---|
| `"node" no se reconoce como un comando` | Instale Node.js (3.1) y abra una ventana nueva de PowerShell |
| `No such built-in module: node:sqlite` | Su Node.js es anterior a la 22.13. Instale la versión LTS actual |
| `El puerto 3000 ya está en uso` | Cierre la otra ventana de GeoIstmo o cree `.env` con `PORT=3001` |
| No puedo entrar con una cuenta | Revise que eligió la **pestaña del rol** correcto. Tras 5 intentos fallidos se bloquea 15 minutos |
| Quiero empezar de cero | `npm run seed` |

## 10. Equipo

Raiben Pol (coordinador y diseño de interfaz) · Alain Cast (analista y tester) · Exiquiel Gonz (diseño instruccional y documentación) · Joses Deg (diseño de interfaz y programación).

Nombres tal como aparecen en la tabla 1 del Avance 2. La tabla 7.1 del mismo documento usa otras grafías (Rubén Polanco, Alan Castro, Ezequiel Gonzalez, Jesús De Gracia); conviene unificarlas antes de entregar.
