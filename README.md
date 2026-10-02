**** README ****
* Descripcion: El presente proyecto es una aplicación desarrollada con express.js y EJS, cuya finalidad es realizar la reserva de salas de estudio; todo esto poniendo en práctica el flujo y orden de los middlewares; utilizando medidores de tiempo, validadores de solicitudes y vistas estáticas.

* Instalación y ejecucion:
    -npm intall

* Verificacion:
    -npm run check

* Ejecucion del Servidor:
    -npm start

* Rutas: 

    GET / -> Página inicio con los accesos principales.

    GET /estado -> Devuelve un JSON con información sobre el servidor, cuantas reservas hay y el ID de cada solicitud.

    GET /reservas -> Muestra todas las reservas de salas registradas que hay.

    GET /reservas/nueva -> Formulario en blanco para el registro de una nueva reserva.

    GET /reservas/:id -> Entra al detelle de una reserva puntual.

    POST /reservas -> Procesa el formulario, hace la validación de los datos y si resulta positiva, guarda la reserva.

* Pipeline de middleware:
    
    Ingresa la petición HTTP al servidor
        |
    1. morgan("dev") --> Loguea en la consola la ruta y el método que ingreso.
        |
    2. identificarSolicitud --> Le da un ID único a la solicitud (tipo BIB-0001) guardandolo en res.locals.
        |
    3. medirDuracion--> Comienza a medir el tiempo (con process.hrtime) y pone el listener del evento "finish".
        |
    4. expressLayouts--> Prepara el layout base de EJS (main.ejs) para incrustar las vistas.
        |
    5. express.static --> Revisa si lo que piden es un archivo estático (el CSS). Si no lo es, le pasa la solicitud al que sigue.
        |
    6. express.urlencoded --> Porcesa los datos que vienen del formulario HTML y arma el objeto del req.body.
        |
    7. reservasRouter --> Filtra las rutas que inician con el prefijo "/reservas".
        |
    8. prepararAreaReservas --> Define res.locals.seccion = "Reservas de salas" para que lo use la vista.
        |
    9. validarReserva --> Controla que no hayan campos vacíos, que el mail tenga el @ y que las personas esten dentro del rango de 1 a 6. Si está correcto, llama a next().
        |
    10. crearReserva --> Le asigna el nuevo ID, lo ingresa a la memoria y lo ingresa en un res.redirect("/reservas").
        |
    11. se manda la respuesta (código 302) y salta el evento "finish" de medirDuracion mostrando en consola cuántos ms tardó toda la operatoria.

 * Diagrama del POST con error en el cargado:
    
    1. Entra la petición HTTP al servidor
       |
(Los pasos del 1 al 8 se ejecutan de igual menra que en la descripta más arriba)
       |
   2. validarReserva--> Se detecta que se ingreso un dato mal (ej. nombre vacío, el mail sin el @).
        Devuelve la vista "reservas/nueva" de nuevo mostrando el error y tira un HTTP 400 Bad Request.
        Importante, al haber un error, NO se llama a next(), entonces corta la cadena ahí nomás.
       |
(El paso 10 que es: crearReserva directamente NO se ejecuta)
       |
Devuelve la respuesta (400) y salta el evento "finish" registrando el tiempo que llevó rebotar la petición.

* Alcance de cada función:
    
    - identificarSolicitud y medirDuracion: Global (app.use). Aplican a todas las peticiones que entran al servidor.

    - prepararAreaReservas: Router (router.use). Aplica únicamente a las rutas bajo /reservas.

    - validarReserva y crearReserva: De ruta específica. Solo se ejecutan en la petición POST /reservas.

* Validación:

    Se revisa que estudiante, email, sala, fecha, turno y personas estén cargados de manera correcta.

    Se comprueba que el email contenga @, que la fecha no sea pasada y personas sea un numero entero entre 1 y 6.

    - Si falla, corta el flujo con código HTTP 400 Bad Request, re-renderiza reservas/nueva conservando los datos tipeados y devuelve el mensaje de error.

* Pruebas manuales:

    Casos con éxito: Navegar a / (inicio), /reservas (listado) y enviar el POST con datos válidos para verificar el redireccionamiento (PRG) al listado.

    Casos límite/fallo: Enviar el POST con campos vacíos, emails sin el @ o con una cantidad de personas fuera de rango para verificar la respuesta HTTP 400 y la retención de valores en el formulario.

* Persistencia temporal:

    Los datos se almacenan en un arreglo de JavaScript en memoria RAM del servidor

    No haypa base de almacenamiento físico: al reiniciar el proceso de Node.js (npm start / Ctrl+C), todos los nuevos registros se borraran y el sistema vuelve a su estado inicial.