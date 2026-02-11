# 🎮 Clicker Game

Un juego clicker completo desarrollado con TypeScript vanilla, con sistema de mejoras, tienda, misiones, prestigio y múltiples temas visuales.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![LocalStorage](https://img.shields.io/badge/Storage-localStorage-yellow)

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Capturas](#capturas)
- [Instalación](#instalación)
- [Cómo Jugar](#cómo-jugar)
- [Sistemas del Juego](#sistemas-del-juego)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Tecnologías](#tecnologías)

---

## Descripción

Clicker Game es un juego incremental donde acumulás puntos haciendo click, comprás mejoras para aumentar tu producción, completás misiones, desbloqueás temas visuales y avanzás a través de 10 etapas de progresión. Todo funciona en el navegador sin necesidad de servidor.

---

## Características

- **Sistema de clicks** con feedback visual, partículas y combos
- **Mejoras** de click y auto-clicker con precios escalables
- **Tienda** con 8 ítems que otorgan bonuses permanentes
- **26 misiones** con 5 rangos de dificultad (bronce → maestro)
- **Sistema de prestigio** para reiniciar y acumular bonuses globales
- **10 etapas de progresión** que desbloquean contenido nuevo
- **11 temas visuales** desbloqueables (Violeta Neón, Océano, Galaxia, etc.)
- **Perfil de jugador** con avatar, nivel y estadísticas detalladas
- **Ganancias offline** — acumulás puntos mientras no jugás (hasta 8 horas)
- **Guardado automático** en localStorage con migración de versiones
- **Modo claro y oscuro**
- **Responsive** — funciona en desktop y móvil
- **Sin dependencias** de runtime — TypeScript vanilla compilado a JS

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/thiago-so15/clicker-game.git
cd clicker-game

# Instalar dependencias de desarrollo
npm install

# Compilar TypeScript
npm run build

# Abrir el juego
npm start
```

O simplemente abrí `index.html` en tu navegador.

---

## Cómo Jugar

1. **Hacé click** en el botón central para ganar puntos
2. **Comprá mejoras** para aumentar tus puntos por click y por segundo
3. **Visitá la tienda** para adquirir ítems con efectos permanentes
4. **Completá misiones** para ganar recompensas en puntos
5. **Avanzá de etapa** cumpliendo objetivos (clicks, puntos, misiones, prestigios)
6. **Hacé prestigio** para reiniciar con bonuses globales acumulativos
7. **Desbloqueá temas** a medida que progresás por las etapas

---

## Sistemas del Juego

### Mejoras

| Mejora | Precio Base | Efecto |
|--------|-------------|--------|
| Click Potenciado | 10 pts | +1 punto por click |
| Auto-Clicker | 50 pts | +1 punto por segundo |

> Los precios escalan con cada nivel comprado (×1.5 y ×1.8 respectivamente).

### Tienda

| Ítem | Precio | Efecto |
|------|--------|--------|
| 🖐️ Dedo Dorado | 10,000 | +5 puntos por click |
| 🍀 Trébol de la Suerte | 50,000 | +10 puntos por click |
| 🤖 Mini Robot | 25,000 | +3 puntos por segundo |
| 🔧 Motor Turbo | 75,000 | +5 puntos por segundo |
| ✨ Brillo Neón | 5,000 | Efecto visual: brillo extra |
| 🌈 Borde Arcoíris | 15,000 | Efecto visual: borde animado |
| 💫 Estela de Partículas | 35,000 | Efecto visual: partículas al click |
| 💥 Doble Problema | 100,000 | Multiplicador ×2 en todos los puntos |

### Etapas de Progresión

| # | Etapa | Requisito | Desbloqueos |
|---|-------|-----------|-------------|
| 1 | 🌱 Novato | Inicio | Tema Violeta Neón |
| 2 | 📚 Aprendiz | 100 clicks | Tema Océano |
| 3 | ⚡ Practicante | 1,000 puntos | Ítems de tienda + Tema Bosque |
| 4 | 🎯 Experto | 5 misiones | Ítems de tienda + Tema Atardecer |
| 5 | 🏆 Veterano | 10,000 puntos | Ítems de tienda + Tema Cerezo |
| 6 | 👑 Maestro | 1 prestigio | Ítems de tienda + Tema Oro |
| 7 | 🌟 Leyenda | 15 misiones | Tema Galaxia |
| 8 | 🔮 Mítico | 3 prestigios | Tema Arcoíris |
| 9 | 💀 Inmortal | 500,000 puntos | Tema Vacío |
| 10 | ⚜️ Dios del Click | 10 prestigios | Tema Divino |

### Misiones

26 misiones organizadas en 5 rangos de dificultad:

- **🥉 Bronce** — Objetivos iniciales (10 clicks, 100 puntos, etc.)
- **🥈 Plata** — Desafíos intermedios
- **🥇 Oro** — Objetivos avanzados
- **💎 Diamante** — Desafíos de alto nivel
- **👑 Maestro** — Para los más dedicados (10,000+ clicks, 10 prestigios, etc.)

### Sistema de Combos

Hacé clicks rápidos (menos de 300ms entre cada uno) para activar combos:

- **x3+** → Indicador de combo + partículas extra
- **x5+** → Partículas de combo (efecto ⚡)
- **x10+** → Partículas mega (efecto 🔥)

### Ganancias Offline

Al volver al juego después de estar inactivo, recibís el **50%** de tu producción por segundo acumulada (máximo 8 horas).

### Niveles

Tu nivel sube en base a los puntos totales ganados (histórico). El sistema escala desde nivel 1 hasta nivel 100 con umbrales cada vez más altos.

---

## Estructura del Proyecto

```
clicker-game/
├── index.html          # Markup de todas las pantallas y modales
├── main.ts             # Lógica del juego, estado, UI, sistema de guardado
├── main.js             # Archivo compilado (output de tsc)
├── main.js.map         # Source map para debugging
├── styles.css          # Estilos, temas, animaciones
├── favicon.svg         # Icono del juego
├── tsconfig.json       # Configuración de TypeScript
├── package.json        # Metadata y scripts del proyecto
└── README.md
```

### Pantallas del Juego

| Pantalla | Descripción |
|----------|-------------|
| Menú Principal | Hub central con acceso a todas las secciones |
| Juego | Botón de click, score, mejoras |
| Tienda | Ítems comprables con efectos permanentes |
| Misiones | Lista de objetivos con progreso y recompensas |
| Perfil | Avatar, nombre, nivel, estadísticas |
| Estadísticas | Datos detallados de actividad, producción e historial |
| Prestigio | Reiniciar progreso a cambio de bonuses globales |
| Ajustes | Sonidos, animaciones, temas, gestión de datos |

---

## Scripts Disponibles

```bash
npm run build    # Compila TypeScript a JavaScript
npm run watch    # Compila en modo watch (recompila al guardar)
npm start        # Abre index.html en el navegador
```

---

## Tecnologías

- **TypeScript** (ES2020, modo estricto) — Toda la lógica del juego
- **CSS3** — Variables CSS, temas dinámicos, animaciones, responsive design
- **HTML5** — Estructura semántica
- **localStorage** — Persistencia de datos con versionado y migración
- **Sin frameworks** — 100% vanilla, sin dependencias de runtime
