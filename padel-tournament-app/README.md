# Padel Tournament App

## Descripción

La aplicación de torneos de pádel permite a los clubes registrados organizar torneos de manera automática. Los jugadores pueden registrarse en diferentes categorías y participar en torneos que se estructuran automáticamente en eliminatorias, cuartos de final, semifinales y finales, similar a un torneo profesional de pádel.

## Características

- **Registro de Clubes**: Los clubes pueden registrarse y gestionar sus torneos.
- **Registro de Jugadores**: Los jugadores pueden registrarse en diferentes categorías y equipos.
- **Generación Automática de Torneos**: Los torneos se organizan automáticamente en función del número de equipos registrados.
- **Sistema de Puntuación**: Implementación de reglas de puntuación como suma 7 y suma 11.
- **Gestión de Partidos**: Los partidos se crean y gestionan automáticamente, con seguimiento de resultados y estados.

## Estructura del Proyecto

- `src/app.ts`: Punto de entrada de la aplicación.
- `src/controllers/`: Controladores para manejar la lógica de negocio de torneos, clubes, jugadores y partidos.
- `src/models/`: Modelos que representan las entidades del sistema.
- `src/routes/`: Rutas para manejar las solicitudes HTTP.
- `src/services/`: Servicios que contienen la lógica de negocio y utilidades.
- `src/middleware/`: Middleware para autenticación y validación de solicitudes.
- `src/utils/`: Funciones utilitarias y constantes.
- `src/types/`: Tipos e interfaces utilizados en la aplicación.

## Instalación

1. Clona el repositorio.
2. Navega al directorio del proyecto.
3. Ejecuta `npm install` para instalar las dependencias.
4. Configura la base de datos y las variables de entorno según sea necesario.
5. Ejecuta `npm start` para iniciar la aplicación.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.