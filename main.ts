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
    purchasedItems: string[];   // IDs de ítems comprados en la tienda
}

/**
 * Interfaz para la configuración de mejoras
 */
interface UpgradeConfig {
    basePrice: number;         // Precio base de la mejora
    priceMultiplier: number;   // Multiplicador de precio por nivel
    effect: number;            // Efecto de la mejora
}

/**
 * Tipo de efecto que puede tener un ítem de tienda
 */
type ShopItemEffect = 
    | { type: 'clickBonus'; value: number }      // Bonus permanente por click
    | { type: 'autoBonus'; value: number }       // Bonus permanente por segundo
    | { type: 'visual'; value: string }          // Efecto visual (clase CSS)
    | { type: 'multiplier'; value: number };     // Multiplicador de puntos

/**
 * Interfaz para ítems de la tienda
 */
interface ShopItem {
    id: string;                // Identificador único
    name: string;              // Nombre del ítem
    description: string;       // Descripción del efecto
    icon: string;              // Emoji o icono
    price: number;             // Precio en puntos
    effect: ShopItemEffect;    // Efecto al comprar
}

/**
 * Interfaz para la configuración del juego
 */
interface GameSettings {
    soundEnabled: boolean;         // Sonidos activados
    animationsEnabled: boolean;    // Animaciones activadas
    theme: 'dark' | 'light';       // Tema visual
    confirmPurchases: boolean;     // Confirmar compras en tienda
}

/**
 * Interfaz para el perfil del jugador
 */
interface PlayerProfile {
    name: string;                  // Nombre del jugador
    avatar: string;                // Emoji del avatar
    totalClicks: number;           // Total de clicks realizados
    totalPointsEarned: number;     // Total de puntos ganados (histórico)
    totalTimePlayed: number;       // Tiempo total jugado en segundos
    level: number;                 // Nivel del jugador (calculado)
}

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

/** Clave para guardar en localStorage */
const STORAGE_KEY = 'clickerGameState';

/** Clave para guardar configuración en localStorage */
const SETTINGS_KEY = 'clickerGameSettings';

/** Clave para guardar perfil en localStorage */
const PROFILE_KEY = 'clickerGameProfile';

/** Niveles: puntos requeridos para cada nivel */
const LEVEL_THRESHOLDS: number[] = [
    0,        // Nivel 1
    100,      // Nivel 2
    500,      // Nivel 3
    1000,     // Nivel 4
    2500,     // Nivel 5
    5000,     // Nivel 6
    10000,    // Nivel 7
    25000,    // Nivel 8
    50000,    // Nivel 9
    100000,   // Nivel 10
    250000,   // Nivel 11
    500000,   // Nivel 12
    1000000,  // Nivel 13
    // ... se pueden agregar más
];

/** Nivel máximo */
const MAX_LEVEL = 100;

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

/**
 * Configuración de ítems de la tienda
 * Agregar nuevos ítems es tan simple como añadir objetos a este array
 */
const SHOP_ITEMS: ShopItem[] = [
    // === ÍTEMS DE PROGRESO ===
    {
        id: 'golden_finger',
        name: 'Dedo Dorado',
        description: '+5 puntos permanentes por cada click',
        icon: '👆',
        price: 10000,
        effect: { type: 'clickBonus', value: 5 }
    },
    {
        id: 'lucky_clover',
        name: 'Trébol de la Suerte',
        description: '+10 puntos permanentes por cada click',
        icon: '🍀',
        price: 50000,
        effect: { type: 'clickBonus', value: 10 }
    },
    {
        id: 'mini_robot',
        name: 'Mini Robot',
        description: '+3 puntos automáticos por segundo',
        icon: '🤖',
        price: 25000,
        effect: { type: 'autoBonus', value: 3 }
    },
    {
        id: 'turbo_engine',
        name: 'Motor Turbo',
        description: '+5 puntos automáticos por segundo',
        icon: '⚡',
        price: 75000,
        effect: { type: 'autoBonus', value: 5 }
    },
    // === ÍTEMS VISUALES ===
    {
        id: 'neon_glow',
        name: 'Brillo Neón',
        description: 'Añade un efecto de brillo extra al botón',
        icon: '✨',
        price: 5000,
        effect: { type: 'visual', value: 'neon-glow-effect' }
    },
    {
        id: 'rainbow_border',
        name: 'Borde Arcoíris',
        description: 'El botón principal tiene un borde animado',
        icon: '🌈',
        price: 15000,
        effect: { type: 'visual', value: 'rainbow-border-effect' }
    },
    {
        id: 'particle_trail',
        name: 'Estela de Partículas',
        description: 'Efecto de partículas al hacer click',
        icon: '💫',
        price: 35000,
        effect: { type: 'visual', value: 'particle-effect' }
    },
    // === ÍTEMS ESPECIALES ===
    {
        id: 'double_trouble',
        name: 'Doble Problema',
        description: 'Duplica todos los puntos ganados (x2)',
        icon: '🎯',
        price: 100000,
        effect: { type: 'multiplier', value: 2 }
    }
];

// ============================================
// CLASE PRINCIPAL DEL JUEGO
// ============================================

/**
 * Clase que maneja toda la lógica del juego Clicker
 */
class ClickerGame {
    // Estado del juego
    private state: GameState;
    
    // Perfil del jugador
    private profile: PlayerProfile;
    
    // Referencias a elementos del DOM
    private elements: {
        // Pantallas
        mainMenu: HTMLElement;
        gameScreen: HTMLElement;
        shopScreen: HTMLElement;
        profileScreen: HTMLElement;
        settingsScreen: HTMLElement;
        // Menú
        playButton: HTMLButtonElement;
        shopButton: HTMLButtonElement;
        profileButton: HTMLButtonElement;
        settingsButton: HTMLButtonElement;
        // Perfil
        profileAvatar: HTMLElement;
        changeAvatarBtn: HTMLButtonElement;
        avatarSelector: HTMLElement;
        avatarOptions: NodeListOf<HTMLButtonElement>;
        profileNameInput: HTMLInputElement;
        profileNameSaved: HTMLElement;
        profileLevel: HTMLElement;
        statTotalClicks: HTMLElement;
        statTotalPoints: HTMLElement;
        statTimePlayed: HTMLElement;
        statPointsPerClick: HTMLElement;
        progressUpgrades: HTMLElement;
        progressUpgradesBar: HTMLElement;
        progressItems: HTMLElement;
        progressItemsBar: HTMLElement;
        progressLevel: HTMLElement;
        progressLevelBar: HTMLElement;
        progressLevelHint: HTMLElement;
        // Tienda
        shopScore: HTMLElement;
        shopItemsContainer: HTMLElement;
        // Juego
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
        menuButton: HTMLButtonElement;
        upgradeClickCard: HTMLElement;
        upgradeAutoCard: HTMLElement;
        // Modal de confirmación
        confirmModal: HTMLElement;
        modalTitle: HTMLElement;
        modalMessage: HTMLElement;
        modalCancel: HTMLButtonElement;
        modalConfirm: HTMLButtonElement;
        // Botones volver
        backButtons: NodeListOf<HTMLButtonElement>;
        // Configuración
        settingSoundToggle: HTMLInputElement;
        settingAnimationsToggle: HTMLInputElement;
        settingConfirmPurchasesToggle: HTMLInputElement;
        themeButtons: NodeListOf<HTMLButtonElement>;
        settingsResetBtn: HTMLButtonElement;
    };
    
    // Multiplicador de puntos (de ítems de tienda)
    private pointsMultiplier: number = 1;
    
    // Configuración del juego
    private settings: GameSettings;
    
    // ID del intervalo del auto-clicker
    private autoClickerInterval: number | null = null;
    
    // Acción pendiente de confirmación
    private pendingAction: (() => void) | null = null;

    // Flag para saber si el perfil está visible
    private isProfileVisible: boolean = false;

    /**
     * Constructor: inicializa el juego
     */
    constructor() {
        // Inicializar estado por defecto
        this.state = this.getDefaultState();
        
        // Inicializar configuración por defecto
        this.settings = this.getDefaultSettings();
        
        // Inicializar perfil por defecto
        this.profile = this.getDefaultProfile();
        
        // Obtener referencias a elementos del DOM
        this.elements = this.getElements();
        
        // Cargar progreso guardado
        this.loadProgress();
        
        // Cargar configuración guardada
        this.loadSettings();
        
        // Cargar perfil guardado
        this.loadProfile();
        
        // Aplicar configuración al juego
        this.applySettings();
        
        // Aplicar efectos de ítems comprados
        this.applyPurchasedItemsEffects();
        
        // Renderizar tienda
        this.renderShop();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Iniciar auto-clicker si corresponde
        this.startAutoClicker();
        
        // Iniciar contador de tiempo
        this.startTimeTracking();
        
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
            autoUpgradeLevel: 0,
            purchasedItems: []
        };
    }

    /**
     * Devuelve la configuración por defecto
     */
    private getDefaultSettings(): GameSettings {
        return {
            soundEnabled: true,
            animationsEnabled: true,
            theme: 'dark',
            confirmPurchases: false
        };
    }

    /**
     * Devuelve el perfil por defecto
     */
    private getDefaultProfile(): PlayerProfile {
        return {
            name: 'Jugador',
            avatar: '😊',
            totalClicks: 0,
            totalPointsEarned: 0,
            totalTimePlayed: 0,
            level: 1
        };
    }

    /**
     * Obtiene referencias a todos los elementos del DOM necesarios
     */
    private getElements() {
        return {
            // Pantallas
            mainMenu: document.getElementById('main-menu')!,
            gameScreen: document.getElementById('game-screen')!,
            shopScreen: document.getElementById('shop-screen')!,
            profileScreen: document.getElementById('profile-screen')!,
            settingsScreen: document.getElementById('settings-screen')!,
            // Menú
            playButton: document.getElementById('play-button') as HTMLButtonElement,
            shopButton: document.getElementById('shop-button') as HTMLButtonElement,
            profileButton: document.getElementById('profile-button') as HTMLButtonElement,
            settingsButton: document.getElementById('settings-button') as HTMLButtonElement,
            // Perfil
            profileAvatar: document.getElementById('profile-avatar')!,
            changeAvatarBtn: document.getElementById('change-avatar-btn') as HTMLButtonElement,
            avatarSelector: document.getElementById('avatar-selector')!,
            avatarOptions: document.querySelectorAll('.avatar-option') as NodeListOf<HTMLButtonElement>,
            profileNameInput: document.getElementById('profile-name') as HTMLInputElement,
            profileNameSaved: document.getElementById('profile-name-saved')!,
            profileLevel: document.getElementById('profile-level')!,
            statTotalClicks: document.getElementById('stat-total-clicks')!,
            statTotalPoints: document.getElementById('stat-total-points')!,
            statTimePlayed: document.getElementById('stat-time-played')!,
            statPointsPerClick: document.getElementById('stat-points-per-click')!,
            progressUpgrades: document.getElementById('progress-upgrades')!,
            progressUpgradesBar: document.getElementById('progress-upgrades-bar')!,
            progressItems: document.getElementById('progress-items')!,
            progressItemsBar: document.getElementById('progress-items-bar')!,
            progressLevel: document.getElementById('progress-level')!,
            progressLevelBar: document.getElementById('progress-level-bar')!,
            progressLevelHint: document.getElementById('progress-level-hint')!,
            // Tienda
            shopScore: document.getElementById('shop-score')!,
            shopItemsContainer: document.getElementById('shop-items')!,
            // Juego
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
            menuButton: document.getElementById('menu-button') as HTMLButtonElement,
            upgradeClickCard: document.getElementById('upgrade-click')!,
            upgradeAutoCard: document.getElementById('upgrade-auto')!,
            // Modal de confirmación
            confirmModal: document.getElementById('confirm-modal')!,
            modalTitle: document.getElementById('modal-title')!,
            modalMessage: document.getElementById('modal-message')!,
            modalCancel: document.getElementById('modal-cancel') as HTMLButtonElement,
            modalConfirm: document.getElementById('modal-confirm') as HTMLButtonElement,
            // Botones volver
            backButtons: document.querySelectorAll('.back-btn') as NodeListOf<HTMLButtonElement>,
            // Configuración
            settingSoundToggle: document.getElementById('setting-sound') as HTMLInputElement,
            settingAnimationsToggle: document.getElementById('setting-animations') as HTMLInputElement,
            settingConfirmPurchasesToggle: document.getElementById('setting-confirm-purchases') as HTMLInputElement,
            themeButtons: document.querySelectorAll('.theme-btn') as NodeListOf<HTMLButtonElement>,
            settingsResetBtn: document.getElementById('settings-reset-btn') as HTMLButtonElement
        };
    }

    /**
     * Configura todos los event listeners
     */
    private setupEventListeners(): void {
        // Navegación menú principal
        this.elements.playButton.addEventListener('click', () => this.showScreen('game'));
        this.elements.shopButton.addEventListener('click', () => this.showScreen('shop'));
        this.elements.profileButton.addEventListener('click', () => this.showScreen('profile'));
        this.elements.settingsButton.addEventListener('click', () => this.showScreen('settings'));
        this.elements.menuButton.addEventListener('click', () => this.showScreen('menu'));
        
        // Botones de volver
        this.elements.backButtons.forEach(btn => {
            btn.addEventListener('click', () => this.showScreen('menu'));
        });
        
        // Click en el botón principal
        this.elements.clickButton.addEventListener('click', () => this.handleClick());
        
        // Comprar mejora de click
        this.elements.clickUpgradeButton.addEventListener('click', () => this.buyClickUpgrade());
        
        // Comprar mejora de auto-click
        this.elements.autoUpgradeButton.addEventListener('click', () => this.buyAutoUpgrade());
        
        // Reiniciar juego - mostrar modal
        this.elements.resetButton.addEventListener('click', () => this.showResetConfirmation());
        
        // Botones del modal
        this.elements.modalCancel.addEventListener('click', () => this.hideConfirmModal());
        this.elements.modalConfirm.addEventListener('click', () => this.confirmAction());
        
        // Cerrar modal al hacer click fuera
        this.elements.confirmModal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.elements.confirmModal) {
                this.hideConfirmModal();
            }
        });
        
        // === EVENTOS DEL PERFIL ===
        
        // Botón para cambiar avatar
        this.elements.changeAvatarBtn.addEventListener('click', () => this.toggleAvatarSelector());
        
        // Opciones de avatar
        this.elements.avatarOptions.forEach(option => {
            option.addEventListener('click', () => {
                const avatar = option.dataset.avatar;
                if (avatar) {
                    this.setAvatar(avatar);
                }
            });
        });
        
        // Input del nombre del jugador
        let nameTimeout: number | null = null;
        this.elements.profileNameInput.addEventListener('input', () => {
            // Debounce para no guardar en cada tecla
            if (nameTimeout) {
                clearTimeout(nameTimeout);
            }
            nameTimeout = window.setTimeout(() => {
                this.setPlayerName(this.elements.profileNameInput.value);
            }, 500);
        });
        
        // Guardar nombre al perder el foco
        this.elements.profileNameInput.addEventListener('blur', () => {
            if (nameTimeout) {
                clearTimeout(nameTimeout);
            }
            this.setPlayerName(this.elements.profileNameInput.value);
        });
        
        // === EVENTOS DE CONFIGURACIÓN ===
        
        // Toggle de sonido
        this.elements.settingSoundToggle.addEventListener('change', () => {
            this.settings.soundEnabled = this.elements.settingSoundToggle.checked;
            this.saveSettings();
        });
        
        // Toggle de animaciones
        this.elements.settingAnimationsToggle.addEventListener('change', () => {
            this.settings.animationsEnabled = this.elements.settingAnimationsToggle.checked;
            this.applyAnimationsSetting();
            this.saveSettings();
        });
        
        // Toggle de confirmar compras
        this.elements.settingConfirmPurchasesToggle.addEventListener('change', () => {
            this.settings.confirmPurchases = this.elements.settingConfirmPurchasesToggle.checked;
            this.saveSettings();
        });
        
        // Botones de tema
        this.elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme as 'dark' | 'light';
                this.setTheme(theme);
            });
        });
        
        // Botón de reiniciar desde configuración
        this.elements.settingsResetBtn.addEventListener('click', () => this.showResetConfirmation());
        
        // Guardar antes de cerrar la página
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
            this.saveSettings();
            this.saveProfile();
        });
    }

    /**
     * Oculta todas las pantallas
     */
    private hideAllScreens(): void {
        this.elements.mainMenu.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.elements.shopScreen.classList.add('hidden');
        this.elements.profileScreen.classList.add('hidden');
        this.elements.settingsScreen.classList.add('hidden');
    }

    /**
     * Muestra una pantalla específica
     */
    private showScreen(screen: 'menu' | 'game' | 'shop' | 'profile' | 'settings'): void {
        this.hideAllScreens();
        
        // Ocultar el selector de avatar si estaba abierto
        this.elements.avatarSelector.classList.add('hidden');
        
        // Marcar si el perfil está visible
        this.isProfileVisible = screen === 'profile';
        
        switch (screen) {
            case 'menu':
                this.elements.mainMenu.classList.remove('hidden');
                this.saveProgress();
                this.saveProfile();
                break;
            case 'game':
                this.elements.gameScreen.classList.remove('hidden');
                break;
            case 'shop':
                this.updateShopUI();
                this.elements.shopScreen.classList.remove('hidden');
                break;
            case 'profile':
                this.updateProfileUI();
                this.elements.profileScreen.classList.remove('hidden');
                break;
            case 'settings':
                this.elements.settingsScreen.classList.remove('hidden');
                break;
        }
    }

    // ============================================
    // SISTEMA DE PERFIL
    // ============================================

    /**
     * Carga el perfil desde localStorage
     */
    private loadProfile(): void {
        try {
            const savedProfile = localStorage.getItem(PROFILE_KEY);
            
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile) as Partial<PlayerProfile>;
                
                // Combinar con valores por defecto (compatibilidad)
                this.profile = {
                    ...this.getDefaultProfile(),
                    ...parsedProfile
                };
                
                // Recalcular nivel por si acaso
                this.profile.level = this.calculateLevel(this.profile.totalPointsEarned);
                
                console.log('Perfil cargado correctamente');
            }
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
        }
    }

    /**
     * Guarda el perfil en localStorage
     */
    private saveProfile(): void {
        try {
            const profileJSON = JSON.stringify(this.profile);
            localStorage.setItem(PROFILE_KEY, profileJSON);
        } catch (error) {
            console.error('Error al guardar el perfil:', error);
        }
    }

    /**
     * Actualiza la UI del perfil
     */
    private updateProfileUI(): void {
        // Información básica
        this.elements.profileAvatar.textContent = this.profile.avatar;
        this.elements.profileNameInput.value = this.profile.name;
        this.elements.profileLevel.textContent = this.profile.level.toString();
        
        // Marcar avatar actual como seleccionado
        this.updateAvatarSelection();
        
        // Estadísticas
        this.elements.statTotalClicks.textContent = this.formatNumber(this.profile.totalClicks);
        this.elements.statTotalPoints.textContent = this.formatNumber(this.profile.totalPointsEarned);
        this.elements.statTimePlayed.textContent = this.formatTime(this.profile.totalTimePlayed);
        
        const effectiveClickPoints = this.state.pointsPerClick * this.pointsMultiplier;
        this.elements.statPointsPerClick.textContent = effectiveClickPoints.toString();
        
        // Progreso - Mejoras
        const totalUpgrades = this.state.clickUpgradeLevel + this.state.autoUpgradeLevel;
        this.elements.progressUpgrades.textContent = totalUpgrades.toString();
        const upgradesPercent = Math.min((totalUpgrades / 20) * 100, 100); // Max 20 mejoras como referencia
        this.elements.progressUpgradesBar.style.width = `${upgradesPercent}%`;
        
        // Progreso - Ítems de tienda
        const totalShopItems = SHOP_ITEMS.length;
        const purchasedItems = this.state.purchasedItems.length;
        this.elements.progressItems.textContent = `${purchasedItems}/${totalShopItems}`;
        const itemsPercent = (purchasedItems / totalShopItems) * 100;
        this.elements.progressItemsBar.style.width = `${itemsPercent}%`;
        
        // Progreso - Nivel
        this.updateLevelProgress();
    }

    /**
     * Actualiza la barra de progreso del nivel
     */
    private updateLevelProgress(): void {
        const currentLevel = this.profile.level;
        const nextLevel = Math.min(currentLevel + 1, MAX_LEVEL);
        
        this.elements.progressLevel.textContent = `${currentLevel}/${MAX_LEVEL}`;
        
        // Calcular progreso hacia el siguiente nivel
        const currentThreshold = this.getLevelThreshold(currentLevel);
        const nextThreshold = this.getLevelThreshold(nextLevel);
        
        if (currentLevel >= MAX_LEVEL) {
            // Nivel máximo alcanzado
            this.elements.progressLevelBar.style.width = '100%';
            this.elements.progressLevelHint.textContent = '¡Nivel máximo alcanzado!';
        } else {
            const pointsInCurrentLevel = this.profile.totalPointsEarned - currentThreshold;
            const pointsNeededForNextLevel = nextThreshold - currentThreshold;
            const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;
            
            this.elements.progressLevelBar.style.width = `${Math.min(progress, 100)}%`;
            this.elements.progressLevelHint.textContent = 
                `${this.formatNumber(this.profile.totalPointsEarned)} / ${this.formatNumber(nextThreshold)} puntos para nivel ${nextLevel}`;
        }
    }

    /**
     * Obtiene el umbral de puntos para un nivel
     */
    private getLevelThreshold(level: number): number {
        if (level <= 0) return 0;
        if (level <= LEVEL_THRESHOLDS.length) {
            const threshold = LEVEL_THRESHOLDS[level - 1];
            return threshold !== undefined ? threshold : 0;
        }
        // Para niveles más allá de los definidos, usar fórmula exponencial
        const lastDefined = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] ?? 1000000;
        const extraLevels = level - LEVEL_THRESHOLDS.length;
        return Math.floor(lastDefined * Math.pow(2, extraLevels));
    }

    /**
     * Calcula el nivel basado en los puntos totales
     */
    private calculateLevel(totalPoints: number): number {
        let level = 1;
        
        // Buscar en los umbrales definidos
        for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
            const threshold = LEVEL_THRESHOLDS[i];
            if (threshold !== undefined && totalPoints >= threshold) {
                level = i + 1;
            } else {
                break;
            }
        }
        
        // Si supera todos los umbrales definidos, calcular niveles extra
        const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] ?? 1000000;
        if (totalPoints >= lastThreshold) {
            let threshold = lastThreshold;
            let extraLevel = LEVEL_THRESHOLDS.length;
            
            while (threshold <= totalPoints && extraLevel < MAX_LEVEL) {
                threshold *= 2;
                if (totalPoints >= threshold) {
                    extraLevel++;
                }
            }
            
            level = Math.min(extraLevel, MAX_LEVEL);
        }
        
        return level;
    }

    /**
     * Cambia el avatar del jugador
     */
    private setAvatar(avatar: string): void {
        this.profile.avatar = avatar;
        this.elements.profileAvatar.textContent = avatar;
        this.updateAvatarSelection();
        this.elements.avatarSelector.classList.add('hidden');
        this.saveProfile();
    }

    /**
     * Actualiza la selección visual del avatar
     */
    private updateAvatarSelection(): void {
        this.elements.avatarOptions.forEach(option => {
            if (option.dataset.avatar === this.profile.avatar) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    /**
     * Muestra/oculta el selector de avatar
     */
    private toggleAvatarSelector(): void {
        this.elements.avatarSelector.classList.toggle('hidden');
    }

    /**
     * Cambia el nombre del jugador
     */
    private setPlayerName(name: string): void {
        const trimmedName = name.trim() || 'Jugador';
        this.profile.name = trimmedName;
        
        // Mostrar indicador de guardado
        this.elements.profileNameSaved.classList.remove('hidden');
        setTimeout(() => {
            this.elements.profileNameSaved.classList.add('hidden');
        }, 1500);
        
        this.saveProfile();
    }

    /**
     * Formatea el tiempo en formato HH:MM:SS
     */
    private formatTime(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }

    /**
     * Inicia el contador de tiempo jugado
     */
    private startTimeTracking(): void {
        // Actualizar cada segundo (el intervalo se mantiene activo durante toda la sesión)
        window.setInterval(() => {
            this.profile.totalTimePlayed++;
            
            // Si el perfil está visible, actualizar el display
            if (this.isProfileVisible) {
                this.elements.statTimePlayed.textContent = this.formatTime(this.profile.totalTimePlayed);
            }
            
            // Guardar cada minuto
            if (this.profile.totalTimePlayed % 60 === 0) {
                this.saveProfile();
            }
        }, 1000);
    }

    /**
     * Registra puntos ganados y actualiza estadísticas
     */
    private recordPointsEarned(points: number): void {
        this.profile.totalPointsEarned += points;
        
        // Verificar si subió de nivel
        const newLevel = this.calculateLevel(this.profile.totalPointsEarned);
        if (newLevel > this.profile.level) {
            this.profile.level = newLevel;
            // Aquí se podría agregar una animación de nivel
            console.log(`¡Subiste al nivel ${newLevel}!`);
        }
    }

    /**
     * Registra un click
     */
    private recordClick(): void {
        this.profile.totalClicks++;
    }

    // ============================================
    // SISTEMA DE CONFIGURACIÓN
    // ============================================

    /**
     * Carga la configuración desde localStorage
     */
    private loadSettings(): void {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings) as Partial<GameSettings>;
                
                // Combinar con valores por defecto (por si hay nuevas opciones)
                this.settings = {
                    ...this.getDefaultSettings(),
                    ...parsedSettings
                };
                
                console.log('Configuración cargada correctamente');
            }
        } catch (error) {
            console.error('Error al cargar la configuración:', error);
        }
    }

    /**
     * Guarda la configuración en localStorage
     */
    private saveSettings(): void {
        try {
            const settingsJSON = JSON.stringify(this.settings);
            localStorage.setItem(SETTINGS_KEY, settingsJSON);
        } catch (error) {
            console.error('Error al guardar la configuración:', error);
        }
    }

    /**
     * Aplica todas las configuraciones guardadas
     */
    private applySettings(): void {
        // Actualizar toggles en la UI
        this.elements.settingSoundToggle.checked = this.settings.soundEnabled;
        this.elements.settingAnimationsToggle.checked = this.settings.animationsEnabled;
        this.elements.settingConfirmPurchasesToggle.checked = this.settings.confirmPurchases;
        
        // Aplicar tema
        this.applyThemeSetting();
        
        // Aplicar animaciones
        this.applyAnimationsSetting();
        
        // Actualizar botones de tema activos
        this.updateThemeButtons();
    }

    /**
     * Aplica el tema visual
     */
    private applyThemeSetting(): void {
        document.body.classList.remove('theme-light', 'theme-dark');
        
        if (this.settings.theme === 'light') {
            document.body.classList.add('theme-light');
        }
    }

    /**
     * Aplica la configuración de animaciones
     */
    private applyAnimationsSetting(): void {
        if (this.settings.animationsEnabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    }

    /**
     * Cambia el tema y lo aplica
     */
    private setTheme(theme: 'dark' | 'light'): void {
        this.settings.theme = theme;
        this.applyThemeSetting();
        this.updateThemeButtons();
        this.saveSettings();
    }

    /**
     * Actualiza los botones de tema para mostrar el activo
     */
    private updateThemeButtons(): void {
        this.elements.themeButtons.forEach(btn => {
            const btnTheme = btn.dataset.theme;
            if (btnTheme === this.settings.theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ============================================
    // SISTEMA DE TIENDA
    // ============================================

    /**
     * Renderiza todos los ítems de la tienda
     */
    private renderShop(): void {
        const container = this.elements.shopItemsContainer;
        container.innerHTML = '';

        SHOP_ITEMS.forEach(item => {
            const itemElement = this.createShopItemElement(item);
            container.appendChild(itemElement);
        });
    }

    /**
     * Crea el elemento HTML para un ítem de tienda
     */
    private createShopItemElement(item: ShopItem): HTMLElement {
        const isPurchased = this.state.purchasedItems.includes(item.id);
        const canAfford = this.state.score >= item.price;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.dataset.itemId = item.id;

        // Agregar clases de estado
        if (isPurchased) {
            div.classList.add('purchased');
        } else if (!canAfford) {
            div.classList.add('unavailable');
        }

        div.innerHTML = `
            <div class="shop-item-header">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                </div>
            </div>
            <div class="shop-item-footer">
                <div class="shop-item-price">
                    <span class="shop-item-price-icon">💰</span>
                    <span>${this.formatNumber(item.price)}</span>
                </div>
                <div class="purchased-badge">✓ Comprado</div>
                <button class="shop-buy-btn ${isPurchased ? 'purchased' : (canAfford ? 'available' : 'unavailable')}"
                        ${isPurchased || !canAfford ? 'disabled' : ''}>
                    ${isPurchased ? '✓ Comprado' : 'Comprar'}
                </button>
            </div>
        `;

        // Agregar evento de compra si no está comprado
        if (!isPurchased) {
            const buyBtn = div.querySelector('.shop-buy-btn') as HTMLButtonElement;
            buyBtn.addEventListener('click', () => this.purchaseItem(item));
        }

        return div;
    }

    /**
     * Inicia el proceso de compra de un ítem
     */
    private purchaseItem(item: ShopItem): void {
        // Verificar que no esté comprado y que tenga suficientes puntos
        if (this.state.purchasedItems.includes(item.id)) {
            return;
        }
        if (this.state.score < item.price) {
            return;
        }

        // Si la confirmación está habilitada, mostrar modal
        if (this.settings.confirmPurchases) {
            this.showConfirmModal(
                '🛒 Confirmar Compra',
                `¿Comprar "${item.name}" por ${this.formatNumber(item.price)} puntos?`,
                'Comprar',
                () => this.executePurchase(item)
            );
        } else {
            // Comprar directamente
            this.executePurchase(item);
        }
    }

    /**
     * Ejecuta la compra de un ítem (después de confirmación)
     */
    private executePurchase(item: ShopItem): void {
        // Descontar puntos
        this.state.score -= item.price;

        // Marcar como comprado
        this.state.purchasedItems.push(item.id);

        // Aplicar efecto del ítem
        this.applyItemEffect(item);

        // Animación de compra exitosa
        const itemElement = this.elements.shopItemsContainer.querySelector(`[data-item-id="${item.id}"]`);
        if (itemElement) {
            itemElement.classList.add('just-purchased');
            setTimeout(() => {
                itemElement.classList.remove('just-purchased');
            }, 500);
        }

        // Actualizar UI
        this.updateShopUI();
        this.updateUI();
        this.saveProgress();
    }

    /**
     * Aplica el efecto de un ítem al comprarlo
     */
    private applyItemEffect(item: ShopItem): void {
        switch (item.effect.type) {
            case 'clickBonus':
                this.state.pointsPerClick += item.effect.value;
                break;
            case 'autoBonus':
                this.state.pointsPerSecond += item.effect.value;
                this.startAutoClicker(); // Reiniciar auto-clicker con nuevo valor
                break;
            case 'visual':
                this.elements.clickButton.classList.add(item.effect.value);
                break;
            case 'multiplier':
                this.pointsMultiplier *= item.effect.value;
                break;
        }
    }

    /**
     * Aplica los efectos de todos los ítems comprados (al cargar)
     */
    private applyPurchasedItemsEffects(): void {
        this.state.purchasedItems.forEach(itemId => {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (item) {
                // Solo aplicar efectos visuales y multiplicadores
                // Los bonus de click/auto ya están en el estado guardado
                if (item.effect.type === 'visual') {
                    this.elements.clickButton.classList.add(item.effect.value);
                } else if (item.effect.type === 'multiplier') {
                    this.pointsMultiplier *= item.effect.value;
                }
            }
        });
    }

    /**
     * Actualiza la UI de la tienda
     */
    private updateShopUI(): void {
        // Actualizar balance mostrado
        this.elements.shopScore.textContent = this.formatNumber(this.state.score);

        // Actualizar estado de cada ítem
        SHOP_ITEMS.forEach(item => {
            const itemElement = this.elements.shopItemsContainer.querySelector(`[data-item-id="${item.id}"]`);
            if (!itemElement) return;

            const isPurchased = this.state.purchasedItems.includes(item.id);
            const canAfford = this.state.score >= item.price;
            const buyBtn = itemElement.querySelector('.shop-buy-btn') as HTMLButtonElement;

            // Actualizar clases del contenedor
            itemElement.classList.remove('purchased', 'unavailable');
            if (isPurchased) {
                itemElement.classList.add('purchased');
            } else if (!canAfford) {
                itemElement.classList.add('unavailable');
            }

            // Actualizar botón
            if (buyBtn) {
                buyBtn.className = 'shop-buy-btn';
                if (isPurchased) {
                    buyBtn.classList.add('purchased');
                    buyBtn.disabled = true;
                    buyBtn.textContent = '✓ Comprado';
                } else if (canAfford) {
                    buyBtn.classList.add('available');
                    buyBtn.disabled = false;
                    buyBtn.textContent = 'Comprar';
                } else {
                    buyBtn.classList.add('unavailable');
                    buyBtn.disabled = true;
                    buyBtn.textContent = 'Comprar';
                }
            }
        });
    }

    /**
     * Maneja el click en el botón principal
     */
    private handleClick(): void {
        // Sumar puntos (con multiplicador)
        const points = this.state.pointsPerClick * this.pointsMultiplier;
        this.state.score += points;
        
        // Registrar estadísticas del perfil
        this.recordClick();
        this.recordPointsEarned(points);
        
        // Mostrar feedback visual
        this.showClickFeedback();
        
        // Actualizar UI y guardar
        this.updateUI();
        this.updateShopUI();
        this.saveProgress();
    }

    /**
     * Muestra el feedback visual al hacer click (+N puntos flotando)
     */
    private showClickFeedback(): void {
        const feedback = this.elements.clickFeedback;
        
        // Crear el texto del feedback (con multiplicador)
        const points = this.state.pointsPerClick * this.pointsMultiplier;
        feedback.textContent = `+${points}`;
        
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
            this.updateShopUI();
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
            this.updateShopUI();
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
                // Aplicar multiplicador
                const points = this.state.pointsPerSecond * this.pointsMultiplier;
                this.state.score += points;
                
                // Registrar puntos ganados en el perfil
                this.recordPointsEarned(points);
                
                this.updateUI();
                this.updateShopUI();
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
        
        // Actualizar estadísticas (con multiplicador si aplica)
        const effectiveClickPoints = this.state.pointsPerClick * this.pointsMultiplier;
        const effectiveAutoPoints = this.state.pointsPerSecond * this.pointsMultiplier;
        this.elements.pointsPerClick.textContent = effectiveClickPoints.toString();
        this.elements.pointsPerSecond.textContent = effectiveAutoPoints.toString();
        
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
        
        // Validar campos básicos
        const basicValid = (
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

        // Si no tiene purchasedItems, agregarlo como array vacío (compatibilidad)
        if (basicValid && !Array.isArray(state.purchasedItems)) {
            state.purchasedItems = [];
        }

        return basicValid;
    }

    /**
     * Muestra el modal de confirmación con contenido personalizado
     */
    private showConfirmModal(
        title: string = '⚠️ Confirmar',
        message: string = '¿Estás seguro?',
        confirmText: string = 'Confirmar',
        action?: () => void
    ): void {
        // Actualizar contenido del modal
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalConfirm.textContent = confirmText;
        
        // Guardar la acción pendiente
        this.pendingAction = action || null;
        
        // Mostrar modal
        this.elements.confirmModal.classList.remove('hidden');
    }

    /**
     * Oculta el modal de confirmación
     */
    private hideConfirmModal(): void {
        this.elements.confirmModal.classList.add('hidden');
        this.pendingAction = null;
    }

    /**
     * Ejecuta la acción pendiente del modal
     */
    private confirmAction(): void {
        // Ocultar el modal
        this.hideConfirmModal();
        
        // Ejecutar la acción pendiente si existe
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = null;
        }
    }

    /**
     * Muestra el modal de confirmación para reiniciar
     */
    private showResetConfirmation(): void {
        this.showConfirmModal(
            '⚠️ Reiniciar Juego',
            '¿Estás seguro? Se perderá todo el progreso.',
            'Reiniciar',
            () => this.resetGame()
        );
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
        
        // Reiniciar contador de tiempo (pero no detener)
        // El tiempo se resetea en el perfil
        
        // Quitar efectos visuales de ítems comprados
        SHOP_ITEMS.forEach(item => {
            if (item.effect.type === 'visual') {
                this.elements.clickButton.classList.remove(item.effect.value);
            }
        });
        
        // Resetear multiplicador
        this.pointsMultiplier = 1;
        
        // Restaurar estado por defecto
        this.state = this.getDefaultState();
        
        // Resetear estadísticas del perfil (mantener nombre y avatar)
        const savedName = this.profile.name;
        const savedAvatar = this.profile.avatar;
        this.profile = this.getDefaultProfile();
        this.profile.name = savedName;
        this.profile.avatar = savedAvatar;
        
        // Limpiar localStorage del juego y perfil
        localStorage.removeItem(STORAGE_KEY);
        this.saveProfile(); // Guardar perfil reseteado
        
        // Actualizar UI
        this.updateUI();
        this.updateShopUI();
        
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
