# GeoIstmo · Funcionalidades pendientes para los avances siguientes

En la aplicación, estas opciones aparecen en el menú en gris, con la marca **A4** y sin enlace, para no simular funciones que todavía no existen.

## Avance 4 · 11 de noviembre · beta completa y pruebas (calendario)

### Estudiante
| Funcionalidad | Referencia del Avance 2 | Notas |
|---|---|---|
| **Mapa interactivo** de Panamá con fichas de provincia y modos que se abren con los temas (RF-06) | 05-01 a 05-10, ficha 4 | Requiere un mapa político de fuente abierta y datos validados por el experto |
| Reto «¿Qué lugar es?» con foto y pistas (hasta +40 XP) | 05-06 a 05-08 | Las fotos ya están extraídas en `public/assets/img` |
| Paso «Apuesta y descubrimiento» de la lección (control 0–300, arriesgar 5/10/20 XP) | 04-05, 04-06 | Necesita los datos reales de densidad validados por el experto |
| «Reto» de práctica dentro del tema | 04-07 | |
| Pista (−5 XP) y cronómetro en los retos | 02-02 | |
| Reto de refuerzo automático de 5 preguntas si el resultado es < 60 % | 2.6 | Hoy se muestra un mensaje de repaso |
| Noticias del día, lectura, filtro por tema y dato curioso | 03-01 a 03-06 | |
| Debate sobre la noticia | 03-04, 03-05 | |
| **Aula**: tareas con entrega de archivo (PDF, Word o foto, máximo 10 MB) | 06-01 a 06-06 | Requiere almacenamiento de archivos |
| Liga semanal de la sección (opcional, la activa el docente) | 07-01, 07-02 | |
| Pasaporte del mapamundi (1 de 12 países) | 01-04, 05-01, 07-04 | |
| Avisos con destino y «Marcar todo leído» | 07-05 | |
| Tour de bienvenida de 3 pasos | 01-01 a 01-03 | |
| Responder el verdadero o falso deslizando la carta | 02-09 | Hoy: botones y teclas ← → |
| Ponderación de «Mis notas» (Tareas 40 %, Quices 30 %, Participación 30 %) y corrección de H1 | 07-03, 6.3 | Depende de tareas y debates |

### Docente
| Funcionalidad | Referencia |
|---|---|
| Publicar misiones y tareas en el Aula | 09-04, 09-07 |
| **Calificar** entregas con nota, comentario, descuentos y «Publicar todas las notas» | 09-05, 09-08 |
| Moderar debates (ocultar comentarios, menciones) | 09-06, 09-09, 09-10 |
| Avisos del docente | 09-12, 09-13 |

### Administrador
| Funcionalidad | Referencia |
|---|---|
| Escuelas | 10-02 |
| Editor de lecciones (bloques de texto e imágenes) y de parejas de «Relaciona conceptos» | 10-05 |
| Jerarquía completa grado → asignatura → unidad (extensión a otros grados) | 4.2 |
| Calendario escolar | 10-06 |
| Reportes | 10-07 |
| Configuración | 10-08 |
| Importar usuarios desde CSV, acciones masivas y aprobación de cuentas pendientes | 10-04 |
| Publicar avisos generales | 10-11, 10-12 |
| Recuperación de contraseña por correo (hoy la restablece el administrador) | 00-01 |

### Calidad (entregables del A4 según el calendario)
- Contenido completo de los módulos 3 a 7, revisado por el experto (R4, D2).
- Informe de pruebas técnicas (ampliar `tests/`).
- Prueba de usabilidad con 3 a 5 usuarios y cuestionario SUS (plan en el A2, 6.4).
- Auditoría de accesibilidad con WAVE y Lighthouse (RNF-05).
- Confirmar la escala de notas y los rangos (D3).

## Avance 5 · 25 de noviembre · validación e implementación
- Versión 1.0 e informe de validación.
- Manual de usuario por rol y manual técnico.
- Capacitación, acta de aceptación y plan de mantenimiento.
- Registro de autor y licencia de cada fotografía (A2, 2.8).
- Publicación en un servidor con HTTPS (`COOKIE_SECURE=true`).
