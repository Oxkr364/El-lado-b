/* Datos editoriales del motor Plan B.
 * La redacción es deliberada: las opciones no son buenas/malas;
 * cada una abre una forma distinta de recordar y continuar la historia.
 */

export const PLAN_B_DECISIONS = [
  {
    id: 'Q1', chapter: 'capitulo-01', title: 'La primera mirada',
    summary: 'En el gimnasio de 1998, José descubre que mirar a Paz ya no se parece del todo a mirar a una amiga. Todavía no existe una historia entre ellos; existe apenas una posibilidad que él mismo puede negar.',
    question: 'Cuando José descubre que la está mirando de otra manera, ¿qué hace con esa sensación?',
    choices: [
      { id: 'A', text: 'La deja pasar. No quiere poner en riesgo la amistad.', state_delta: { jose: { interesRomantico: 1, tendenciaAlSilencio: 2 }, relacion: { cercania: 1 } }, bridge_fragment: 'José apartó la mirada antes de que pudiera convertirse en una pregunta. No sabía todavía qué significaba aquello y decidió no averiguarlo. A veces la amistad también se protege dejando algunas cosas sin nombre.', next_decision: { chapter: 'capitulo-02', passage: 'naranjo' } },
      { id: 'B', text: 'Se permite observar qué está sintiendo.', state_delta: { jose: { interesRomantico: 2, confianza: 1 }, relacion: { tension: 1, cercania: 1 } }, bridge_fragment: 'José no hizo nada visible. Solo se quedó un segundo más de lo necesario. Fue una decisión pequeña, casi invisible, pero desde ese día empezó a reconocer aquello que antes habría llamado simplemente curiosidad.', next_decision: { chapter: 'capitulo-02', passage: 'naranjo' } },
      { id: 'C', text: 'Busca una aproximación sutil.', state_delta: { jose: { interesRomantico: 2, iniciativa: 2 }, paz: { percepcionDelInteres: 1 }, relacion: { tension: 1, cercania: 2 } }, bridge_fragment: 'José encontró una excusa cualquiera para acercarse. No fue una declaración ni un gesto evidente. Fue apenas una pequeña modificación en la distancia entre ambos, suficiente para que Paz pudiera notar que algo había cambiado.', next_decision: { chapter: 'capitulo-02', passage: 'naranjo' } }
    ]
  },
  {
    id: 'Q2', chapter: 'capitulo-02', title: 'El naranjo',
    summary: 'En la fiesta, Paz pregunta quién es Nadia. José percibe por primera vez que los celos podrían existir también al otro lado del secreto.',
    question: 'Cuando Paz pregunta «¿Quién es ella?», ¿José aprovecha el momento o lo deja pasar?',
    choices: [
      { id: 'A', text: 'Lo deja pasar y cambia de tema.', state_delta: { jose: { tendenciaAlSilencio: 1 }, relacion: { tension: 1 } }, bridge_fragment: 'José sonrió como si la pregunta no tuviera importancia. Paz también sonrió, pero ninguno de los dos quedó completamente convencido. Algo había quedado suspendido entre las ramas del naranjo.', next_decision: { chapter: 'capitulo-03', passage: 'moneda' } },
      { id: 'B', text: 'Le pregunta por qué le interesa saberlo.', state_delta: { jose: { iniciativa: 1 }, paz: { percepcionDelInteres: 2, confianzaEnJose: 1 }, relacion: { comunicacion: 1, tension: 1 } }, bridge_fragment: '—¿Por qué te interesa? —preguntó José. Paz no respondió de inmediato. Bajó la mirada, como si recién entonces comprendiera que una pregunta también podía revelar algo de quien la hacía.', next_decision: { chapter: 'capitulo-03', passage: 'moneda' } },
      { id: 'C', text: 'Admite que a él también le habría molestado verla con otro.', state_delta: { jose: { iniciativa: 2, confianza: 1 }, paz: { percepcionDelInteres: 2, disponibilidadEmocional: 1 }, relacion: { cercania: 2, comunicacion: 2, tension: 1 } }, bridge_fragment: 'José no explicó demasiado. Solo dejó escapar una frase que podía ser tomada como broma o como algo más. Paz lo miró durante unos segundos. Esa noche el idioma secreto ganó una palabra nueva.', next_decision: { chapter: 'capitulo-03', passage: 'moneda' } }
    ]
  },
  {
    id: 'Q3', chapter: 'capitulo-03', title: 'La moneda y el sillón',
    summary: 'Después del cumpleaños de Paz, una invitación aparentemente sencilla cambia el límite entre amistad e intimidad.',
    question: 'Cuando Paz le pide que se quede, ¿José protege el límite que conocían o acepta que algo cambie?',
    choices: [
      { id: 'A', text: 'Se queda, pero intenta conservar el límite.', state_delta: { jose: { tendenciaAlSilencio: 1, temorAPerderPaz: 1 }, paz: { confianzaEnJose: 1 }, relacion: { cercania: 2, tension: 1 } }, bridge_fragment: 'José entendió que quedarse también podía significar no cruzar una frontera. Esa noche aprendieron que algunas decisiones no necesitan consumarse para cambiar una relación.', next_decision: { chapter: 'capitulo-04', passage: 'grieta' } },
      { id: 'B', text: 'Acepta que la relación está cambiando.', state_delta: { jose: { iniciativa: 2, confianza: 1 }, paz: { disponibilidadEmocional: 2, confianzaEnJose: 2 }, relacion: { cercania: 3, comunicacion: 1, clandestinidad: 1 } }, bridge_fragment: 'Después de aquella noche, ninguno pudo volver a fingir que todo seguía exactamente igual. Lo que ocurrió quedó entre ambos, sin necesidad de explicaciones, pero comenzó a ocupar un lugar nuevo en la memoria.', next_decision: { chapter: 'capitulo-04', passage: 'grieta' } }
    ]
  },
  {
    id: 'Q4', chapter: 'capitulo-04', title: 'La grieta de septiembre',
    summary: 'Paz cuenta que está conociendo a otro hombre. José descubre el costo de haber aceptado durante años la máscara de amigo.',
    question: 'Ahora que Paz está mirando hacia otra parte, ¿José rompe el silencio o protege la fachada que ambos construyeron?',
    choices: [
      { id: 'A', text: 'Guarda silencio.', state_delta: { jose: { tendenciaAlSilencio: 2, temorAPerderPaz: 2 }, relacion: { distancia: 2, tension: 2 } }, bridge_fragment: 'José sonrió y la felicitó. Después caminó junto al grupo como si nada hubiera ocurrido. Esa noche comprendió que el silencio también podía ser una forma de perder a alguien.', next_decision: { chapter: 'capitulo-04', passage: 'numero' } },
      { id: 'B', text: 'Busca hablar con Paz a solas.', state_delta: { jose: { iniciativa: 2, confianza: 1 }, paz: { confianzaEnJose: 1 }, relacion: { comunicacion: 2, tension: 2, distancia: 1 } }, bridge_fragment: 'Cuando quedaron solos, José dejó caer parte de la máscara. No dijo que tenía derecho sobre ella. Dijo solamente que le dolía imaginar que aquello que habían construido pudiera desaparecer sin siquiera una conversación.', next_decision: { chapter: 'capitulo-04', passage: 'numero' } },
      { id: 'C', text: 'Se distancia para protegerse.', state_delta: { jose: { temorAPerderPaz: 2, tendenciaAlSilencio: 1 }, relacion: { distancia: 3, tension: 1 }, memoria: { heridas: 1 } }, bridge_fragment: 'José decidió retroceder antes de que alguien tuviera que pedirle espacio. No era indiferencia. Era una forma torpe de proteger lo que todavía le dolía.', next_decision: { chapter: 'capitulo-04', passage: 'numero' } }
    ]
  },
  {
    id: 'Q5', chapter: 'capitulo-04', title: 'Los siete dígitos',
    summary: 'Paz le entrega a José el número de la red fija de su casa y le pide que no pierdan la comunicación.',
    question: '¿Qué significa para José ese pequeño papel?',
    choices: [
      { id: 'A', text: 'Un recuerdo que debe guardar.', state_delta: { memoria: { numeroSieteDigitos: true }, jose: { tendenciaAlSilencio: 1 }, relacion: { comunicacion: 1 } }, bridge_fragment: 'José dobló el papel y lo guardó en la billetera. No sabía si alguna vez llamaría. Pero conservarlo significaba reconocer que todavía había una puerta abierta.', next_decision: { chapter: 'capitulo-05', passage: 'asado' } },
      { id: 'B', text: 'Una puerta que puede usar.', state_delta: { memoria: { numeroSieteDigitos: true }, jose: { iniciativa: 2 }, relacion: { comunicacion: 3, cercania: 1 } }, bridge_fragment: 'José guardó los siete dígitos, pero no como quien guarda una reliquia. Los guardó como quien conserva una posibilidad. A partir de entonces, el teléfono dejó de ser solamente un aparato de la casa.', next_decision: { chapter: 'capitulo-05', passage: 'asado' } },
      { id: 'C', text: 'Una decisión que corresponde tomar a Paz.', state_delta: { memoria: { numeroSieteDigitos: true }, jose: { tendenciaAlSilencio: 2 }, relacion: { comunicacion: 1, distancia: 1 } }, bridge_fragment: 'José entendió que el número no era una invitación a perseguirla. Era una posibilidad que Paz había decidido dejar en sus manos. El siguiente movimiento no tenía por qué ser suyo.', next_decision: { chapter: 'capitulo-05', passage: 'asado' } }
    ]
  },
  {
    id: 'Q6', chapter: 'capitulo-05', title: 'La geometría del desvelo',
    summary: 'En el reencuentro del 2000, la distancia entre José y Paz está llena de recuerdos que los demás no pueden leer.',
    question: 'Cuando vuelven a encontrarse, ¿José continúa hablando en el idioma secreto o intenta decir algo más claro?',
    choices: [
      { id: 'A', text: 'Mantiene el código entre ambos.', state_delta: { memoria: { codigoSecreto: 2 }, relacion: { clandestinidad: 1, cercania: 1, comunicacion: 1 } }, bridge_fragment: 'No necesitaban explicarse frente a los demás. Una mirada bastaba. El idioma secreto sobrevivió porque todavía era el único territorio donde ambos podían encontrarse sin pedirle permiso al resto del mundo.', next_decision: { chapter: 'capitulo-06', passage: 'llamada' } },
      { id: 'B', text: 'Intenta decir algo más claro.', state_delta: { jose: { iniciativa: 2, confianza: 1 }, paz: { percepcionDelInteres: 2 }, relacion: { comunicacion: 2, tension: 1, cercania: 1 } }, bridge_fragment: 'José se arriesgó con una frase que ya no podía esconderse detrás del humor. Paz lo escuchó sin responder de inmediato. Pero esta vez el silencio no fue evasión: fue una respuesta que todavía estaba buscando palabras.', next_decision: { chapter: 'capitulo-06', passage: 'llamada' } }
    ]
  },
  {
    id: 'Q7', chapter: 'capitulo-06', title: 'La llamada de 2001',
    summary: 'José encuentra el papel, llama a la casa y ambos vuelven a encontrarse. La rutina parece regresar, pero ya no son los mismos.',
    question: '¿Qué busca realmente José al volver a llamar?',
    choices: [
      { id: 'A', text: 'Recuperar lo que tuvieron.', state_delta: { jose: { iniciativa: 2, temorAPerderPaz: 1 }, relacion: { cercania: 2, tension: 2, comunicacion: 2 } }, bridge_fragment: 'José llamó porque una parte de él quería recuperar algo que el tiempo no había conseguido borrar. Pero al verla entendió que recuperar no significaba volver atrás.', next_decision: { chapter: 'capitulo-06', passage: 'embarazo' } },
      { id: 'B', text: 'Entender qué fue realmente lo que pasó entre ellos.', state_delta: { jose: { confianza: 2 }, paz: { confianzaEnJose: 1 }, relacion: { comunicacion: 3, tension: 1, cercania: 1 } }, bridge_fragment: 'José no llamó para reconstruir el pasado. Llamó para comprenderlo. Quizás por eso pudieron sentarse a conversar sin exigirle a la memoria que se comportara como una segunda oportunidad.', next_decision: { chapter: 'capitulo-06', passage: 'embarazo' } },
      { id: 'C', text: 'Simplemente verla otra vez.', state_delta: { jose: { interesRomantico: 1 }, relacion: { cercania: 2, comunicacion: 1 }, memoria: { llamadas: 1 } }, bridge_fragment: 'José no tuvo una explicación elegante para la llamada. Solo quería verla. A veces una persona vuelve a buscar a otra antes de saber qué espera encontrar.', next_decision: { chapter: 'capitulo-06', passage: 'embarazo' } }
    ]
  },
  {
    id: 'Q8', chapter: 'capitulo-06', title: 'La pregunta difícil',
    summary: 'Paz plantea la posibilidad de un embarazo y pregunta qué haría José, incluso si el hijo no fuera suyo. La escena pone a prueba la madurez de ambos.',
    question: 'Frente a una pregunta que puede cambiarlo todo, ¿desde dónde responde José?',
    choices: [
      { id: 'A', text: 'Desde la responsabilidad.', state_delta: { jose: { confianza: 2, iniciativa: 1 }, relacion: { confianza: 2, cercania: 1 } }, bridge_fragment: 'José no respondió desde el orgullo. Respondió desde una idea más adulta: ser padre no depende solamente de engendrar. Hay vínculos que se sostienen porque alguien decide hacerse responsable.', next_decision: { chapter: 'capitulo-07', passage: 'casa' } },
      { id: 'B', text: 'Desde el miedo a perderla.', state_delta: { jose: { temorAPerderPaz: 3, tendenciaAlSilencio: 1 }, relacion: { tension: 2, distancia: 1 } }, bridge_fragment: 'Por un instante José pensó primero en perderla. Después comprendió que el miedo podía disfrazarse de amor y que no toda respuesta nacida del temor era una respuesta justa.', next_decision: { chapter: 'capitulo-07', passage: 'casa' } },
      { id: 'C', text: 'Desde la necesidad de saber la verdad.', state_delta: { jose: { confianza: 1, iniciativa: 1 }, paz: { confianzaEnJose: 1 }, relacion: { comunicacion: 2, tension: 1 } }, bridge_fragment: 'José quiso saber la verdad antes de imaginar el futuro. No era una respuesta cómoda, pero le permitió entender que algunas decisiones necesitan primero hechos y después sentimientos.', next_decision: { chapter: 'capitulo-07', passage: 'casa' } }
    ]
  },
  {
    id: 'Q9', chapter: 'capitulo-07', title: 'Cuando quiero que estés',
    summary: 'En la casa familiar, después de una herida pública y una conversación incómoda, Paz expresa la ausencia que más le duele: cuando necesita que José esté, él no está.',
    question: 'Cuando Paz dice «Cuando quiero que estés... no estás», ¿qué hace José?',
    choices: [
      { id: 'A', text: 'Habla y asume su responsabilidad.', state_delta: { jose: { iniciativa: 2, confianza: 1, tendenciaAlSilencio: -1 }, relacion: { comunicacion: 2, cercania: 1, distancia: -1 } }, bridge_fragment: 'José entendió que pedir perdón no podía consistir en explicar sus intenciones. Tenía que reconocer la ausencia. Por primera vez, hablar no significó defenderse, sino aceptar el lugar desde donde Paz había vivido la historia.', next_decision: { chapter: 'capitulo-08', passage: 'mostrador' } },
      { id: 'B', text: 'Guarda silencio y acepta la distancia.', state_delta: { jose: { tendenciaAlSilencio: 2, temorAPerderPaz: 1 }, relacion: { distancia: 3, comunicacion: -1 }, memoria: { heridas: 2 } }, bridge_fragment: 'José no encontró una respuesta que pudiera reparar lo ocurrido. Esta vez aceptó el silencio sin convertirlo en una promesa. Algunas historias no terminan con una pelea; terminan cuando dos personas dejan de insistir.', next_decision: { chapter: 'capitulo-08', passage: 'mostrador' } },
      { id: 'C', text: 'Intenta reparar sin prometer lo imposible.', state_delta: { jose: { iniciativa: 1, confianza: 2 }, paz: { confianzaEnJose: 1 }, relacion: { comunicacion: 1, distancia: -1 }, memoria: { heridas: -1 } }, bridge_fragment: 'José no prometió que nunca volvería a fallar. Prometió algo más pequeño: intentar estar cuando realmente importara. Paz no respondió con una reconciliación inmediata. Solo dejó de cerrar completamente la puerta.', next_decision: { chapter: 'capitulo-08', passage: 'mostrador' } }
    ]
  }
];

export const PLAN_B_CLOSURE = [
  {
    id: 'closure-mature-connection',
    label: 'Una historia que aprendió a recordar',
    when: state => state.relacion.comunicacion >= 5 && state.jose.confianza >= 3,
    literary_text: 'Con el tiempo, José comprendió que algunas historias no se miden por si terminaron juntas, sino por la forma en que transformaron a quienes las vivieron. Lo que construiste con tus decisiones no reemplaza lo ocurrido. Es otra posibilidad de esa misma memoria.'
  },
  {
    id: 'closure-open-door',
    label: 'Una puerta que nunca terminó de cerrarse',
    when: state => state.memoria.numeroSieteDigitos && state.relacion.cercania >= 5,
    literary_text: 'El número seguía siendo siete dígitos. Pero ahora significaba algo distinto: no una promesa, sino la evidencia de que hubo una puerta que alguna vez ambos decidieron dejar abierta.'
  },
  {
    id: 'closure-distance',
    label: 'Lo que quedó sin decir',
    when: state => state.relacion.distancia >= 5 || state.jose.tendenciaAlSilencio >= 6,
    literary_text: 'Algunas historias sobreviven precisamente porque no alcanzaron a decirlo todo. Esta es la versión que construiste alrededor de esos silencios.'
  }
];
