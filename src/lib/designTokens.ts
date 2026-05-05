import type { DesignToken, TokenType } from '@/types/component';
import { uid } from './id';

function makeToken(name: string, type: TokenType, value: string, group?: string): DesignToken {
  return { id: uid('token'), name, type, value, group };
}

export const DEFAULT_DESIGN_TOKENS: DesignToken[] = [
  // Semantic colors
  makeToken('surface', 'color', '#1a1b26', 'semantic'),
  makeToken('accent', 'color', '#7aa2f7', 'semantic'),
  makeToken('danger', 'color', '#f7768e', 'semantic'),
  makeToken('success', 'color', '#9ece6a', 'semantic'),
  makeToken('warning', 'color', '#e0af68', 'semantic'),
  makeToken('muted', 'color', '#414868', 'semantic'),
  // Spacing scale
  makeToken('space-1', 'spacing', '1', 'spacing'),
  makeToken('space-2', 'spacing', '2', 'spacing'),
  makeToken('space-4', 'spacing', '4', 'spacing'),
  makeToken('space-8', 'spacing', '8', 'spacing'),
  // Border styles
  makeToken('border-default', 'border', 'single', 'borders'),
  makeToken('border-accent', 'border', 'rounded', 'borders'),
  // Text styles
  makeToken('text-base', 'text', 'default', 'text'),
  makeToken('text-bold', 'text', 'bold', 'text'),
];

export function exportTokensJson(tokens: DesignToken[]): string {
  return JSON.stringify(tokens, null, 2);
}

export function importTokensJson(json: string): DesignToken[] {
  return JSON.parse(json) as DesignToken[];
}

export function exportStyleDictionary(tokens: DesignToken[]): string {
  const result: Record<string, Record<string, { value: string }>> = {};
  for (const token of tokens) {
    if (!result[token.type]) result[token.type] = {};
    result[token.type][token.name] = { value: token.value };
  }
  return JSON.stringify(result, null, 2);
}
