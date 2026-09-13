# Motor narrativo de Plan B

Este directorio contiene exclusivamente el motor de reconstrucción narrativa de **El Lado B**.

## Regla absoluta

**Nunca modifica `historia/`.**

`historia/` representa Lado A y permanece como canon inmutable. El motor toma el canon como entrada, aplica decisiones del lector y construye una trayectoria derivada.

## Flujo

```text
CANON
  ↓
RESUMEN DEL CAPÍTULO
  ↓
QUIEBRE
  ↓
PREGUNTA
  ↓
DECISIÓN DEL LECTOR
  ↓
DELTA DE ESTADO
  ↓
FRAGMENTO PUENTE
  ↓
ESTADO NARRATIVO
  ↓
SIGUIENTE CAPÍTULO
```

## Componentes

- `engine.js`: motor puro de estado y continuidad.
- `plan-b-data.js`: decisiones editoriales y consecuencias.
- `demo.html`: prueba local del flujo completo.

## Principios

1. Las decisiones deben tener consecuencias literarias.
2. Se guarda estado, no una copia completa de cada novela posible.
3. Diferentes combinaciones pueden converger en un mismo estado narrativo.
4. El motor no decide qué es moralmente correcto.
5. La redacción de continuidad pertenece a la capa editorial.
6. La interfaz no debe sentirse como una encuesta.
7. El Lado B recuerda las decisiones del lector.
8. La historia original nunca se reescribe.
