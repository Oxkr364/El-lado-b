-- EL LADO B — Plan B branching V1
-- Estado aplicado al proyecto Supabase bqrwcmrpzvtjoebmqiji.
-- Paula se incorpora como trayectoria narrativa legítima, no como antagonista de Paz.

-- 1) Ruta inicial desde Q1
UPDATE public.plan_b_choices SET next_decision_id='Q2A', next_passage='naranjo_silencio' WHERE decision_id='Q1' AND choice_code='A';
UPDATE public.plan_b_choices SET next_decision_id='Q2B', next_passage='naranjo_curiosidad' WHERE decision_id='Q1' AND choice_code='B';
UPDATE public.plan_b_choices SET next_decision_id='Q2C', next_passage='naranjo_aproximacion' WHERE decision_id='Q1' AND choice_code='C';

-- 2) Nodos nuevos
INSERT INTO public.plan_b_decisions (id,chapter,title,summary,question,sort_order,next_chapter,next_passage) VALUES
('Q2A','capitulo-02','El naranjo — lo que no se dice','José decidió no hacer nada con lo que sintió en el gimnasio. En la fiesta, sin embargo, Paz pregunta quién es Nadia. El silencio que antes parecía prudencia empieza a tener un costo.','Cuando Paz pregunta por Nadia, ¿qué hace José con aquello que todavía no se atreve a decir?',10,'capitulo-02','naranjo_silencio'),
('Q2B','capitulo-02','El naranjo — mirar un poco más','José comenzó a observar su propia reacción antes de actuar. En la fiesta, la pregunta de Paz sobre Nadia abre una posibilidad: descubrir si los dos están leyendo la misma escena.','¿José convierte la curiosidad de Paz en una conversación o vuelve a esconderse detrás del humor?',11,'capitulo-02','naranjo_curiosidad'),
('Q2C','capitulo-02','El naranjo — una distancia nueva','José ya había modificado la distancia con Paz. En la fiesta, cualquier gesto puede confirmar lo que ambos empiezan a sospechar. Pero Paula también está cerca, con esa facilidad suya para leer el ánimo de los demás sin convertirlo en un drama.','Cuando la situación se vuelve incómoda, ¿dónde busca José la respuesta que necesita?',12,'capitulo-02','naranjo_aproximacion'),
('Q3PAZ','capitulo-03','La moneda y el sillón — el límite','Después del cumpleaños de Paz, la invitación a quedarse convierte una tensión acumulada en una situación concreta. José ya sabe que algo existe entre ellos. Ahora debe decidir qué hacer con ese conocimiento.','Cuando Paz le pide que se quede, ¿José protege el límite que conocían o acepta que algo cambie?',13,'capitulo-04','grieta'),
('Q3PAULA','capitulo-03','La comodidad que no parecía una pregunta','La fiesta dejó una escena distinta: José terminó buscando a Paula. Ella no lo interrogó; simplemente se quedó con él. Paula tiene una forma de estar presente que no exige explicaciones. José descubre que a su lado puede reír, hablar y bajar la guardia.','Si con Paula puede ser él mismo sin esfuerzo, ¿qué hace José con esa sensación?',14,'capitulo-04','grieta');

-- Las choices y los textos vinculantes se mantienen también en la tabla plan_b_choices.
-- La fuente editorial humana está documentada en plan-b/engine/branching-v1.md.
