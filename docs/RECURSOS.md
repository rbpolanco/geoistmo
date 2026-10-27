# GeoIstmo · Recursos gráficos

## 1. Inventario del ZIP `svg de geoistmo` (173 archivos, 170 MB)

| Grupo | Cantidad | Tamaño | Qué contiene |
|---|---|---|---|
| Pantallas `NN-NN_Nombre 1.svg` | 99 | 1440 × 900 | Maquetas completas del recorrido principal (secciones 00 a 10) |
| Copias `R-NN-NN_Nombre 1.svg` | 54 | 1440 × 900 | Las mismas pantallas «después de la misión» |
| Rótulos `Sección NN.svg` | 20 | ≈ 700–1300 × 55 | Títulos de las secciones de Figma, con el texto convertido en trazos |

Total: 153 pantallas + 20 rótulos, lo mismo que declara el Avance 2 (sección 3.1).

**Hallazgo importante:** los SVG son exportaciones de pantallas completas. No contienen íconos ni componentes sueltos: el texto está convertido en trazos y las ilustraciones van incrustadas como imágenes PNG o JPEG en base64. Por eso no se pueden usar como componentes de la interfaz. Lo que sí se aprovecha son las **imágenes incrustadas**, que se extrajeron sin pérdida.

## 2. Imágenes extraídas (14 únicas)

Los originales, **idénticos byte a byte**, están en `recursos/imagenes-originales/`, con su identificador (los primeros 10 caracteres de su MD5).

| Archivo en la app (`public/assets/img/`) | Original | Tamaño | Aparece en el prototipo | Uso en la alfa |
|---|---|---|---|---|
| `logo-oscuro.png` | `b5202dfbed.png` | 600 × 162 | Menú lateral (124 pantallas) | Logotipo del menú lateral |
| `panel-ingreso.png` | `f4390b65be.png` | 627 × 792 | Ingreso (00-01 a 00-10) | Panel izquierdo del ingreso y el registro |
| `mascota.png` | `41c6fef57b.png` | 560 × 452 | 02-14 | «¡Cuenta creada!» y estados vacíos del docente |
| `insignia-volcan-baru.png` | `0d106a07a8.png` | 1179 × 1334 | 02-12, 02-13 | Original conservado |
| `insignia-volcan-baru-400.png` | (copia reducida) | 354 × 400 | — | Insignia del día y álbum (copia optimizada) |
| `diagrama-esclusas.png` | `96a8c3bedf.png` | 980 × 250 | 02-09 (V o F) | Reto V o F del Canal y lección del Módulo 1 |
| `banner-celebracion.png` | `0a14c4ba6a.png` | 1040 × 300 | 02-14 | Pantalla de misión completa |
| `foto-canal-esclusas.jpg` | `9ebda30be0.jpeg` | 560 × 700 | Noticia del día (19 pantallas) | Insignia «Esclusas del Canal» |
| `foto-fortificacion.jpg` | `dc2ba9f0d8.jpeg` | 1100 × 374 | Reto del mapa (05-06) | Insignia «Fortificación colonial» |
| `foto-volcan-baru.jpg` | `4e08bb91d7.jpeg` | 900 × 675 | 02-13 | Insignia «Tierras altas» |
| `foto-casco-antiguo.jpg` | `e6530c2063.jpeg` | 515 × 388 | 10-05 | Lección 1.1 e insignia «Casco Antiguo» |
| `foto-isla.jpg` | `c42c8fe1c3.jpeg` | 739 × 415 | 10-05 | Insignia «Isla y playa» |
| `foto-cima.jpg` | `2047022557.jpeg` | 640 × 640 | 10-05 | Insignia «Cumbre panameña» |
| `foto-canal-aerea.jpg` | `8c8460839b.jpeg` | 2400 × 1600 → 1400 × 933 | 10-05 | Insignia «Canal desde el aire» (copia reducida de 776 KB a 263 KB) |

Solo se crearon **dos copias optimizadas** (la insignia y la foto aérea), conservando la proporción. Los demás archivos se usan tal cual.

## 3. Sustitutos creados (y por qué)

| Recurso | Motivo | Sustituto |
|---|---|---|
| Íconos del menú y de los botones | En los SVG están fusionados con la pantalla; no hay archivos de íconos | Íconos de línea propios en SVG en línea (`public/js/ui.js → icono()`), con el mismo estilo de trazo |
| Textura de curvas de nivel | Va incrustada en el fondo de las tarjetas oscuras | `topo.svg` y `topo-claro.svg`, generados a partir de curvas concéntricas |
| Escudos de las insignias 1 a 4 y 6 a 8 | El prototipo solo trae el escudo del Volcán Barú | Medallón con la fotografía del prototipo y el marco naranja del escudo |
| Ícono de la pestaña del navegador | No existe | `favicon.png`, recortado de la silueta del logotipo |
| Fuentes | El A2 nombra Lora, Karla y Brawler, pero no las incluye | Archivos WOFF2 oficiales de Google Fonts (licencia OFL), servidos localmente en `public/fonts/` |

## 4. Referencia del prototipo

`recursos/referencia-prototipo/` contiene una vista JPG de 640 px de las **99 pantallas principales**, generada a partir de los SVG. Sirve para comparar la alfa con el diseño sin abrir Figma. Los SVG originales (170 MB) no se duplican en el ZIP del proyecto; se conservan en el ZIP del equipo.

| Pantalla del prototipo | Ruta de la alfa |
|---|---|
| 00-01 a 00-03 · Ingreso | `/ingreso` |
| 00-04 a 00-06 · Crear cuenta | `/registro` |
| 00-07 / 00-08 · Ingreso docente | `/ingreso/docente` |
| 00-09 / 00-10 · Ingreso administrador | `/ingreso/admin` |
| 01-04 / 01-05 · Inicio | `/estudiante` |
| 02-01 a 02-12 · Retos de la misión | `/estudiante/mision` y `/estudiante/actividad/:id` |
| 02-13 · Insignia del día | `/estudiante/mision` (misión completa) |
| 04-01 / 04-02 · Módulos | `/estudiante/modulos` |
| 04-03 / 04-04 / 04-10 · Temas | `/estudiante/modulos/:id` |
| 04-05 a 04-08 · Tema en pasos | `/estudiante/temas/:id` (lecciones y autoevaluación) |
| 07-03 · Mis notas | `/estudiante/notas` |
| 07-04 · Perfil y álbum | `/estudiante/insignias` |
| 09-01 · Panel del docente | `/docente` |
| 09-02, 09-03, 09-11 · Módulos del docente | `/docente/modulos` |
| 09-05 · Calificar (solo consulta de resultados) | `/docente/resultados` |
| 10-01 · Resumen del administrador | `/admin` |
| 10-03 · Cursos y secciones | `/admin/secciones` |
| 10-04, 10-09, 10-10 · Usuarios | `/admin/usuarios` |
| 10-05 · Catálogo curricular | `/admin/catalogo` |
