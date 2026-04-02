# Política Abierta

Acercando a los boricuas a su proceso político.

## 📚 Descripción

Este proyecto sirve como una herramienta para acercar a las personas al proceso político de Puerto Rico. La aplicación pretende cerrar la brecha entre
las personas que le interesa conocer más sobre la política y el acceso a la información relevante para poder participar correctamente. Adicionalmente, la
aplicación sirve para que todas las personas y organizaciones que participan de la abogacía política puedan hacerse de una herramienta que les permita accelerar sus trabajos. Finalmente, a través de la inteligencia artificial se puede accelerar la entrada de las personas a las complejidades de el proceso político puertorriqueño.

## ✨ Funcionalidad

* Acceso a las noticias políticas locales de Puerto Rico de los principales rotativos del país.
* Acceso en tiempo real a los proyectos de ley de la Asamblea Legislativa de Puerto Rico.
* Actualización de los eventos de los proyectos legislativos monitoreados bajo "Mis Proyectos".

## 👨‍💻 TODO

* [ ] Alertas inteligentes personalizadas sobre noticias y legislación basadas en los temas más importantes para ti.
* [ ] Generar resúmenes concisos sobre las noticias y legislación utilizando inteligencia artificial local.
* [ ] Creación de _timers_ para la búsqueda de noticias, legislación, eventos y envío de notificaciones en intervalos escalonados.

## 1️⃣ Prerrequisitos

* Node.js v22.17.1
* npm v10.9.2
* sqlite3 v3.50.4

## 🚀 Empezando

```bash
git clone https://github.com/svr4/politica-abierta.git
cd politica-abierta
npm install
make init
```

Crea un archivo `.env` en el directorio `politica-abierta` con las siguientes variables:
```bash
REACT_APP_ENV=DEV
REACT_APP_DB_PATH=[absolute_path_to]/politica-abierta/db/imparcial.db
```

Corre la aplicación.
```bash
npm start
```

## 🤝 Contribuciones

El proyecto está abierto a contribuciones y quiero darles la bienvenida a desarrollar este proyecto juntos para el beneficio de la comunidad. Las políticas sobre contribuciones están en desarrollo pero también podemos trabajarlas juntos.

## ❓ Apoyo Técnico

La plataforma aún no está lista para el uso de los usuarios. A los que se experimenten a usar la aplicación, pueden someter sus solicitudes de apoyo a través del "issue tracker" de Github. Igualmente, me puede escribir a través de info@politicaabierta.com

## 📜 Licencia

[Civic Innovation License v1.0](https://github.com/svr4/politica-abierta/blob/main/LICENCE)