# EL LADO B — Arquitectura narrativa

## 1. Principio

El Lado A es el canon: la historia que ocurrió.

El Lado B es una reconstrucción narrativa de esa misma historia a partir de decisiones del lector.

No se generan finales aislados ni una novela completamente distinta desde cero. Se modifica solo aquello que una decisión vuelve causalmente diferente y, desde allí, se reescriben los pasajes afectados.

**Regla central:** la historia determina la decisión; la decisión modifica un pasaje; el pasaje modificado cambia el estado de los personajes; ese nuevo estado puede alterar capítulos posteriores.

## 2. Flujo

```text
CANON / LADO A
      ↓
PASAJE CRÍTICO
      ↓
PREGUNTA AL LECTOR
      ↓
DECISIÓN
      ↓
CONSECUENCIA NARRATIVA
      ↓
NUEVO ESTADO
      ↓
REESCRITURA DE LOS PASAJES AFECTADOS
      ↓
CONTINUIDAD DE LA HISTORIA
      ↓
NUEVO QUIEBRE
```

## 3. Qué permanece

La reescritura debe conservar, salvo que una decisión lo vuelva imposible:

- identidad y personalidad de los personajes;
- época y contexto histórico;
- lugares y objetos fundamentales;
- acontecimientos estructurales del canon;
- relaciones causales ya establecidas;
- tono literario de la obra;
- memoria acumulada de decisiones anteriores.

## 4. Qué puede cambiar

Una decisión puede modificar:

- una conversación;
- una mirada;
- una llamada;
- una omisión;
- una acción;
- una interpretación de un acontecimiento;
- una relación entre personajes;
- el significado posterior de un objeto;
- la presencia o ausencia de un acontecimiento secundario;
- el desenlace de una etapa de la relación.

## 5. Reescritura progresiva

El sistema no debe duplicar toda la novela para cada combinación.

Debe conservar el canon y aplicar modificaciones sobre pasajes determinados.

Conceptualmente:

```text
capítulo_canónico
    + estado_narrativo
    + decisiones_acumuladas
    + reglas_de_continuidad
    = capítulo_reescrito
```

La nueva versión de un capítulo debe seguir siendo reconocible como parte de **El Lado B**.

## 6. Estado narrativo

El sistema debe guardar estados, no miles de novelas.

Ejemplos de estado:

```json
{
  "jose": {
    "interes_romantico": 0,
    "confianza": 0,
    "temor_a_perder_paz": 0,
    "tendencia_al_silencio": 0
  },
  "paz": {
    "confianza_en_jose": 0,
    "percepcion_del_interes": 0,
    "disponibilidad_emocional": 0
  },
  "relacion": {
    "cercania": 0,
    "tension": 0,
    "comunicacion": 0
  }
}
```

Los valores anteriores son conceptuales. No deben fijarse definitivamente hasta diseñar las preguntas y sus consecuencias.

## 7. Preguntas

Las preguntas aparecen únicamente en quiebres narrativos naturales.

No deben sentirse como un cuestionario.

La pregunta debe surgir de la escena y plantear un dilema emocional o moral, no una respuesta correcta.

Ejemplos de tipo de pregunta:

- ¿Lo deja pasar o intenta acercarse?
- ¿Protege la amistad o arriesga lo que existe?
- ¿Dice lo que piensa o guarda silencio?
- ¿Llama o espera?
- ¿Está dispuesto a perder algo para ganar otra cosa?

Las preguntas definitivas se definirán después de revisar la matriz completa de los siete capítulos base.

## 8. Fragmento puente

Cada decisión importante debe producir un fragmento literario que conecte la decisión con la continuidad de la historia.

El fragmento debe contener tres capas:

1. continuidad con el canon;
2. consecuencia de la decisión;
3. semilla para una consecuencia futura.

No debe parecer una pantalla de sistema ni una explicación de IA.

## 9. Reescritura de capítulos

Cuando una decisión tenga consecuencias posteriores, el sistema debe reconstruir únicamente los capítulos afectados.

Ejemplo:

```text
Capítulo I
  decisión → modifica pasaje

Capítulo II
  consecuencia → reescritura parcial

Capítulo III
  consecuencia menor → canon conservado

Capítulo IV
  nueva consecuencia → reescritura parcial
```

Esto permite que una pequeña decisión pueda terminar creando otra historia sin convertir cada elección en una bifurcación gigantesca.

## 10. Estados de convergencia

Diferentes combinaciones de decisiones pueden terminar produciendo el mismo estado narrativo.

Por ejemplo:

```text
Q1-A + Q2-B
Q1-B + Q2-A
       ↓
ESTADO: "distancia emocional con interés no declarado"
```

Esto evita una explosión de ramas y permite mantener un número controlado de trayectorias narrativas.

## 11. Lado A / Lado B

**Lado A:** lo ocurrido.

**Lado B:** lo que pudo haber ocurrido bajo otras decisiones.

El Lado B nunca debe borrar ni modificar el canon original.

La versión generada por el lector es una nueva trayectoria derivada del canon.

## 12. Objetivo de la experiencia

El lector debe sentir que no está jugando un videojuego ni respondiendo una encuesta.

Debe sentir que está leyendo una historia que recuerda lo que decidió.

La interfaz puede ser tecnológica.

La experiencia debe seguir siendo literaria.

> **El Lado A cuenta lo que ocurrió. El Lado B reescribe lo que pudo haber ocurrido.**
