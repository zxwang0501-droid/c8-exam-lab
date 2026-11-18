// Translations for the exam-style tables and the new Table-code parts (see cases-tables.js).
function patchTr(id, o) {
  const tr = TR[id];
  Object.entries(o.en || {}).forEach(([l, v]) => tr.en.parts[l] = {...(tr.en.parts[l] || {}), ...v});
  Object.entries(o.es || {}).forEach(([l, v]) => tr.es.parts[l] = {...(tr.es.parts[l] || {}), ...v});
  if (o.cols) tr.es.cols = o.cols;
}

patchTr('cs-bike', {
 en:{h:{e:"join matches each ride's start station (station) with stations to bring in its neighborhood; end_station is where the ride ended and is not needed. Then keep neighborhood and minutes and average by neighborhood."}},
 es:{h:{q:'Crea una tabla con una fila por barrio y la duración promedio (en minutos) de los viajes que EMPEZARON en ese barrio.', e:'join empareja la estación de inicio de cada viaje (station) con stations para traer su barrio; end_station es donde terminó y no hace falta. Luego se dejan neighborhood y minutes y se promedia por barrio.'}},
 cols:['rides.ride_id (int): número único del viaje','rides.station (str): estación donde empezó el viaje','rides.end_station (str): estación donde terminó el viaje','rides.member (bool): True si el usuario tiene membresía anual','rides.minutes (float): duración del viaje en minutos','rides.day (str): día de la semana abreviado','rides.temp_f (int): temperatura en °F al inicio del viaje','stations.station (str): nombre de la estación (cada una aparece una vez)','stations.neighborhood (str): barrio de la estación','stations.docks (int): número de anclajes','stations.elevation_ft (int): altitud de la estación en pies']});

patchTr('cs-dining', {
 en:{a:{e:'Six rows are shown and 1,089 are omitted, so there are 1,095 rows.'}, h:{e:'Filter to dinners, then to services with more than 30 kg left over (either order), then group by hall to count. Halls that never went over 30 kg do not appear in the result at all; they are not shown with 0.'}},
 es:{a:{e:'Se muestran 6 filas y se omiten 1,089, así que hay 1,095 filas.'}, h:{q:'Escribe una expresión para una tabla con una fila por comedor y el NÚMERO de cenas en ese comedor en las que sobraron más de 30 kg de comida.', e:'Se filtran las cenas y luego los servicios con más de 30 kg sobrantes (en cualquier orden), y se agrupa por comedor para contar. Los comedores que nunca pasaron de 30 kg no aparecen en el resultado; no se muestran con 0.'}},
 cols:['date (str): fecha del servicio, "AAAA-MM-DD"','hall (str): el comedor','meal (str): Breakfast, Lunch o Dinner','served (int): número de platos servidos','leftover_kg (float): kilogramos totales de comida sobrante en las bandejas','theme (str): tema del menú ese día','veg_only (bool): True si todo el menú era vegetariano']});

patchTr('cs-lottery', {
 en:{h:{e:"Comparing the year column with 'Senior' gives a boolean array whose average is the proportion; or filter with where and divide the row count by 600. Simulating this proportion many times under the null gives the distribution needed in part (f)."}},
 es:{d:{q:'entrants es la tabla de arriba; su columna id contiene np.arange(2400). Completa el código para simular UN sorteo y contar cuántos de los cuatro amigos (ids 0–3) ganan.'},
  h:{q:'winners = entrants.sample(600, with_replacement=False). Escribe una expresión para la PROPORCIÓN de estos ganadores que están en último año (Senior).', e:"Comparar la columna year con 'Senior' da un array booleano cuyo promedio es la proporción; o se filtra con where y se divide el número de filas entre 600. Simular esta proporción muchas veces bajo la nula da la distribución que necesita la parte (f)."}},
 cols:['id (int): número de participación de 0 a 2399 (Maya y sus amigos son los ids 0–3)','name (str): nombre del participante','year (str): año de estudios','major (str): carrera declarada o prevista','housing (str): Dorm, Apartment o Co-op','first_concert (bool): True si sería su primer concierto en el campus']});

patchTr('cs-library', {
 en:{h:{e:'group sorts its result by category name (Books, Chargers, Laptops, Room keys), so observed is in that order. Array arithmetic pairs elements by position, so model must use the same order or |observed − model| would subtract different categories.'},
  i:{e:'Two where calls filter the category and the branch; then take the fine column and average it.'}},
 es:{h:{q:'En el código de arriba, model pone las proporciones en el orden Books, Chargers, Laptops, Room keys, no en el orden en que las dio la biblioteca. ¿Por qué?', c:['group ordena las categorías alfabéticamente, así que observed está en orden alfabético y model debe coincidir elemento por elemento.','La TVD exige ordenar las proporciones de mayor a menor.','make_array ordena sus argumentos automáticamente.','El orden no importa en ningún cálculo con arrays.'], e:'group ordena el resultado por nombre de categoría (Books, Chargers, Laptops, Room keys), así que observed queda en ese orden. La aritmética de arrays empareja por posición, así que model debe usar el mismo orden o |observed − model| restaría categorías distintas.'},
  i:{q:'Escribe una expresión para la multa promedio de las devoluciones tardías de LAPTOPS en la sede Moffitt.', e:'Dos where filtran la categoría y la sede; luego se toma la columna fine y se promedia.'}},
 cols:['return_id (int): ID de la devolución tardía','category (str): Books, Chargers, Laptops o Room keys','branch (str): sede de la biblioteca','days_late (int): días de retraso','fine (float): multa cobrada en dólares']});

patchTr('cs-sleep', {
 en:{h:{e:'Subtracting two column arrays works element by element and gives an array as long as the table, which can be a new column. The direction is after − baseline, so positive means more sleep.'},
  i:{e:'Keep only group and change (string columns like year cannot be averaged), then average by group. The result is alphabetical with App first, so item(0) − item(1) = App − Control = 8.5.'}},
 es:{h:{q:'Supón que la tabla no tuviera la columna change. Completa el espacio para crearla a partir de las otras columnas.', e:'Restar dos arrays de columnas funciona elemento a elemento y da un array del largo de la tabla, que puede ser una columna nueva. La dirección es after − baseline: positivo significa más sueño.'},
  i:{q:'Calcula el estadístico de prueba OBSERVADO (cambio medio de App menos cambio medio de Control) directamente con la tabla.', e:'Se dejan solo group y change (las columnas de texto como year no se pueden promediar) y se promedia por grupo. El resultado está en orden alfabético con App primero, así que item(0) − item(1) = App − Control = 8.5.'}},
 cols:['id (int): ID del voluntario',"group (str): 'App' o 'Control'",'year (str): año de estudios','caffeine (bool): True si suele tomar cafeína después de las 6 pm','baseline_min (float): sueño promedio por noche antes del estudio, en minutos','after_min (float): sueño promedio por noche en la semana 4, en minutos','change (float): after_min − baseline_min']});

patchTr('cs-rent', {
 en:{h:{e:'The number of people is roommates plus the student, so divide by Roommates + 1. Do not forget the parentheses.'},
  i:{e:'Resample the whole table with replacement first, then keep the students within 1 mile in that resample and take the median per-person rent. Repeating this many times gives a bootstrap distribution for that subgroup median.'}},
 es:{h:{q:"El alquiler se reparte por igual entre el estudiante y sus compañeros de cuarto. Agrega una columna 'Per person' con la parte de cada estudiante.", e:'El número de personas es compañeros + el estudiante, así que se divide entre Roommates + 1. No olvides los paréntesis.'},
  i:{q:"Completa el código para UN estadístico bootstrap: la mediana del alquiler 'Per person' entre los estudiantes del remuestreo que viven a menos de 1 milla del campus.", e:'Primero se remuestrea toda la tabla con reemplazo; luego, en ese remuestreo, se dejan los que viven a menos de 1 milla y se toma la mediana del alquiler por persona. Repetirlo muchas veces da la distribución bootstrap de esa mediana del subgrupo.'}},
 cols:['Rent (int): alquiler mensual total de la vivienda, en dólares','Bedrooms (int): número de habitaciones','Roommates (int): compañeros que comparten el alquiler (sin contar al estudiante)','Miles (float): distancia al campus en millas','Area (str): barrio','Furnished (bool): True si está amueblada']});

patchTr('cs-boba', {
 en:{h:{e:'The average of a boolean array is a proportion. By Chebyshev in part (b), at most 25% of orders are outside 2–14 minutes, so this proportion cannot exceed 25%.'},
  i:{e:'Averages by group only show a difference (association). Ordering by phone was not randomly assigned and may go with more toppings or busier hours (confounders), so it is not a causal conclusion.'}},
 es:{h:{q:'Escribe una expresión para la proporción de todos los pedidos que esperaron MÁS de 14 minutos.', e:'El promedio de un array booleano es una proporción. Por Chebyshev en la parte (b), como máximo el 25% de los pedidos queda fuera de 2–14 minutos, así que esta proporción no puede pasar del 25%.'},
  i:{q:"orders.select('mobile', 'wait_min').group('mobile', np.mean) muestra 6.9 para False y 9.6 para True. ¿Qué conclusión está justificada?", c:['En estos datos los pedidos por app esperaron más en promedio, pero eso no muestra que pedir por teléfono cause esperas más largas (podrían llevar más toppings o hacerse en horas más ocupadas).','Pedir por teléfono causa una espera 2.7 minutos más larga.','La DE de los tiempos de espera es 2.7 minutos.','Los pedidos por app son una muestra aleatoria de todos los pedidos.'], e:'Los promedios por grupo solo muestran una diferencia (asociación). Pedir por app no se asignó al azar y puede ir con más toppings u horas más ocupadas (factores de confusión), así que no es una conclusión causal.'}},
 cols:['order_id (int): número de pedido','drink (str): nombre de la bebida','size (str): M o L','toppings (int): número de toppings','wait_min (float): tiempo de espera en minutos','hour (int): hora del pedido (0–23)','mobile (bool): True si se pidió por la app del teléfono']});

patchTr('cs-study', {
 en:{i:{e:'Residual = observed − predicted = score − (1.8 × hours + 52). Array arithmetic does this for every row at once.'}},
 es:{i:{q:"Agrega una columna 'residual' con el residuo de cada estudiante, usando la recta de regresión de las partes (a) y (b).", e:'Residuo = observado − predicho = score − (1.8 × hours + 52). La aritmética de arrays lo hace para todas las filas a la vez.'}},
 cols:['student (str): nombre','section (int): sección de discusión','hours (float): horas promedio de estudio por semana','score (float): nota del examen final en porcentaje','first_gen (bool): True si es estudiante de primera generación','prior_gpa (float): promedio (GPA) antes del curso']});

patchTr('cs-plants', {
 en:{h:{e:'join brings in the sun level of each plant\'s bed; blight is 0/1, so the average within each sun group is the proportion with blight.'},
  i:{e:'False. These are observational data; beds were not randomly assigned to sun levels, and Partial-sun beds may also differ in soil pH and watering (confounders).'}},
 es:{h:{q:"Crea una tabla con una fila por nivel de sol ('Full' o 'Partial') y la PROPORCIÓN de plantas con tizón.", e:'join trae el nivel de sol del cantero de cada planta; blight es 0/1, así que el promedio dentro de cada grupo de sol es la proporción con tizón.'},
  i:{q:'Verdadero o falso: Si el tizón es más común en los canteros con sol parcial, esto muestra que el sol parcial causa tizón.', e:'Falso. Son datos observacionales; los canteros no recibieron el nivel de sol al azar, y los de sol parcial también pueden diferir en pH del suelo y riego (factores de confusión).'}},
 cols:['plants.plant_id (str): etiqueta de la planta','plants.bed (str): cantero','plants.leaf_spots (int): manchas oscuras en la hoja más baja, de 0 a 10','plants.yellow_pct (float): porcentaje del área de la hoja que está amarilla, de 0 a 100','plants.height_cm (float): altura de la planta en cm','plants.blight (int): 1 si la planta tenía tizón, 0 si no','beds.bed (str): etiqueta del cantero (cada uno aparece una vez)','beds.sun (str): sol Full (pleno) o Partial (parcial)','beds.soil_ph (float): pH del suelo','beds.watering (str): Drip (goteo) o Hose (manguera)']});

patchTr('cs-market', {
 en:{h:{e:'First divide the two columns to get revenue per customer for each stall-week, keep rain and per, then average by rain.'},
  i:{e:'Two where calls filter organic and category, in either order; num_rows (no parentheses) counts the rows.'}},
 es:{h:{q:'Crea una tabla con dos filas (rain True y False) y el ingreso promedio POR CLIENTE en todas las combinaciones puesto-semana.', e:'Primero se dividen las dos columnas para obtener el ingreso por cliente de cada puesto y semana, se dejan rain y per, y se promedia por rain.'},
  i:{q:'Escribe una expresión para el número de vendedores ORGÁNICOS de la categoría Produce.', e:'Dos where filtran orgánico y categoría, en cualquier orden; num_rows (sin paréntesis) cuenta las filas.'}},
 cols:['vendors.name (str): nombre del vendedor','vendors.category (str): Produce, Bakery o Flowers','vendors.stall (int): número de puesto (un vendedor por puesto)','vendors.organic (bool): True si tiene certificación orgánica','vendors.years (int): años vendiendo en este mercado','sales.stall (int): número de puesto','sales.week (int): número de semana, 1–12','sales.revenue (float): ingreso de esa semana, en dólares','sales.customers (int): número de clientes esa semana','sales.rain (bool): True si llovió ese sábado']});

patchTr('cs-ride', {
 en:{g:{e:'pivot(becomes columns, becomes rows, values, collect): the surge values become columns, each city gets a row, and each cell is the average fare.'}},
 es:{g:{q:'Usando train, crea una tabla con una fila por ciudad de recogida, una columna por cada valor de surge (0 y 1) y la tarifa PROMEDIO en cada celda.', e:'pivot(lo que pasa a columnas, lo que pasa a filas, values, collect): los valores de surge pasan a columnas, cada ciudad es una fila y cada celda es la tarifa promedio.'}},
 cols:['trip_id (str): ID del viaje','pickup (str): ciudad donde empezó el viaje','hour (int): hora de recogida (0–23)','miles (float): distancia del viaje','minutes (float): duración del viaje','surge (int): 1 si había tarifa dinámica, 0 si no','fare (float): tarifa en dólares']});

patchTr('cs-survey', {
 en:{g:{e:'Filter to students with Attended True, compare their Rating with 4, and average the boolean array to get the proportion.'},
  h:{e:'The 100 students were randomly sampled (so results generalize to the class), but attending discussion was each student\'s choice, not randomly assigned. So this is an association, and confounding is possible.'}},
 es:{g:{q:'Entre los estudiantes que asistieron con regularidad a la discusión, escribe una expresión para la proporción que calificó el curso con 4 o más.', e:'Se filtran los estudiantes con Attended True, se compara su Rating con 4 y el promedio del array booleano es la proporción.'},
  h:{q:'Los estudiantes que asistieron a la discusión dieron calificaciones más altas en promedio. ¿Cuál es la mejor conclusión?', c:['Hay una asociación, pero los estudiantes eligieron si asistir; los más motivados pueden asistir y además gustarles más el curso, así que no se puede concluir que asistir cause mejores calificaciones.','Asistir a la discusión causa mejores calificaciones, porque los 100 estudiantes fueron una muestra aleatoria.','No hay asociación porque las calificaciones van de 1 a 5.','La asistencia debería ser obligatoria, porque sube las calificaciones.'], e:'Los 100 estudiantes se eligieron al azar (los resultados se generalizan al curso), pero asistir fue decisión de cada uno, no asignado al azar. Así que es una asociación y puede haber confusión.'}},
 cols:['student_id (str): ID anónimo','Rating (int): calificación general de 1 a 5','Section (int): número de sección de discusión','Year (str): año de estudios','Hours (float): horas por semana dedicadas al curso','Attended (bool): True si asistía con regularidad a la discusión']});

TR['cs-rent'].es.bg = 'El gobierno estudiantil encuesta a una muestra aleatoria simple de 500 estudiantes que viven fuera del campus. La tabla rents tiene una fila por estudiante encuestado, con el alquiler mensual de su vivienda (columna Rent) y otros datos de la vivienda. La mediana muestral del alquiler es $1,450, la media muestral es $1,520 y la DE muestral es $410.';
