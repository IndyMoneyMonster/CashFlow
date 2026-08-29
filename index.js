require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================================================
// INDEX INDY
// AGENTE DE SOPORTE: LAURA
// PROYECTO: NUTRIVIDA
// ==========================================================

// ==========================================================
// INFORMACIÓN OFICIAL
// ==========================================================

const INFORMACION_OFICIAL = {
  marca: "Nutrivida",

  producto:
    "Mega Pack Digital de Alimentación para Personas con Diabetes",

  titulo:
    "¿No Sabes Qué Comer? Nosotros ya lo organizamos por ti.",

  precio: 99,

  moneda: "MXN",

  contenido:
    "Más de 700 recetas",

  pago:
    "Pago único",

  formato:
    "100% digital",

  acceso:
    "De por vida",

  formasPago: [
    "Transferencia",
    "OXXO"
  ],

  bonos: [
    "Meal Prep para Diabéticos",
    "Recetas Express",
    "Listado de Compras Saludables"
  ],

  bonoExtra:
    "Remedios Naturales para la Diabetes"
};

// ==========================================================
// 10 PALABRAS OFICIALES
// ==========================================================

const PALABRAS_OFICIALES = [
  "pago",
  "recibir",
  "acceso",
  "precio",
  "transferencia",
  "comprobante",
  "entrega",
  "bonos",
  "oxxo",
  "descarga"
];

// ==========================================================
// PROMPT DEL AGENTE
// ==========================================================

const SYSTEM_PROMPT = `
Eres Laura, agente de soporte de Nutrivida.

Atiendes por WhatsApp a personas interesadas en el
"Mega Pack Digital de Alimentación para Personas con Diabetes".

Tu función principal es resolver dudas de manera clara,
breve, cálida, natural y humana.

La persona normalmente ya viene de un flujo previo de ManyChat.

Por eso NO debes volver a presentar toda la oferta cada vez
que haga una pregunta.

Responde directamente la duda que tenga.

PERSONALIDAD:

- Tu nombre es Laura.
- Eres amable.
- Eres paciente.
- Eres cálida.
- Eres respetuosa.
- Hablas como una persona real por WhatsApp.
- No suenas robótica.
- No presionas.
- Ayudas a la persona a resolver su duda.

REGLAS DE ESTILO:

- Responde siempre en español.
- Utiliza mensajes breves.
- Utiliza párrafos cortos.
- Deja una línea en blanco entre ideas cuando sea necesario.
- Usa emojis con moderación.
- Evita bloques largos de texto.
- No repitas información innecesariamente.
- No saludes nuevamente si la conversación ya comenzó.
- No hagas preguntas innecesarias.
- Responde directamente la duda del usuario.
- No uses Markdown como encabezados con símbolos #.
- No inventes enlaces, promociones, cuentas ni información.
- No digas que eres una inteligencia artificial.
- No presiones a la persona para comprar.
- No inventes precios.
- No inventes bonos.
- No inventes datos bancarios.
- No inventes instrucciones de OXXO.
- No inventes condiciones de entrega.
- No repitas todo el discurso comercial.

Si una situación requiere información que todavía no está
configurada, responde únicamente con la información que sí
conoces y permite que el equipo continúe la atención manual.

INFORMACIÓN OFICIAL DEL PROYECTO:

Marca:
Nutrivida.

Producto:
Mega Pack Digital de Alimentación para Personas con Diabetes.

Título comercial:
"¿No Sabes Qué Comer? Nosotros ya lo organizamos por ti."

Precio:
$99 MXN.

Es un pago único.

No es una suscripción.

No tiene mensualidades.

El producto es 100% digital.

El acceso es de por vida.

Después de confirmar el pago se realiza la entrega del
material digital.

El Mega Pack contiene más de 700 recetas.

BONOS INCLUIDOS:

1. Meal Prep para Diabéticos.
2. Recetas Express.
3. Listado de Compras Saludables.

BONO EXTRA:

Remedios Naturales para la Diabetes.

Cuando corresponda a la promoción vigente, este Bono Extra
se entrega con la condición comunicada previamente dentro
del flujo.

FORMAS DE PAGO:

- Transferencia.
- OXXO.

Cuando una persona pregunte cómo puede pagar, informa
que existen estas dos opciones.

No inventes números de cuenta, CLABE, titulares, códigos,
referencias ni datos para OXXO.

COMPROBANTE:

Si la persona habla de su comprobante o indica que realizó
su pago, reconoce la situación de manera amable.

No vuelvas a intentar venderle el producto.

Si la información disponible no permite confirmar
automáticamente el pago, indica que su comprobante será
revisado para continuar con la entrega.

ENTREGA:

El producto es 100% digital.

No existe envío físico.

La entrega se realiza después de confirmar el pago.

RECIBIR:

El material se recibe de forma digital.

Después de confirmar el pago se proporciona el acceso
al Mega Pack.

ACCESO:

El acceso al material es de por vida.

DESCARGA:

El material es digital.

Si la persona tiene una dificultad específica con la
descarga y no tienes información suficiente para resolverla,
reconoce el problema y explica que se revisará para ayudarle.

No inventes enlaces de descarga.

SALUD:

El Mega Pack es material educativo relacionado con
alimentación.

No diagnostiques enfermedades.

No prometas curar la diabetes.

No prometas revertir la diabetes.

No indiques que la persona debe suspender medicamentos.

No modifiques tratamientos médicos.

Ante una consulta médica individual, recomienda consultar
con su médico o profesional de salud.

OBJETIVO:

Resolver las dudas de soporte de las personas que llegan
desde ManyChat y facilitar que continúen correctamente
dentro del proceso.

Las 10 palabras utilizadas durante esta primera etapa
de pruebas son:

pago
recibir
acceso
precio
transferencia
comprobante
entrega
bonos
OXXO
descarga
`;

// ==========================================================
// FUNCIONES GENERALES
// ==========================================================

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contienePalabra(texto, palabra) {
  const palabras = texto.split(/\s+/);

  return palabras.includes(
    normalizarTexto(palabra)
  );
}

function limpiarRespuesta(valor) {
  return String(valor ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ==========================================================
// RESPUESTAS DIRECTAS
// ==========================================================

function respuestaDirecta(textoNormalizado) {

  // --------------------------------------------------------
  // 1. PAGO
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "pago"
    )
  ) {
    return {
      intencion: "pago",

      respuesta: [
        "El Mega Pack tiene un pago único de $99 MXN 😊",
        "",
        "Puedes realizarlo por transferencia u OXXO."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 2. RECIBIR
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "recibir"
    )
  ) {
    return {
      intencion: "recibir",

      respuesta: [
        "El material es 100% digital 📲",
        "",
        "Después de confirmar tu pago recibirás el acceso al Mega Pack."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 3. ACCESO
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "acceso"
    )
  ) {
    return {
      intencion: "acceso",

      respuesta: [
        "Tu acceso al Mega Pack es de por vida 😊",
        "",
        "No hay mensualidades ni pagos recurrentes."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 4. PRECIO
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "precio"
    )
  ) {
    return {
      intencion: "precio",

      respuesta: [
        "El precio del Mega Pack Digital de Alimentación para Personas con Diabetes es de $99 MXN.",
        "",
        "Es un solo pago y tendrás acceso de por vida 😊"
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 5. TRANSFERENCIA
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "transferencia"
    )
  ) {
    return {
      intencion: "transferencia",

      respuesta: [
        "Sí 😊 Puedes realizar tu pago por transferencia.",
        "",
        "El pago del Mega Pack es de $99 MXN."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 6. COMPROBANTE
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "comprobante"
    )
  ) {
    return {
      intencion: "comprobante",

      respuesta: [
        "Gracias 😊 Si ya realizaste tu pago y enviaste tu comprobante, se revisará para continuar con la entrega de tu material digital.",
        "",
        "En cuanto sea confirmado podremos continuar con tu acceso."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 7. ENTREGA
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "entrega"
    )
  ) {
    return {
      intencion: "entrega",

      respuesta: [
        "La entrega es 100% digital 📲",
        "",
        "Después de confirmar tu pago recibirás el acceso al material."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 8. BONOS
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "bonos"
    )
  ) {
    return {
      intencion: "bonos",

      respuesta: [
        "Tu Mega Pack incluye estos 3 bonos 🎁",
        "",
        "1. Meal Prep para Diabéticos",
        "2. Recetas Express",
        "3. Listado de Compras Saludables"
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 9. OXXO
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "oxxo"
    )
  ) {
    return {
      intencion: "oxxo",

      respuesta: [
        "Sí 😊 También puedes realizar tu pago por OXXO.",
        "",
        "El pago del Mega Pack es de $99 MXN."
      ].join("\n")
    };
  }

  // --------------------------------------------------------
  // 10. DESCARGA
  // --------------------------------------------------------

  if (
    contienePalabra(
      textoNormalizado,
      "descarga"
    )
  ) {
    return {
      intencion: "descarga",

      respuesta: [
        "El Mega Pack se entrega de forma digital 📲",
        "",
        "Si estás teniendo algún problema con la descarga, indícanos qué sucede para poder ayudarte."
      ].join("\n")
    };
  }

  return null;
}

// ==========================================================
// RUTAS
// ==========================================================

app.get("/", (req, res) => {
  return res
    .status(200)
    .send("Laura - Soporte Nutrivida activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {

    const mensaje =
      req.body?.texto ??
      req.body?.mensaje ??
      req.body?.message ??
      "";

    const textoUsuario =
      String(mensaje).trim();

    console.log(
      "Mensaje recibido:",
      textoUsuario
        ? "[contenido recibido]"
        : "[vacío]"
    );

    if (!textoUsuario) {
      return res.json({
        respuesta: [
          "Estoy aquí para ayudarte 😊",
          "",
          "Escríbeme tu duda y con gusto la revisamos."
        ].join("\n")
      });
    }

    const textoNormalizado =
      normalizarTexto(textoUsuario);

    // ======================================================
    // RESPUESTA DIRECTA
    // ======================================================

    const directa =
      respuestaDirecta(
        textoNormalizado
      );

    if (directa) {

      const respuestaFinal =
        limpiarRespuesta(
          directa.respuesta
        );

      console.log(
        "Intención detectada:",
        directa.intencion
      );

      console.log(
        "Respuesta generada mediante base de conocimiento"
      );

      return res.json({
        respuesta: respuestaFinal
      });
    }

    // ======================================================
    // CONSULTA ABIERTA CON OPENAI
    // ======================================================

    console.log(
      "Intención detectada: consulta abierta"
    );

    const response =
      await openai.responses.create({

        model: "gpt-4.1-mini",

        temperature: 0.4,

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: SYSTEM_PROMPT
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: textoUsuario
              }
            ]
          }
        ]
      });

    const respuestaIA =
      response.output_text || "";

    const respuestaFinal =
      limpiarRespuesta(
        respuestaIA
      );

    console.log(
      "Respuesta generada mediante OpenAI"
    );

    return res.json({
      respuesta: respuestaFinal
    });

  } catch (error) {

    console.error(
      "Error en /mensaje:",
      error
    );

    return res
      .status(200)
      .json({
        respuesta: [
          "En este momento no pude procesar tu mensaje correctamente.",
          "",
          "Por favor, inténtalo nuevamente en unos minutos 😊"
        ].join("\n")
      });
  }
});

// ==========================================================
// INICIAR SERVIDOR
// ==========================================================

app.listen(PORT, () => {
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
