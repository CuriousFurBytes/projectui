import type { ProjectState } from '@/types/component';

export interface PluginComponentDef {
  type: string;
  label: string;
  group?: string;
  icon?: string;
  description?: string;
  defaultProps?: Record<string, unknown>;
  render?: (props: Record<string, unknown>, cols: number, rows: number) => string[][];
}

export interface PluginExporter {
  id: string;
  label: string;
  language: string;
  export: (project: ProjectState) => string;
}

export interface PluginRegistration {
  manifest: { id: string; name: string; version: string };
  components?: PluginComponentDef[];
  exporters?: PluginExporter[];
}

class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map();

  register(plugin: PluginRegistration): void {
    this.plugins.set(plugin.manifest.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  getComponents(): PluginComponentDef[] {
    const result: PluginComponentDef[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.components) result.push(...plugin.components);
    }
    return result;
  }

  getExporters(): PluginExporter[] {
    const result: PluginExporter[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.exporters) result.push(...plugin.exporters);
    }
    return result;
  }

  getPlugin(id: string): PluginRegistration | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();

export function registerPlugin(plugin: PluginRegistration): void {
  pluginRegistry.register(plugin);
}

export function unregisterPlugin(id: string): void {
  pluginRegistry.unregister(id);
}
