import defaults from './customization.json';
export function safeAsset(value: unknown): boolean;
export function hydrateCustomization(config?: Record<string, any>): typeof defaults;
export function validCustomization(config: unknown): boolean;
