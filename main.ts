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

/**
 * Interfaz para una sesión de juego
 */
interface GameSession {
    id: number;                    // Timestamp de inicio
    date: string;                  // Fecha formateada
    duration: number;              // Duración en segundos
    clicks: number;                // Clicks en esta sesión
    pointsEarned: number;          // Puntos ganados en esta sesión
}

/**
 * Interfaz para estadísticas avanzadas
 */
interface AdvancedStats {
    // Actividad
    totalClicks: number;           // Clicks totales históricos
    bestClickStreak: number;       // Mejor racha de clicks (clicks en 1 segundo)
    
    // Producción
    totalPointsEarned: number;     // Puntos totales ganados
    manualPointsEarned: number;    // Puntos ganados por clicks manuales
    autoPointsEarned: number;      // Puntos ganados por auto-clicker
    
    // Tiempo
    totalTimePlayed: number;       // Tiempo total jugado
    activeTime: number;            // Tiempo activo clickeando
    totalSessions: number;         // Número total de sesiones
    
    // Historial
    sessionHistory: GameSession[]; // Últimas sesiones
}

/**
 * Tipo de misión disponible
 */
type MissionType = 'clicks' | 'points' | 'purchase' | 'upgrade' | 'time' | 'prestige';

/**
 * Rango de misión (determina dificultad y recompensa)
 */
type MissionRank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master';

/**
 * Interfaz para una misión
 */
interface Mission {
    id: string;                     // Identificador único
    title: string;                  // Título de la misión
    description: string;            // Descripción del objetivo
    icon: string;                   // Emoji o icono
    type: MissionType;              // Tipo de misión
    rank: MissionRank;              // Rango de la misión
    reward: number;                 // Recompensa en puntos
    target: number;                 // Objetivo a alcanzar
    progress: number;               // Progreso actual
    completed: boolean;             // Si está completada
    completedAt?: number;           // Timestamp de cuando se completó
}

/**
 * Interfaz para el estado del sistema de misiones
 */
interface MissionsState {
    missions: Mission[];            // Lista de misiones
    completedIds: string[];         // IDs de misiones completadas (persistido)
}

/**
 * Interfaz para un registro de prestigio
 */
interface PrestigeRecord {
    number: number;                 // Número de prestigio (1, 2, 3...)
    date: string;                   // Fecha del prestigio
    pointsAtPrestige: number;       // Puntos que tenía al prestigiar
    clicksAtPrestige: number;       // Clicks que tenía al prestigiar
}

/**
 * Interfaz para el estado del sistema de prestigio
 */
interface PrestigeState {
    level: number;                  // Nivel de prestigio actual
    totalHistoricPoints: number;    // Puntos totales históricos (todos los prestigios)
    totalHistoricClicks: number;    // Clicks totales históricos
    totalHistoricItems: number;     // Items comprados históricamente
    totalHistoricMissions: number;  // Misiones completadas históricamente
    history: PrestigeRecord[];      // Historial de prestigios
}

/**
 * Tipo de requisito para desbloquear una etapa
 */
type StageRequirementType = 'points' | 'clicks' | 'missions' | 'prestige' | 'purchases' | 'upgrades';

/**
 * Interfaz para requisito de etapa
 */
interface StageRequirement {
    type: StageRequirementType;
    value: number;
}

/**
 * Interfaz para una etapa del juego
 */
interface GameStage {
    id: string;                     // Identificador único
    name: string;                   // Nombre de la etapa
    description: string;            // Descripción
    icon: string;                   // Emoji o icono
    requirement: StageRequirement;  // Requisito para desbloquear
    unlocks: {
        shopItems?: string[];       // IDs de ítems de tienda que desbloquea
        themes?: string[];          // IDs de temas que desbloquea
        features?: string[];        // Características que desbloquea
    };
}

/**
 * Interfaz para el estado de progresión
 */
interface ProgressionState {
    currentStage: number;           // Índice de etapa actual
    unlockedStages: string[];       // IDs de etapas desbloqueadas
    unlockedThemes: string[];       // IDs de temas desbloqueados
    activeTheme: string;            // ID del tema activo
}

/**
 * Tipo de requisito para desbloquear un tema
 */
type ThemeRequirementType = 'stage' | 'missions' | 'prestige' | 'clicks' | 'points' | 'free';

/**
 * Interfaz para requisito de tema
 */
interface ThemeRequirement {
    type: ThemeRequirementType;
    value: number | string;         // Número o ID de etapa
}

/**
 * Interfaz para un tema visual
 */
interface GameTheme {
    id: string;                     // Identificador único
    name: string;                   // Nombre del tema
    description: string;            // Descripción
    icon: string;                   // Emoji o icono
    requirement: ThemeRequirement;  // Requisito para desbloquear
    cssClass: string;               // Clase CSS a aplicar
    colors: {
        primary: string;
        background: string;
        accent: string;
        neon: string;
    };
}

// ============================================
// SISTEMA DE GUARDADO CENTRALIZADO
// ============================================

/** Versión actual del formato de guardado */
const SAVE_VERSION = 1;

/** Clave maestra para el guardado centralizado */
const MASTER_SAVE_KEY = 'clickerGameSave';

/**
 * Interfaz para el estado completo del juego (guardado centralizado)
 */
interface GameSaveData {
    version: number;                // Versión del formato de guardado
    lastSaveTime: number;           // Timestamp del último guardado
    lastActiveTime: number;         // Timestamp de la última actividad
    gameState: GameState;           // Estado del juego
    settings: GameSettings;         // Configuración
    profile: PlayerProfile;         // Perfil del jugador
    stats: AdvancedStats;           // Estadísticas avanzadas
    missions: {
        completedIds: string[];     // IDs de misiones completadas
    };
    prestige: PrestigeState;        // Estado de prestigio
    progression: ProgressionState;  // Estado de progresión
}

/**
 * Interfaz para el resumen de ganancias offline
 */
interface OfflineEarnings {
    timeAway: number;               // Tiempo fuera en segundos
    pointsEarned: number;           // Puntos ganados offline
    maxOfflineTime: number;         // Tiempo máximo offline considerado
}

/**
 * ============================================
 * SAVE MANAGER - Gestor Central de Guardado
 * ============================================
 * 
 * Centraliza todo el acceso a localStorage para:
 * - Evitar múltiples accesos innecesarios
 * - Mantener versionado de datos
 * - Facilitar migraciones futuras
 * - Manejar errores de forma consistente
 */
class SaveManager {
    private static instance: SaveManager;
    private saveKey: string = MASTER_SAVE_KEY;
    private isDirty: boolean = false;
    
    // Cache del último guardado para evitar lecturas innecesarias
    private cachedData: GameSaveData | null = null;

    private constructor() {}

    /**
     * Obtiene la instancia singleton del SaveManager
     */
    static getInstance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    /**
     * Carga los datos del juego desde localStorage
     * @returns Los datos guardados o null si no existen
     */
    load(): GameSaveData | null {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            
            if (!savedData) {
                // Intentar migrar datos antiguos
                return this.migrateOldSave();
            }
            
            const parsed = JSON.parse(savedData) as GameSaveData;
            
            // Verificar y migrar si es necesario
            if (parsed.version < SAVE_VERSION) {
                return this.migrateSaveData(parsed);
            }
            
            this.cachedData = parsed;
            return parsed;
        } catch (error) {
            console.error('[SaveManager] Error al cargar datos:', error);
            return null;
        }
    }

    /**
     * Guarda los datos del juego en localStorage
     * @param data Los datos completos del juego
     * @returns true si el guardado fue exitoso
     */
    save(data: Omit<GameSaveData, 'version' | 'lastSaveTime'>): boolean {
        try {
            const saveData: GameSaveData = {
                ...data,
                version: SAVE_VERSION,
                lastSaveTime: Date.now()
            };
            
            const serialized = JSON.stringify(saveData);
            localStorage.setItem(this.saveKey, serialized);
            
            this.cachedData = saveData;
            this.isDirty = false;
            
            console.log('[SaveManager] Juego guardado correctamente');
            return true;
        } catch (error) {
            console.error('[SaveManager] Error al guardar:', error);
            return false;
        }
    }

    /**
     * Marca los datos como modificados (necesitan guardarse)
     */
    markDirty(): void {
        this.isDirty = true;
    }

    /**
     * Verifica si hay cambios pendientes de guardar
     */
    hasPendingChanges(): boolean {
        return this.isDirty;
    }

    /**
     * Reinicia todos los datos del juego
     */
    reset(): void {
        try {
            localStorage.removeItem(this.saveKey);
            // También limpiar claves antiguas por si acaso
            localStorage.removeItem('clickerGameState');
            localStorage.removeItem('clickerGameSettings');
            localStorage.removeItem('clickerGameProfile');
            localStorage.removeItem('clickerGameStats');
            localStorage.removeItem('clickerGameMissions');
            localStorage.removeItem('clickerGamePrestige');
            localStorage.removeItem('clickerGameProgression');
            
            this.cachedData = null;
            this.isDirty = false;
            
            console.log('[SaveManager] Datos reiniciados');
        } catch (error) {
            console.error('[SaveManager] Error al reiniciar:', error);
        }
    }

    /**
     * Exporta los datos del juego como string JSON
     * @returns String JSON con todos los datos
     */
    exportSave(): string {
        if (this.cachedData) {
            return JSON.stringify(this.cachedData, null, 2);
        }
        const data = this.load();
        return data ? JSON.stringify(data, null, 2) : '';
    }

    /**
     * Importa datos del juego desde un string JSON
     * @param jsonString String JSON con los datos a importar
     * @returns true si la importación fue exitosa
     */
    importSave(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString) as GameSaveData;
            
            // Validar estructura básica
            if (!data.gameState || !data.profile || !data.settings) {
                throw new Error('Estructura de datos inválida');
            }
            
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            this.cachedData = data;
            
            console.log('[SaveManager] Datos importados correctamente');
            return true;
        } catch (error) {
            console.error('[SaveManager] Error al importar:', error);
            return false;
        }
    }

    /**
     * Calcula las ganancias offline basadas en el auto-clicker
     * @param pointsPerSecond Puntos por segundo del auto-clicker
     * @returns Información sobre las ganancias offline
     */
    calculateOfflineEarnings(pointsPerSecond: number): OfflineEarnings {
        const MAX_OFFLINE_HOURS = 8; // Máximo 8 horas de ganancias offline
        const MAX_OFFLINE_SECONDS = MAX_OFFLINE_HOURS * 60 * 60;
        const OFFLINE_EFFICIENCY = 0.5; // 50% de eficiencia offline
        
        if (!this.cachedData || pointsPerSecond <= 0) {
            return { timeAway: 0, pointsEarned: 0, maxOfflineTime: MAX_OFFLINE_SECONDS };
        }
        
        const lastActive = this.cachedData.lastActiveTime || this.cachedData.lastSaveTime;
        const now = Date.now();
        const timeAwayMs = now - lastActive;
        const timeAwaySeconds = Math.floor(timeAwayMs / 1000);
        
        // Limitar tiempo offline
        const effectiveTime = Math.min(timeAwaySeconds, MAX_OFFLINE_SECONDS);
        
        // Calcular puntos con eficiencia reducida
        const pointsEarned = Math.floor(effectiveTime * pointsPerSecond * OFFLINE_EFFICIENCY);
        
        return {
            timeAway: timeAwaySeconds,
            pointsEarned,
            maxOfflineTime: MAX_OFFLINE_SECONDS
        };
    }

    /**
     * Migra datos del formato antiguo (múltiples claves) al nuevo formato
     */
    private migrateOldSave(): GameSaveData | null {
        console.log('[SaveManager] Intentando migrar datos antiguos...');
        
        try {
            // Intentar cargar datos de las claves antiguas
            const oldState = localStorage.getItem('clickerGameState');
            const oldSettings = localStorage.getItem('clickerGameSettings');
            const oldProfile = localStorage.getItem('clickerGameProfile');
            const oldStats = localStorage.getItem('clickerGameStats');
            const oldMissions = localStorage.getItem('clickerGameMissions');
            const oldPrestige = localStorage.getItem('clickerGamePrestige');
            const oldProgression = localStorage.getItem('clickerGameProgression');
            
            if (!oldState) {
                return null; // No hay datos para migrar
            }
            
            const gameState = JSON.parse(oldState) as GameState;
            const settings = oldSettings ? JSON.parse(oldSettings) as GameSettings : this.getDefaultSettings();
            const profile = oldProfile ? JSON.parse(oldProfile) as PlayerProfile : this.getDefaultProfile();
            const stats = oldStats ? JSON.parse(oldStats) as AdvancedStats : this.getDefaultStats();
            const missions = oldMissions ? JSON.parse(oldMissions) : { completedIds: [] };
            const prestige = oldPrestige ? JSON.parse(oldPrestige) as PrestigeState : this.getDefaultPrestige();
            const progression = oldProgression ? JSON.parse(oldProgression) as ProgressionState : this.getDefaultProgression();
            
            const migratedData: GameSaveData = {
                version: SAVE_VERSION,
                lastSaveTime: Date.now(),
                lastActiveTime: Date.now(),
                gameState,
                settings,
                profile,
                stats,
                missions,
                prestige,
                progression
            };
            
            // Guardar en el nuevo formato
            localStorage.setItem(this.saveKey, JSON.stringify(migratedData));
            
            // Limpiar claves antiguas
            localStorage.removeItem('clickerGameState');
            localStorage.removeItem('clickerGameSettings');
            localStorage.removeItem('clickerGameProfile');
            localStorage.removeItem('clickerGameStats');
            localStorage.removeItem('clickerGameMissions');
            localStorage.removeItem('clickerGamePrestige');
            localStorage.removeItem('clickerGameProgression');
            
            console.log('[SaveManager] Migración completada');
            this.cachedData = migratedData;
            return migratedData;
        } catch (error) {
            console.error('[SaveManager] Error en migración:', error);
            return null;
        }
    }

    /**
     * Migra datos de una versión anterior a la actual
     */
    private migrateSaveData(oldData: GameSaveData): GameSaveData {
        console.log(`[SaveManager] Migrando de v${oldData.version} a v${SAVE_VERSION}...`);
        
        // Aquí se añadirían las migraciones específicas por versión
        // Por ahora solo actualizamos el número de versión
        const migratedData: GameSaveData = {
            ...oldData,
            version: SAVE_VERSION,
            lastActiveTime: oldData.lastActiveTime || oldData.lastSaveTime
        };
        
        localStorage.setItem(this.saveKey, JSON.stringify(migratedData));
        this.cachedData = migratedData;
        
        return migratedData;
    }

    // Métodos auxiliares para valores por defecto
    private getDefaultSettings(): GameSettings {
        return {
            soundEnabled: true,
            animationsEnabled: true,
            theme: 'dark',
            confirmPurchases: true
        };
    }

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

    private getDefaultStats(): AdvancedStats {
        return {
            totalClicks: 0,
            bestClickStreak: 0,
            totalPointsEarned: 0,
            manualPointsEarned: 0,
            autoPointsEarned: 0,
            totalTimePlayed: 0,
            activeTime: 0,
            totalSessions: 0,
            sessionHistory: []
        };
    }

    private getDefaultPrestige(): PrestigeState {
        return {
            level: 0,
            totalHistoricPoints: 0,
            totalHistoricClicks: 0,
            totalHistoricItems: 0,
            totalHistoricMissions: 0,
            history: []
        };
    }

    private getDefaultProgression(): ProgressionState {
        return {
            currentStage: 0,
            unlockedStages: ['stage_1'],
            unlockedThemes: ['theme_neon_violet'],
            activeTheme: 'theme_neon_violet'
        };
    }
}

// Instancia global del SaveManager
const saveManager = SaveManager.getInstance();

// ============================================
// SISTEMA DE EVENTOS (EVENT BUS)
// ============================================

/**
 * Mapa de eventos y sus payloads tipados
 * Agregar nuevos eventos aquí es simple: solo añadir el tipo
 */
interface GameEventMap {
    // === EVENTOS DE GAMEPLAY ===
    'click:performed': {
        points: number;           // Puntos ganados con este click
        totalClicks: number;      // Total de clicks acumulados
        timestamp: number;        // Momento del click
    };
    
    'points:changed': {
        previousScore: number;    // Puntos antes del cambio
        newScore: number;         // Puntos después del cambio
        delta: number;            // Diferencia (+/-)
        source: 'click' | 'auto' | 'purchase' | 'reset' | 'offline';  // Origen del cambio
    };
    
    'upgrade:purchased': {
        upgradeType: 'click' | 'auto';
        newLevel: number;
        price: number;
    };
    
    // === EVENTOS DE TIENDA ===
    'shop:item-purchased': {
        item: ShopItem;
        newScore: number;
    };
    
    // === EVENTOS DE SESIÓN ===
    'session:started': {
        timestamp: number;
        sessionNumber: number;
    };
    
    'session:tick': {
        sessionDuration: number;  // Duración en segundos
        totalTimePlayed: number;
    };
    
    'session:ended': {
        duration: number;
        clicks: number;
        pointsEarned: number;
    };
    
    // === EVENTOS DE PERFIL ===
    'profile:updated': {
        field: 'name' | 'avatar' | 'level';
        value: string | number;
    };
    
    'profile:level-up': {
        previousLevel: number;
        newLevel: number;
        totalPoints: number;
    };
    
    // === EVENTOS DE CONFIGURACIÓN ===
    'settings:changed': {
        setting: keyof GameSettings;
        value: boolean | string;
    };
    
    'settings:theme-changed': {
        theme: 'dark' | 'light';
    };
    
    // === EVENTOS DE ESTADÍSTICAS ===
    'stats:streak-updated': {
        currentStreak: number;
        bestStreak: number;
        isNewRecord: boolean;
    };
    
    'stats:milestone-reached': {
        type: 'clicks' | 'points' | 'time' | 'purchases';
        value: number;
        milestone: number;
    };
    
    // === EVENTOS DE UI ===
    'ui:screen-changed': {
        previousScreen: string;
        newScreen: string;
    };
    
    // === EVENTOS DE JUEGO ===
    'game:reset': {
        timestamp: number;
    };
    
    'game:saved': {
        timestamp: number;
    };
    
    // === EVENTOS DE MISIONES ===
    'mission:progress': {
        missionId: string;
        progress: number;
        target: number;
    };
    
    'mission:completed': {
        mission: Mission;
        timestamp: number;
    };
    
    // === EVENTOS DE PRESTIGIO ===
    'prestige:performed': {
        newLevel: number;
        pointsAtPrestige: number;
        clicksAtPrestige: number;
        timestamp: number;
    };
    
    // === EVENTOS DE PROGRESIÓN ===
    'stage:unlocked': {
        stage: GameStage;
        stageIndex: number;
        timestamp: number;
    };
    
    'theme:unlocked': {
        theme: GameTheme;
        timestamp: number;
    };
    
    'theme:changed': {
        previousTheme: string;
        newTheme: string;
    };
    
    // === EVENTOS DE GUARDADO ===
    'save:completed': {
        timestamp: number;
    };
    
    'save:loaded': {
        timestamp: number;
        hadPreviousSave: boolean;
    };
    
    // === EVENTOS DE OFFLINE ===
    'offline:earnings-calculated': {
        timeAway: number;
        pointsEarned: number;
    };
    
    'offline:earnings-claimed': {
        pointsEarned: number;
    };
    
    // === EVENTOS DE ESTADO GLOBAL ===
    'state:changed': {
        path: string;
        previousValue: unknown;
        newValue: unknown;
    };
}

/**
 * Tipo para los nombres de eventos disponibles
 */
type GameEventName = keyof GameEventMap;

/**
 * Tipo para el callback de un evento específico
 */
type EventCallback<T extends GameEventName> = (payload: GameEventMap[T]) => void;

/**
 * Interfaz para una suscripción activa
 */
interface EventSubscription {
    unsubscribe: () => void;
}

/**
 * ============================================
 * EVENT BUS - Sistema de Eventos Central
 * ============================================
 * 
 * Patrón Publisher/Subscriber para desacoplar
 * la comunicación entre sistemas del juego.
 * 
 * Uso:
 *   // Suscribirse a un evento
 *   const sub = eventBus.on('click:performed', (data) => {
 *       console.log('Click!', data.points);
 *   });
 * 
 *   // Emitir un evento
 *   eventBus.emit('click:performed', { points: 10, ... });
 * 
 *   // Cancelar suscripción
 *   sub.unsubscribe();
 */
class EventBus {
    // Mapa de listeners por evento
    private listeners: Map<GameEventName, Set<EventCallback<GameEventName>>> = new Map();
    
    // Flag para debug (opcional)
    private debugMode: boolean = false;

    /**
     * Suscribirse a un evento
     * @param event Nombre del evento
     * @param callback Función a ejecutar cuando ocurra el evento
     * @returns Objeto con método unsubscribe para cancelar
     */
    on<T extends GameEventName>(
        event: T, 
        callback: EventCallback<T>
    ): EventSubscription {
        // Crear el Set si no existe para este evento
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        // Añadir el callback
        const eventListeners = this.listeners.get(event)!;
        eventListeners.add(callback as EventCallback<GameEventName>);
        
        if (this.debugMode) {
            console.log(`[EventBus] Suscrito a "${event}". Total listeners: ${eventListeners.size}`);
        }
        
        // Retornar objeto para cancelar suscripción
        return {
            unsubscribe: () => {
                eventListeners.delete(callback as EventCallback<GameEventName>);
                if (this.debugMode) {
                    console.log(`[EventBus] Desuscrito de "${event}"`);
                }
            }
        };
    }

    /**
     * Suscribirse a un evento solo una vez
     * @param event Nombre del evento
     * @param callback Función a ejecutar (solo la primera vez)
     */
    once<T extends GameEventName>(
        event: T, 
        callback: EventCallback<T>
    ): EventSubscription {
        const subscription = this.on(event, (payload) => {
            subscription.unsubscribe();
            callback(payload);
        });
        return subscription;
    }

    /**
     * Emitir un evento a todos los listeners suscritos
     * @param event Nombre del evento
     * @param payload Datos del evento
     */
    emit<T extends GameEventName>(event: T, payload: GameEventMap[T]): void {
        const eventListeners = this.listeners.get(event);
        
        if (this.debugMode) {
            console.log(`[EventBus] Emitiendo "${event}"`, payload);
        }
        
        if (!eventListeners || eventListeners.size === 0) {
            return;
        }
        
        // Ejecutar cada callback
        eventListeners.forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`[EventBus] Error en listener de "${event}":`, error);
            }
        });
    }

    /**
     * Eliminar todos los listeners de un evento específico
     * @param event Nombre del evento
     */
    off(event: GameEventName): void {
        this.listeners.delete(event);
        if (this.debugMode) {
            console.log(`[EventBus] Eliminados todos los listeners de "${event}"`);
        }
    }

    /**
     * Eliminar TODOS los listeners de TODOS los eventos
     */
    clear(): void {
        this.listeners.clear();
        if (this.debugMode) {
            console.log('[EventBus] Todos los listeners eliminados');
        }
    }

    /**
     * Obtener el número de listeners para un evento
     * @param event Nombre del evento
     */
    listenerCount(event: GameEventName): number {
        return this.listeners.get(event)?.size || 0;
    }

    /**
     * Activar/desactivar modo debug
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        console.log(`[EventBus] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
}

/**
 * Instancia global del Event Bus
 * Singleton para uso en toda la aplicación
 */
const eventBus = new EventBus();

// ============================================
// GAME STATE MANAGER - Estado Central del Juego
// ============================================

/**
 * Interfaz para el estado global completo del juego
 * Representa la única fuente de verdad para todos los datos
 */
interface GlobalGameState {
    // Core gameplay
    game: GameState;
    // Configuración
    settings: GameSettings;
    // Perfil del jugador
    profile: PlayerProfile;
    // Estadísticas avanzadas
    stats: AdvancedStats;
    // Sistema de misiones
    missions: {
        completedIds: string[];
    };
    // Sistema de prestigio
    prestige: PrestigeState;
    // Sistema de progresión
    progression: ProgressionState;
}

/**
 * Tipo para paths de propiedades anidadas del estado
 * Permite acceso tipo 'game.score' o 'settings.soundEnabled'
 */
type StatePathKey = 
    | 'game' | 'game.score' | 'game.pointsPerClick' | 'game.pointsPerSecond' 
    | 'game.clickUpgradeLevel' | 'game.autoUpgradeLevel' | 'game.purchasedItems'
    | 'settings' | 'settings.soundEnabled' | 'settings.animationsEnabled' 
    | 'settings.theme' | 'settings.confirmPurchases'
    | 'profile' | 'profile.name' | 'profile.avatar' | 'profile.totalClicks'
    | 'profile.totalPointsEarned' | 'profile.totalTimePlayed' | 'profile.level'
    | 'stats' | 'prestige' | 'prestige.level' | 'progression' | 'missions';

/**
 * ============================================
 * GAME STATE MANAGER
 * ============================================
 * 
 * Singleton que centraliza todo el estado del juego.
 * Proporciona:
 * - Acceso controlado mediante get/set
 * - Emisión automática de eventos al cambiar estado
 * - Validación de datos
 * - Integración con SaveManager
 * 
 * Uso:
 *   // Obtener valor
 *   const score = gameState.get('game.score');
 *   
 *   // Establecer valor
 *   gameState.set('game.score', 100);
 *   
 *   // Obtener sección completa
 *   const gameData = gameState.getSection('game');
 *   
 *   // Suscribirse a cambios
 *   gameState.subscribe('game.score', (newValue, oldValue) => { ... });
 */
class GameStateManager {
    private static instance: GameStateManager;
    
    // Estado interno
    private state: GlobalGameState;
    
    // Listeners para cambios de estado
    private changeListeners: Map<string, Set<(newValue: unknown, oldValue: unknown) => void>> = new Map();
    
    // Flag para evitar múltiples notificaciones
    private batchUpdating: boolean = false;
    private pendingNotifications: Map<string, { newValue: unknown; oldValue: unknown }> = new Map();
    
    private constructor() {
        // Inicializar con valores por defecto
        this.state = this.getDefaultState();
    }
    
    /**
     * Obtener instancia singleton
     */
    static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }
    
    /**
     * Estado por defecto
     */
    private getDefaultState(): GlobalGameState {
        return {
            game: {
                score: 0,
                pointsPerClick: 1,
                pointsPerSecond: 0,
                clickUpgradeLevel: 0,
                autoUpgradeLevel: 0,
                purchasedItems: []
            },
            settings: {
                soundEnabled: true,
                animationsEnabled: true,
                theme: 'dark',
                confirmPurchases: true
            },
            profile: {
                name: 'Jugador',
                avatar: '🎮',
                totalClicks: 0,
                totalPointsEarned: 0,
                totalTimePlayed: 0,
                level: 1
            },
            stats: {
                totalClicks: 0,
                bestClickStreak: 0,
                totalPointsEarned: 0,
                manualPointsEarned: 0,
                autoPointsEarned: 0,
                totalTimePlayed: 0,
                activeTime: 0,
                totalSessions: 0,
                sessionHistory: []
            },
            missions: {
                completedIds: []
            },
            prestige: {
                level: 0,
                totalHistoricPoints: 0,
                totalHistoricClicks: 0,
                totalHistoricItems: 0,
                totalHistoricMissions: 0,
                history: []
            },
            progression: {
                currentStage: 0,
                unlockedStages: ['stage-1'],
                unlockedThemes: ['neon-violet'],
                activeTheme: 'neon-violet'
            }
        };
    }
    
    /**
     * Obtener un valor usando path (ej: 'game.score')
     */
    get<T = unknown>(path: StatePathKey): T {
        const parts = path.split('.');
        let current: unknown = this.state;
        
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = (current as Record<string, unknown>)[part];
            } else {
                return undefined as T;
            }
        }
        
        return current as T;
    }
    
    /**
     * Establecer un valor usando path (ej: 'game.score', 100)
     */
    set<T = unknown>(path: StatePathKey, value: T): void {
        const parts = path.split('.');
        const oldValue = this.get(path);
        
        // Si el valor no cambió, no hacer nada
        if (oldValue === value) {
            return;
        }
        
        // Navegar hasta el objeto padre
        let current: Record<string, unknown> = this.state as unknown as Record<string, unknown>;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (key !== undefined) {
                current = current[key] as Record<string, unknown>;
            }
        }
        
        // Establecer el valor
        const lastKey = parts[parts.length - 1];
        if (lastKey !== undefined) {
            current[lastKey] = value;
        }
        
        // Notificar cambio
        if (this.batchUpdating) {
            this.pendingNotifications.set(path, { newValue: value, oldValue });
        } else {
            this.notifyChange(path, value, oldValue);
        }
    }
    
    /**
     * Obtener una sección completa del estado
     */
    getSection<K extends keyof GlobalGameState>(section: K): GlobalGameState[K] {
        return JSON.parse(JSON.stringify(this.state[section]));
    }
    
    /**
     * Establecer una sección completa del estado
     */
    setSection<K extends keyof GlobalGameState>(section: K, value: GlobalGameState[K]): void {
        const oldValue = this.state[section];
        this.state[section] = JSON.parse(JSON.stringify(value));
        this.notifyChange(section, value, oldValue);
    }
    
    /**
     * Obtener el estado completo (copia profunda)
     */
    getAll(): GlobalGameState {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    /**
     * Establecer el estado completo
     */
    setAll(newState: GlobalGameState): void {
        this.state = JSON.parse(JSON.stringify(newState));
        this.notifyChange('*', this.state, null);
    }
    
    /**
     * Iniciar un batch de actualizaciones (evita múltiples notificaciones)
     */
    beginBatch(): void {
        this.batchUpdating = true;
        this.pendingNotifications.clear();
    }
    
    /**
     * Finalizar batch y notificar todos los cambios
     */
    endBatch(): void {
        this.batchUpdating = false;
        this.pendingNotifications.forEach((data, path) => {
            this.notifyChange(path, data.newValue, data.oldValue);
        });
        this.pendingNotifications.clear();
    }
    
    /**
     * Suscribirse a cambios en un path específico
     * @param path Path a observar (o '*' para todos los cambios)
     * @param callback Función a ejecutar cuando cambie
     * @returns Función para cancelar suscripción
     */
    subscribe(path: string, callback: (newValue: unknown, oldValue: unknown) => void): () => void {
        if (!this.changeListeners.has(path)) {
            this.changeListeners.set(path, new Set());
        }
        
        this.changeListeners.get(path)!.add(callback);
        
        return () => {
            this.changeListeners.get(path)?.delete(callback);
        };
    }
    
    /**
     * Notificar cambio a los listeners
     */
    private notifyChange(path: string, newValue: unknown, oldValue: unknown): void {
        // Notificar listeners específicos del path
        this.changeListeners.get(path)?.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error(`[GameStateManager] Error en listener de "${path}":`, error);
            }
        });
        
        // Notificar listeners globales
        this.changeListeners.get('*')?.forEach(callback => {
            try {
                callback({ path, newValue, oldValue }, null);
            } catch (error) {
                console.error('[GameStateManager] Error en listener global:', error);
            }
        });
        
        // Emitir evento al EventBus
        eventBus.emit('state:changed', {
            path,
            previousValue: oldValue,
            newValue
        });
    }
    
    /**
     * Resetear el estado a valores por defecto
     */
    reset(): void {
        const oldState = this.state;
        this.state = this.getDefaultState();
        this.notifyChange('*', this.state, oldState);
    }
    
    /**
     * Modificar el puntaje con validación
     */
    addScore(amount: number, source: 'click' | 'auto' | 'offline' | 'dev' = 'click'): void {
        if (amount < 0) return;
        
        const oldScore = this.state.game.score;
        this.state.game.score += amount;
        
        // Emitir evento específico de puntos
        eventBus.emit('points:changed', {
            previousScore: oldScore,
            newScore: this.state.game.score,
            delta: amount,
            source: source === 'dev' ? 'click' : source
        });
        
        this.notifyChange('game.score', this.state.game.score, oldScore);
    }
    
    /**
     * Restar puntaje con validación
     */
    subtractScore(amount: number): boolean {
        if (amount < 0 || this.state.game.score < amount) {
            return false;
        }
        
        const oldScore = this.state.game.score;
        this.state.game.score -= amount;
        
        eventBus.emit('points:changed', {
            previousScore: oldScore,
            newScore: this.state.game.score,
            delta: -amount,
            source: 'purchase'
        });
        
        this.notifyChange('game.score', this.state.game.score, oldScore);
        return true;
    }
}

// Instancia global del GameStateManager
const gameState = GameStateManager.getInstance();

// ============================================
// DEV PANEL - Panel de Desarrollador
// ============================================

/**
 * Configuración de comandos disponibles en Dev Mode
 */
interface DevCommand {
    id: string;
    label: string;
    icon: string;
    description: string;
    action: () => void;
    category: 'points' | 'progression' | 'debug' | 'reset';
}

/**
 * ============================================
 * DEV PANEL
 * ============================================
 * 
 * Panel oculto para desarrolladores.
 * Se activa con Ctrl+Shift+D (Cmd+Shift+D en Mac).
 * 
 * Funcionalidades:
 * - Añadir puntos instantáneamente
 * - Completar misiones
 * - Forzar prestigio
 * - Desbloquear temas
 * - Resetear progreso
 * - Ver estado actual
 * - Activar debug mode del EventBus
 * 
 * IMPORTANTE: Este panel es solo para desarrollo
 * y no debe ser accesible para usuarios normales.
 */
class DevPanel {
    private static instance: DevPanel;
    
    // Estado del panel
    private isVisible: boolean = false;
    private isEnabled: boolean = false;
    
    // Referencia a elementos del DOM
    private panelElement: HTMLElement | null = null;
    private logElement: HTMLElement | null = null;
    
    // Historial de comandos
    private commandHistory: string[] = [];
    
    // Referencia al juego (se establece después)
    private gameInstance: ClickerGame | null = null;
    
    private constructor() {
        this.setupKeyboardShortcut();
    }
    
    /**
     * Obtener instancia singleton
     */
    static getInstance(): DevPanel {
        if (!DevPanel.instance) {
            DevPanel.instance = new DevPanel();
        }
        return DevPanel.instance;
    }
    
    /**
     * Establecer referencia al juego
     */
    setGameInstance(game: ClickerGame): void {
        this.gameInstance = game;
    }
    
    /**
     * Habilitar el modo desarrollador
     */
    enable(): void {
        this.isEnabled = true;
        this.createPanel();
        this.log('Dev Mode habilitado. Presiona Ctrl+Shift+D para abrir/cerrar.');
    }
    
    /**
     * Configurar atajo de teclado (Ctrl+Shift+D)
     */
    private setupKeyboardShortcut(): void {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            // Ctrl+Shift+D (o Cmd+Shift+D en Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                
                // Si no está habilitado, habilitarlo primero
                if (!this.isEnabled) {
                    this.enable();
                }
                
                this.toggle();
            }
        });
    }
    
    /**
     * Alternar visibilidad del panel
     */
    toggle(): void {
        if (!this.isEnabled) return;
        
        this.isVisible = !this.isVisible;
        
        if (this.panelElement) {
            this.panelElement.classList.toggle('hidden', !this.isVisible);
        }
        
        if (this.isVisible) {
            this.log('Panel abierto');
            this.updateStateDisplay();
        }
    }
    
    /**
     * Crear el panel en el DOM
     */
    private createPanel(): void {
        // Evitar crear múltiples paneles
        if (document.getElementById('dev-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'dev-panel';
        panel.className = 'dev-panel hidden';
        
        panel.innerHTML = `
            <div class="dev-panel-header">
                <span class="dev-panel-title">🛠️ Dev Panel</span>
                <button class="dev-panel-close" id="dev-panel-close">×</button>
            </div>
            
            <div class="dev-panel-body">
                <!-- Estado actual -->
                <div class="dev-section">
                    <h4 class="dev-section-title">📊 Estado Actual</h4>
                    <div class="dev-state-display" id="dev-state-display">
                        <div class="dev-state-row">
                            <span>Puntos:</span>
                            <span id="dev-current-score">0</span>
                        </div>
                        <div class="dev-state-row">
                            <span>Nivel Click:</span>
                            <span id="dev-click-level">0</span>
                        </div>
                        <div class="dev-state-row">
                            <span>Nivel Auto:</span>
                            <span id="dev-auto-level">0</span>
                        </div>
                        <div class="dev-state-row">
                            <span>Prestigio:</span>
                            <span id="dev-prestige-level">0</span>
                        </div>
                    </div>
                </div>
                
                <!-- Puntos -->
                <div class="dev-section">
                    <h4 class="dev-section-title">💰 Puntos</h4>
                    <div class="dev-buttons-grid">
                        <button class="dev-btn" data-cmd="add-100">+100</button>
                        <button class="dev-btn" data-cmd="add-1k">+1K</button>
                        <button class="dev-btn" data-cmd="add-10k">+10K</button>
                        <button class="dev-btn" data-cmd="add-100k">+100K</button>
                        <button class="dev-btn" data-cmd="add-1m">+1M</button>
                        <button class="dev-btn" data-cmd="set-0">= 0</button>
                    </div>
                </div>
                
                <!-- Progresión -->
                <div class="dev-section">
                    <h4 class="dev-section-title">🎯 Progresión</h4>
                    <div class="dev-buttons-grid">
                        <button class="dev-btn dev-btn-wide" data-cmd="complete-missions">✅ Completar Misiones</button>
                        <button class="dev-btn dev-btn-wide" data-cmd="unlock-themes">🎨 Desbloquear Temas</button>
                        <button class="dev-btn dev-btn-wide" data-cmd="force-prestige">⭐ Forzar Prestigio</button>
                        <button class="dev-btn dev-btn-wide" data-cmd="max-upgrades">📈 Max Mejoras</button>
                    </div>
                </div>
                
                <!-- Debug -->
                <div class="dev-section">
                    <h4 class="dev-section-title">🔧 Debug</h4>
                    <div class="dev-buttons-grid">
                        <button class="dev-btn dev-btn-wide" data-cmd="toggle-eventbus-debug">📡 Toggle EventBus Debug</button>
                        <button class="dev-btn dev-btn-wide" data-cmd="export-state">💾 Exportar Estado</button>
                        <button class="dev-btn dev-btn-wide" data-cmd="log-state">📋 Log Estado (Console)</button>
                    </div>
                </div>
                
                <!-- Reset -->
                <div class="dev-section">
                    <h4 class="dev-section-title">⚠️ Peligro</h4>
                    <div class="dev-buttons-grid">
                        <button class="dev-btn dev-btn-danger dev-btn-wide" data-cmd="reset-all">🗑️ Reset Total</button>
                    </div>
                </div>
                
                <!-- Log -->
                <div class="dev-section">
                    <h4 class="dev-section-title">📜 Log</h4>
                    <div class="dev-log" id="dev-log"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.panelElement = panel;
        this.logElement = document.getElementById('dev-log');
        
        // Event listeners
        document.getElementById('dev-panel-close')?.addEventListener('click', () => this.toggle());
        
        // Delegación de eventos para botones
        panel.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const cmd = target.dataset.cmd;
            if (cmd) {
                this.executeCommand(cmd);
            }
        });
        
        // Permitir arrastrar el panel
        this.makeDraggable(panel);
    }
    
    /**
     * Hacer el panel arrastrable
     */
    private makeDraggable(element: HTMLElement): void {
        const header = element.querySelector('.dev-panel-header') as HTMLElement;
        if (!header) return;
        
        let isDragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;
        
        header.addEventListener('mousedown', (e: MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains('dev-panel-close')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            element.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = `${initialLeft + deltaX}px`;
            element.style.top = `${initialTop + deltaY}px`;
            element.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = '';
        });
    }
    
    /**
     * Ejecutar un comando
     */
    private executeCommand(cmd: string): void {
        this.commandHistory.push(cmd);
        
        switch (cmd) {
            // Puntos
            case 'add-100':
                gameState.addScore(100, 'dev');
                this.log('Añadidos +100 puntos');
                break;
            case 'add-1k':
                gameState.addScore(1000, 'dev');
                this.log('Añadidos +1,000 puntos');
                break;
            case 'add-10k':
                gameState.addScore(10000, 'dev');
                this.log('Añadidos +10,000 puntos');
                break;
            case 'add-100k':
                gameState.addScore(100000, 'dev');
                this.log('Añadidos +100,000 puntos');
                break;
            case 'add-1m':
                gameState.addScore(1000000, 'dev');
                this.log('Añadidos +1,000,000 puntos');
                break;
            case 'set-0':
                gameState.set('game.score', 0);
                this.log('Puntos establecidos a 0');
                break;
                
            // Progresión
            case 'complete-missions':
                this.completeMissions();
                break;
            case 'unlock-themes':
                this.unlockAllThemes();
                break;
            case 'force-prestige':
                this.forcePrestige();
                break;
            case 'max-upgrades':
                this.maxUpgrades();
                break;
                
            // Debug
            case 'toggle-eventbus-debug':
                const currentDebug = eventBus['debugMode'];
                eventBus.setDebugMode(!currentDebug);
                this.log(`EventBus debug: ${!currentDebug ? 'ON' : 'OFF'}`);
                break;
            case 'export-state':
                this.exportState();
                break;
            case 'log-state':
                console.log('=== GAME STATE ===', gameState.getAll());
                this.log('Estado impreso en consola');
                break;
                
            // Reset
            case 'reset-all':
                if (confirm('¿Seguro que quieres resetear TODO el progreso?')) {
                    saveManager.reset();
                    gameState.reset();
                    this.log('⚠️ Progreso reseteado. Recarga la página.');
                    setTimeout(() => location.reload(), 1000);
                }
                break;
                
            default:
                this.log(`Comando desconocido: ${cmd}`);
        }
        
        // Actualizar display después de cada comando
        this.updateStateDisplay();
        
        // Notificar al juego para actualizar UI
        if (this.gameInstance) {
            this.gameInstance['updateUI']();
        }
    }
    
    /**
     * Completar todas las misiones
     */
    private completeMissions(): void {
        if (!this.gameInstance) {
            this.log('Error: No hay instancia del juego');
            return;
        }
        
        // Obtener misiones del juego y completarlas
        const missions = this.gameInstance['missions'] as Mission[];
        let completed = 0;
        
        missions.forEach(mission => {
            if (!mission.completed) {
                mission.progress = mission.target;
                mission.completed = true;
                mission.completedAt = Date.now();
                completed++;
                
                // Añadir recompensa
                gameState.addScore(mission.reward, 'dev');
            }
        });
        
        // Actualizar IDs completados
        const completedIds = missions.filter(m => m.completed).map(m => m.id);
        this.gameInstance['completedMissionIds'] = completedIds;
        
        this.log(`✅ Completadas ${completed} misiones`);
        this.gameInstance['updateMissionsUI']();
        this.gameInstance['updateMissionsBadge']();
    }
    
    /**
     * Desbloquear todos los temas
     */
    private unlockAllThemes(): void {
        const progression = gameState.getSection('progression');
        const allThemeIds = ['neon-violet', 'light', 'cyber-blue', 'fire-red', 'nature-green', 'royal-gold'];
        
        progression.unlockedThemes = allThemeIds;
        gameState.setSection('progression', progression);
        
        if (this.gameInstance) {
            this.gameInstance['progression'] = progression;
            this.gameInstance['renderThemeSelector']();
        }
        
        this.log('🎨 Todos los temas desbloqueados');
    }
    
    /**
     * Forzar un prestigio
     */
    private forcePrestige(): void {
        if (!this.gameInstance) {
            this.log('Error: No hay instancia del juego');
            return;
        }
        
        this.gameInstance['performPrestige']();
        this.log('⭐ Prestigio forzado');
    }
    
    /**
     * Maximizar mejoras
     */
    private maxUpgrades(): void {
        const game = gameState.getSection('game');
        game.clickUpgradeLevel = 50;
        game.autoUpgradeLevel = 50;
        game.pointsPerClick = 51;
        game.pointsPerSecond = 50;
        gameState.setSection('game', game);
        
        if (this.gameInstance) {
            this.gameInstance['state'] = game;
            this.gameInstance['startAutoClicker']();
        }
        
        this.log('📈 Mejoras maximizadas (nivel 50)');
    }
    
    /**
     * Exportar estado a JSON
     */
    private exportState(): void {
        const state = gameState.getAll();
        const json = JSON.stringify(state, null, 2);
        
        // Copiar al clipboard
        navigator.clipboard.writeText(json).then(() => {
            this.log('💾 Estado copiado al portapapeles');
        }).catch(() => {
            // Fallback: descargar archivo
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clicker-game-state-${Date.now()}.json`;
            a.click();
            this.log('💾 Estado descargado como archivo');
        });
    }
    
    /**
     * Actualizar display de estado
     */
    private updateStateDisplay(): void {
        const scoreEl = document.getElementById('dev-current-score');
        const clickEl = document.getElementById('dev-click-level');
        const autoEl = document.getElementById('dev-auto-level');
        const prestigeEl = document.getElementById('dev-prestige-level');
        
        if (scoreEl) scoreEl.textContent = this.formatNumber(gameState.get<number>('game.score') ?? 0);
        if (clickEl) clickEl.textContent = String(gameState.get<number>('game.clickUpgradeLevel') ?? 0);
        if (autoEl) autoEl.textContent = String(gameState.get<number>('game.autoUpgradeLevel') ?? 0);
        if (prestigeEl) prestigeEl.textContent = String(gameState.get<number>('prestige.level') ?? 0);
    }
    
    /**
     * Formatear número
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    /**
     * Añadir mensaje al log
     */
    private log(message: string): void {
        const time = new Date().toLocaleTimeString();
        const entry = `[${time}] ${message}`;
        
        console.log(`[DevPanel] ${message}`);
        
        if (this.logElement) {
            const line = document.createElement('div');
            line.className = 'dev-log-entry';
            line.textContent = entry;
            this.logElement.appendChild(line);
            this.logElement.scrollTop = this.logElement.scrollHeight;
            
            // Limitar a 50 entradas
            while (this.logElement.children.length > 50) {
                this.logElement.removeChild(this.logElement.firstChild!);
            }
        }
    }
}

// Instancia global del DevPanel
const devPanel = DevPanel.getInstance();

// ============================================
// MICRO-ANIMACIONES
// ============================================

/**
 * Configuración de una partícula de click
 */
interface ClickParticleConfig {
    x: number;
    y: number;
    text: string;
    type: 'normal' | 'combo' | 'mega';
    rotation?: number;
}

/**
 * ============================================
 * MICRO ANIMATIONS MANAGER
 * ============================================
 * 
 * Sistema de micro-animaciones para feedback visual.
 * Incluye:
 * - Números flotantes con posición variable
 * - Partículas decorativas (estrellas)
 * - Efectos de combo
 * - Animaciones de valores
 * 
 * Respeta la configuración de animaciones del usuario.
 */
class MicroAnimations {
    private static instance: MicroAnimations;
    
    // Contenedor de partículas
    private container: HTMLElement | null = null;
    
    // Estado de combo
    private comboCount: number = 0;
    private comboTimeout: number | null = null;
    private lastClickTime: number = 0;
    
    // Referencia al botón de click
    private clickButton: HTMLElement | null = null;
    private comboIndicator: HTMLElement | null = null;
    
    // Configuración
    private readonly COMBO_THRESHOLD_MS = 300; // ms entre clicks para combo
    private readonly COMBO_DECAY_MS = 1000; // ms para perder el combo
    
    private constructor() {
        this.init();
    }
    
    static getInstance(): MicroAnimations {
        if (!MicroAnimations.instance) {
            MicroAnimations.instance = new MicroAnimations();
        }
        return MicroAnimations.instance;
    }
    
    /**
     * Inicializar el sistema
     */
    private init(): void {
        this.container = document.getElementById('particles-container');
        this.clickButton = document.getElementById('click-button');
        
        // Crear indicador de combo
        if (this.clickButton) {
            this.comboIndicator = document.createElement('div');
            this.comboIndicator.className = 'combo-indicator';
            this.comboIndicator.textContent = 'COMBO x1';
            this.clickButton.style.position = 'relative';
            this.clickButton.appendChild(this.comboIndicator);
        }
    }
    
    /**
     * Verificar si las animaciones están habilitadas
     */
    private isEnabled(): boolean {
        return !document.body.classList.contains('no-animations');
    }
    
    /**
     * Obtener la posición central del botón de click
     */
    private getButtonCenter(): { x: number; y: number } {
        if (!this.clickButton) return { x: 0, y: 0 };
        const rect = this.clickButton.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    /**
     * Crear partícula de puntos flotante (siempre sobre el botón)
     */
    createClickParticle(config: ClickParticleConfig): void {
        if (!this.isEnabled() || !this.container) return;
        
        // Siempre usar la posición del botón como referencia
        const center = this.getButtonCenter();
        
        const particle = document.createElement('div');
        particle.className = `click-particle ${config.type}`;
        particle.textContent = config.text;
        
        // Posición centrada en el botón con variación aleatoria
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 20 - 30; // Un poco arriba del centro
        
        particle.style.left = `${center.x + offsetX}px`;
        particle.style.top = `${center.y + offsetY}px`;
        particle.style.setProperty('--rotation', `${(Math.random() - 0.5) * 20}deg`);
        
        this.container.appendChild(particle);
        
        // Eliminar después de la animación
        setTimeout(() => particle.remove(), 800);
    }
    
    /**
     * Crear estrellas decorativas (siempre sobre el botón)
     */
    createStars(count: number = 3): void {
        if (!this.isEnabled() || !this.container) return;
        
        // Siempre usar la posición del botón como referencia
        const center = this.getButtonCenter();
        
        const emojis = ['✨', '⭐', '💫', '🌟'];
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'click-star';
            star.textContent = emojis[Math.floor(Math.random() * emojis.length)] ?? '✨';
            
            // Posición en círculo alrededor del botón
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 40 + Math.random() * 30;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            star.style.left = `${center.x}px`;
            star.style.top = `${center.y}px`;
            star.style.setProperty('--tx', `${tx}px`);
            star.style.setProperty('--ty', `${ty}px`);
            
            this.container.appendChild(star);
            
            setTimeout(() => star.remove(), 600);
        }
    }
    
    /**
     * Manejar click y actualizar combo (posición siempre sobre el botón)
     */
    handleClick(points: number): void {
        if (!this.isEnabled()) return;
        
        const now = Date.now();
        const timeSinceLastClick = now - this.lastClickTime;
        
        // Actualizar combo
        if (timeSinceLastClick < this.COMBO_THRESHOLD_MS) {
            this.comboCount++;
        } else if (timeSinceLastClick > this.COMBO_DECAY_MS) {
            this.comboCount = 1;
        }
        
        this.lastClickTime = now;
        
        // Determinar tipo de partícula
        let particleType: 'normal' | 'combo' | 'mega' = 'normal';
        let displayText = `+${this.formatNumber(points)}`;
        
        if (this.comboCount >= 10) {
            particleType = 'mega';
            displayText = `🔥 +${this.formatNumber(points)}`;
        } else if (this.comboCount >= 5) {
            particleType = 'combo';
            displayText = `⚡ +${this.formatNumber(points)}`;
        }
        
        // Obtener posición real del botón para las partículas
        const center = this.getButtonCenter();
        
        // Crear partícula (centrada en el botón)
        this.createClickParticle({
            x: center.x, y: center.y, text: displayText, type: particleType
        });
        
        // Crear estrellas si es combo (centradas en el botón)
        if (this.comboCount >= 3) {
            this.createStars(Math.min(this.comboCount, 6));
        }
        
        // Actualizar indicador de combo
        this.updateComboIndicator();
        
        // Efecto de pulso en el botón
        this.pulseButton();
        
        // Resetear combo después de inactividad
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        this.comboTimeout = window.setTimeout(() => {
            this.comboCount = 0;
            this.updateComboIndicator();
            this.clickButton?.classList.remove('combo-mode');
        }, this.COMBO_DECAY_MS);
    }
    
    /**
     * Actualizar indicador de combo
     */
    private updateComboIndicator(): void {
        if (!this.comboIndicator || !this.clickButton) return;
        
        if (this.comboCount >= 3) {
            this.comboIndicator.textContent = `COMBO x${this.comboCount}`;
            this.comboIndicator.classList.add('show');
            this.clickButton.classList.add('combo-mode');
        } else {
            this.comboIndicator.classList.remove('show');
            this.clickButton.classList.remove('combo-mode');
        }
    }
    
    /**
     * Efecto de pulso en el botón
     */
    private pulseButton(): void {
        if (!this.clickButton || !this.isEnabled()) return;
        
        // Efecto ripple
        this.clickButton.classList.remove('ripple');
        void this.clickButton.offsetWidth; // Forzar reflow
        this.clickButton.classList.add('ripple');
        
        // Efecto pulse
        this.clickButton.classList.remove('pulse');
        void this.clickButton.offsetWidth;
        this.clickButton.classList.add('pulse');
        
        setTimeout(() => {
            this.clickButton?.classList.remove('ripple', 'pulse');
        }, 400);
    }
    
    /**
     * Animar actualización de valor (score, stats)
     */
    animateValueUpdate(element: HTMLElement, className: string = 'updated'): void {
        if (!this.isEnabled()) return;
        
        element.classList.remove(className);
        void element.offsetWidth;
        element.classList.add(className);
        
        setTimeout(() => element.classList.remove(className), 200);
    }
    
    /**
     * Animar compra exitosa
     */
    animatePurchase(card: HTMLElement): void {
        if (!this.isEnabled()) return;
        
        card.classList.add('purchased-animation');
        setTimeout(() => card.classList.remove('purchased-animation'), 500);
    }
    
    /**
     * Mostrar animación de nivel subido
     */
    showLevelUp(newLevel: number): void {
        if (!this.isEnabled()) return;
        
        const flash = document.createElement('div');
        flash.className = 'level-up-flash';
        flash.textContent = `🎉 NIVEL ${newLevel}!`;
        
        document.body.appendChild(flash);
        
        setTimeout(() => flash.remove(), 1000);
    }
    
    /**
     * Obtener el combo actual
     */
    getComboCount(): number {
        return this.comboCount;
    }
    
    /**
     * Formatear número
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Instancia global
const microAnimations = MicroAnimations.getInstance();

// ============================================
// IA DE ANÁLISIS DEL JUGADOR
// ============================================

/**
 * Tipos de tips que puede mostrar la IA
 */
type TipType = 'suggestion' | 'achievement' | 'warning' | 'motivation';

/**
 * Configuración de un tip
 */
interface PlayerTip {
    type: TipType;
    icon: string;
    message: string;
    priority: number; // Mayor = más importante
}

/**
 * Análisis del comportamiento del jugador
 */
interface PlayerBehavior {
    cps: number;                    // Clicks por segundo actual
    avgCps: number;                 // CPS promedio de la sesión
    peakCps: number;                // Mejor CPS registrado
    sessionDuration: number;        // Duración de sesión en segundos
    totalClicks: number;            // Clicks totales
    totalPoints: number;            // Puntos totales
    upgradeClickLevel: number;      // Nivel de mejora click
    upgradeAutoLevel: number;       // Nivel de mejora auto
    idleTime: number;               // Tiempo inactivo en segundos
    purchasedItems: number;         // Items comprados
    completedMissions: number;      // Misiones completadas
    prestigeLevel: number;          // Nivel de prestigio
}

/**
 * ============================================
 * PLAYER ANALYZER - IA Simple de Análisis
 * ============================================
 * 
 * Sistema que analiza el comportamiento del jugador
 * y muestra sugerencias/feedback contextual.
 * 
 * Características:
 * - Análisis de CPS (clicks por segundo)
 * - Detección de tiempo de inactividad
 * - Sugerencias de mejoras
 * - Mensajes motivacionales
 * - Celebración de logros
 * 
 * NO modifica el gameplay, solo feedback textual.
 */
class PlayerAnalyzer {
    private static instance: PlayerAnalyzer;
    
    // Elementos del DOM
    private panel: HTMLElement | null = null;
    private messageEl: HTMLElement | null = null;
    private closeBtn: HTMLElement | null = null;
    
    // Estado interno
    private clickHistory: number[] = []; // Timestamps de clicks recientes
    private sessionStartTime: number = Date.now();
    private lastActivityTime: number = Date.now();
    private lastTipTime: number = 0;
    private tipQueue: PlayerTip[] = [];
    private isShowing: boolean = false;
    
    // Referencia al juego
    private gameInstance: ClickerGame | null = null;
    
    // Configuración
    private readonly CPS_WINDOW_MS = 5000; // Ventana para calcular CPS
    private readonly MIN_TIP_INTERVAL_MS = 30000; // Mínimo entre tips
    private readonly ANALYSIS_INTERVAL_MS = 10000; // Cada cuánto analizar
    
    // Intervalo de análisis
    private analysisInterval: number | null = null;
    
    private constructor() {
        this.init();
    }
    
    static getInstance(): PlayerAnalyzer {
        if (!PlayerAnalyzer.instance) {
            PlayerAnalyzer.instance = new PlayerAnalyzer();
        }
        return PlayerAnalyzer.instance;
    }
    
    /**
     * Establecer referencia al juego
     */
    setGameInstance(game: ClickerGame): void {
        this.gameInstance = game;
    }
    
    /**
     * Inicializar el sistema
     */
    private init(): void {
        this.panel = document.getElementById('ai-tips-panel');
        this.messageEl = document.getElementById('ai-tips-message');
        this.closeBtn = document.getElementById('ai-tips-close');
        
        // Event listener para cerrar
        this.closeBtn?.addEventListener('click', () => this.hideTip());
        
        // Iniciar análisis periódico
        this.startAnalysis();
        
        // Escuchar eventos del juego
        this.setupEventListeners();
    }
    
    /**
     * Configurar listeners del Event Bus
     */
    private setupEventListeners(): void {
        // Registrar cada click
        eventBus.on('click:performed', () => {
            this.recordClick();
            this.lastActivityTime = Date.now();
        });
        
        // Celebrar compras
        eventBus.on('upgrade:purchased', (data) => {
            if (data.newLevel === 1) {
                this.queueTip({
                    type: 'achievement',
                    icon: '🎉',
                    message: `¡Primera mejora de <span class="highlight">${data.upgradeType === 'click' ? 'Click' : 'Auto-Clicker'}</span>! Vas por buen camino.`,
                    priority: 8
                });
            } else if (data.newLevel % 10 === 0) {
                this.queueTip({
                    type: 'achievement',
                    icon: '🏆',
                    message: `¡Nivel <span class="highlight">${data.newLevel}</span> en ${data.upgradeType === 'click' ? 'Click Potenciado' : 'Auto-Clicker'}! Impresionante.`,
                    priority: 7
                });
            }
        });
        
        // Celebrar compras de tienda
        eventBus.on('shop:item-purchased', (data) => {
            this.queueTip({
                type: 'achievement',
                icon: '🛒',
                message: `¡Compraste <span class="highlight">${data.item.name}</span>! Buena elección.`,
                priority: 6
            });
        });
        
        // Prestigio
        eventBus.on('prestige:performed', (data) => {
            this.queueTip({
                type: 'achievement',
                icon: '⭐',
                message: `¡Prestigio nivel <span class="highlight">${data.newLevel}</span>! Eres un verdadero maestro del click.`,
                priority: 10
            });
        });
    }
    
    /**
     * Registrar un click
     */
    recordClick(): void {
        const now = Date.now();
        this.clickHistory.push(now);
        
        // Limpiar clicks antiguos
        const windowStart = now - this.CPS_WINDOW_MS;
        this.clickHistory = this.clickHistory.filter(t => t > windowStart);
    }
    
    /**
     * Calcular CPS actual
     */
    private calculateCPS(): number {
        const now = Date.now();
        const windowStart = now - this.CPS_WINDOW_MS;
        const recentClicks = this.clickHistory.filter(t => t > windowStart);
        return (recentClicks.length / this.CPS_WINDOW_MS) * 1000;
    }
    
    /**
     * Obtener comportamiento actual del jugador
     */
    private getBehavior(): PlayerBehavior {
        const game = this.gameInstance;
        const state = game ? game['state'] : null;
        const stats = game ? game['stats'] : null;
        const prestige = game ? game['prestige'] : null;
        
        return {
            cps: this.calculateCPS(),
            avgCps: stats ? (stats.totalClicks / Math.max(stats.totalTimePlayed, 1)) : 0,
            peakCps: stats?.bestClickStreak ?? 0,
            sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
            totalClicks: stats?.totalClicks ?? 0,
            totalPoints: stats?.totalPointsEarned ?? 0,
            upgradeClickLevel: state?.clickUpgradeLevel ?? 0,
            upgradeAutoLevel: state?.autoUpgradeLevel ?? 0,
            idleTime: (Date.now() - this.lastActivityTime) / 1000,
            purchasedItems: state?.purchasedItems?.length ?? 0,
            completedMissions: game ? game['completedMissionIds']?.length ?? 0 : 0,
            prestigeLevel: prestige?.level ?? 0
        };
    }
    
    /**
     * Iniciar análisis periódico
     */
    private startAnalysis(): void {
        // Primer análisis después de 15 segundos
        setTimeout(() => {
            this.analyze();
        }, 15000);
        
        // Análisis periódico
        this.analysisInterval = window.setInterval(() => {
            this.analyze();
        }, this.ANALYSIS_INTERVAL_MS);
    }
    
    /**
     * Analizar comportamiento y generar tips
     */
    private analyze(): void {
        const behavior = this.getBehavior();
        const now = Date.now();
        
        // No mostrar tips muy seguido
        if (now - this.lastTipTime < this.MIN_TIP_INTERVAL_MS && !this.tipQueue.length) {
            return;
        }
        
        // Analizar diferentes aspectos
        this.analyzeIdleTime(behavior);
        this.analyzeUpgrades(behavior);
        this.analyzeProgress(behavior);
        this.analyzePerformance(behavior);
        
        // Mostrar tip de mayor prioridad
        this.showNextTip();
    }
    
    /**
     * Analizar tiempo de inactividad
     */
    private analyzeIdleTime(behavior: PlayerBehavior): void {
        if (behavior.idleTime > 120) { // 2 minutos
            this.queueTip({
                type: 'motivation',
                icon: '💤',
                message: '¿Sigues ahí? ¡Tus puntos te extrañan! Haz click para seguir progresando.',
                priority: 5
            });
        } else if (behavior.idleTime > 60 && behavior.upgradeAutoLevel === 0) {
            this.queueTip({
                type: 'suggestion',
                icon: '💡',
                message: 'Tip: Compra un <span class="highlight">Auto-Clicker</span> para ganar puntos mientras descansas.',
                priority: 6
            });
        }
    }
    
    /**
     * Analizar mejoras
     */
    private analyzeUpgrades(behavior: PlayerBehavior): void {
        const game = this.gameInstance;
        if (!game) return;
        
        const score = game['state']?.score ?? 0;
        const clickPrice = this.calculateUpgradePrice(behavior.upgradeClickLevel, 10, 1.5);
        const autoPrice = this.calculateUpgradePrice(behavior.upgradeAutoLevel, 50, 1.8);
        
        // Sugerir mejora de click si puede comprarla
        if (score >= clickPrice && behavior.upgradeClickLevel < behavior.upgradeAutoLevel) {
            this.queueTip({
                type: 'suggestion',
                icon: '⚡',
                message: `¡Puedes mejorar tu <span class="highlight">Click Potenciado</span>! Cuesta ${this.formatNumber(clickPrice)} puntos.`,
                priority: 4
            });
        }
        
        // Sugerir auto-clicker si no tiene
        if (behavior.upgradeAutoLevel === 0 && score >= autoPrice * 0.8) {
            this.queueTip({
                type: 'suggestion',
                icon: '🤖',
                message: 'Casi tienes suficiente para un <span class="highlight">Auto-Clicker</span>. ¡Sigue así!',
                priority: 5
            });
        }
        
        // Balance entre mejoras
        if (behavior.upgradeClickLevel > behavior.upgradeAutoLevel + 5) {
            this.queueTip({
                type: 'suggestion',
                icon: '⚖️',
                message: 'Tu Click está muy fuerte, pero considera mejorar el <span class="highlight">Auto-Clicker</span> para ingresos pasivos.',
                priority: 3
            });
        }
    }
    
    /**
     * Analizar progreso general
     */
    private analyzeProgress(behavior: PlayerBehavior): void {
        // Primeros logros
        if (behavior.totalClicks >= 100 && behavior.totalClicks < 150) {
            this.queueTip({
                type: 'achievement',
                icon: '💯',
                message: '¡<span class="highlight">100 clicks</span>! Eres oficialmente un clicker.',
                priority: 7
            });
        }
        
        if (behavior.totalClicks >= 1000 && behavior.totalClicks < 1050) {
            this.queueTip({
                type: 'achievement',
                icon: '🎯',
                message: '¡<span class="highlight">1,000 clicks</span>! Tu dedo es una máquina.',
                priority: 7
            });
        }
        
        // Tiempo jugado
        if (behavior.sessionDuration >= 300 && behavior.sessionDuration < 330) { // 5 minutos
            this.queueTip({
                type: 'motivation',
                icon: '⏰',
                message: '¡Llevas <span class="highlight">5 minutos</span> jugando! Recuerda descansar.',
                priority: 4
            });
        }
        
        // Misiones
        if (behavior.completedMissions === 0 && behavior.totalClicks > 50) {
            this.queueTip({
                type: 'suggestion',
                icon: '📋',
                message: '¿Ya revisaste las <span class="highlight">Misiones</span>? Puedes ganar recompensas extra.',
                priority: 5
            });
        }
    }
    
    /**
     * Analizar rendimiento
     */
    private analyzePerformance(behavior: PlayerBehavior): void {
        // CPS alto
        if (behavior.cps > 5) {
            this.queueTip({
                type: 'achievement',
                icon: '🔥',
                message: `¡Increíble! <span class="highlight">${behavior.cps.toFixed(1)} CPS</span>. ¡Eres un rayo!`,
                priority: 6
            });
        }
        
        // Nuevo récord de CPS
        if (behavior.cps > behavior.peakCps && behavior.cps > 3) {
            this.queueTip({
                type: 'achievement',
                icon: '🏅',
                message: `¡Nuevo récord personal de <span class="highlight">${behavior.cps.toFixed(1)} CPS</span>!`,
                priority: 8
            });
        }
    }
    
    /**
     * Añadir tip a la cola
     */
    private queueTip(tip: PlayerTip): void {
        // Evitar duplicados recientes
        const isDuplicate = this.tipQueue.some(t => t.message === tip.message);
        if (isDuplicate) return;
        
        this.tipQueue.push(tip);
        
        // Ordenar por prioridad
        this.tipQueue.sort((a, b) => b.priority - a.priority);
        
        // Limitar cola
        if (this.tipQueue.length > 5) {
            this.tipQueue = this.tipQueue.slice(0, 5);
        }
    }
    
    /**
     * Mostrar siguiente tip de la cola
     */
    private showNextTip(): void {
        if (this.isShowing || this.tipQueue.length === 0) return;
        
        const now = Date.now();
        if (now - this.lastTipTime < this.MIN_TIP_INTERVAL_MS) return;
        
        const tip = this.tipQueue.shift();
        if (tip) {
            this.showTip(tip);
        }
    }
    
    /**
     * Mostrar un tip
     */
    private showTip(tip: PlayerTip): void {
        if (!this.panel || !this.messageEl) return;
        
        this.isShowing = true;
        this.lastTipTime = Date.now();
        
        // Actualizar contenido
        this.messageEl.innerHTML = `<span class="tip-icon">${tip.icon}</span>${tip.message}`;
        
        // Actualizar clase de tipo
        this.panel.className = `ai-tips-panel tip-${tip.type}`;
        
        // Auto-ocultar después de 8 segundos
        setTimeout(() => {
            this.hideTip();
        }, 8000);
    }
    
    /**
     * Ocultar tip actual
     */
    hideTip(): void {
        if (!this.panel) return;
        
        this.panel.classList.add('hidden');
        this.isShowing = false;
        
        // Mostrar siguiente si hay
        setTimeout(() => {
            this.showNextTip();
        }, 2000);
    }
    
    /**
     * Calcular precio de mejora (simplificado)
     */
    private calculateUpgradePrice(level: number, base: number, multiplier: number): number {
        return Math.floor(base * Math.pow(multiplier, level));
    }
    
    /**
     * Formatear número
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    /**
     * Detener el análisis
     */
    stop(): void {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
    }
}

// Instancia global
const playerAnalyzer = PlayerAnalyzer.getInstance();

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

/** Clave para guardar en localStorage */
const STORAGE_KEY = 'clickerGameState';

/** Clave para guardar configuración en localStorage */
const SETTINGS_KEY = 'clickerGameSettings';

/** Clave para guardar perfil en localStorage */
const PROFILE_KEY = 'clickerGameProfile';

/** Clave para guardar estadísticas avanzadas en localStorage */
const STATS_KEY = 'clickerGameStats';

/** Clave para guardar misiones en localStorage */
const MISSIONS_KEY = 'clickerGameMissions';

/** Clave para guardar prestigio en localStorage */
const PRESTIGE_KEY = 'clickerGamePrestige';

/** Número máximo de sesiones en el historial */
const MAX_SESSION_HISTORY = 10;

/** Número máximo de registros de prestigio */
const MAX_PRESTIGE_HISTORY = 20;

/** Puntos requeridos para prestigiar (aumenta con cada prestigio) */
const PRESTIGE_BASE_REQUIREMENT = 100000;

/** Multiplicador de requisito por nivel de prestigio */
const PRESTIGE_REQUIREMENT_MULTIPLIER = 2;

/**
 * Configuración de misiones
 * Agregar nuevas misiones es tan simple como añadir objetos a este array
 */
/**
 * Configuración de rangos de misiones con sus colores y multiplicadores
 */
const MISSION_RANKS: Record<MissionRank, { name: string; icon: string; color: string }> = {
    bronze: { name: 'Bronce', icon: '🥉', color: '#cd7f32' },
    silver: { name: 'Plata', icon: '🥈', color: '#c0c0c0' },
    gold: { name: 'Oro', icon: '🥇', color: '#ffd700' },
    diamond: { name: 'Diamante', icon: '💎', color: '#b9f2ff' },
    master: { name: 'Maestro', icon: '👑', color: '#ff6b6b' }
};

const MISSIONS_CONFIG: Omit<Mission, 'progress' | 'completed' | 'completedAt'>[] = [
    // === MISIONES DE CLICKS (BRONCE → MAESTRO) ===
    {
        id: 'first_clicks',
        title: 'Primeros Pasos',
        description: 'Haz 10 clicks',
        icon: '👆',
        type: 'clicks',
        rank: 'bronze',
        reward: 25,
        target: 10
    },
    {
        id: 'click_beginner',
        title: 'Aprendiz del Click',
        description: 'Haz 100 clicks',
        icon: '✊',
        type: 'clicks',
        rank: 'bronze',
        reward: 100,
        target: 100
    },
    {
        id: 'click_intermediate',
        title: 'Clickeador Dedicado',
        description: 'Haz 500 clicks',
        icon: '💪',
        type: 'clicks',
        rank: 'silver',
        reward: 500,
        target: 500
    },
    {
        id: 'click_advanced',
        title: 'Maestro del Click',
        description: 'Haz 1,000 clicks',
        icon: '🏆',
        type: 'clicks',
        rank: 'gold',
        reward: 1500,
        target: 1000
    },
    {
        id: 'click_expert',
        title: 'Leyenda del Click',
        description: 'Haz 5,000 clicks',
        icon: '👑',
        type: 'clicks',
        rank: 'diamond',
        reward: 5000,
        target: 5000
    },
    {
        id: 'click_master',
        title: 'Dios del Click',
        description: 'Haz 25,000 clicks',
        icon: '⚡',
        type: 'clicks',
        rank: 'master',
        reward: 25000,
        target: 25000
    },
    
    // === MISIONES DE PUNTOS (BRONCE → MAESTRO) ===
    {
        id: 'points_starter',
        title: 'Primer Centenar',
        description: 'Acumula 100 puntos',
        icon: '💰',
        type: 'points',
        rank: 'bronze',
        reward: 50,
        target: 100
    },
    {
        id: 'points_thousand',
        title: 'Millonario en Progreso',
        description: 'Acumula 1,000 puntos',
        icon: '💵',
        type: 'points',
        rank: 'silver',
        reward: 250,
        target: 1000
    },
    {
        id: 'points_rich',
        title: 'Acumulador de Fortuna',
        description: 'Acumula 10,000 puntos',
        icon: '🤑',
        type: 'points',
        rank: 'gold',
        reward: 2000,
        target: 10000
    },
    {
        id: 'points_wealthy',
        title: 'Magnate de Puntos',
        description: 'Acumula 100,000 puntos',
        icon: '🏦',
        type: 'points',
        rank: 'diamond',
        reward: 15000,
        target: 100000
    },
    {
        id: 'points_tycoon',
        title: 'Emperador de Puntos',
        description: 'Acumula 1,000,000 puntos',
        icon: '🌟',
        type: 'points',
        rank: 'master',
        reward: 100000,
        target: 1000000
    },
    
    // === MISIONES DE COMPRAS (BRONCE → DIAMANTE) ===
    {
        id: 'first_upgrade',
        title: 'Primera Mejora',
        description: 'Compra tu primera mejora',
        icon: '🛠️',
        type: 'upgrade',
        rank: 'bronze',
        reward: 20,
        target: 1
    },
    {
        id: 'upgrade_collector',
        title: 'Coleccionista de Mejoras',
        description: 'Compra 10 mejoras en total',
        icon: '📦',
        type: 'upgrade',
        rank: 'silver',
        reward: 300,
        target: 10
    },
    {
        id: 'upgrade_hoarder',
        title: 'Acumulador de Mejoras',
        description: 'Compra 25 mejoras en total',
        icon: '🗃️',
        type: 'upgrade',
        rank: 'gold',
        reward: 1000,
        target: 25
    },
    {
        id: 'first_shop_item',
        title: 'Primera Compra',
        description: 'Compra un ítem de la tienda',
        icon: '🛒',
        type: 'purchase',
        rank: 'silver',
        reward: 500,
        target: 1
    },
    {
        id: 'shop_enthusiast',
        title: 'Entusiasta de la Tienda',
        description: 'Compra 3 ítems de la tienda',
        icon: '🛍️',
        type: 'purchase',
        rank: 'gold',
        reward: 2500,
        target: 3
    },
    {
        id: 'shop_master',
        title: 'Rey de las Compras',
        description: 'Compra 6 ítems de la tienda',
        icon: '🏪',
        type: 'purchase',
        rank: 'diamond',
        reward: 10000,
        target: 6
    },
    
    // === MISIONES DE TIEMPO (BRONCE → MAESTRO) ===
    {
        id: 'time_1min',
        title: 'Primer Minuto',
        description: 'Juega durante 1 minuto',
        icon: '⏱️',
        type: 'time',
        rank: 'bronze',
        reward: 15,
        target: 60
    },
    {
        id: 'time_5min',
        title: 'Dedicación Inicial',
        description: 'Juega durante 5 minutos',
        icon: '⏰',
        type: 'time',
        rank: 'bronze',
        reward: 75,
        target: 300
    },
    {
        id: 'time_30min',
        title: 'Jugador Comprometido',
        description: 'Juega durante 30 minutos',
        icon: '⏳',
        type: 'time',
        rank: 'silver',
        reward: 400,
        target: 1800
    },
    {
        id: 'time_1hour',
        title: 'Maratón de Clicks',
        description: 'Juega durante 1 hora',
        icon: '🕐',
        type: 'time',
        rank: 'gold',
        reward: 1200,
        target: 3600
    },
    {
        id: 'time_3hours',
        title: 'Adicto al Click',
        description: 'Juega durante 3 horas',
        icon: '🕰️',
        type: 'time',
        rank: 'diamond',
        reward: 5000,
        target: 10800
    },
    {
        id: 'time_10hours',
        title: 'Leyenda Eterna',
        description: 'Juega durante 10 horas',
        icon: '🌙',
        type: 'time',
        rank: 'master',
        reward: 20000,
        target: 36000
    },
    
    // === MISIONES DE PRESTIGIO (PLATA → MAESTRO) ===
    {
        id: 'first_prestige',
        title: 'Primera Estrella',
        description: 'Realiza tu primer prestigio',
        icon: '⭐',
        type: 'prestige',
        rank: 'silver',
        reward: 1000,
        target: 1
    },
    {
        id: 'prestige_veteran',
        title: 'Veterano del Prestigio',
        description: 'Alcanza prestigio nivel 3',
        icon: '✨',
        type: 'prestige',
        rank: 'gold',
        reward: 5000,
        target: 3
    },
    {
        id: 'prestige_elite',
        title: 'Elite Prestigiosa',
        description: 'Alcanza prestigio nivel 5',
        icon: '💫',
        type: 'prestige',
        rank: 'diamond',
        reward: 15000,
        target: 5
    },
    {
        id: 'prestige_master',
        title: 'Señor del Prestigio',
        description: 'Alcanza prestigio nivel 10',
        icon: '🌠',
        type: 'prestige',
        rank: 'master',
        reward: 50000,
        target: 10
    }
];

// ============================================
// CONFIGURACIÓN DE ETAPAS
// ============================================

/** Clave para guardar progresión en localStorage */
const PROGRESSION_KEY = 'clickerGameProgression';

/**
 * Configuración de etapas del juego
 * Cada etapa desbloquea nuevas funcionalidades y temas
 */
const STAGES_CONFIG: GameStage[] = [
    {
        id: 'stage_1',
        name: 'Novato',
        description: 'Comienzas tu aventura como clickeador',
        icon: '🌱',
        requirement: { type: 'points', value: 0 },
        unlocks: {
            themes: ['theme_neon_violet'],
            features: ['basic_gameplay']
        }
    },
    {
        id: 'stage_2',
        name: 'Aprendiz',
        description: 'Has demostrado dedicación',
        icon: '📚',
        requirement: { type: 'clicks', value: 100 },
        unlocks: {
            themes: ['theme_ocean'],
            features: ['shop_basic']
        }
    },
    {
        id: 'stage_3',
        name: 'Practicante',
        description: 'Tus habilidades mejoran',
        icon: '⚡',
        requirement: { type: 'points', value: 1000 },
        unlocks: {
            shopItems: ['golden_finger', 'silver_aura'],
            themes: ['theme_forest'],
            features: ['missions']
        }
    },
    {
        id: 'stage_4',
        name: 'Experto',
        description: 'Dominas el arte del click',
        icon: '🎯',
        requirement: { type: 'missions', value: 5 },
        unlocks: {
            shopItems: ['rainbow_touch', 'auto_boost'],
            themes: ['theme_sunset'],
            features: ['statistics']
        }
    },
    {
        id: 'stage_5',
        name: 'Veterano',
        description: 'Tu experiencia es notable',
        icon: '🏅',
        requirement: { type: 'points', value: 10000 },
        unlocks: {
            shopItems: ['diamond_click', 'point_magnet'],
            themes: ['theme_cherry'],
            features: ['prestige']
        }
    },
    {
        id: 'stage_6',
        name: 'Maestro',
        description: 'Has alcanzado la maestría',
        icon: '👑',
        requirement: { type: 'prestige', value: 1 },
        unlocks: {
            shopItems: ['cosmic_power'],
            themes: ['theme_gold'],
            features: ['advanced_stats']
        }
    },
    {
        id: 'stage_7',
        name: 'Leyenda',
        description: 'Tu nombre será recordado',
        icon: '🌟',
        requirement: { type: 'missions', value: 15 },
        unlocks: {
            themes: ['theme_galaxy'],
            features: ['all_shop']
        }
    },
    {
        id: 'stage_8',
        name: 'Mítico',
        description: 'Has trascendido los límites',
        icon: '🔮',
        requirement: { type: 'prestige', value: 3 },
        unlocks: {
            themes: ['theme_rainbow'],
            features: ['legendary']
        }
    },
    {
        id: 'stage_9',
        name: 'Inmortal',
        description: 'Tu poder es infinito',
        icon: '💫',
        requirement: { type: 'points', value: 500000 },
        unlocks: {
            themes: ['theme_void'],
            features: ['ultimate']
        }
    },
    {
        id: 'stage_10',
        name: 'Dios del Click',
        description: 'Has alcanzado la perfección absoluta',
        icon: '🌌',
        requirement: { type: 'prestige', value: 10 },
        unlocks: {
            themes: ['theme_divine'],
            features: ['godmode']
        }
    }
];

// ============================================
// CONFIGURACIÓN DE TEMAS VISUALES
// ============================================

/**
 * Configuración de temas visuales
 * Los temas se desbloquean al alcanzar ciertas etapas
 */
const THEMES_CONFIG: GameTheme[] = [
    {
        id: 'theme_neon_violet',
        name: 'Violeta Neón',
        description: 'El tema clásico del juego',
        icon: '💜',
        requirement: { type: 'free', value: 0 },
        cssClass: 'theme-neon-violet',
        colors: {
            primary: '#9d4edd',
            background: '#0d0015',
            accent: '#c77dff',
            neon: '#ff00ff'
        }
    },
    {
        id: 'theme_ocean',
        name: 'Océano Profundo',
        description: 'Sumérgete en las profundidades',
        icon: '🌊',
        requirement: { type: 'stage', value: 'stage_2' },
        cssClass: 'theme-ocean',
        colors: {
            primary: '#0077b6',
            background: '#001219',
            accent: '#00b4d8',
            neon: '#00f5ff'
        }
    },
    {
        id: 'theme_forest',
        name: 'Bosque Encantado',
        description: 'La magia de la naturaleza',
        icon: '🌲',
        requirement: { type: 'stage', value: 'stage_3' },
        cssClass: 'theme-forest',
        colors: {
            primary: '#2d6a4f',
            background: '#081c15',
            accent: '#40916c',
            neon: '#52b788'
        }
    },
    {
        id: 'theme_sunset',
        name: 'Atardecer',
        description: 'Cálidos colores del ocaso',
        icon: '🌅',
        requirement: { type: 'stage', value: 'stage_4' },
        cssClass: 'theme-sunset',
        colors: {
            primary: '#e85d04',
            background: '#1a0a00',
            accent: '#f48c06',
            neon: '#ff6b35'
        }
    },
    {
        id: 'theme_cherry',
        name: 'Cerezo en Flor',
        description: 'Delicada belleza primaveral',
        icon: '🌸',
        requirement: { type: 'stage', value: 'stage_5' },
        cssClass: 'theme-cherry',
        colors: {
            primary: '#ff69b4',
            background: '#1a0a10',
            accent: '#ffb6c1',
            neon: '#ff1493'
        }
    },
    {
        id: 'theme_gold',
        name: 'Oro Imperial',
        description: 'El lujo de los campeones',
        icon: '👑',
        requirement: { type: 'stage', value: 'stage_6' },
        cssClass: 'theme-gold',
        colors: {
            primary: '#ffd700',
            background: '#1a1400',
            accent: '#ffed4a',
            neon: '#fff700'
        }
    },
    {
        id: 'theme_galaxy',
        name: 'Galaxia',
        description: 'Los colores del cosmos',
        icon: '🌌',
        requirement: { type: 'stage', value: 'stage_7' },
        cssClass: 'theme-galaxy',
        colors: {
            primary: '#7b68ee',
            background: '#0a0a1a',
            accent: '#9370db',
            neon: '#ba55d3'
        }
    },
    {
        id: 'theme_rainbow',
        name: 'Arcoíris',
        description: 'Todos los colores del espectro',
        icon: '🌈',
        requirement: { type: 'stage', value: 'stage_8' },
        cssClass: 'theme-rainbow',
        colors: {
            primary: '#ff6b6b',
            background: '#0d0015',
            accent: '#4ecdc4',
            neon: '#ffe66d'
        }
    },
    {
        id: 'theme_void',
        name: 'Vacío Absoluto',
        description: 'La oscuridad más profunda',
        icon: '🕳️',
        requirement: { type: 'stage', value: 'stage_9' },
        cssClass: 'theme-void',
        colors: {
            primary: '#1a1a2e',
            background: '#000000',
            accent: '#4a4a6a',
            neon: '#6a6aaa'
        }
    },
    {
        id: 'theme_divine',
        name: 'Divino',
        description: 'La luz celestial',
        icon: '✨',
        requirement: { type: 'stage', value: 'stage_10' },
        cssClass: 'theme-divine',
        colors: {
            primary: '#ffffff',
            background: '#0a0a15',
            accent: '#f0f0ff',
            neon: '#ffffff'
        }
    },
    {
        id: 'theme_light',
        name: 'Modo Claro',
        description: 'Tema claro para el día',
        icon: '☀️',
        requirement: { type: 'clicks', value: 500 },
        cssClass: 'theme-light',
        colors: {
            primary: '#6c63ff',
            background: '#f5f5f5',
            accent: '#9d97ff',
            neon: '#6c63ff'
        }
    }
];

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
    
    // Estadísticas avanzadas
    private stats: AdvancedStats;
    
    // Sesión actual
    private currentSession: {
        startTime: number;
        clicks: number;
        pointsEarned: number;
        lastClickTime: number;
        clicksInLastSecond: number;
        currentStreak: number;
    };
    
    // Referencias a elementos del DOM
    private elements: {
        // Pantallas
        mainMenu: HTMLElement;
        gameScreen: HTMLElement;
        shopScreen: HTMLElement;
        profileScreen: HTMLElement;
        settingsScreen: HTMLElement;
        statsScreen: HTMLElement;
        // Menú
        playButton: HTMLButtonElement;
        shopButton: HTMLButtonElement;
        profileButton: HTMLButtonElement;
        settingsButton: HTMLButtonElement;
        statsButton: HTMLButtonElement;
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
        // Estadísticas
        sessionClicks: HTMLElement;
        sessionPoints: HTMLElement;
        sessionDuration: HTMLElement;
        statsTotalClicks: HTMLElement;
        statsCps: HTMLElement;
        statsBestStreak: HTMLElement;
        statsCurrentStreak: HTMLElement;
        statsTotalPoints: HTMLElement;
        statsPps: HTMLElement;
        statsAvgPerClick: HTMLElement;
        statsManualPoints: HTMLElement;
        statsAutoPoints: HTMLElement;
        statsTotalTime: HTMLElement;
        statsActiveTime: HTMLElement;
        statsTotalSessions: HTMLElement;
        statsAvgSession: HTMLElement;
        statsHistoryList: HTMLElement;
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
        // Misiones
        missionsScreen: HTMLElement;
        missionsButton: HTMLButtonElement;
        missionsBadge: HTMLElement;
        missionsList: HTMLElement;
        missionsCompleted: HTMLElement;
        missionsTotal: HTMLElement;
        missionsProgressFill: HTMLElement;
        // Prestigio
        prestigeScreen: HTMLElement;
        prestigeButton: HTMLButtonElement;
        prestigeCount: HTMLElement;
        prestigeLevel: HTMLElement;
        prestigeTotalPoints: HTMLElement;
        prestigeTotalClicks: HTMLElement;
        prestigeTotalItems: HTMLElement;
        prestigeTotalMissions: HTMLElement;
        prestigeRequirement: HTMLElement;
        prestigeCurrentPoints: HTMLElement;
        prestigeActionBtn: HTMLButtonElement;
        prestigeHistoryList: HTMLElement;
        // Progresión
        stageIndicator: HTMLElement;
        stageProgress: HTMLElement;
        stageProgressFill: HTMLElement;
        stageName: HTMLElement;
        stageIcon: HTMLElement;
        // Selector de temas
        themeSelector: HTMLElement;
        themeSelectorGrid: HTMLElement;
        // Modal offline
        offlineModal: HTMLElement;
        offlineTime: HTMLElement;
        offlinePoints: HTMLElement;
        offlineClaimBtn: HTMLButtonElement;
    };
    
    // Ganancias offline pendientes de reclamar
    private pendingOfflineEarnings: OfflineEarnings | null = null;
    
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
    
    // Flag para saber si las estadísticas están visibles
    private isStatsVisible: boolean = false;
    
    // Pantalla actual
    private currentScreen: string = 'menu';
    
    // Sistema de misiones
    private missions: Mission[] = [];
    private completedMissionIds: string[] = [];
    
    // Sistema de prestigio
    private prestige: PrestigeState = this.getDefaultPrestige();
    
    // Sistema de progresión y temas
    private progression: ProgressionState = this.getDefaultProgression();

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
        
        // Inicializar estadísticas por defecto
        this.stats = this.getDefaultStats();
        
        // Inicializar sesión actual
        this.currentSession = this.createNewSession();
        
        // Obtener referencias a elementos del DOM
        this.elements = this.getElements();
        
        // Cargar progreso guardado
        this.loadProgress();
        
        // Cargar configuración guardada
        this.loadSettings();
        
        // Cargar perfil guardado
        this.loadProfile();
        
        // Cargar estadísticas guardadas
        this.loadStats();
        
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
        
        // Iniciar tracking de estadísticas
        this.startStatsTracking();
        
        // Cargar sistema de misiones
        this.loadMissions();
        
        // Cargar sistema de prestigio
        this.loadPrestige();
        
        // Cargar sistema de progresión y temas
        this.loadProgression();
        this.applyCurrentTheme();
        
        // Configurar listeners del Event Bus
        this.setupGameEventListeners();
        
        // Emitir evento de inicio de sesión
        eventBus.emit('session:started', {
            timestamp: Date.now(),
            sessionNumber: this.stats.totalSessions
        });
        
        // Actualizar la UI
        this.updateUI();
        this.updateMissionsBadge();
        
        // Verificar ganancias offline
        this.checkOfflineEarnings();
        
        // Configurar guardado automático y al cerrar
        this.setupAutoSave();
    }

    /**
     * Configura los listeners del Event Bus
     * Esto demuestra cómo los sistemas pueden reaccionar a eventos
     */
    private setupGameEventListeners(): void {
        // === MISIONES Y PROGRESIÓN: Actualizar al hacer click ===
        eventBus.on('click:performed', () => {
            this.updateAllMissionsProgress();
            this.checkStageUnlocks();
            this.checkThemeUnlocks();
            this.updateStageIndicator();
        });

        // === MISIONES Y PROGRESIÓN: Actualizar al cambiar puntos ===
        eventBus.on('points:changed', (data) => {
            if (data.source !== 'reset') {
                this.updateAllMissionsProgress();
                this.checkStageUnlocks();
                this.checkThemeUnlocks();
                this.updateStageIndicator();
            }
        });

        // === MISIONES: Actualizar al comprar ítem ===
        eventBus.on('shop:item-purchased', () => {
            this.updateAllMissionsProgress();
            console.log(`🛒 Compraste un ítem de la tienda`);
        });

        // === MISIONES: Actualizar al comprar mejora ===
        eventBus.on('upgrade:purchased', () => {
            this.updateAllMissionsProgress();
        });

        // === MISIONES Y PROGRESIÓN: Actualizar al prestigiar ===
        eventBus.on('prestige:performed', (data) => {
            this.updateAllMissionsProgress();
            this.checkStageUnlocks();
            this.checkThemeUnlocks();
            this.updateStageIndicator();
            console.log(`⭐ ¡Prestigio nivel ${data.newLevel} alcanzado!`);
        });

        // === MISIONES Y PROGRESIÓN: Al completar misión ===
        eventBus.on('mission:completed', (data) => {
            // Verificar desbloqueos
            this.checkStageUnlocks();
            this.checkThemeUnlocks();
            this.updateStageIndicator();
            
            // Animación visual de la misión completada
            const missionCard = document.querySelector(`[data-mission-id="${data.mission.id}"]`);
            if (missionCard) {
                missionCard.classList.add('just-completed');
                setTimeout(() => {
                    missionCard.classList.remove('just-completed');
                }, 600);
            }
        });

        // === MILESTONES de clicks ===
        const clickMilestones = [10, 50, 100, 500, 1000, 5000, 10000];
        eventBus.on('click:performed', (data) => {
            for (const milestone of clickMilestones) {
                if (data.totalClicks === milestone) {
                    eventBus.emit('stats:milestone-reached', {
                        type: 'clicks',
                        value: data.totalClicks,
                        milestone
                    });
                    console.log(`🎉 ¡Milestone alcanzado: ${milestone} clicks!`);
                }
            }
        });

        // === MILESTONES de puntos ===
        const pointMilestones = [100, 1000, 10000, 100000, 1000000];
        let lastPointMilestone = 0;
        eventBus.on('points:changed', (data) => {
            if (data.source === 'reset') {
                lastPointMilestone = 0;
                return;
            }
            for (const milestone of pointMilestones) {
                if (data.newScore >= milestone && lastPointMilestone < milestone) {
                    lastPointMilestone = milestone;
                    eventBus.emit('stats:milestone-reached', {
                        type: 'points',
                        value: data.newScore,
                        milestone
                    });
                    console.log(`🎉 ¡Milestone alcanzado: ${milestone} puntos!`);
                }
            }
        });

        // === Level up ===
        eventBus.on('profile:level-up', (data) => {
            console.log(`⬆️ ¡Nivel ${data.previousLevel} → ${data.newLevel}!`);
        });

        // === Cambio de tema ===
        eventBus.on('settings:theme-changed', (data) => {
            console.log(`🎨 Tema cambiado a: ${data.theme}`);
        });

        // === Cambio de pantalla ===
        eventBus.on('ui:screen-changed', (data) => {
            if (data.previousScreen !== data.newScreen) {
                console.log(`📱 Pantalla: ${data.previousScreen} → ${data.newScreen}`);
            }
        });
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
     * Devuelve las estadísticas por defecto
     */
    private getDefaultStats(): AdvancedStats {
        return {
            totalClicks: 0,
            bestClickStreak: 0,
            totalPointsEarned: 0,
            manualPointsEarned: 0,
            autoPointsEarned: 0,
            totalTimePlayed: 0,
            activeTime: 0,
            totalSessions: 0,
            sessionHistory: []
        };
    }

    /**
     * Crea una nueva sesión de juego
     */
    private createNewSession() {
        return {
            startTime: Date.now(),
            clicks: 0,
            pointsEarned: 0,
            lastClickTime: 0,
            clicksInLastSecond: 0,
            currentStreak: 0
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
            statsScreen: document.getElementById('stats-screen')!,
            // Menú
            playButton: document.getElementById('play-button') as HTMLButtonElement,
            shopButton: document.getElementById('shop-button') as HTMLButtonElement,
            profileButton: document.getElementById('profile-button') as HTMLButtonElement,
            settingsButton: document.getElementById('settings-button') as HTMLButtonElement,
            statsButton: document.getElementById('stats-button') as HTMLButtonElement,
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
            // Estadísticas
            sessionClicks: document.getElementById('session-clicks')!,
            sessionPoints: document.getElementById('session-points')!,
            sessionDuration: document.getElementById('session-duration')!,
            statsTotalClicks: document.getElementById('stats-total-clicks')!,
            statsCps: document.getElementById('stats-cps')!,
            statsBestStreak: document.getElementById('stats-best-streak')!,
            statsCurrentStreak: document.getElementById('stats-current-streak')!,
            statsTotalPoints: document.getElementById('stats-total-points')!,
            statsPps: document.getElementById('stats-pps')!,
            statsAvgPerClick: document.getElementById('stats-avg-per-click')!,
            statsManualPoints: document.getElementById('stats-manual-points')!,
            statsAutoPoints: document.getElementById('stats-auto-points')!,
            statsTotalTime: document.getElementById('stats-total-time')!,
            statsActiveTime: document.getElementById('stats-active-time')!,
            statsTotalSessions: document.getElementById('stats-total-sessions')!,
            statsAvgSession: document.getElementById('stats-avg-session')!,
            statsHistoryList: document.getElementById('stats-history-list')!,
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
            settingsResetBtn: document.getElementById('settings-reset-btn') as HTMLButtonElement,
            // Misiones
            missionsScreen: document.getElementById('missions-screen')!,
            missionsButton: document.getElementById('missions-button') as HTMLButtonElement,
            missionsBadge: document.getElementById('missions-badge')!,
            missionsList: document.getElementById('missions-list')!,
            missionsCompleted: document.getElementById('missions-completed')!,
            missionsTotal: document.getElementById('missions-total')!,
            missionsProgressFill: document.getElementById('missions-progress-fill')!,
            // Prestigio
            prestigeScreen: document.getElementById('prestige-screen')!,
            prestigeButton: document.getElementById('prestige-button') as HTMLButtonElement,
            prestigeCount: document.getElementById('prestige-count')!,
            prestigeLevel: document.getElementById('prestige-level')!,
            prestigeTotalPoints: document.getElementById('prestige-total-points')!,
            prestigeTotalClicks: document.getElementById('prestige-total-clicks')!,
            prestigeTotalItems: document.getElementById('prestige-total-items')!,
            prestigeTotalMissions: document.getElementById('prestige-total-missions')!,
            prestigeRequirement: document.getElementById('prestige-requirement')!,
            prestigeCurrentPoints: document.getElementById('prestige-current-points')!,
            prestigeActionBtn: document.getElementById('prestige-action-btn') as HTMLButtonElement,
            prestigeHistoryList: document.getElementById('prestige-history-list')!,
            // Progresión
            stageIndicator: document.getElementById('stage-indicator')!,
            stageProgress: document.getElementById('stage-progress')!,
            stageProgressFill: document.getElementById('stage-progress-fill')!,
            stageName: document.getElementById('stage-name')!,
            stageIcon: document.getElementById('stage-icon')!,
            // Selector de temas
            themeSelector: document.getElementById('theme-selector')!,
            themeSelectorGrid: document.getElementById('theme-selector-grid')!,
            // Modal offline
            offlineModal: document.getElementById('offline-modal')!,
            offlineTime: document.getElementById('offline-time')!,
            offlinePoints: document.getElementById('offline-points')!,
            offlineClaimBtn: document.getElementById('offline-claim-btn') as HTMLButtonElement
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
        this.elements.statsButton.addEventListener('click', () => this.showScreen('stats'));
        this.elements.missionsButton.addEventListener('click', () => this.showScreen('missions'));
        this.elements.prestigeButton.addEventListener('click', () => this.showScreen('prestige'));
        this.elements.menuButton.addEventListener('click', () => this.showScreen('menu'));
        
        // Botón de acción de prestigio
        this.elements.prestigeActionBtn.addEventListener('click', () => this.handlePrestigeClick());
        
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
        
        // === MODAL OFFLINE ===
        this.elements.offlineClaimBtn.addEventListener('click', () => this.claimOfflineEarnings());
        
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
            this.saveCurrentSession();
            this.saveProgress();
            this.saveSettings();
            this.saveProfile();
            this.saveStats();
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
        this.elements.statsScreen.classList.add('hidden');
        this.elements.missionsScreen.classList.add('hidden');
        this.elements.prestigeScreen.classList.add('hidden');
    }

    /**
     * Muestra una pantalla específica
     */
    private showScreen(screen: 'menu' | 'game' | 'shop' | 'profile' | 'settings' | 'stats' | 'missions' | 'prestige'): void {
        const previousScreen = this.currentScreen;
        this.currentScreen = screen;
        
        this.hideAllScreens();
        
        // Ocultar el selector de avatar si estaba abierto
        this.elements.avatarSelector.classList.add('hidden');
        
        // Marcar si el perfil está visible
        this.isProfileVisible = screen === 'profile';
        
        // Marcar si las estadísticas están visibles
        this.isStatsVisible = screen === 'stats';
        
        // Emitir evento de cambio de pantalla
        eventBus.emit('ui:screen-changed', {
            previousScreen,
            newScreen: screen
        });
        
        switch (screen) {
            case 'menu':
                this.elements.mainMenu.classList.remove('hidden');
                this.saveProgress();
                this.saveProfile();
                this.saveStats();
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
                this.renderThemeSelector();
                this.elements.settingsScreen.classList.remove('hidden');
                break;
            case 'stats':
                this.updateStatsUI();
                this.elements.statsScreen.classList.remove('hidden');
                break;
            case 'missions':
                this.updateMissionsUI();
                this.elements.missionsScreen.classList.remove('hidden');
                break;
            case 'prestige':
                this.updatePrestigeUI();
                this.elements.prestigeScreen.classList.remove('hidden');
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
            this.stats.totalTimePlayed++;
            
            // Si el perfil está visible, actualizar el display
            if (this.isProfileVisible) {
                this.elements.statTimePlayed.textContent = this.formatTime(this.profile.totalTimePlayed);
            }
            
            // Guardar cada minuto
            if (this.profile.totalTimePlayed % 60 === 0) {
                this.saveProfile();
                this.saveStats();
            }
        }, 1000);
    }

    /**
     * Registra puntos ganados y actualiza estadísticas
     */
    private recordPointsEarned(points: number): void {
        this.profile.totalPointsEarned += points;
        
        // Verificar si subió de nivel
        const previousLevel = this.profile.level;
        const newLevel = this.calculateLevel(this.profile.totalPointsEarned);
        if (newLevel > previousLevel) {
            this.profile.level = newLevel;
            
            // Emitir evento de level up
            eventBus.emit('profile:level-up', {
                previousLevel,
                newLevel,
                totalPoints: this.profile.totalPointsEarned
            });
            
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
    // SISTEMA DE ESTADÍSTICAS AVANZADAS
    // ============================================

    /**
     * Carga las estadísticas desde localStorage
     */
    private loadStats(): void {
        try {
            const savedStats = localStorage.getItem(STATS_KEY);
            
            if (savedStats) {
                const parsedStats = JSON.parse(savedStats) as Partial<AdvancedStats>;
                
                // Combinar con valores por defecto
                this.stats = {
                    ...this.getDefaultStats(),
                    ...parsedStats,
                    sessionHistory: parsedStats.sessionHistory || []
                };
                
                // Incrementar contador de sesiones
                this.stats.totalSessions++;
                
                console.log('Estadísticas cargadas correctamente');
            } else {
                // Primera sesión
                this.stats.totalSessions = 1;
            }
        } catch (error) {
            console.error('Error al cargar las estadísticas:', error);
            this.stats.totalSessions = 1;
        }
    }

    /**
     * Guarda las estadísticas en localStorage
     */
    private saveStats(): void {
        try {
            const statsJSON = JSON.stringify(this.stats);
            localStorage.setItem(STATS_KEY, statsJSON);
        } catch (error) {
            console.error('Error al guardar las estadísticas:', error);
        }
    }

    /**
     * Inicia el tracking de estadísticas en tiempo real
     */
    private startStatsTracking(): void {
        // Actualizar CPS y resetear contador cada segundo
        window.setInterval(() => {
            // Actualizar mejor racha si es necesario
            if (this.currentSession.clicksInLastSecond > this.stats.bestClickStreak) {
                this.stats.bestClickStreak = this.currentSession.clicksInLastSecond;
            }
            
            // Actualizar racha actual
            this.currentSession.currentStreak = this.currentSession.clicksInLastSecond;
            
            // Resetear contador de clicks del último segundo
            this.currentSession.clicksInLastSecond = 0;
            
            // Si las estadísticas están visibles, actualizar UI
            if (this.isStatsVisible) {
                this.updateStatsUI();
            }
        }, 1000);
    }

    /**
     * Registra un click en las estadísticas
     */
    private recordClickStats(points: number): void {
        const now = Date.now();
        
        // Estadísticas globales
        this.stats.totalClicks++;
        this.stats.manualPointsEarned += points;
        this.stats.totalPointsEarned += points;
        
        // Sesión actual
        this.currentSession.clicks++;
        this.currentSession.pointsEarned += points;
        this.currentSession.clicksInLastSecond++;
        
        // Tiempo activo: si el último click fue hace menos de 2 segundos, sumar 1 segundo
        if (this.currentSession.lastClickTime > 0 && 
            now - this.currentSession.lastClickTime < 2000) {
            this.stats.activeTime++;
        }
        this.currentSession.lastClickTime = now;
    }

    /**
     * Registra puntos del auto-clicker
     */
    private recordAutoPoints(points: number): void {
        this.stats.autoPointsEarned += points;
        this.stats.totalPointsEarned += points;
        this.currentSession.pointsEarned += points;
    }

    /**
     * Actualiza la UI de estadísticas
     */
    private updateStatsUI(): void {
        // Sesión actual
        const sessionDuration = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        this.elements.sessionClicks.textContent = this.formatNumber(this.currentSession.clicks);
        this.elements.sessionPoints.textContent = this.formatNumber(this.currentSession.pointsEarned);
        this.elements.sessionDuration.textContent = this.formatTimeShort(sessionDuration);
        
        // Actividad
        this.elements.statsTotalClicks.textContent = this.formatNumber(this.stats.totalClicks);
        
        // CPS (clicks por segundo en el último segundo)
        this.elements.statsCps.textContent = this.currentSession.currentStreak.toFixed(1);
        this.elements.statsBestStreak.textContent = this.stats.bestClickStreak.toString();
        this.elements.statsCurrentStreak.textContent = this.currentSession.currentStreak.toString();
        
        // Producción
        this.elements.statsTotalPoints.textContent = this.formatNumber(this.stats.totalPointsEarned);
        
        // PPS (puntos por segundo efectivo)
        const effectivePps = this.state.pointsPerSecond * this.pointsMultiplier;
        this.elements.statsPps.textContent = effectivePps.toString();
        
        // Promedio por click
        const avgPerClick = this.stats.totalClicks > 0 
            ? (this.stats.manualPointsEarned / this.stats.totalClicks).toFixed(1)
            : '0.0';
        this.elements.statsAvgPerClick.textContent = avgPerClick;
        
        this.elements.statsManualPoints.textContent = this.formatNumber(this.stats.manualPointsEarned);
        this.elements.statsAutoPoints.textContent = this.formatNumber(this.stats.autoPointsEarned);
        
        // Tiempo
        this.elements.statsTotalTime.textContent = this.formatTime(this.stats.totalTimePlayed);
        this.elements.statsActiveTime.textContent = this.formatTime(this.stats.activeTime);
        this.elements.statsTotalSessions.textContent = this.stats.totalSessions.toString();
        
        // Promedio por sesión
        const avgSessionTime = this.stats.totalSessions > 0
            ? Math.floor(this.stats.totalTimePlayed / this.stats.totalSessions)
            : 0;
        this.elements.statsAvgSession.textContent = this.formatTimeShort(avgSessionTime);
        
        // Historial
        this.renderSessionHistory();
    }

    /**
     * Renderiza el historial de sesiones
     */
    private renderSessionHistory(): void {
        const container = this.elements.statsHistoryList;
        
        if (this.stats.sessionHistory.length === 0) {
            container.innerHTML = '<div class="stats-history-empty">No hay sesiones anteriores</div>';
            return;
        }
        
        // Mostrar últimas sesiones (más recientes primero)
        const sessions = [...this.stats.sessionHistory].reverse().slice(0, 5);
        
        container.innerHTML = sessions.map(session => `
            <div class="stats-history-item">
                <div class="stats-history-info">
                    <span class="stats-history-date">${session.date}</span>
                    <span class="stats-history-duration">${this.formatTimeShort(session.duration)}</span>
                </div>
                <div class="stats-history-data">
                    <div class="stats-history-stat">
                        <span class="stats-history-stat-value">${this.formatNumber(session.clicks)}</span>
                        <span class="stats-history-stat-label">clicks</span>
                    </div>
                    <div class="stats-history-stat">
                        <span class="stats-history-stat-value">${this.formatNumber(session.pointsEarned)}</span>
                        <span class="stats-history-stat-label">puntos</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Guarda la sesión actual en el historial
     */
    private saveCurrentSession(): void {
        const sessionDuration = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        
        // Solo guardar si la sesión duró más de 10 segundos y tuvo clicks
        if (sessionDuration > 10 && this.currentSession.clicks > 0) {
            const session: GameSession = {
                id: this.currentSession.startTime,
                date: new Date().toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                duration: sessionDuration,
                clicks: this.currentSession.clicks,
                pointsEarned: this.currentSession.pointsEarned
            };
            
            // Añadir al historial
            this.stats.sessionHistory.push(session);
            
            // Mantener solo las últimas N sesiones
            if (this.stats.sessionHistory.length > MAX_SESSION_HISTORY) {
                this.stats.sessionHistory = this.stats.sessionHistory.slice(-MAX_SESSION_HISTORY);
            }
        }
    }

    /**
     * Formatea tiempo en formato corto (M:SS o H:MM:SS)
     */
    private formatTimeShort(totalSeconds: number): string {
        if (totalSeconds < 3600) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return this.formatTime(totalSeconds);
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
        
        // Emitir evento
        eventBus.emit('settings:theme-changed', { theme });
        eventBus.emit('settings:changed', { setting: 'theme', value: theme });
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
        const previousScore = this.state.score;
        
        // Descontar puntos
        this.state.score -= item.price;

        // Marcar como comprado
        this.state.purchasedItems.push(item.id);

        // Aplicar efecto del ítem
        this.applyItemEffect(item);

        // === EMITIR EVENTOS ===
        eventBus.emit('shop:item-purchased', {
            item,
            newScore: this.state.score
        });
        
        eventBus.emit('points:changed', {
            previousScore,
            newScore: this.state.score,
            delta: -item.price,
            source: 'purchase'
        });

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
        // Guardar puntuación anterior
        const previousScore = this.state.score;
        
        // Sumar puntos (con multiplicador)
        const points = this.state.pointsPerClick * this.pointsMultiplier;
        this.state.score += points;
        
        // Registrar estadísticas del perfil
        this.recordClick();
        this.recordPointsEarned(points);
        
        // Registrar estadísticas avanzadas
        this.recordClickStats(points);
        
        // === EMITIR EVENTOS ===
        eventBus.emit('click:performed', {
            points,
            totalClicks: this.profile.totalClicks,
            timestamp: Date.now()
        });
        
        eventBus.emit('points:changed', {
            previousScore,
            newScore: this.state.score,
            delta: points,
            source: 'click'
        });
        
        // Mostrar feedback visual con micro-animaciones
        this.showClickFeedback();
        
        // Micro-animaciones avanzadas (siempre centradas en el botón)
        microAnimations.handleClick(points);
        
        // Animar actualización del score
        microAnimations.animateValueUpdate(this.elements.score, 'updated');
        
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
            const previousScore = this.state.score;
            
            // Restar el precio
            this.state.score -= price;
            
            // Incrementar el nivel de mejora
            this.state.clickUpgradeLevel++;
            
            // Incrementar los puntos por click
            this.state.pointsPerClick += CLICK_UPGRADE_CONFIG.effect;
            
            // Emitir eventos
            eventBus.emit('upgrade:purchased', {
                upgradeType: 'click',
                newLevel: this.state.clickUpgradeLevel,
                price
            });
            
            eventBus.emit('points:changed', {
                previousScore,
                newScore: this.state.score,
                delta: -price,
                source: 'purchase'
            });
            
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
            const previousScore = this.state.score;
            
            // Restar el precio
            this.state.score -= price;
            
            // Incrementar el nivel de mejora
            this.state.autoUpgradeLevel++;
            
            // Incrementar los puntos por segundo
            this.state.pointsPerSecond += AUTO_UPGRADE_CONFIG.effect;
            
            // Emitir eventos
            eventBus.emit('upgrade:purchased', {
                upgradeType: 'auto',
                newLevel: this.state.autoUpgradeLevel,
                price
            });
            
            eventBus.emit('points:changed', {
                previousScore,
                newScore: this.state.score,
                delta: -price,
                source: 'purchase'
            });
            
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
                const previousScore = this.state.score;
                
                // Aplicar multiplicador
                const points = this.state.pointsPerSecond * this.pointsMultiplier;
                this.state.score += points;
                
                // Registrar puntos ganados en el perfil
                this.recordPointsEarned(points);
                
                // Registrar puntos automáticos en estadísticas
                this.recordAutoPoints(points);
                
                // Emitir evento de cambio de puntos
                eventBus.emit('points:changed', {
                    previousScore,
                    newScore: this.state.score,
                    delta: points,
                    source: 'auto'
                });
                
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
        // Guardar la acción antes de ocultar el modal
        const action = this.pendingAction;
        
        // Ocultar el modal (esto limpia pendingAction)
        this.hideConfirmModal();
        
        // Ejecutar la acción si existe
        if (action) {
            action();
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
        
        // Resetear perfil completamente
        this.profile = this.getDefaultProfile();
        
        // Resetear estadísticas avanzadas completamente
        this.stats = this.getDefaultStats();
        
        // Resetear sesión actual
        this.currentSession = this.createNewSession();
        
        // Resetear misiones
        this.completedMissionIds = [];
        this.missions = this.initializeMissions();
        
        // Resetear prestigio
        this.prestige = this.getDefaultPrestige();
        
        // Resetear progresión (mantener tema por defecto)
        this.progression = this.getDefaultProgression();
        
        // Resetear configuración a valores por defecto
        this.settings = this.getDefaultSettings();
        
        // Limpiar TODOS los datos de localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(MISSIONS_KEY);
        localStorage.removeItem(PRESTIGE_KEY);
        localStorage.removeItem(PROGRESSION_KEY);
        localStorage.removeItem(MASTER_SAVE_KEY);
        
        // Usar también el SaveManager para limpiar
        saveManager.reset();
        
        // Emitir evento de reset
        eventBus.emit('game:reset', { timestamp: Date.now() });
        eventBus.emit('points:changed', {
            previousScore: 0,
            newScore: 0,
            delta: 0,
            source: 'reset'
        });
        
        // Aplicar configuración por defecto
        this.applySettings();
        
        // Aplicar tema por defecto
        this.applyCurrentTheme();
        
        // Actualizar toda la UI
        this.updateUI();
        this.updateShopUI();
        this.renderShop();
        this.updateMissionsUI();
        this.updateMissionsBadge();
        this.updatePrestigeUI();
        this.updateStageIndicator();
        this.renderThemeSelector();
        this.updateProfileUI();
        this.updateStatsUI();
        
        console.log('🔄 Juego reiniciado completamente');
    }

    // ============================================
    // SISTEMA DE MISIONES
    // ============================================

    /**
     * Carga las misiones desde localStorage y configura el sistema
     */
    private loadMissions(): void {
        // Cargar IDs de misiones completadas
        const savedData = localStorage.getItem(MISSIONS_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.completedMissionIds = parsed.completedIds || [];
            } catch {
                this.completedMissionIds = [];
            }
        }

        // Inicializar misiones desde la configuración
        this.missions = MISSIONS_CONFIG.map(config => ({
            ...config,
            progress: 0,
            completed: this.completedMissionIds.includes(config.id),
            completedAt: this.completedMissionIds.includes(config.id) ? Date.now() : undefined
        }));

        // Actualizar progreso inicial de las misiones
        this.updateAllMissionsProgress();
    }
    
    /**
     * Inicializa las misiones desde la configuración (sin cargar de localStorage)
     */
    private initializeMissions(): Mission[] {
        return MISSIONS_CONFIG.map(config => ({
            ...config,
            progress: 0,
            completed: this.completedMissionIds.includes(config.id),
            completedAt: this.completedMissionIds.includes(config.id) ? Date.now() : undefined
        }));
    }

    /**
     * Guarda las misiones en localStorage
     */
    private saveMissions(): void {
        const data = {
            completedIds: this.completedMissionIds
        };
        localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
    }

    /**
     * Actualiza el progreso de todas las misiones
     */
    private updateAllMissionsProgress(): void {
        const totalClicks = this.profile.totalClicks;
        const totalPoints = this.profile.totalPointsEarned;
        const totalUpgrades = this.state.clickUpgradeLevel + this.state.autoUpgradeLevel;
        const totalPurchases = this.state.purchasedItems.length;
        const totalTime = this.stats.totalTimePlayed;
        const prestigeLevel = this.prestige.level;

        this.missions.forEach(mission => {
            if (mission.completed) return;

            let newProgress = 0;
            switch (mission.type) {
                case 'clicks':
                    newProgress = totalClicks;
                    break;
                case 'points':
                    newProgress = totalPoints;
                    break;
                case 'upgrade':
                    newProgress = totalUpgrades;
                    break;
                case 'purchase':
                    newProgress = totalPurchases;
                    break;
                case 'time':
                    newProgress = totalTime;
                    break;
                case 'prestige':
                    newProgress = prestigeLevel;
                    break;
            }

            mission.progress = Math.min(newProgress, mission.target);

            // Verificar si se completó
            if (mission.progress >= mission.target && !mission.completed) {
                this.completeMission(mission);
            }
        });
    }

    /**
     * Completa una misión
     */
    private completeMission(mission: Mission): void {
        mission.completed = true;
        mission.completedAt = Date.now();
        this.completedMissionIds.push(mission.id);
        
        // === DAR RECOMPENSA DE PUNTOS ===
        const previousScore = this.state.score;
        this.state.score += mission.reward;
        
        // Emitir evento de cambio de puntos
        eventBus.emit('points:changed', {
            previousScore,
            newScore: this.state.score,
            delta: mission.reward,
            source: 'click' // Usamos 'click' para que no resetee milestones
        });
        
        // Actualizar UI
        this.updateUI();
        this.updateShopUI();
        this.saveProgress();
        
        // Actualizar estadísticas de prestigio
        this.prestige.totalHistoricMissions++;
        this.savePrestige();
        
        this.saveMissions();

        // Emitir evento de misión completada
        eventBus.emit('mission:completed', {
            mission,
            timestamp: Date.now()
        });

        const rankInfo = MISSION_RANKS[mission.rank];
        console.log(`🎯 ¡Misión ${rankInfo.icon} ${rankInfo.name} completada: ${mission.title}! +${this.formatNumber(mission.reward)} puntos`);
        
        // Actualizar badge
        this.updateMissionsBadge();
    }

    /**
     * Actualiza el badge de misiones completadas en el menú
     */
    private updateMissionsBadge(): void {
        const pendingCount = this.missions.filter(m => !m.completed).length;
        const badge = this.elements.missionsBadge;
        
        if (pendingCount > 0) {
            badge.textContent = pendingCount.toString();
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    /**
     * Actualiza la UI de misiones
     */
    private updateMissionsUI(): void {
        const completedCount = this.missions.filter(m => m.completed).length;
        const totalCount = this.missions.length;
        const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        // Actualizar resumen
        this.elements.missionsCompleted.textContent = completedCount.toString();
        this.elements.missionsTotal.textContent = totalCount.toString();
        this.elements.missionsProgressFill.style.width = `${progressPercent}%`;

        // Actualizar progreso actual de misiones
        this.updateAllMissionsProgress();

        // Renderizar lista de misiones
        this.renderMissionsList();
    }

    /**
     * Renderiza la lista de misiones
     */
    private renderMissionsList(): void {
        const container = this.elements.missionsList;
        
        // Ordenar: por rango (no completadas primero), luego completadas al final
        const rankOrder: Record<MissionRank, number> = {
            bronze: 1, silver: 2, gold: 3, diamond: 4, master: 5
        };
        
        const sortedMissions = [...this.missions].sort((a, b) => {
            // Primero ordenar por completadas (no completadas primero)
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Luego por rango
            return rankOrder[a.rank] - rankOrder[b.rank];
        });

        container.innerHTML = sortedMissions.map(mission => {
            const progressPercent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;
            const progressText = this.formatMissionProgress(mission);
            const rankInfo = MISSION_RANKS[mission.rank];
            
            return `
                <div class="mission-card ${mission.completed ? 'completed' : ''} mission-rank-${mission.rank}" data-mission-id="${mission.id}">
                    <div class="mission-rank-badge" style="background: ${rankInfo.color}">
                        ${rankInfo.icon}
                    </div>
                    <div class="mission-icon">${mission.icon}</div>
                    <div class="mission-info">
                        <div class="mission-header">
                            <div class="mission-title">${mission.title}</div>
                            <div class="mission-rank-label" style="color: ${rankInfo.color}">${rankInfo.name}</div>
                        </div>
                        <div class="mission-description">${mission.description}</div>
                        <div class="mission-reward">
                            <span class="mission-reward-icon">🎁</span>
                            <span class="mission-reward-value">+${this.formatNumber(mission.reward)} puntos</span>
                        </div>
                    </div>
                    ${mission.completed ? `
                        <div class="mission-completed-section">
                            <div class="mission-badge">✓</div>
                            <div class="mission-claimed">Reclamado</div>
                        </div>
                    ` : `
                        <div class="mission-progress-section">
                            <div class="mission-progress-text">${progressText}</div>
                            <div class="mission-progress-bar">
                                <div class="mission-progress-fill" style="width: ${Math.min(progressPercent, 100)}%; background: ${rankInfo.color}"></div>
                            </div>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    /**
     * Formatea el progreso de una misión para mostrar
     */
    private formatMissionProgress(mission: Mission): string {
        if (mission.type === 'time') {
            const progressMin = Math.floor(mission.progress / 60);
            const targetMin = Math.floor(mission.target / 60);
            return `${progressMin}/${targetMin} min`;
        }
        return `${this.formatNumber(mission.progress)}/${this.formatNumber(mission.target)}`;
    }

    // ============================================
    // SISTEMA DE PRESTIGIO
    // ============================================

    /**
     * Retorna el estado de prestigio por defecto
     */
    private getDefaultPrestige(): PrestigeState {
        return {
            level: 0,
            totalHistoricPoints: 0,
            totalHistoricClicks: 0,
            totalHistoricItems: 0,
            totalHistoricMissions: 0,
            history: []
        };
    }

    /**
     * Carga el estado de prestigio desde localStorage
     */
    private loadPrestige(): void {
        const savedData = localStorage.getItem(PRESTIGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.prestige = {
                    ...this.getDefaultPrestige(),
                    ...parsed
                };
            } catch {
                this.prestige = this.getDefaultPrestige();
            }
        }
        
        // Actualizar contador en el menú
        this.elements.prestigeCount.textContent = `×${this.prestige.level}`;
    }

    /**
     * Guarda el estado de prestigio en localStorage
     */
    private savePrestige(): void {
        localStorage.setItem(PRESTIGE_KEY, JSON.stringify(this.prestige));
    }

    /**
     * Calcula los puntos requeridos para prestigiar
     */
    private getPrestigeRequirement(): number {
        return PRESTIGE_BASE_REQUIREMENT * Math.pow(PRESTIGE_REQUIREMENT_MULTIPLIER, this.prestige.level);
    }

    /**
     * Verifica si puede prestigiar
     */
    private canPrestige(): boolean {
        return this.profile.totalPointsEarned >= this.getPrestigeRequirement();
    }

    /**
     * Maneja el click en el botón de prestigio
     */
    private handlePrestigeClick(): void {
        if (!this.canPrestige()) return;

        this.showConfirmModal(
            '⭐ Confirmar Prestigio',
            `¿Estás seguro de que quieres prestigiar? Perderás todo tu progreso actual pero conservarás tus logros y estadísticas históricas. Tu nivel de prestigio aumentará a ${this.prestige.level + 1}.`,
            'Prestigiar',
            () => this.performPrestige()
        );
    }

    /**
     * Ejecuta el prestigio
     */
    private performPrestige(): void {
        const pointsAtPrestige = this.profile.totalPointsEarned;
        const clicksAtPrestige = this.profile.totalClicks;

        // Actualizar estadísticas históricas
        this.prestige.totalHistoricPoints += pointsAtPrestige;
        this.prestige.totalHistoricClicks += clicksAtPrestige;
        this.prestige.totalHistoricItems += this.state.purchasedItems.length;
        
        // Incrementar nivel
        this.prestige.level++;

        // Añadir al historial
        const record: PrestigeRecord = {
            number: this.prestige.level,
            date: new Date().toLocaleDateString('es-ES'),
            pointsAtPrestige,
            clicksAtPrestige
        };
        this.prestige.history.unshift(record);
        
        // Limitar historial
        if (this.prestige.history.length > MAX_PRESTIGE_HISTORY) {
            this.prestige.history = this.prestige.history.slice(0, MAX_PRESTIGE_HISTORY);
        }

        // Guardar prestigio
        this.savePrestige();

        // Emitir evento de prestigio
        eventBus.emit('prestige:performed', {
            newLevel: this.prestige.level,
            pointsAtPrestige,
            clicksAtPrestige,
            timestamp: Date.now()
        });

        // Resetear el juego (pero mantener logros y stats)
        this.resetForPrestige();

        // Mostrar efecto visual
        this.showPrestigeEffect();

        // Actualizar UI
        this.elements.prestigeCount.textContent = `×${this.prestige.level}`;
        this.updatePrestigeUI();

        console.log(`⭐ ¡Prestigio nivel ${this.prestige.level} alcanzado!`);
    }

    /**
     * Resetea el juego para el prestigio (mantiene logros y stats globales)
     */
    private resetForPrestige(): void {
        // Detener auto-clicker
        if (this.autoClickerInterval !== null) {
            clearInterval(this.autoClickerInterval);
            this.autoClickerInterval = null;
        }

        // Quitar efectos visuales de ítems
        SHOP_ITEMS.forEach(item => {
            if (item.effect.type === 'visual') {
                this.elements.clickButton.classList.remove(item.effect.value);
            }
        });

        // Resetear multiplicador
        this.pointsMultiplier = 1;

        // Resetear estado del juego
        this.state = this.getDefaultState();

        // Resetear perfil (mantener nombre y avatar)
        const savedName = this.profile.name;
        const savedAvatar = this.profile.avatar;
        this.profile = this.getDefaultProfile();
        this.profile.name = savedName;
        this.profile.avatar = savedAvatar;

        // Limpiar localStorage del juego
        localStorage.removeItem(STORAGE_KEY);
        this.saveProfile();

        // Actualizar misiones (el progreso se recalcula)
        this.updateAllMissionsProgress();

        // Actualizar UI
        this.updateUI();
        this.updateShopUI();
    }

    /**
     * Muestra un efecto visual de prestigio
     */
    private showPrestigeEffect(): void {
        const flash = document.createElement('div');
        flash.className = 'prestige-flash';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 1000);
    }

    /**
     * Actualiza la UI de prestigio
     */
    private updatePrestigeUI(): void {
        const requirement = this.getPrestigeRequirement();
        const currentPoints = this.profile.totalPointsEarned;
        const canPrestige = this.canPrestige();

        // Nivel de prestigio
        this.elements.prestigeLevel.textContent = this.prestige.level.toString();

        // Estadísticas históricas
        this.elements.prestigeTotalPoints.textContent = this.formatNumber(this.prestige.totalHistoricPoints);
        this.elements.prestigeTotalClicks.textContent = this.formatNumber(this.prestige.totalHistoricClicks);
        this.elements.prestigeTotalItems.textContent = this.prestige.totalHistoricItems.toString();
        this.elements.prestigeTotalMissions.textContent = this.prestige.totalHistoricMissions.toString();

        // Requisito y puntos actuales
        this.elements.prestigeRequirement.textContent = this.formatNumber(requirement) + ' puntos';
        this.elements.prestigeCurrentPoints.textContent = this.formatNumber(currentPoints);

        // Botón de prestigio
        this.elements.prestigeActionBtn.disabled = !canPrestige;

        // Renderizar historial
        this.renderPrestigeHistory();
    }

    /**
     * Renderiza el historial de prestigios
     */
    private renderPrestigeHistory(): void {
        const container = this.elements.prestigeHistoryList;

        if (this.prestige.history.length === 0) {
            container.innerHTML = '<div class="prestige-history-empty">Aún no has prestigiado</div>';
            return;
        }

        container.innerHTML = this.prestige.history.map(record => `
            <div class="prestige-history-item">
                <div class="prestige-history-number">⭐ Prestigio #${record.number}</div>
                <div class="prestige-history-date">${record.date}</div>
                <div class="prestige-history-points">${this.formatNumber(record.pointsAtPrestige)} pts</div>
            </div>
        `).join('');
    }

    // ============================================
    // SISTEMA DE PROGRESIÓN POR ETAPAS
    // ============================================

    /**
     * Retorna el estado de progresión por defecto
     */
    private getDefaultProgression(): ProgressionState {
        return {
            currentStage: 0,
            unlockedStages: ['stage_1'],
            unlockedThemes: ['theme_neon_violet'],
            activeTheme: 'theme_neon_violet'
        };
    }

    /**
     * Carga la progresión desde localStorage
     */
    private loadProgression(): void {
        const savedData = localStorage.getItem(PROGRESSION_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.progression = {
                    ...this.getDefaultProgression(),
                    ...parsed
                };
            } catch {
                this.progression = this.getDefaultProgression();
            }
        }
        
        // Verificar desbloqueos al cargar
        this.checkStageUnlocks();
        this.checkThemeUnlocks();
        this.updateStageIndicator();
    }

    /**
     * Guarda la progresión en localStorage
     */
    private saveProgression(): void {
        localStorage.setItem(PROGRESSION_KEY, JSON.stringify(this.progression));
    }

    /**
     * Obtiene la etapa actual
     */
    private getCurrentStage(): GameStage {
        const stage = STAGES_CONFIG[this.progression.currentStage];
        return stage ?? STAGES_CONFIG[0]!;
    }

    /**
     * Obtiene la siguiente etapa (si existe)
     */
    private getNextStage(): GameStage | null {
        const nextIndex = this.progression.currentStage + 1;
        if (nextIndex >= STAGES_CONFIG.length) return null;
        const stage = STAGES_CONFIG[nextIndex];
        return stage ?? null;
    }

    /**
     * Verifica el valor actual de un requisito
     */
    private getRequirementValue(type: StageRequirementType): number {
        switch (type) {
            case 'points':
                return this.profile.totalPointsEarned;
            case 'clicks':
                return this.profile.totalClicks;
            case 'missions':
                return this.completedMissionIds.length;
            case 'prestige':
                return this.prestige.level;
            case 'purchases':
                return this.state.purchasedItems.length;
            case 'upgrades':
                return this.state.clickUpgradeLevel + this.state.autoUpgradeLevel;
            default:
                return 0;
        }
    }

    /**
     * Verifica si una etapa está desbloqueada
     */
    private isStageUnlocked(stage: GameStage): boolean {
        const currentValue = this.getRequirementValue(stage.requirement.type);
        return currentValue >= stage.requirement.value;
    }

    /**
     * Verifica y desbloquea etapas
     */
    private checkStageUnlocks(): void {
        let stageChanged = false;
        
        STAGES_CONFIG.forEach((stage, index) => {
            if (!this.progression.unlockedStages.includes(stage.id)) {
                if (this.isStageUnlocked(stage)) {
                    // Desbloquear etapa
                    this.progression.unlockedStages.push(stage.id);
                    
                    // Actualizar etapa actual si es la siguiente
                    if (index > this.progression.currentStage) {
                        this.progression.currentStage = index;
                        stageChanged = true;
                        
                        // Emitir evento
                        eventBus.emit('stage:unlocked', {
                            stage,
                            stageIndex: index,
                            timestamp: Date.now()
                        });
                        
                        console.log(`🎉 ¡Nueva etapa desbloqueada: ${stage.name}!`);
                    }
                    
                    // Desbloquear temas de la etapa
                    if (stage.unlocks.themes) {
                        stage.unlocks.themes.forEach(themeId => {
                            if (!this.progression.unlockedThemes.includes(themeId)) {
                                this.progression.unlockedThemes.push(themeId);
                                const theme = THEMES_CONFIG.find(t => t.id === themeId);
                                if (theme) {
                                    eventBus.emit('theme:unlocked', { theme, timestamp: Date.now() });
                                    console.log(`🎨 ¡Nuevo tema desbloqueado: ${theme.name}!`);
                                }
                            }
                        });
                    }
                }
            }
        });
        
        if (stageChanged) {
            this.saveProgression();
            this.updateStageIndicator();
        }
    }

    /**
     * Verifica y desbloquea temas por otros requisitos
     */
    private checkThemeUnlocks(): void {
        THEMES_CONFIG.forEach(theme => {
            if (this.progression.unlockedThemes.includes(theme.id)) return;
            
            let unlocked = false;
            
            switch (theme.requirement.type) {
                case 'free':
                    unlocked = true;
                    break;
                case 'stage':
                    unlocked = this.progression.unlockedStages.includes(theme.requirement.value as string);
                    break;
                case 'missions':
                    unlocked = this.completedMissionIds.length >= (theme.requirement.value as number);
                    break;
                case 'prestige':
                    unlocked = this.prestige.level >= (theme.requirement.value as number);
                    break;
                case 'clicks':
                    unlocked = this.profile.totalClicks >= (theme.requirement.value as number);
                    break;
                case 'points':
                    unlocked = this.profile.totalPointsEarned >= (theme.requirement.value as number);
                    break;
            }
            
            if (unlocked) {
                this.progression.unlockedThemes.push(theme.id);
                this.saveProgression();
                eventBus.emit('theme:unlocked', { theme, timestamp: Date.now() });
                console.log(`🎨 ¡Nuevo tema desbloqueado: ${theme.name}!`);
            }
        });
    }

    /**
     * Actualiza el indicador de etapa en el menú
     */
    private updateStageIndicator(): void {
        const currentStage = this.getCurrentStage();
        const nextStage = this.getNextStage();
        
        if (this.elements.stageName) {
            this.elements.stageName.textContent = currentStage.name;
        }
        if (this.elements.stageIcon) {
            this.elements.stageIcon.textContent = currentStage.icon;
        }
        
        // Calcular progreso hacia la siguiente etapa
        if (nextStage && this.elements.stageProgressFill) {
            const currentValue = this.getRequirementValue(nextStage.requirement.type);
            const targetValue = nextStage.requirement.value;
            const progress = Math.min((currentValue / targetValue) * 100, 100);
            this.elements.stageProgressFill.style.width = `${progress}%`;
        } else if (this.elements.stageProgressFill) {
            this.elements.stageProgressFill.style.width = '100%';
        }
    }

    // ============================================
    // SISTEMA DE TEMAS VISUALES
    // ============================================

    /**
     * Aplica el tema actual
     */
    private applyCurrentTheme(): void {
        const theme = THEMES_CONFIG.find(t => t.id === this.progression.activeTheme);
        if (!theme) return;
        
        // Remover todas las clases de tema
        THEMES_CONFIG.forEach(t => {
            document.body.classList.remove(t.cssClass);
        });
        
        // Añadir clase del tema actual
        document.body.classList.add(theme.cssClass);
        
        // Aplicar variables CSS
        document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
        document.documentElement.style.setProperty('--neon-accent', theme.colors.neon);
        document.documentElement.style.setProperty('--background-color', theme.colors.background);
        document.documentElement.style.setProperty('--secondary-color', theme.colors.accent);
    }

    /**
     * Cambia el tema activo
     */
    private setThemeById(themeId: string): void {
        if (!this.progression.unlockedThemes.includes(themeId)) {
            console.log('Tema no desbloqueado:', themeId);
            return;
        }
        
        const previousTheme = this.progression.activeTheme;
        this.progression.activeTheme = themeId;
        this.applyCurrentTheme();
        this.saveProgression();
        this.renderThemeSelector();
        
        eventBus.emit('theme:changed', { previousTheme, newTheme: themeId });
        
        const theme = THEMES_CONFIG.find(t => t.id === themeId);
        console.log(`🎨 Tema cambiado a: ${theme?.name}`);
    }

    /**
     * Renderiza el selector de temas en la configuración
     */
    private renderThemeSelector(): void {
        const container = this.elements.themeSelectorGrid;
        if (!container) return;
        
        container.innerHTML = THEMES_CONFIG.map(theme => {
            const isUnlocked = this.progression.unlockedThemes.includes(theme.id);
            const isActive = this.progression.activeTheme === theme.id;
            
            let requirementText = '';
            if (!isUnlocked) {
                switch (theme.requirement.type) {
                    case 'stage':
                        const stage = STAGES_CONFIG.find(s => s.id === theme.requirement.value);
                        requirementText = `Etapa: ${stage?.name || theme.requirement.value}`;
                        break;
                    case 'missions':
                        requirementText = `${theme.requirement.value} misiones`;
                        break;
                    case 'prestige':
                        requirementText = `Prestigio ${theme.requirement.value}`;
                        break;
                    case 'clicks':
                        requirementText = `${this.formatNumber(theme.requirement.value as number)} clicks`;
                        break;
                    case 'points':
                        requirementText = `${this.formatNumber(theme.requirement.value as number)} puntos`;
                        break;
                }
            }
            
            return `
                <button class="theme-option ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}" 
                        data-theme-id="${theme.id}"
                        ${!isUnlocked ? 'disabled' : ''}>
                    <div class="theme-option-preview" style="background: linear-gradient(135deg, ${theme.colors.background}, ${theme.colors.primary})">
                        <span class="theme-option-icon">${theme.icon}</span>
                    </div>
                    <div class="theme-option-info">
                        <span class="theme-option-name">${theme.name}</span>
                        ${!isUnlocked ? `<span class="theme-option-lock">🔒 ${requirementText}</span>` : ''}
                        ${isActive ? '<span class="theme-option-active">✓ Activo</span>' : ''}
                    </div>
                </button>
            `;
        }).join('');
        
        // Añadir event listeners
        container.querySelectorAll('.theme-option:not(.locked)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const themeId = target.dataset.themeId;
                if (themeId) {
                    this.setThemeById(themeId);
                }
            });
        });
    }
    
    // ============================================
    // SISTEMA DE GANANCIAS OFFLINE
    // ============================================
    
    /**
     * Verifica si hay ganancias offline pendientes
     */
    private checkOfflineEarnings(): void {
        // Calcular puntos por segundo actual (de auto-clickers con multiplicador)
        const pointsPerSecond = this.state.pointsPerSecond * this.pointsMultiplier;
        
        // Si no hay auto-clickers, no hay ganancias offline
        if (pointsPerSecond <= 0) {
            return;
        }
        
        // Calcular ganancias offline
        const offlineEarnings = saveManager.calculateOfflineEarnings(pointsPerSecond);
        
        // Solo mostrar si hay ganancias significativas y tiempo fuera > 1 minuto
        if (offlineEarnings.pointsEarned > 0 && offlineEarnings.timeAway >= 60) {
            this.pendingOfflineEarnings = offlineEarnings;
            this.showOfflineModal(offlineEarnings);
            
            // Emitir evento
            eventBus.emit('offline:earnings-calculated', {
                timeAway: offlineEarnings.timeAway,
                pointsEarned: offlineEarnings.pointsEarned
            });
        }
    }
    
    /**
     * Muestra el modal de ganancias offline
     */
    private showOfflineModal(earnings: OfflineEarnings): void {
        // Formatear tiempo
        const timeText = this.formatOfflineTime(earnings.timeAway);
        
        // Actualizar contenido del modal
        this.elements.offlineTime.textContent = timeText;
        this.elements.offlinePoints.textContent = `+${this.formatNumber(earnings.pointsEarned)}`;
        
        // Mostrar modal
        this.elements.offlineModal.classList.remove('hidden');
    }
    
    /**
     * Formatea el tiempo offline en texto legible
     */
    private formatOfflineTime(seconds: number): string {
        if (seconds < 60) {
            return `${Math.floor(seconds)} segundos`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (minutes > 0) {
                return `${hours} hora${hours !== 1 ? 's' : ''} y ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
            }
            return `${hours} hora${hours !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Reclama las ganancias offline
     */
    private claimOfflineEarnings(): void {
        if (!this.pendingOfflineEarnings) {
            this.elements.offlineModal.classList.add('hidden');
            return;
        }
        
        const points = this.pendingOfflineEarnings.pointsEarned;
        const previousScore = this.state.score;
        
        // Añadir puntos
        this.state.score += points;
        
        // Actualizar estadísticas
        this.stats.totalPointsEarned += points;
        this.stats.autoPointsEarned += points;
        
        // Emitir evento
        eventBus.emit('offline:earnings-claimed', {
            pointsEarned: points
        });
        
        eventBus.emit('points:changed', {
            previousScore: previousScore,
            newScore: this.state.score,
            delta: points,
            source: 'offline'
        });
        
        // Limpiar y ocultar modal
        this.pendingOfflineEarnings = null;
        this.elements.offlineModal.classList.add('hidden');
        
        // Actualizar UI
        this.updateUI();
        
        // Guardar progreso
        this.saveAll();
    }
    
    // ============================================
    // SISTEMA DE GUARDADO AUTOMÁTICO
    // ============================================
    
    /**
     * Configura el guardado automático y al cerrar la página
     */
    private setupAutoSave(): void {
        // Guardar al cerrar o cambiar de pestaña
        window.addEventListener('beforeunload', () => {
            this.saveAll();
        });
        
        // Guardar periódicamente (cada 30 segundos)
        setInterval(() => {
            this.saveAll();
        }, 30000);
        
        // También guardar cuando la pestaña pierde visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAll();
            }
        });
    }
    
    /**
     * Guarda todos los datos del juego usando el SaveManager
     */
    private saveAll(): void {
        const saveData: Omit<GameSaveData, 'version' | 'lastSaveTime'> = {
            lastActiveTime: Date.now(),
            gameState: this.state,
            settings: this.settings,
            profile: this.profile,
            stats: this.stats,
            missions: {
                completedIds: this.completedMissionIds
            },
            prestige: this.prestige,
            progression: this.progression
        };
        
        if (saveManager.save(saveData)) {
            eventBus.emit('save:completed', {
                timestamp: Date.now()
            });
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
    
    // Configurar DevPanel con referencia al juego
    devPanel.setGameInstance(game);
    
    // Configurar PlayerAnalyzer con referencia al juego
    playerAnalyzer.setGameInstance(game);
    
    // Sincronizar GameStateManager con el estado del juego
    gameState.setAll({
        game: game['state'],
        settings: game['settings'],
        profile: game['profile'],
        stats: game['stats'],
        missions: {
            completedIds: game['completedMissionIds']
        },
        prestige: game['prestige'],
        progression: game['progression']
    });
    
    // Suscribirse a cambios del GameStateManager para sincronizar
    gameState.subscribe('game.score', (newValue) => {
        game['state'].score = newValue as number;
        game['updateUI']();
    });
    
    // Definir tipo para window extendido
    interface GameWindow {
        game: ClickerGame;
        gameState: GameStateManager;
        devPanel: DevPanel;
        microAnimations: MicroAnimations;
        playerAnalyzer: PlayerAnalyzer;
    }
    
    // Exponer para debugging (opcional)
    const gameWindow = window as unknown as GameWindow;
    gameWindow.game = game;
    gameWindow.gameState = gameState;
    gameWindow.devPanel = devPanel;
    gameWindow.microAnimations = microAnimations;
    gameWindow.playerAnalyzer = playerAnalyzer;
    
    console.log('🎮 Clicker Game iniciado!');
    console.log('💡 Dev Mode: Presiona Ctrl+Shift+D para abrir el panel de desarrollador');
    console.log('🤖 IA Asistente activa - te dará tips mientras juegas');
});
