/**
 * ============================================
 * CLICKER GAME - Lógica Principal
 * ============================================
 * 
 * Un juego clicker completo con sistema de mejoras
 * y guardado automático en localStorage.
 */

// ============================================
// INTERFACES Y TIPOS
// ============================================

/**
 * Interfaz para el estado del juego
 */
interface GameState {
    score: number;              // Puntos actuales
    pointsPerClick: number;     // Puntos ganados por click
    pointsPerSecond: number;    // Puntos ganados por segundo (auto-clicker)
    clickUpgradeLevel: number;  // Nivel de mejora de click
    autoUpgradeLevel: number;   // Nivel de mejora de auto-click
}

/**
 * Interfaz para la configuración de mejoras
 */
interface UpgradeConfig {
    basePrice: number;         // Precio base de la mejora
    priceMultiplier: number;   // Multiplicador de precio por nivel
    effect: number;            // Efecto de la mejora
}

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

/** Clave para guardar en localStorage */
const STORAGE_KEY = 'clickerGameState';

/** Configuración de la mejora de click potenciado */
const CLICK_UPGRADE_CONFIG: UpgradeConfig = {
    basePrice: 10,
    priceMultiplier: 1.5,
    effect: 1  // +1 punto por click
};

/** Configuración de la mejora de auto-clicker */
const AUTO_UPGRADE_CONFIG: UpgradeConfig = {
    basePrice: 50,
    priceMultiplier: 1.8,
    effect: 1  // +1 punto por segundo
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
    // Estado del juego
    private state: GameState;
    
    // Referencias a elementos del DOM
    private elements: {
        score: HTMLElement;
        pointsPerClick: HTMLElement;
        pointsPerSecond: HTMLElement;
        clickButton: HTMLButtonElement;
        clickFeedback: HTMLElement;
        clickUpgradeButton: HTMLButtonElement;
        clickUpgradePrice: HTMLElement;
        clickUpgradeLevel: HTMLElement;
        autoUpgradeButton: HTMLButtonElement;
        autoUpgradePrice: HTMLElement;
        autoUpgradeLevel: HTMLElement;
        resetButton: HTMLButtonElement;
        upgradeClickCard: HTMLElement;
        upgradeAutoCard: HTMLElement;
        // Modal de confirmación
        confirmModal: HTMLElement;
        modalCancel: HTMLButtonElement;
        modalConfirm: HTMLButtonElement;
    };
    
    // ID del intervalo del auto-clicker
    private autoClickerInterval: number | null = null;

    /**
     * Constructor: inicializa el juego
     */
    constructor() {
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
    private getDefaultState(): GameState {
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
    private getElements() {
        return {
            score: document.getElementById('score')!,
            pointsPerClick: document.getElementById('points-per-click')!,
            pointsPerSecond: document.getElementById('points-per-second')!,
            clickButton: document.getElementById('click-button') as HTMLButtonElement,
            clickFeedback: document.getElementById('click-feedback')!,
            clickUpgradeButton: document.getElementById('buy-click-upgrade') as HTMLButtonElement,
            clickUpgradePrice: document.getElementById('upgrade-click-price')!,
            clickUpgradeLevel: document.getElementById('upgrade-click-level')!,
            autoUpgradeButton: document.getElementById('buy-auto-upgrade') as HTMLButtonElement,
            autoUpgradePrice: document.getElementById('upgrade-auto-price')!,
            autoUpgradeLevel: document.getElementById('upgrade-auto-level')!,
            resetButton: document.getElementById('reset-button') as HTMLButtonElement,
            upgradeClickCard: document.getElementById('upgrade-click')!,
            upgradeAutoCard: document.getElementById('upgrade-auto')!,
            // Modal de confirmación
            confirmModal: document.getElementById('confirm-modal')!,
            modalCancel: document.getElementById('modal-cancel') as HTMLButtonElement,
            modalConfirm: document.getElementById('modal-confirm') as HTMLButtonElement
        };
    }

    /**
     * Configura todos los event listeners
     */
    private setupEventListeners(): void {
        // Click en el botón principal
        this.elements.clickButton.addEventListener('click', () => this.handleClick());
        
        // Comprar mejora de click
        this.elements.clickUpgradeButton.addEventListener('click', () => this.buyClickUpgrade());
        
        // Comprar mejora de auto-click
        this.elements.autoUpgradeButton.addEventListener('click', () => this.buyAutoUpgrade());
        
        // Reiniciar juego - mostrar modal
        this.elements.resetButton.addEventListener('click', () => this.showConfirmModal());
        
        // Botones del modal
        this.elements.modalCancel.addEventListener('click', () => this.hideConfirmModal());
        this.elements.modalConfirm.addEventListener('click', () => this.confirmReset());
        
        // Cerrar modal al hacer click fuera
        this.elements.confirmModal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.elements.confirmModal) {
                this.hideConfirmModal();
            }
        });
        
        // Guardar antes de cerrar la página
        window.addEventListener('beforeunload', () => this.saveProgress());
    }

    /**
     * Maneja el click en el botón principal
     */
    private handleClick(): void {
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
    private showClickFeedback(): void {
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
    private calculateUpgradePrice(config: UpgradeConfig, level: number): number {
        return Math.floor(config.basePrice * Math.pow(config.priceMultiplier, level));
    }

    /**
     * Obtiene el precio actual de la mejora de click
     */
    private getClickUpgradePrice(): number {
        return this.calculateUpgradePrice(CLICK_UPGRADE_CONFIG, this.state.clickUpgradeLevel);
    }

    /**
     * Obtiene el precio actual de la mejora de auto-click
     */
    private getAutoUpgradePrice(): number {
        return this.calculateUpgradePrice(AUTO_UPGRADE_CONFIG, this.state.autoUpgradeLevel);
    }

    /**
     * Compra la mejora de click potenciado
     */
    private buyClickUpgrade(): void {
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
    private buyAutoUpgrade(): void {
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
    private startAutoClicker(): void {
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
    private updateUI(): void {
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
    private formatNumber(num: number): string {
        return num.toLocaleString('es-ES');
    }

    /**
     * Guarda el progreso en localStorage
     */
    private saveProgress(): void {
        try {
            const stateJSON = JSON.stringify(this.state);
            localStorage.setItem(STORAGE_KEY, stateJSON);
        } catch (error) {
            console.error('Error al guardar el progreso:', error);
        }
    }

    /**
     * Carga el progreso desde localStorage
     */
    private loadProgress(): void {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            
            if (savedState) {
                const parsedState = JSON.parse(savedState) as GameState;
                
                // Validar que el estado cargado tiene todas las propiedades necesarias
                if (this.isValidState(parsedState)) {
                    this.state = parsedState;
                    console.log('Progreso cargado correctamente');
                } else {
                    console.warn('Estado guardado inválido, usando valores por defecto');
                }
            }
        } catch (error) {
            console.error('Error al cargar el progreso:', error);
        }
    }

    /**
     * Valida que un objeto tenga la estructura correcta de GameState
     */
    private isValidState(obj: unknown): obj is GameState {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        
        const state = obj as Record<string, unknown>;
        
        return (
            typeof state.score === 'number' &&
            typeof state.pointsPerClick === 'number' &&
            typeof state.pointsPerSecond === 'number' &&
            typeof state.clickUpgradeLevel === 'number' &&
            typeof state.autoUpgradeLevel === 'number' &&
            state.score >= 0 &&
            state.pointsPerClick >= 1 &&
            state.pointsPerSecond >= 0 &&
            state.clickUpgradeLevel >= 0 &&
            state.autoUpgradeLevel >= 0
        );
    }

    /**
     * Muestra el modal de confirmación
     */
    private showConfirmModal(): void {
        this.elements.confirmModal.classList.remove('hidden');
    }

    /**
     * Oculta el modal de confirmación
     */
    private hideConfirmModal(): void {
        this.elements.confirmModal.classList.add('hidden');
    }

    /**
     * Confirma el reinicio del juego desde el modal
     */
    private confirmReset(): void {
        // Ocultar el modal
        this.hideConfirmModal();
        
        // Reiniciar el juego
        this.resetGame();
    }

    /**
     * Reinicia el juego completamente
     */
    private resetGame(): void {
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
    (window as unknown as { game: ClickerGame }).game = game;
    
    console.log('🎮 Clicker Game iniciado!');
});
