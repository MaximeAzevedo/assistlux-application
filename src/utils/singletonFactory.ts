// ═══════════════════════════════════════════════════════════
// FACTORY GÉNÉRIQUE POUR PATTERN SINGLETON
// ═══════════════════════════════════════════════════════════

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Factory générique pour créer des singletons
 * Évite la duplication du pattern singleton dans chaque classe
 */
export function createSingleton<T>(constructor: Constructor<T>): () => T {
  let instance: T;
  
  return function getInstance(): T {
    if (!instance) {
      instance = new constructor();
    }
    return instance;
  };
}

/**
 * Décorateur pour transformer automatiquement une classe en singleton
 */
export function Singleton<T extends Constructor>(constructor: T) {
  let instance: InstanceType<T>;
  
  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this as InstanceType<T>;
      return instance;
    }
    
    static getInstance(): InstanceType<T> {
      if (!instance) {
        instance = new this() as InstanceType<T>;
      }
      return instance;
    }
  } as T & { getInstance(): InstanceType<T> };
}

/**
 * Utilitaire pour créer un singleton avec lazy loading
 */
export class SingletonRegistry {
  private static instances = new Map<string, any>();
  
  static getInstance<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key);
  }
  
  static clear(key?: string): void {
    if (key) {
      this.instances.delete(key);
    } else {
      this.instances.clear();
    }
  }
} 