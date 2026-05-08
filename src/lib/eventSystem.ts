import { uid } from '@/lib/id';

export type EditorEventType = 'keypress' | 'timer' | 'focus' | 'blur' | 'click';

export interface EditorEvent {
  type: EditorEventType;
  sourceNodeId: string;
  key?: string;
  intervalMs?: number;
}

export interface EventHandler {
  id: string;
  event: EditorEvent;
  action: 'navigate' | 'setState' | 'custom';
  targetLayerId?: string;
  stateNodeId?: string;
  stateName?: string;
  customActionId?: string;
}

export function createEventHandler(
  event: EditorEvent,
  action: EventHandler['action'],
  options?: Partial<EventHandler>,
): EventHandler {
  return {
    id: uid('handler'),
    event,
    action,
    ...options,
  };
}

export function matchesEvent(handler: EventHandler, event: EditorEvent): boolean {
  if (handler.event.type !== event.type) return false;
  if (handler.event.sourceNodeId !== event.sourceNodeId) return false;
  if (event.type === 'keypress' && handler.event.key !== undefined && handler.event.key !== event.key) return false;
  return true;
}

export function getHandlersForNode(handlers: EventHandler[], nodeId: string): EventHandler[] {
  return handlers.filter((h) => h.event.sourceNodeId === nodeId);
}

export function serializeEventHandlers(handlers: EventHandler[]): string {
  return JSON.stringify(handlers);
}

export function deserializeEventHandlers(json: string): EventHandler[] {
  return JSON.parse(json) as EventHandler[];
}
