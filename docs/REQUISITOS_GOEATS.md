# Requisitos de GoEats

Borrador del 10 de noviembre de 2026. Reúne en un solo lugar lo que pidieron los jefes, lo que ya está construido y lo que falta. No es definitivo: muestra lo que se sabe y lo que todavía hay que preguntar.

**Equipo:** Deyvi (full stack y revisión), Jhosept (backend) y Janneth (frontend y parte visual).

---

## 1. Alcance

GoEats es una plataforma para restaurantes de Loja con cuatro partes:

- **Cliente:** pide a domicilio, para recoger o en la mesa, paga y sigue su pedido.
- **Restaurante:** atiende mesas, cocina, cobra en caja y administra su menú, personal y promociones.
- **Motorizado:** toma pedidos cercanos, los entrega con un código y maneja su saldo.
- **Administrador de GoEats:** da de alta restaurantes, fija tarifas y recibe avisos.

**Público:** personas de 40 años o más. Todo debe ser simple, con textos grandes y pocos pasos.

**Fuera del MVP, salvo que los jefes digan otra cosa:** factura real ante el SRI, cobro real con PayPhone, conexión con Scooter y la app Flutter. En la demo, lo simulado se muestra como simulado.

---

## 2. Modelo de proceso

GoEats se construye **por incrementos**, con una vuelta corta de prototipo para lo incierto.

| Criterio | Situación de GoEats | Consecuencia |
|---|---|---|
| Estabilidad de los requisitos | Cambian: los jefes aclaran reglas en cada reunión | Se descarta la cascada |
| Urgencia de uso | Hay fechas: prototipo el 20 de noviembre y MVP el 27 | Se entrega por bloques que ya se pueden mostrar |
| Riesgo | El SRI y PayPhone dependen de terceros | Antes de construirlos se hace un prototipo pequeño |

**Riesgo aceptado:** la estructura se puede desordenar entre incrementos. Se controla con una revisión de Deyvi antes de unir cada rama y con la regresión completa al cerrar cada bloque.

---

## 3. Historias de usuario

Cada historia tiene un criterio del caso normal y uno de excepción. Estado: **Hecho** significa construido y probado en la copia aislada.

### Cliente

| # | Historia | Criterio normal | Criterio de excepción | Estado |
|---|---|---|---|---|
| HU-01 | Como cliente, quiero registrarme con mi cédula, para tener una sola cuenta a mi nombre | Dado que mi cédula es válida y no está registrada, cuando envío el formulario, entonces se crea mi cuenta | Dado que mi cédula ya tiene cuenta, cuando intento registrarme, entonces el sistema lo rechaza y me avisa | Hecho |
| HU-02 | Como cliente, quiero marcar mi punto de entrega en un mapa, para que el motorizado llegue sin llamarme | Dado que busco mi calle o muevo el pin, cuando confirmo, entonces se guarda la dirección con sus coordenadas | Dado que no marqué dirección ni teléfono, cuando intento pedir a domicilio, entonces no me deja confirmar | Hecho |
| HU-03 | Como cliente, quiero conservar mi carrito al iniciar sesión, para no volver a elegir los platos | Dado que tengo platos en el carrito, cuando inicio sesión, entonces vuelvo al mismo restaurante con el carrito intacto | Dado que aún no tengo dirección, cuando la guardo, entonces también vuelvo al restaurante con el carrito | Hecho |
| HU-04 | Como cliente, quiero seguir mi pedido, para saber cuándo llega | Dado que mi pedido está en camino, cuando abro Mis Pedidos, entonces veo su estado y mi código de entrega | Dado que el pedido es de otra persona, cuando intento verlo, entonces el sistema responde que no tengo permiso | Hecho |
| HU-05 | Como cliente, quiero calificar al restaurante y al motorizado, para que el servicio mejore | Dado que mi pedido fue entregado, cuando califico, entonces la nota queda guardada | Dado que el pedido no ha sido entregado, cuando intento calificar, entonces no se permite | Hecho |
| HU-06 | Como cliente, quiero recibir un aviso en el celular, para enterarme de mi pedido sin tener la página abierta | Dado que acepté los avisos, cuando mi pedido cambia de estado, entonces me llega una notificación | Dado que no acepté los avisos, cuando mi pedido cambia, entonces lo veo igual dentro de la página | Pendiente |

### Restaurante

| # | Historia | Criterio normal | Criterio de excepción | Estado |
|---|---|---|---|---|
| HU-07 | Como cajero, quiero que el cobro salga con la cédula del cliente, para no volver a pedírsela | Dado un pedido hecho desde la app, cuando abro el cobro, entonces la cédula ya aparece | Dado que soy mesero o cliente, cuando pido ese dato, entonces el sistema responde 403 | Hecho |
| HU-08 | Como cajero, quiero registrar la propina en efectivo, para entregarla a los meseros al cierre | Dado un cobro con $2 de propina, cuando confirmo, entonces la propina queda guardada en el pedido | Dado ese mismo cobro, cuando se genera la venta, entonces la propina no entra en la venta ni en la factura | Hecho |
| HU-09 | Como mesero, quiero tomar el pedido de una mesa, para enviarlo a cocina sin papel | Dado una mesa libre, cuando registro el pedido, entonces la cocina lo ve al instante | Dado un pedido pendiente, cuando alguien intenta marcarlo como entregado sin pasar por cocina, entonces el sistema lo rechaza | Hecho |
| HU-10 | Como cocinero, quiero ver los pedidos en una pantalla grande, para prepararlos en orden | Dado un pedido nuevo, cuando lo marco como listo, entonces queda registrado quién lo preparó | Dado un pedido ya entregado, cuando lo busco, entonces aparece en el historial y no en la lista activa | Hecho |
| HU-11 | Como dueño, quiero registrar mis compras, para que el inventario suba sin usar recetas | Dado que registro una compra de 10 unidades, cuando la guardo, entonces el inventario sube en 10 | Dado que escribo una cantidad en cero o negativa, cuando guardo, entonces el sistema lo rechaza | El backend ya suma las compras al inventario. Falta probarlo de punta a punta y confirmar el criterio de excepción |
| HU-12 | Como dueño, quiero manejar reservas y promociones, para llenar el local en horas bajas | Dado una reserva nueva, cuando la confirmo, entonces la mesa queda apartada para esa hora | Dado que el restaurante tiene las reservas apagadas, cuando un cliente intenta reservar, entonces el sistema avisa que no recibe reservas | Hecho |
| HU-13 | Como dueño, quiero ver solo los datos de mi restaurante, para que nadie más vea mis ventas | Dado que inicio sesión, cuando abro reportes, entonces veo solo mi restaurante | Dado que pido datos de otro restaurante, cuando llega la petición, entonces el sistema responde 403 | Hecho |

### Motorizado

| # | Historia | Criterio normal | Criterio de excepción | Estado |
|---|---|---|---|---|
| HU-14 | Como motorizado, quiero tomar un pedido cercano, para ganar por la entrega | Dado un pedido listo, cuando lo acepto, entonces queda a mi nombre y se descuenta la comisión | Dado que ningún motorizado lo toma en el tiempo fijado, cuando vence el plazo, entonces se avisa al administrador | Hecho. La regla de saldo espera a los jefes |
| HU-15 | Como motorizado, quiero pasar o cancelar una orden con un motivo, para no quedar atado si tengo un problema | Dado que escribo un motivo, cuando paso la orden, entonces vuelve a la lista y se me devuelve la comisión | Dado que el motivo tiene menos de 10 letras, cuando confirmo, entonces la pantalla me pide más detalle | Hecho |
| HU-16 | Como motorizado, quiero entregar con el código del cliente, para probar que el pedido llegó | Dado que el cliente me da su código de 4 dígitos, cuando lo escribo, entonces el pedido queda entregado | Dado que el cliente no tiene el código, cuando explico el motivo, entonces puedo entregar y queda registrado | Hecho |

### Administrador

| # | Historia | Criterio normal | Criterio de excepción | Estado |
|---|---|---|---|---|
| HU-17 | Como administrador, quiero fijar tarifas, radio y tiempo de espera, para ajustar el servicio sin tocar el código | Dado que cambio el tiempo de espera, cuando guardo, entonces los pedidos nuevos usan ese valor | Dado que no soy administrador, cuando intento cambiarlo, entonces el sistema responde 403 | Hecho |

### Historias que no pasan la revisión INVEST

| Historia original | Letra que falla | Corrección |
|---|---|---|
| "Como dueño, quiero emitir facturas electrónicas del SRI" | S: no cabe en un incremento | Se parte en tres: pantalla de datos de facturación del cliente; generar el comprobante firmado en ambiente de pruebas; enviarlo al SRI y guardar la respuesta |
| "Como cliente, quiero pagar con PayPhone" | E: no se puede estimar sin la cuenta y las credenciales | Primero un prototipo con las credenciales de prueba; después se estima |
| "Como cliente, quiero recibir avisos" (HU-06) | I: depende de aprobar una dependencia nueva | Primero se decide la dependencia; después se construye |

---

## 4. Requisitos no funcionales

Cada uno dice qué se mide, cuánto y cómo se comprueba.

| # | Categoría | Requisito | Cómo se comprueba | Estado |
|---|---|---|---|---|
| RNF-01 | Seguridad | La cédula y los datos sensibles se guardan cifrados con AES-256-GCM | Leer la tabla directo en la base: el valor no es legible | Cumple |
| RNF-02 | Seguridad | Toda conexión a la base usa TLS con verificación estricta del certificado | `npm run db:check` falla si se quita el certificado | Cumple |
| RNF-03 | Seguridad | Ningún usuario lee ni cambia datos de otro restaurante: 0 respuestas exitosas en las pruebas de ataque | `npm run test:api` (15 de 15) | Cumple |
| RNF-04 | Seguridad | El inicio de sesión limita los intentos fallidos seguidos | Prueba de intentos repetidos | Cumple |
| RNF-05 | Rendimiento | El catálogo de un restaurante responde en menos de 2 segundos con 15 restaurantes cargados | Medir 20 peticiones seguidas y tomar la más lenta | Por medir |
| RNF-06 | Usabilidad | En un celular de 390 px no hay desplazamiento horizontal y los botones principales miden al menos 44 px de alto | Pruebas de celular automáticas | Cumple en el mapa y en la pantalla del motorizado. Falta revisar el resto |
| RNF-07 | Usabilidad | Una persona que no conoce el sistema hace su primer pedido en menos de 5 minutos | Prueba con 3 personas de 40 años o más | Por medir |
| RNF-08 | Accesibilidad | El texto cumple el contraste AA de las pautas WCAG (4.5 a 1) | Revisión con la herramienta del navegador en las pantallas principales | Por medir. El blanco y negro ayuda |
| RNF-09 | Disponibilidad | La demo está disponible fuera de la PC de Deyvi durante la presentación | Abrirla desde otro equipo y otra red | Pendiente: falta el despliegue |
| RNF-10 | Mantenimiento | Cada entrega pasa `tsc`, `npm run build` y la regresión antes de unirse a `desarrollo` | Revisión de Deyvi en cada pull request | En uso |

---

## 5. Prioridad de lo pendiente (MoSCoW)

| Prioridad | Qué | Por qué |
|---|---|---|
| **Debe** | Guion de demo e idea de negocio | Sin esto no hay presentación del 20 de noviembre |
| **Debe** | Despliegue para que los jefes prueben (RNF-09) | Los jefes quieren ver el funcionamiento antes de dar la base real |
| **Debe** | Prueba en un celular real | El público usa celular; hasta hoy solo se probó en el navegador |
| **Debe** | Probar y cerrar el inventario por compra (HU-11) | Lo pidió el jefe de forma directa y es lo único del restaurante sin prueba completa |
| **Debe** | Pasar a blanco y negro las pantallas que siguen en verde | Decisión visual ya tomada; hoy la app se ve con dos estilos |
| **Debería** | Avisos en el celular (HU-06) | El jefe los pidió, pero el pedido ya se puede seguir dentro de la página |
| **Debería** | Pantalla de datos de facturación del cliente | Es el primer tercio de la factura y no depende del SRI |
| **Debería** | Medir RNF-05, RNF-07 y RNF-08 | Convierte "rápido y fácil" en cifras que se pueden mostrar |
| **Podría** | Prototipo de factura del SRI en ambiente de pruebas | Reduce el riesgo antes de comprometer una fecha |
| **Podría** | Prototipo de PayPhone con credenciales de prueba | Igual que el anterior |
| **No ahora** | Conexión con Scooter | Espera la reunión con su responsable |
| **No ahora** | App Flutter | La web instalable alcanza para el MVP |

La prioridad final la deciden los jefes. Esta tabla es la propuesta del equipo.

---

## 6. Guion de entrevista con los jefes

**Objetivo:** cerrar las reglas de negocio que hoy están como supuestos.

**Forma:** preguntas abiertas, de lo general a los casos raros. Se pregunta por la última vez que pasó algo, no por lo que "suele" pasar. Al final se resume lo entendido y se pide confirmación.

| # | Tema | Pregunta | Qué decide |
|---|---|---|---|
| 1 | Contexto | Cuéntenos el último pedido a domicilio que salió mal. ¿Qué pasó? | Qué casos de excepción faltan |
| 2 | Saldo del motorizado | La última vez que un motorizado se quedó sin saldo, ¿qué hicieron? ¿Recarga antes de trabajar o puede quedar debiendo? | Recarga y planes, o saldo negativo con límite de $50 (HU-14) |
| 3 | Radio y espera | ¿Hasta qué distancia vale la pena ofrecer un pedido? ¿Cuánto esperan antes de buscar a otro motorizado? | Valores iniciales del radio y del tiempo (HU-17) |
| 4 | IVA | ¿Todos los restaurantes cobran el mismo IVA? ¿Hay alguno con régimen distinto? | La tasa, hoy en 15 % |
| 5 | Propinas | Al cerrar la caja, ¿cómo se reparte hoy la propina? ¿Quién la entrega? | Cómo se registra la entrega de propinas (HU-08) |
| 6 | Cuenta bancaria | ¿A qué cuenta transfiere el cliente y quién revisa el comprobante? | Los datos de la cuenta de GoEats |
| 7 | Documentación | Dijeron que "está todo" en un lugar. ¿Nos lo muestran? | Dónde está la documentación original |
| 8 | Prioridad | De esta lista de pendientes, ¿qué tres cosas quieren ver primero? | El orden de la sección 5 |
| 9 | Cierre | Entendimos esto: (resumen). ¿Falta o sobra algo? | Confirmación |

**Evitar:** preguntas que ya traen la respuesta, como "¿verdad que el IVA es 15 %?".
