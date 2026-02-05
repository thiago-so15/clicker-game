"use strict";
/**
 * ============================================
 * CLICKER GAME - Lógica Principal
 * ============================================
 *
 * Un juego clicker completo con sistema de mejoras
 * y guardado automático en localStorage.
 */
// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================
/** Clave para guardar en localStorage */
const STORAGE_KEY = 'clickerGameState';
/** Configuración de la mejora de click potenciado */
const CLICK_UPGRADE_CONFIG = {
    basePrice: 10,
    priceMultiplier: 1.5,
    effect: 1 // +1 punto por click
};
/** Configuración de la mejora de auto-clicker */
const AUTO_UPGRADE_CONFIG = {
    basePrice: 50,
    priceMultiplier: 1.8,
    effect: 1 // +1 punto por segundo
};
/** Intervalo del auto-clicker en milisegundos */
const AUTO_CLICK_INTERVAL = 1000;
// ============================================
// CLASE PRINCIPAL DEL JUEGO
// ============================================
/**
 * Clase que maneja toda la lógica del juego Clicker
 */
class ClickerGame {
    /**
     * Constructor: inicializa el juego
     */
    constructor() {
        // ID del intervalo del auto-clicker
        this.autoClickerInterval = null;
        // Inicializar estado por defecto
        this.state = this.getDefaultState();
        // Obtener referencias a elementos del DOM
        this.elements = this.getElements();
        // Cargar progreso guardado
        this.loadProgress();
        // Configurar eventos
        this.setupEventListeners();
        // Iniciar auto-clicker si corresponde
        this.startAutoClicker();
        // Actualizar la UI
        this.updateUI();
    }
    /**
     * Devuelve el estado por defecto del juego
     */
    getDefaultState() {
        return {
            score: 0,
            pointsPerClick: 1,
            pointsPerSecond: 0,
            clickUpgradeLevel: 0,
            autoUpgradeLevel: 0
        };
    }
    /**
     * Obtiene referencias a todos los elementos del DOM necesarios
     */
    getElements() {
        return {
            score: document.getElementById('score'),
            pointsPerClick: document.getElementById('points-per-click'),
            pointsPerSecond: document.getElementById('points-per-second'),
            clickButton: document.getElementById('click-button'),
            clickFeedback: document.getElementById('click-feedback'),
            clickUpgradeButton: document.getElementById('buy-click-upgrade'),
            clickUpgradePrice: document.getElementById('upgrade-click-price'),
            clickUpgradeLevel: document.getElementById('upgrade-click-level'),
            autoUpgradeButton: document.getElementById('buy-auto-upgrade'),
            autoUpgradePrice: document.getElementById('upgrade-auto-price'),
            autoUpgradeLevel: document.getElementById('upgrade-auto-level'),
            resetButton: document.getElementById('reset-button'),
            upgradeClickCard: document.getElementById('upgrade-click'),
            upgradeAutoCard: document.getElementById('upgrade-auto')
        };
    }
    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Click en el botón principal
        this.elements.clickButton.addEventListener('click', () => this.handleClick());
        // Comprar mejora de click
        this.elements.clickUpgradeButton.addEventListener('click', () => this.buyClickUpgrade());
        // Comprar mejora de auto-click
        this.elements.autoUpgradeButton.addEventListener('click', () => this.buyAutoUpgrade());
        // Reiniciar juego
        this.elements.resetButton.addEventListener('click', () => this.resetGame());
        // Guardar antes de cerrar la página
        window.addEventListener('beforeunload', () => this.saveProgress());
    }
    /**
     * Maneja el click en el botón principal
     */
    handleClick() {
        // Sumar puntos
        this.state.score += this.state.pointsPerClick;
        // Mostrar feedback visual
        this.showClickFeedback();
        // Actualizar UI y guardar
        this.updateUI();
        this.saveProgress();
    }
    /**
     * Muestra el feedback visual al hacer click (+N puntos flotando)
     */
    showClickFeedback() {
        const feedback = this.elements.clickFeedback;
        // Crear el texto del feedback
        feedback.textContent = `+${this.state.pointsPerClick}`;
        // Reiniciar la animación
        feedback.classList.remove('show');
        // Forzar reflow para reiniciar la animación
        void feedback.offsetWidth;
        // Mostrar la animación
        feedback.classList.add('show');
    }
    /**
     * Calcula el precio de una mejora basándose en su nivel actual
     */
    calculateUpgradePrice(config, level) {
        return Math.floor(config.basePrice * Math.pow(config.priceMultiplier, level));
    }
    /**
     * Obtiene el precio actual de la mejora de click
     */
    getClickUpgradePrice() {
        return this.calculateUpgradePrice(CLICK_UPGRADE_CONFIG, this.state.clickUpgradeLevel);
    }
    /**
     * Obtiene el precio actual de la mejora de auto-click
     */
    getAutoUpgradePrice() {
        return this.calculateUpgradePrice(AUTO_UPGRADE_CONFIG, this.state.autoUpgradeLevel);
    }
    /**
     * Compra la mejora de click potenciado
     */
    buyClickUpgrade() {
        const price = this.getClickUpgradePrice();
        // Verificar si hay suficientes puntos
        if (this.state.score >= price) {
            // Restar el precio
            this.state.score -= price;
            // Incrementar el nivel de mejora
            this.state.clickUpgradeLevel++;
            // Incrementar los puntos por click
            this.state.pointsPerClick += CLICK_UPGRADE_CONFIG.effect;
            // Actualizar UI y guardar
            this.updateUI();
            this.saveProgress();
        }
    }
    /**
     * Compra la mejora de auto-clicker
     */
    buyAutoUpgrade() {
        const price = this.getAutoUpgradePrice();
        // Verificar si hay suficientes puntos
        if (this.state.score >= price) {
            // Restar el precio
            this.state.score -= price;
            // Incrementar el nivel de mejora
            this.state.autoUpgradeLevel++;
            // Incrementar los puntos por segundo
            this.state.pointsPerSecond += AUTO_UPGRADE_CONFIG.effect;
            // Reiniciar el auto-clicker con los nuevos valores
            this.startAutoClicker();
            // Actualizar UI y guardar
            this.updateUI();
            this.saveProgress();
        }
    }
    /**
     * Inicia o reinicia el auto-clicker
     */
    startAutoClicker() {
        // Detener el intervalo existente si hay uno
        if (this.autoClickerInterval !== null) {
            clearInterval(this.autoClickerInterval);
            this.autoClickerInterval = null;
        }
        // Solo iniciar si hay puntos por segundo
        if (this.state.pointsPerSecond > 0) {
            this.autoClickerInterval = window.setInterval(() => {
                this.state.score += this.state.pointsPerSecond;
                this.updateUI();
                this.saveProgress();
            }, AUTO_CLICK_INTERVAL);
        }
    }
    /**
     * Actualiza toda la interfaz de usuario
     */
    updateUI() {
        // Actualizar puntuación
        this.elements.score.textContent = this.formatNumber(this.state.score);
        // Actualizar estadísticas
        this.elements.pointsPerClick.textContent = this.state.pointsPerClick.toString();
        this.elements.pointsPerSecond.textContent = this.state.pointsPerSecond.toString();
        // Actualizar mejora de click
        const clickPrice = this.getClickUpgradePrice();
        this.elements.clickUpgradePrice.textContent = this.formatNumber(clickPrice);
        this.elements.clickUpgradeLevel.textContent = this.state.clickUpgradeLevel.toString();
        this.elements.clickUpgradeButton.disabled = this.state.score < clickPrice;
        // Actualizar mejora de auto-click
        const autoPrice = this.getAutoUpgradePrice();
        this.elements.autoUpgradePrice.textContent = this.formatNumber(autoPrice);
        this.elements.autoUpgradeLevel.textContent = this.state.autoUpgradeLevel.toString();
        this.elements.autoUpgradeButton.disabled = this.state.score < autoPrice;
        // Actualizar clases de tarjetas de mejoras (efecto visual de disponibilidad)
        this.elements.upgradeClickCard.classList.toggle('affordable', this.state.score >= clickPrice);
        this.elements.upgradeAutoCard.classList.toggle('affordable', this.state.score >= autoPrice);
    }
    /**
     * Formatea un número para mostrar (ej: 1000 -> 1,000)
     */
    formatNumber(num) {
        return num.toLocaleString('es-ES');
    }
    /**
     * Guarda el progreso en localStorage
     */
    saveProgress() {
        try {
            const stateJSON = JSON.stringify(this.state);
            localStorage.setItem(STORAGE_KEY, stateJSON);
        }
        catch (error) {
            console.error('Error al guardar el progreso:', error);
        }
    }
    /**
     * Carga el progreso desde localStorage
     */
    loadProgress() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // Validar que el estado cargado tiene todas las propiedades necesarias
                if (this.isValidState(parsedState)) {
                    this.state = parsedState;
                    console.log('Progreso cargado correctamente');
                }
                else {
                    console.warn('Estado guardado inválido, usando valores por defecto');
                }
            }
        }
        catch (error) {
            console.error('Error al cargar el progreso:', error);
        }
    }
    /**
     * Valida que un objeto tenga la estructura correcta de GameState
     */
    isValidState(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        const state = obj;
        return (typeof state.score === 'number' &&
            typeof state.pointsPerClick === 'number' &&
            typeof state.pointsPerSecond === 'number' &&
            typeof state.clickUpgradeLevel === 'number' &&
            typeof state.autoUpgradeLevel === 'number' &&
            state.score >= 0 &&
            state.pointsPerClick >= 1 &&
            state.pointsPerSecond >= 0 &&
            state.clickUpgradeLevel >= 0 &&
            state.autoUpgradeLevel >= 0);
    }
    /**
     * Reinicia el juego completamente
     */
    resetGame() {
        // Confirmar antes de reiniciar
        const confirmed = confirm('¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.');
        if (confirmed) {
            // Detener el auto-clicker
            if (this.autoClickerInterval !== null) {
                clearInterval(this.autoClickerInterval);
                this.autoClickerInterval = null;
            }
            // Restaurar estado por defecto
            this.state = this.getDefaultState();
            // Limpiar localStorage
            localStorage.removeItem(STORAGE_KEY);
            // Actualizar UI
            this.updateUI();
            console.log('Juego reiniciado');
        }
    }
}
// ============================================
// INICIALIZACIÓN
// ============================================
/**
 * Inicializa el juego cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia del juego
    const game = new ClickerGame();
    // Exponer para debugging (opcional)
    window.game = game;
    console.log('🎮 Clicker Game iniciado!');
});
//# sourceMappingURL=main.js.map