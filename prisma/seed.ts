import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  ArticleStatus,
  ContributorRole,
  UserRole,
  type Prisma,
} from "../src/generated/prisma/client";
import { slugify } from "../src/lib/utils";
import type { TipNode } from "../src/lib/content/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const UPLOADS = path.join(process.cwd(), process.env.STORAGE_DIR ?? "storage/uploads");

// SEED_DEMO=false → solo secciones, admin y configuración (sin autores ni artículos de ejemplo).
const SEED_DEMO = process.env.SEED_DEMO !== "false";

const p = (text: string): TipNode => ({ type: "paragraph", content: [{ type: "text", text }] });

const rich = (parts: Array<{ t: string; b?: boolean; i?: boolean; u?: boolean; link?: string }>): TipNode => ({
  type: "paragraph",
  content: parts.map(({ t, b, i, u, link }) => ({
    type: "text",
    text: t,
    marks: [
      ...(b ? [{ type: "bold" as const }] : []),
      ...(i ? [{ type: "italic" as const }] : []),
      ...(u ? [{ type: "underline" as const }] : []),
      ...(link ? [{ type: "link" as const, attrs: { href: link } }] : []),
    ],
  })),
});

const h2 = (text: string): TipNode => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});

const bullet = (items: string[]): TipNode => ({
  type: "bulletList",
  content: items.map((it) => ({ type: "listItem", content: [p(it)] })),
});

const pullQuote = (text: string, author?: string): TipNode => ({
  type: "pullQuote",
  attrs: author ? { author } : {},
  content: [p(text)],
});

const image = (src: string, alt: string): TipNode => ({ type: "image", attrs: { src, alt }, content: [] });

const youtube = (src: string): TipNode => ({ type: "youtube", attrs: { src }, content: [] });

async function writeSvg(media: { slug: string; color: string }) {
  const key = `images/seed-cover-${media.slug}/original.svg`;
  const file = path.join(UPLOADS, key);
  const light = `${media.color}20`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${media.color}"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1100" cy="120" r="180" fill="${light}"/>
  <circle cx="180" cy="620" r="240" fill="${light}"/>
  <circle cx="640" cy="360" r="300" fill="#ffffff08"/>
</svg>`;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, svg, "utf8");
  return {
    key,
    url: `/media/${key}`,
  };
}

async function createCoverMedia(slug: string, label: string, color: string) {
  await db.media.deleteMany({ where: { filename: `${slug}.svg` } });
  const svg = await writeSvg({ slug, color });
  return db.media.create({
    data: {
      filename: `${slug}.svg`,
      url: svg.url,
      mimeType: "image/svg+xml",
      size: Buffer.byteLength(""),
      width: 1280,
      height: 720,
      variants: {},
      altText: `Ilustración de portada: ${label}`,
      credit: "KEY Studio",
    },
  });
}

async function main() {
  console.log("Seeding KEY magazine…");

  const sections = [
    { slug: "noticias", name: "Noticias", color: "#026DFD", sortOrder: 1, description: "Lo que está pasando en Key: campus, eventos, logros y proyectos." },
    { slug: "opinion", name: "Opinión", color: "#FF5A1F", sortOrder: 2, description: "Columnas, ensayos, debates y reflexiones de la comunidad." },
    { slug: "entrevistas", name: "Entrevistas a Staff", color: "#4F46E5", sortOrder: 3, description: "Charlas con profesores, directores y mentores de Key." },
    { slug: "ciencia-ingenieria", name: "Divulgación sobre Ciencia e Ingeniería", color: "#0D9488", sortOrder: 4, description: "Ciencia e ingeniería explicadas para todos." },
    { slug: "valores-key", name: "Valores Key", color: "#5E9400", sortOrder: 5, description: "Cultura, comunidad, liderazgo y experiencia estudiantil." },
  ];

  for (const s of sections) {
    await db.section.upsert({
      where: { slug: s.slug },
      update: { name: s.name, color: s.color, sortOrder: s.sortOrder, description: s.description, isActive: true },
      create: { slug: s.slug, name: s.name, color: s.color, sortOrder: s.sortOrder, description: s.description, isActive: true },
    });
  }
  console.log(`✓ ${sections.length} secciones`);

  const authors = !SEED_DEMO ? [] : [
    { name: "Valeria Menjívar", slug: "valeria-menjivar", role: "Editora jefa", program: "Ingeniería en Software", bio: "Editora jefa de KEY y estudiante de Ingeniería en Software. Le gusta el café, los sistemas distribuidos y contar historias de gente real." },
    { name: "Diego Alas", slug: "diego-alas", role: "Redactor de noticias", program: "Ingeniería en Sistemas", bio: "Cubre la actualidad del campus y las noticias de la comunidad Key." },
    { name: "Camila Rodríguez", slug: "camila-rodriguez", role: "Columnista", program: "Diseño UX", bio: "Escribe sobre tecnología, diseño y cultura digital." },
    { name: "Andrés García", slug: "andres-garcia", role: "Editor de ciencia", program: "Ingeniería en Software", bio: "Apasionado de la IA, la robótica y las matemáticas aplicadas." },
    { name: "María José Duarte", slug: "maria-jose-duarte", role: "Redactora de valores", program: "Psicología", bio: "Cuenta historias de comunidad, liderazgo y crecimiento personal." },
    { name: "José Manuel Reyes", slug: "jose-manuel-reyes", role: "Fotógrafo", program: "Ingeniería en Mecatrónica", bio: "Fotógrafo oficial de KEY. Cree que cada imagen cuenta una historia." },
    { name: "Sofía Lemus", slug: "sofia-lemus", role: "Editora de entrevistas", program: "Comunicaciones", bio: "Entrevista a profesores y mentores para descubrir qué hay detrás de su trabajo." },
    { name: "Kevin Amaya", slug: "kevin-amaya", role: "Editor técnico", program: "Ingeniería en Sistemas", bio: "Revisa que todo lo que publicamos sea técnicamente sólido." },
    { name: "Natalia Fuentes", slug: "natalia-fuentes", role: "Colaboradora", program: "Ingeniería en Software", bio: "Colabora con investigaciones y reportajes de ciencia." },
    { name: "Rafael Cáceres", slug: "rafael-caceres", role: "Diseñador editorial", program: "Diseño Gráfico", bio: "Diseña la identidad visual de cada edición." },
  ];

  for (const a of authors) {
    await db.author.upsert({
      where: { slug: a.slug },
      update: { name: a.name, role: a.role, program: a.program, bio: a.bio, isActive: true },
      create: { name: a.name, slug: a.slug, role: a.role, program: a.program, bio: a.bio, isActive: true },
    });
  }
  console.log(`✓ ${authors.length} autores`);

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const articles = !SEED_DEMO ? [] : [
    {
      slug: "primer-hackathon-ia-salud",
      title: "Key lanza su primer hackathon de IA aplicada a la salud",
      subtitle: "48 horas, 20 equipos y un mismo objetivo: ideas que salven vidas.",
      excerpt: "Estudiantes de todas las carreras formaron equipos para desarrollar soluciones de inteligencia artificial que respondan a retos reales del sistema de salud.",
      section: "noticias",
      featured: true,
      publishedAt: daysAgo(1),
      authors: [{ slug: "diego-alas", role: ContributorRole.author }, { slug: "valeria-menjivar", role: ContributorRole.editor }],
      tags: ["hackathon", "inteligencia artificial", "salud", "innovación"],
      content: [
        rich([{ t: "Este fin de semana, " }, { t: "Key Institute" }, { t: " reunió a más de 80 estudiantes en su primer hackathon enfocado en inteligencia artificial aplicada a la salud. Durante 48 horas consecutivas, los equipos desarrollaron prototipos para diagnosticar mejor, comunicar mejor y cuidar mejor." }]),
        h2("Una competencia, tres retos"),
        image("", "Estudiantes trabajando en el hackathon"),
        p("Los participantes eligieron entre tres desafíos: detección temprana de enfermedades a partir de imágenes, asistentes que mejoren la comunicación entre pacientes y personal médico, y modelos que predigan la demanda de recursos hospitalarios."),
        bullet(["Detección de retinopatía mediante visión por computadora.", "Chatbots de salud pública con respuestas verificadas.", "Predicción de ocupación hospitalaria con series de tiempo."]),
        pullQuote("La tecnología no sustituye a los médicos; les da una segunda opinión inmediata.", "Valeria Menjívar"),
        h2("El veredicto"),
        p("El jurado, integrado por docentes y profesionales del sector salud, premió tres proyectos con becas para continuar su desarrollo. La organización anunció que el hackathon será un evento semestral."),
      ],
    },
    {
      slug: "semana-ciencia-2026-fechas",
      title: "Semana de la Ciencia 2026: fechas, actividades y cómo participar",
      subtitle: "Charlas, talleres, demostraciones de robótica y un concurso de divulgación.",
      excerpt: "Del 16 al 20 de noviembre el campus se convertirá en un laboratorio abierto. Estas son las actividades imperdibles.",
      section: "noticias",
      publishedAt: daysAgo(3),
      authors: [{ slug: "andres-garcia", role: ContributorRole.author }],
      tags: ["ciencia", "eventos", "campus"],
      content: [
        p("La Semana de la Ciencia regresa en su tercera edición con un programa que mezcla academia, curiosidad y mucha experimentación. Todo es gratuito y abierto a la comunidad."),
        h2("Actividades destacadas"),
        bullet(["Lunes: inauguración y feria de proyectos estudiantiles.", "Martes: taller de robótica con Arduino para principiantes.", "Miércoles: panel sobre el futuro de la IA en El Salvador.", "Jueves: noche de observación astronómica.", "Viernes: final del concurso de divulgación científica."]),
        h2("Cómo inscribirse"),
        rich([{ t: "La inscripción se abre el 1 de octubre en la página del evento. Los cupos para talleres son limitados, así que " }, { t: "no dejes tu lugar para el final" }, { t: "." }]),
      ],
    },
    {
      slug: "oro-robotica-nacional",
      title: "Estudiantes de Key ganan medalla de oro en robótica nacional",
      subtitle: "El equipo SparkBots superó a 14 instituciones en la categoría de sumo.",
      excerpt: "Tras tres meses de iteraciones, el robot compacto del equipo venció en la gran final. Así se preparó el camino al podio.",
      section: "noticias",
      publishedAt: daysAgo(6),
      authors: [{ slug: "jose-manuel-reyes", role: ContributorRole.photographer }, { slug: "diego-alas", role: ContributorRole.author }],
      tags: ["robótica", "logros", "estudiantes"],
      content: [
        p("El club de robótica de Key Institute volvió a hacer historia. Su robot, apodado “Caguama” por su resistencia y sus movimientos precisos, se llevó la medalla de oro en la categoría sumo del torneo nacional."),
        h2("Diseño y método"),
        p("El equipo documentó cada iteración: más de 40 versiones del chasis, un sistema de detección de borde propio y un algoritmo de empuje que prioriza la estabilidad."),
        pullQuote("Perdimos muchas peleas de prueba. Eso nos enseñó más que las que ganamos.", "José Manuel Reyes"),
        h2("Qué sigue"),
        p("Con el triunfo, el equipo clasificó al campeonato centroamericano, donde competirá contra instituciones de toda la región."),
      ],
    },
    {
      slug: "tecnologia-no-reemplaza-al-docente",
      title: "La tecnología no reemplaza al docente: lo potencia",
      subtitle: "Reflexiones sobre la enseñanza en la era de la inteligencia artificial.",
      excerpt: "En lugar de temer a las nuevas herramientas, la educación debería reapropiarlas para hacer más humana la experiencia de aprender.",
      section: "opinion",
      publishedAt: daysAgo(2),
      authors: [{ slug: "camila-rodriguez", role: ContributorRole.author }],
      tags: ["educación", "inteligencia artificial", "docencia"],
      content: [
        p("Cada vez que aparece una herramienta poderosa, vuelve la misma pregunta: ¿esto reemplazará a los maestros? La respuesta corta es no. La respuesta larga es más interesante."),
        h2("Del miedo a la apropiación"),
        p("El docente que usa IA para personalizar lecturas, generar ejercicios o detectar temprano a un estudiante en dificultad no está delegando su trabajo: lo está multiplicando."),
        bullet(["Tareas repetitivas que la IA puede aligerar.", "Retroalimentación más rápida y consistente.", "Más tiempo para lo que sí es humano: acompañar, motivar, cuestionar."]),
        h2("Lo que no se puede automatizar"),
        rich([{ t: "Ningún modelo generará la confianza de un maestro que recuerda tu nombre, tus metas y tus miedos. Esa es la parte que " }, { t: "no se puede descargar" }, { t: ", y es justo la parte que importa." }]),
      ],
    },
    {
      slug: "listos-para-ia-responsable",
      title: "¿Estamos listos para una IA responsable?",
      subtitle: "Tres preguntas que deberíamos hacernos antes de adoptar otra herramienta.",
      excerpt: "La responsabilidad no es un ajuste técnico: es una conversación que la sociedad entera tiene que tener, y la juventud debería liderarla.",
      section: "opinion",
      publishedAt: daysAgo(5),
      authors: [{ slug: "kevin-amaya", role: ContributorRole.author }],
      tags: ["ética", "inteligencia artificial", "sociedad"],
      content: [
        p("Adoptamos la IA a una velocidad récord, pero ¿a qué velocidad estamos discutiendo sus límites? Antes de que una organización instale otra herramienta, debería poder responder tres preguntas."),
        bullet(["¿Quién responde cuando el sistema se equivoca?", "¿Qué datos estamos cediendo y a cambio de qué?", "¿Qué decisiones quedan reservadas a las personas?"]),
        h2("La alfabetización es el primer paso"),
        p("No se puede exigir uso responsable de algo que no se entiende. Por eso la divulgación no es un lujo: es un requisito de la ciudadanía digital."),
      ],
    },
    {
      slug: "menos-panico-mas-pensamiento-critico",
      title: "Menos pánico, más pensamiento crítico",
      subtitle: "Cómo distinguir un avance real de una exageración en el mundo de la IA.",
      excerpt: "Entre el hype y el apocalipsis hay un territorio más aburrido, y también mucho más útil: el análisis riguroso.",
      section: "opinion",
      publishedAt: daysAgo(8),
      authors: [{ slug: "andres-garcia", role: ContributorRole.author }, { slug: "camila-rodriguez", role: ContributorRole.collaborator }],
      tags: ["pensamiento crítico", "desinformación"],
      content: [
        p("Un titular grita que la IA “superó a los humanos”. Otro asegura que va a acabar con una profesión entera. La realidad, como casi siempre, está en el detalle."),
        h2("Preguntas que cortan el humo"),
        bullet(["¿Sobre qué datos se evaluó el resultado?", "¿El problema resuelto es el problema real?", "¿Quién financia el estudio o la campaña?"]),
        p("El pensamiento crítico no es escepticismo permanente: es curiosidad disciplinada. Esa es una habilidad que ningún sistema va a hacer por nosotros."),
      ],
    },
    {
      slug: "curiosidad-motor-del-aprendizaje",
      title: "«La curiosidad es el motor del aprendizaje» — Dra. Ana Sofía Rivas",
      subtitle: "Conversamos con la investigadora detrás del laboratorio de ciencias cognitivas.",
      excerpt: "En esta entrevista, la Dra. Rivas habla de cómo el error, la pregunta y la exploración moldean a los mejores estudiantes.",
      section: "entrevistas",
      featured: true,
      publishedAt: daysAgo(4),
      authors: [{ slug: "sofia-lemus", role: ContributorRole.author }],
      tags: ["entrevistas", "docencia", "investigación"],
      content: [
        rich([{ t: "La Dra. Ana Sofía Rivas" }, { t: " lleva diez años estudiando cómo aprendemos. Para esta edición nos abrió la puerta de su laboratorio y su forma de ver la enseñanza." }]),
        h2("Sobre el error como maestro"),
        p("PREGUNTA: ¿Qué debería hacer un estudiante que tiene miedo de equivocarse?"),
        pullQuote("Si no estás cometiendo errores, no estás aprendiendo. Los errores son el motor del aprendizaje.", "Dra. Ana Sofía Rivas"),
        p("RESPUESTA: Cambiar la meta. No se trata de no fallar, sino de fallar más rápido y más inteligente. Cada error bien analizado es una lección comprimida."),
        h2("Un consejo final"),
        p("Rodéense de preguntas, no de respuestas. Las personas que preguntan bien, aprenden siempre."),
      ],
    },
    {
      slug: "director-ingenieria-software",
      title: "Entrevista: «La ingeniería es el idioma de la era digital» — Ing. Mauricio Herrera",
      subtitle: "El director de Ingeniería en Software comparte su visión del futuro de la carrera.",
      excerpt: "Del perfil del egresado a las habilidades blandas, así ve el director la formación de la próxima generación de ingenieros.",
      section: "entrevistas",
      publishedAt: daysAgo(7),
      authors: [{ slug: "sofia-lemus", role: ContributorRole.author }],
      tags: ["entrevistas", "ingeniería", "carreras"],
      content: [
        p("PREGUNTA: ¿Qué habilidades son hoy irrenunciables para un ingeniero de software?"),
        p("RESPUESTA: Tres cosas: pensar en sistemas, escribir con claridad y saber trabajar en equipo. El código se aprende; comunicar soluciones es lo que te distingue."),
        h2("La carrera y sus caminos"),
        bullet(["Desarrollo de plataformas web y móviles.", "Ciencia de datos e inteligencia artificial.", "Seguridad informática y cloud."]),
        rich([{ t: "Quien domina los fundamentos, " }, { t: "cambia de tecnología sin miedo" }, { t: "." }]),
      ],
    },
    {
      slug: "mentora-club-robotica",
      title: "Conversación con la mentora del club de robótica",
      subtitle: "Detrás de las medallas hay un trabajo silencioso de mentoría.",
      excerpt: "La ingeniera Karla Bonilla cuenta cómo el club pasó de ser una idea a un equipo campeón.",
      section: "entrevistas",
      publishedAt: daysAgo(10),
      authors: [{ slug: "valeria-menjivar", role: ContributorRole.author }],
      tags: ["entrevistas", "robótica", "mentoría"],
      content: [
        p("PREGUNTA: ¿Cómo se arma un equipo ganador?"),
        p("RESPUESTA: Con paciencia y roles claros. Aquí cada quien tiene un superpoder: unos programan, otros diseñan, otros motivan. Mi trabajo es que todos se sientan dueños del proyecto."),
        pullQuote("La medalla es un efecto secundario. Lo que importa es lo que aprenden cuando nadie los aplaude.", "Ing. Karla Bonilla"),
        p("El club se reúne los viernes por la tarde y acepta estudiantes de cualquier carrera. No se necesita experiencia previa."),
      ],
    },
    {
      slug: "redes-neuronales-taza-cafe",
      title: "Redes neuronales explicadas con una taza de café",
      subtitle: "Si puedes hacer café, puedes entender una red neuronal.",
      excerpt: "Una metáfora cotidiana para uno de los conceptos más citados (y menos entendidos) de la IA.",
      section: "ciencia-ingenieria",
      publishedAt: daysAgo(1),
      authors: [{ slug: "andres-garcia", role: ContributorRole.author }, { slug: "natalia-fuentes", role: ContributorRole.author }],
      tags: ["inteligencia artificial", "redes neuronales", "divulgación"],
      content: [
        p("Hacer una buena taza de café implica ajustar varias perillas: temperatura, molienda, proporción. Pruebas, pruebas y más pruebas hasta que el sabor es el correcto. Una red neuronal hace algo muy parecido."),
        h2("Las perillas del aprendizaje"),
        image("", "Ilustración de una taza de café y circuitos"),
        bullet(["Entrada: los datos (los granos).", "Pesos: las perillas (temperatura, molienda).", "Error: la diferencia entre lo esperado y lo obtenido (el amargor)."]),
        p("El algoritmo ajusta las perillas una y otra vez hasta minimizar el error. Eso es entrenar. Cuando la red ya no falla con datos que nunca vio, decimos que generalizó."),
        pullQuote("Aprender es ajustar: la cafetera y la red neuronal comparten la misma receta.", "Andrés García"),
        h2("¿Y los datos?"),
        p("Sin buenos granos no hay buena taza. Sin buenos datos no hay buen modelo. El ingrediente sigue siendo lo más importante."),
      ],
    },
    {
      slug: "que-es-un-modelo-de-lenguaje",
      title: "Qué es un modelo de lenguaje y cómo aprende",
      subtitle: "La explicación más clara que vas a leer hoy sobre los LLM.",
      excerpt: "No son oráculos ni memorias infinitas: son sistemas de probabilidad a escala. Te lo contamos sin jerga.",
      section: "ciencia-ingenieria",
      publishedAt: daysAgo(6),
      authors: [{ slug: "kevin-amaya", role: ContributorRole.author }, { slug: "natalia-fuentes", role: ContributorRole.collaborator }],
      tags: ["inteligencia artificial", "modelos de lenguaje", "divulgación"],
      content: [
        p("Cuando lees un texto generado por un modelo de lenguaje, no estás viendo magia: estás viendo probabilidades gigantes. El modelo aprende a predecir la siguiente palabra, una y otra vez, hasta que ese simple truco se vuelve conversación."),
        youtube(""),
        h2("Del truco a la herramienta"),
        bullet(["Predice la siguiente palabra con base en el contexto.", "Entrena con enormes cantidades de texto público.", "Ajusta su comportamiento con instrucciones y ejemplos."]),
        h2("Lo que no es"),
        p("Un modelo no “sabe” en el sentido humano. Puede equivocarse con total seguridad y puede inventar citas. Por eso conviene tratarlo como a un colega muy elocuente pero no siempre confiable: verifica siempre."),
      ],
    },
    {
      slug: "robotica-laboratorio-vida-diaria",
      title: "Robótica: del laboratorio a la vida diaria",
      subtitle: "Así pasan los robots del mundo académico a ayudarnos en casa y en el trabajo.",
      excerpt: "Los robots ya no viven solo en fábricas. Revisamos cómo la robótica está aterrizando en la vida cotidiana.",
      section: "ciencia-ingenieria",
      publishedAt: daysAgo(9),
      authors: [{ slug: "jose-manuel-reyes", role: ContributorRole.author }],
      tags: ["robótica", "divulgación"],
      content: [
        p("Durante décadas, los robots fueron una curiosidad de laboratorio. Hoy los usamos para barrer, entregar paquetes, operar con más precisión y explorar lugares donde una persona no puede llegar."),
        h2("Tres tendencias que definen la era"),
        bullet(["Robots colaborativos que trabajan codo a codo con personas.", "Sensores y cámaras que les dan conciencia del entorno.", "Aprendizaje por imitación: se les enseña mostrando, no programando."]),
        p("La robótica ya no es una promesa lejana: es una disciplina que transforma empleos, industrias y hasta la forma en que nos cuidamos."),
      ],
    },
    {
      slug: "colaboracion-sobre-competencia",
      title: "Colaboración sobre competencia: la cultura Key",
      subtitle: "Lo que el consejo estudiantil aprendió organizando el primer festival de talentos.",
      excerpt: "Cuando los equipos dejan de competir por brillar y empiezan a colaborar para brillar juntos, pasa esto.",
      section: "valores-key",
      publishedAt: daysAgo(2),
      authors: [{ slug: "maria-jose-duarte", role: ContributorRole.author }],
      tags: ["comunidad", "liderazgo", "cultura"],
      content: [
        p("El festival de talentos de este año tuvo un ingrediente nuevo: presupuesto para que cada grupo pudiera ensayar con acompañamiento. El resultado no fue solo un mejor show; fue un campus más unido."),
        h2("Lo que cambió en el equipo"),
        bullet(["Roles claros y celebración de cada aporte.", "Reuniones semanales abiertas a ideas nuevas.", "Mentoría entre generaciones: los mayores guían a los nuevos."]),
        pullQuote("Cuando dejamos de compararnos, empezamos a sumar.", "María José Duarte"),
        h2("Una lección para el resto del año"),
        p("La colaboración no es un eslogan: es una decisión diaria de ceder crédito, compartir información y aplaudir primero el trabajo ajeno."),
      ],
    },
    {
      slug: "liderazgo-estudiantil-historias-consejo",
      title: "Liderazgo estudiantil: historias del consejo",
      subtitle: "Tres exrepresentantes cuentan qué aprendieron sirviendo a su comunidad.",
      excerpt: "Dirigir el consejo estudiantil no es un cargo, es un entrenamiento de vida. Tres voces lo confirman.",
      section: "valores-key",
      publishedAt: daysAgo(5),
      authors: [{ slug: "maria-jose-duarte", role: ContributorRole.author }, { slug: "valeria-menjivar", role: ContributorRole.collaborator }],
      tags: ["liderazgo", "comunidad"],
      content: [
        p("Le pedimos a tres exrepresentantes del consejo estudiantil que resumieran su gestión en una sola lección. Estas fueron sus respuestas."),
        bullet(["«Escuchar primero. Las mejores ideas llegaron en los pasillos, no en las reuniones.»", "«Los logros se construyen con gente que confía en ti, no con gente que te obedece.»", "«Aprende a perder con gracia: no todo lo que pides se aprueba a la primera.»"]),
        h2("El cargo es una escuela"),
        p("Quien sirve a su comunidad aprende a negociar, a comunicar, a pedir ayuda y a rendir cuentas. Ningún curso de liderazgo lo reemplaza."),
      ],
    },
    {
      slug: "primer-ano-estudiante-key",
      title: "El primer año de un estudiante Key: de la expectativa a la comunidad",
      subtitle: "Siete meses después de ingresar, cuatro estudiantes cuentan cómo cambió su idea de la universidad.",
      excerpt: "La adaptación no fue solo académica. Fue una historia de pertenencia, miedo y descubrimiento.",
      section: "valores-key",
      publishedAt: daysAgo(12),
      authors: [{ slug: "maria-jose-duarte", role: ContributorRole.author }, { slug: "jose-manuel-reyes", role: ContributorRole.photographer }],
      tags: ["estudiantes", "comunidad", "primer año"],
      content: [
        p("Entrar a la universidad es entrar a un país nuevo. Cuatro estudiantes de primer ingreso aceptaron contarnos cómo han navegado su primer año en Key."),
        h2("Los tres descubrimientos"),
        bullet(["El miedo a preguntar se disuelve cuando descubres que todos lo sentimos.", "La comunidad se construye en los rincones: clubes, pasillos y grupos de estudio.", "El fracaso académico de una semana no define la carrera: se remonta."]),
        pullQuote("Pensé que tenía que ser perfecto para pertenecer. Me equivoqué: pertenezco porque soy real.", "Estudiante de primer ingreso"),
        h2("Para quienes vienen atrás"),
        p("A los que empiezan el próximo año: busquen a una persona de confianza, únanse a algo pequeño y den permiso a su proceso. Es normal no saber aún."),
      ],
    },
    {
      slug: "notas-luego-publicado-programado",
      title: "La edición impresa llega en primavera",
      subtitle: "Preview de la próxima edición de la revista en papel.",
      excerpt: "Estamos preparando la edición impresa con lo mejor de los primeros seis meses. La fecha exacta de salida está por confirmarse.",
      section: "noticias",
      scheduledAt: daysAgo(-14),
      authors: [{ slug: "valeria-menjivar", role: ContributorRole.author }],
      tags: ["edición impresa", "revista"],
      content: [
        p("La edición impresa de la revista llegará con una selección de los artículos más leídos, nuevas fotografías y una sección especial dedicada a la comunidad."),
        h2("Cómo seguir el proceso"),
        p("Seguiremos publicando avances en esta sección de noticias. Este artículo se publicará automáticamente cuando llegue la fecha programada."),
      ],
    },
  ];

  const tagNames = new Set<string>();
  for (const a of articles) a.tags.forEach((t) => tagNames.add(t));
  const tagRows = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    const tag = await db.tag.upsert({ where: { slug }, update: { name }, create: { name, slug } });
    tagRows.push(tag);
  }
  const tagBySlug = new Map(tagRows.map((t) => [t.slug, t]));
  console.log(`✓ ${tagRows.length} etiquetas`);

  for (const a of articles) {
    const section = await db.section.findUnique({ where: { slug: a.section } });
    if (!section) continue;
    const cover = await createCoverMedia(a.slug, a.title.length > 26 ? a.title.slice(0, 26) + "…" : a.title, section.color ?? "#026DFD");

    const content = a.content.map((node) => {
      if (node.type === "image") return image(cover.url, String(node.attrs?.alt ?? a.title));
      if (node.type === "youtube") return youtube("https://www.youtube.com/embed/jNQXAC9IVRw");
      return node;
    }) as Prisma.InputJsonValue;

    const exists = await db.article.findUnique({ where: { slug: a.slug } });
    const data = {
      title: a.title,
      slug: a.slug,
      subtitle: a.subtitle,
      excerpt: a.excerpt,
      content,
      sectionId: section.id,
      heroMediaId: cover.id,
      imageCaption: `Ilustración: KEY Studio`,
      tags: { connect: a.tags.map((name) => ({ id: tagBySlug.get(slugify(name))!.id })) },
    };

    if (exists) {
      await db.article.update({
        where: { id: exists.id },
        data: {
          ...data,
          status: ArticleStatus.published,
          publishedAt: a.publishedAt ?? daysAgo(1),
          featured: a.featured ?? false,
          authors: { deleteMany: {} },
        },
      });
      await setContributors(exists.id, a.authors);
    } else {
      const article = await db.article.create({
        data: {
          ...data,
          status: a.scheduledAt ? ArticleStatus.scheduled : ArticleStatus.published,
          scheduledAt: a.scheduledAt ?? null,
          publishedAt: a.scheduledAt ? null : (a.publishedAt ?? daysAgo(1)),
          featured: a.featured ?? false,
        },
      });
      await setContributors(article.id, a.authors);
    }
  }
  console.log(`✓ ${articles.length} artículos`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@keyinstitute.edu.sv";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_PASSWORD no está definida en .env");
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { email: adminEmail },
    update: { name: "Administrador KEY", role: UserRole.superadmin, isActive: true },
    create: {
      name: "Administrador KEY",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: UserRole.superadmin,
      isActive: true,
    },
  });
  console.log("✓ usuario admin");

  const settings: Array<[string, unknown]> = [
    ["siteName", "KEY"],
    ["tagline", "The Spark Index"],
    ["instagram", "@keymagazine"],
    ["tiktok", "@keymagazine"],
    ["twitter", "@keymagazine"],
    ["description", "La revista estudiantil que enciende la curiosidad de la comunidad de Key Institute."],
  ];
  for (const [key, value] of settings) {
    await db.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never } });
  }
  console.log("✓ configuración");

  console.log("Seed completado.");
}

async function setContributors(
  articleId: string,
  contributors: Array<{ slug: string; role: ContributorRole }>
) {
  const authorRows = await db.author.findMany();
  const map = new Map(authorRows.map((a) => [a.slug, a]));
  let order = 0;
  for (const c of contributors) {
    const author = map.get(c.slug);
    if (!author) continue;
    await db.articleAuthor.create({ data: { articleId, authorId: author.id, role: c.role, sortOrder: order++ } });
  }
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
