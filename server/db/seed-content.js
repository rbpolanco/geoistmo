// Contenido educativo de la versión alfa. Geografía Humana, Económica y Política · 12.º · Panamá.
// IMPORTANTE: los textos y preguntas son una propuesta del equipo y están PENDIENTES de revisión
// por el experto en contenido (Avance 2: riesgo R4, decisión D2). No incluyen estadísticas oficiales.

const sel = (prompt, opciones, correcta, explicacion, imagen) => ({
  prompt,
  data: { opciones: opciones.map((t, i) => ({ id: 'abcd'[i], text: t })), ...(imagen ? { imagen } : {}) },
  answer: { id: 'abcd'[correcta] },
  explanation: explicacion,
});
const vf = (prompt, verdad, explicacion, imagen) => ({ prompt, data: imagen ? { imagen } : {}, answer: { value: verdad }, explanation: explicacion });
const rel = (prompt, pares, explicacion) => ({
  prompt,
  data: { terminos: pares.map((p, i) => ({ id: `t${i + 1}`, text: p[0] })), definiciones: pares.map((p, i) => ({ id: `d${i + 1}`, text: p[1] })) },
  answer: { map: Object.fromEntries(pares.map((_, i) => [`t${i + 1}`, `d${i + 1}`])) },
  explanation: explicacion,
});
const p = (x) => ({ t: 'p', x });
const ul = (...items) => ({ t: 'ul', items });
const dest = (x) => ({ t: 'destacado', x });
const img = (src, alt, pie) => ({ t: 'img', src, alt, pie });

export const MODULOS = [
  { n: 1, titulo: 'Introducción a la Geografía Humana, Económica y Política', corto: 'Introducción a la Geografía',
    desc: 'Qué estudia la Geografía y por qué importa para el desarrollo.',
    temas: [
      { titulo: 'Objeto de estudio y ramas', resumen: 'Qué estudia cada rama de la Geografía.', min: 6,
        lecciones: [
          { titulo: '¿Qué estudia la Geografía?', bloques: [
            p('La Geografía estudia la superficie terrestre y la relación entre las personas y el espacio donde viven. No solo describe lugares: se pregunta por qué las cosas están donde están y cómo cambian con el tiempo.'),
            p('Esta asignatura se centra en tres ramas que se complementan: la Geografía humana, la Geografía económica y la Geografía política.'),
            dest('Idea clave: la Geografía conecta personas, territorio y decisiones.'),
          ] },
          { titulo: 'Tres ramas, tres preguntas', bloques: [
            ul('Geografía humana: ¿dónde y cómo vive la población de un territorio?',
              'Geografía económica: ¿cómo se producen, distribuyen y consumen los bienes y servicios en el espacio?',
              'Geografía política: ¿cómo se organizan los territorios, los Estados, las fronteras y las divisiones político-administrativas?'),
            p('Ejemplo en Panamá: saber en qué zonas vive más gente es una pregunta de Geografía humana; el tránsito de buques por el Canal es un servicio que estudia la Geografía económica; y la división del país en provincias y comarcas pertenece a la Geografía política.'),
            img('/assets/img/foto-casco-antiguo.jpg', 'Vista aérea del Casco Antiguo de la ciudad de Panamá, con sus calles y edificios junto al mar.', 'Una ciudad reúne población, actividades económicas y organización política.'),
          ] },
        ],
        quiz: [
          sel('¿Qué rama estudia la organización del territorio, las fronteras y las divisiones político-administrativas?', ['Geografía política', 'Geografía económica', 'Climatología', 'Geología'], 0, 'La Geografía política analiza cómo se organizan y se gobiernan los territorios.'),
          vf('La Geografía económica estudia cómo se producen, distribuyen y consumen bienes y servicios en el espacio.', true, 'Así es: la Geografía económica relaciona las actividades productivas con el territorio.'),
          sel('¿Cuál de estas preguntas corresponde a la Geografía humana?', ['¿Dónde y cómo vive la población de un territorio?', '¿Qué minerales forman una roca?', '¿Cuántas capas tiene la atmósfera?', '¿Cómo se formó una montaña?'], 0, 'La Geografía humana se ocupa de la población y de cómo habita el espacio.'),
          vf('La Geografía humana estudia únicamente el relieve y el clima.', false, 'El relieve y el clima son parte de la Geografía física. La Geografía humana estudia a las personas y su relación con el espacio.'),
        ] },
      { titulo: 'Espacio, territorio, población y recursos', resumen: 'Los cuatro conceptos con los que se lee un país.', min: 7,
        lecciones: [
          { titulo: 'Cuatro conceptos básicos', bloques: [
            ul('Espacio geográfico: lugar construido por la sociedad en su relación con la naturaleza.',
              'Territorio: espacio que un grupo o un Estado organiza, usa y gobierna.',
              'Población: conjunto de personas que habitan un territorio.',
              'Recursos naturales: elementos de la naturaleza que la sociedad aprovecha, como el agua, los bosques o los minerales.'),
            dest('Estos cuatro conceptos aparecen en todos los módulos del curso.'),
          ] },
          { titulo: 'Panamá: un istmo entre dos océanos', bloques: [
            p('Panamá se encuentra en un istmo: una franja de tierra estrecha que une el norte y el sur del continente americano y separa el mar Caribe, que pertenece al océano Atlántico, del océano Pacífico.'),
            p('Esta posición explica la importancia del Canal de Panamá: permite que los buques crucen de un océano a otro sin rodear el continente.'),
            img('/assets/img/diagrama-esclusas.png', 'Diagrama del Canal de Panamá con las esclusas de Agua Clara y Cocolí y el lago Gatún entre el mar Caribe y el océano Pacífico.', 'Diagrama de las esclusas del Canal (recurso del diseño del Avance 2).'),
          ] },
        ],
        quiz: [
          sel('¿Cómo se llama el espacio que un grupo o un Estado organiza, usa y gobierna?', ['Territorio', 'Recurso', 'Clima', 'Relieve'], 0, 'Territorio es el espacio apropiado y organizado por un grupo humano o por un Estado.'),
          vf('Un recurso natural es un elemento de la naturaleza que la sociedad aprovecha.', true, 'El agua, los bosques y los minerales son ejemplos de recursos naturales.'),
          sel('¿Qué dos océanos conecta el Canal de Panamá?', ['Atlántico y Pacífico', 'Pacífico e Índico', 'Atlántico y Ártico', 'Índico y Ártico'], 0, 'El Canal conecta el océano Atlántico, por el mar Caribe, con el océano Pacífico.', '/assets/img/diagrama-esclusas.png'),
          vf('Panamá está en un istmo que une el norte y el sur del continente americano.', true, 'Esa posición de istmo es la base de su importancia geográfica.'),
        ] },
      { titulo: 'Importancia para el desarrollo', resumen: 'Para qué sirve conocer el territorio.', min: 6,
        lecciones: [
          { titulo: 'La Geografía y las decisiones', bloques: [
            p('Conocer el territorio ayuda a tomar mejores decisiones: dónde construir escuelas y hospitales, cómo cuidar el agua, qué hacer ante las inundaciones o cómo repartir mejor las oportunidades entre regiones.'),
            ul('Planificar el uso del territorio.', 'Entender las diferencias entre regiones.', 'Cuidar los recursos para las próximas generaciones.'),
            dest('Desarrollo sostenible: mejorar la vida de las personas hoy sin agotar los recursos de mañana.'),
          ] },
        ],
        quiz: [
          sel('¿Para qué sirve la Geografía en la planificación de un país?', ['Para decidir mejor cómo usar y cuidar el territorio', 'Para memorizar nombres sin utilidad', 'Para evitar que cambie la población', 'Para eliminar las fronteras'], 0, 'La información geográfica orienta decisiones sobre el uso del territorio y de sus recursos.'),
          vf('El desarrollo sostenible busca mejorar la vida actual sin agotar los recursos del futuro.', true, 'Esa es la idea central del desarrollo sostenible.'),
          sel('¿Cuál de estas decisiones se apoya en conocer cómo se distribuye la población?', ['Dónde ubicar una nueva escuela', 'Qué color tendrá la bandera', 'Cuántos días tiene el año', 'Cómo se llama un océano'], 0, 'Saber dónde vive la gente permite ubicar servicios públicos donde se necesitan.'),
          vf('Las diferencias entre regiones no tienen importancia para planificar.', false, 'Conocer esas diferencias es justamente lo que permite planificar mejor.'),
        ] },
    ] },
  { n: 2, titulo: 'Población panameña: características y dinámica', corto: 'Población panameña',
    desc: 'Tamaño, estructura, diversidad y cambios de la población.',
    temas: [
      { titulo: 'Tamaño, distribución y densidad', resumen: 'Cuántos somos, dónde vivimos y cuán concentrados estamos.', min: 6,
        lecciones: [
          { titulo: 'Tamaño y distribución', bloques: [
            p('El tamaño de la población es el número de habitantes de un territorio. Se conoce mediante los censos, que son recuentos oficiales y periódicos.'),
            p('La distribución muestra cómo se reparte la población en el territorio. En Panamá no es uniforme: tiende a concentrarse en zonas urbanas, en especial alrededor de la ciudad de Panamá, mientras que otras regiones, como Darién, están menos pobladas.'),
          ] },
          { titulo: 'La densidad de población', bloques: [
            p('La densidad de población indica cuántos habitantes hay, en promedio, por cada kilómetro cuadrado.'),
            dest('Densidad = número de habitantes ÷ superficie en km²'),
            p('Ejemplo ilustrativo (no es un dato real): un territorio de 200 km² con 10 000 habitantes tiene una densidad de 10 000 ÷ 200 = 50 habitantes por km².'),
          ] },
        ],
        quiz: [
          sel('¿Qué indica la densidad de población?', ['Los habitantes por kilómetro cuadrado', 'Los nacimientos por año', 'La edad promedio', 'La cantidad de provincias'], 0, 'La densidad relaciona el número de habitantes con la superficie del territorio.'),
          sel('Un territorio tiene 6 000 habitantes y 120 km². ¿Cuál es su densidad?', ['50 hab/km²', '5 hab/km²', '500 hab/km²', '720 hab/km²'], 0, '6 000 ÷ 120 = 50 habitantes por km².'),
          vf('Los censos son recuentos oficiales y periódicos de la población.', true, 'Los censos permiten conocer el tamaño y las características de la población.'),
          vf('En un país la población siempre está repartida de forma uniforme.', false, 'Normalmente se concentra más en unas zonas, como las ciudades, que en otras.'),
        ] },
      { titulo: 'Estructura por edad y sexo', resumen: 'Cómo se lee una pirámide poblacional.', min: 7,
        lecciones: [
          { titulo: 'La pirámide poblacional', bloques: [
            p('La estructura por edad y sexo muestra cuántos hombres y mujeres hay en cada grupo de edad. Se representa con una pirámide poblacional: los grupos de edad van en el eje vertical y la cantidad de personas en el horizontal, con los hombres a un lado y las mujeres al otro.'),
            ul('Una base ancha indica una población con muchas personas jóvenes.', 'Una base más estrecha indica menos nacimientos en los años recientes.', 'Una parte alta ancha indica más personas adultas mayores.'),
          ] },
        ],
        quiz: [
          sel('¿Qué gráfico muestra la población por edad y sexo?', ['La pirámide poblacional', 'El climograma', 'El mapa de relieve', 'La rosa de los vientos'], 0, 'La pirámide poblacional reúne edad y sexo en un solo gráfico.'),
          vf('En una pirámide poblacional, una base ancha indica muchas personas jóvenes.', true, 'La base representa a los grupos de menor edad.'),
          sel('En una pirámide poblacional, ¿qué va en el eje vertical?', ['Los grupos de edad', 'Los nombres de las provincias', 'Los años del censo', 'Los ríos del país'], 0, 'Los grupos de edad se ordenan de abajo hacia arriba.'),
          vf('Una pirámide poblacional solo muestra a los hombres.', false, 'Muestra hombres y mujeres, cada grupo a un lado del eje.'),
        ] },
      { titulo: 'Diversidad étnica y cultural', resumen: 'Pueblos y culturas que conforman la población.', min: 6,
        lecciones: [
          { titulo: 'Un país diverso', bloques: [
            p('La población panameña es diversa: reúne pueblos originarios, comunidades afrodescendientes, población mestiza y personas de otras procedencias. Esa mezcla se expresa en la lengua, la música, la gastronomía y las tradiciones.'),
            p('Los pueblos originarios tienen un lugar importante en el territorio, que incluye comarcas indígenas como Guna Yala, Emberá-Wounaan y Ngäbe-Buglé. [Por validar con el experto en contenido.]'),
          ] },
        ],
        quiz: [
          sel('¿Dónde se expresa la diversidad cultural de un país?', ['En la lengua, la música, la gastronomía y las tradiciones', 'Solo en el clima', 'Solo en los mapas', 'En ningún aspecto de la vida diaria'], 0, 'La cultura se manifiesta en muchas formas de la vida cotidiana.'),
          vf('La población panameña reúne pueblos originarios, afrodescendientes, mestizos y personas de otras procedencias.', true, 'Esa mezcla forma parte de la diversidad del país.'),
          sel('¿Cuál de estas es una comarca indígena de Panamá?', ['Guna Yala', 'Chiriquí', 'Herrera', 'Coclé'], 0, 'Guna Yala es una comarca indígena; las otras opciones son provincias.'),
          vf('Respetar la diversidad cultural forma parte de la convivencia en un país.', true, 'Reconocer y respetar las diferencias fortalece la convivencia.'),
        ] },
      { titulo: 'Natalidad, mortalidad y migraciones', resumen: 'Por qué cambia la población.', min: 7,
        lecciones: [
          { titulo: 'Cómo cambia la población', bloques: [
            ul('Natalidad: nacimientos en un año por cada mil habitantes.',
              'Mortalidad: muertes en un año por cada mil habitantes.',
              'Migración: movimiento de personas entre lugares. La emigración es salir de un lugar; la inmigración es llegar a él.'),
            p('La población crece cuando los nacimientos y las personas que llegan superan a las muertes y a las personas que se van.'),
            dest('Cambio de población = nacimientos − defunciones + inmigrantes − emigrantes'),
          ] },
        ],
        quiz: [
          sel('¿Qué mide la natalidad?', ['Nacimientos en un año por cada mil habitantes', 'Muertes en un año por cada mil habitantes', 'Personas que cambian de país', 'Habitantes por km²'], 0, 'La natalidad es la tasa de nacimientos.'),
          sel('¿Cómo se llama salir de un lugar para vivir en otro?', ['Emigración', 'Inmigración', 'Natalidad', 'Densidad'], 0, 'Emigrar es salir; inmigrar es llegar.'),
          vf('La mortalidad mide cuántas personas nacen cada año.', false, 'La mortalidad mide las muertes; los nacimientos los mide la natalidad.'),
          vf('La migración es el movimiento de personas entre lugares.', true, 'Puede ser dentro del país o hacia otros países.'),
        ] },
    ] },
  { n: 3, titulo: 'Organización política y administrativa', corto: 'Organización política', desc: 'Provincias, comarcas, distritos y gobierno local.',
    temas: [{ titulo: 'Provincias y comarcas', min: 6 }, { titulo: 'Distritos y corregimientos', min: 6 }, { titulo: 'Capitales y gobierno local', min: 6 }] },
  { n: 4, titulo: 'Recursos naturales y su distribución', corto: 'Recursos naturales', desc: 'Recursos hídricos, forestales, minerales y biodiversidad.',
    temas: [{ titulo: 'Recursos hídricos y forestales', min: 6 }, { titulo: 'Minerales, suelo y biodiversidad', min: 6 }, { titulo: 'Renovables y no renovables', min: 6 }] },
  { n: 5, titulo: 'Actividades económicas principales', corto: 'Actividades económicas', desc: 'Sectores económicos y servicios.',
    temas: [{ titulo: 'Sectores económicos', min: 6 }, { titulo: 'Agropecuaria, pesca, minería e industria', min: 6 }, { titulo: 'Servicios: Canal, logística y turismo', min: 6 }] },
  { n: 6, titulo: 'Problemas ambientales y desarrollo sostenible', corto: 'Problemas ambientales', desc: 'Deforestación, contaminación y medidas.',
    temas: [{ titulo: 'Deforestación y contaminación', min: 6 }, { titulo: 'Residuos y cambio climático', min: 6 }, { titulo: 'Medidas y desarrollo sostenible', min: 6 }] },
  { n: 7, titulo: 'Actividades y evaluación final', corto: 'Evaluación final', desc: 'Práctica integradora y evaluación final.',
    temas: [{ titulo: 'Práctica integradora', min: 8 }, { titulo: 'Banco de preguntas', min: 8 }, { titulo: 'Evaluación final', min: 10 }] },
];

// Retos de la misión del día (Avance 2, sección 3.2): relacionar → ubicar capitales → verdadero o falso.
export const MISION = [
  { slot: 1, kind: 'relacionar', titulo: 'Relaciona conceptos', instr: 'Une cada término con su definición.', xp: 10,
    preguntas: [
      rel('Une cada término con su definición.', [['Densidad', 'Habitantes por kilómetro cuadrado'], ['Natalidad', 'Nacimientos en un año por cada mil habitantes'], ['Migración', 'Movimiento de personas entre lugares'], ['Urbanización', 'Crecimiento de la población que vive en ciudades']], 'Estos cuatro conceptos describen cómo es y cómo cambia la población.'),
      rel('Une cada término con su definición.', [['Mortalidad', 'Muertes en un año por cada mil habitantes'], ['Censo', 'Recuento oficial de la población'], ['Pirámide poblacional', 'Gráfico de la población por edad y sexo'], ['Emigración', 'Salida de personas de un lugar para vivir en otro']], 'Con estos instrumentos y conceptos se estudia la dinámica de la población.'),
    ] },
  { slot: 2, kind: 'seleccion', titulo: 'Ubica la capital', instr: 'Elige la capital de la provincia.', xp: 10,
    preguntas: [
      sel('¿Cuál es la capital de la provincia de Chiriquí?', ['David', 'Santiago', 'Chitré', 'Las Tablas'], 0, 'David es la capital de Chiriquí, una de las ciudades más grandes del país.'),
      sel('¿Cuál es la capital de la provincia de Veraguas?', ['Penonomé', 'Santiago', 'Chitré', 'David'], 1, 'Santiago es la capital de Veraguas.'),
      sel('¿Cuál es la capital de la provincia de Herrera?', ['Las Tablas', 'Penonomé', 'Chitré', 'Santiago'], 2, 'Chitré es la capital de Herrera.'),
      sel('¿Cuál es la capital de la provincia de Los Santos?', ['Las Tablas', 'Chitré', 'David', 'Penonomé'], 0, 'Las Tablas es la capital de Los Santos.'),
      sel('¿Cuál es la capital de la provincia de Coclé?', ['Santiago', 'Chitré', 'Penonomé', 'Las Tablas'], 2, 'Penonomé es la capital de Coclé.'),
    ] },
  { slot: 3, kind: 'vf', titulo: 'Verdadero o falso', instr: 'Decide si cada afirmación es verdadera o falsa. Atajos: ← falso, → verdadero.', xp: 10,
    preguntas: [
      vf('El Canal de Panamá conecta el océano Atlántico con el Pacífico.', true, 'Las esclusas elevan los buques hasta el lago Gatún y luego los bajan al otro océano.', '/assets/img/diagrama-esclusas.png'),
      vf('Santiago es la capital de la provincia de Chiriquí.', false, 'La capital de Chiriquí es David; Santiago es la capital de Veraguas.'),
      vf('La densidad de población se calcula dividiendo los habitantes entre la superficie.', true, 'Se expresa en habitantes por kilómetro cuadrado.'),
      vf('La natalidad mide cuántas personas mueren en un año.', false, 'Eso lo mide la mortalidad; la natalidad mide los nacimientos.'),
      vf('Panamá está dividida en provincias y comarcas indígenas.', true, 'Esa es su división político-administrativa de mayor nivel.'),
      vf('Un recurso natural es un objeto fabricado en una fábrica.', false, 'Los recursos naturales provienen de la naturaleza, como el agua o los bosques.'),
    ] },
];

// Álbum de insignias (8 espacios). Solo la del Volcán Barú tiene escudo en el diseño; las demás usan
// fotografías del prototipo como medallón (sustituto documentado en docs/RECURSOS.md).
export const INSIGNIAS = [
  { pos: 1, nombre: 'Casco Antiguo', lugar: 'Ciudad de Panamá', imagen: '/assets/img/foto-casco-antiguo.jpg', escudo: 0 },
  { pos: 2, nombre: 'Esclusas del Canal', lugar: 'Canal de Panamá', imagen: '/assets/img/foto-canal-esclusas.jpg', escudo: 0 },
  { pos: 3, nombre: 'Fortificación colonial', lugar: 'Costa caribeña', imagen: '/assets/img/foto-fortificacion.jpg', escudo: 0 },
  { pos: 4, nombre: 'Isla y playa', lugar: 'Costa de Panamá', imagen: '/assets/img/foto-isla.jpg', escudo: 0 },
  { pos: 5, nombre: 'Volcán Barú', lugar: 'Chiriquí', imagen: '/assets/img/insignia-volcan-baru-400.png', escudo: 1 },
  { pos: 6, nombre: 'Cumbre panameña', lugar: 'Panamá', imagen: '/assets/img/foto-cima.jpg', escudo: 0 },
  { pos: 7, nombre: 'Canal desde el aire', lugar: 'Canal de Panamá', imagen: '/assets/img/foto-canal-aerea.jpg', escudo: 0 },
  { pos: 8, nombre: 'Tierras altas', lugar: 'Chiriquí', imagen: '/assets/img/foto-volcan-baru.jpg', escudo: 0 },
];
