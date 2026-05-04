// Core schema for the TUI Builder.
// The editor manipulates a normalized tree of `ComponentNode`s keyed by id.

export type ComponentType =
  | 'container'
  | 'text'
  | 'button'
  | 'input'
  | 'checkbox'
  | 'select'
  | 'list'
  | 'textarea'
  | 'table'
  | 'tabs'
  | 'statusbar'
  | 'progressbar'
  | 'modal'
  | 'spinner'
  | 'divider'
  | 'toast'
  | 'grid'
  | 'viewport'
  | 'timer'
  | 'filepicker'
  | 'asciitext';

export type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'thick' | 'ascii';
export type Direction = 'row' | 'column';
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type TitleAlign = 'left' | 'center' | 'right';
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type SpinnerStyle = 'dots' | 'line' | 'braille' | 'arc';
export type AnimationType = 'solid' | 'gradient' | 'rainbow';
export type AnimationDirection = 'ltr' | 'rtl' | 'center-out' | 'sides-in';

export interface ColorAnimation {
  enabled: boolean;
  type: AnimationType;
  direction: AnimationDirection;
  durationMs: number;
  loop: boolean;
  loopCount?: number;
}

// 16 standard ANSI palette names + 'default'.
export type AnsiColor =
  | 'default'
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite';

// `auto` = intrinsic size; `fill` = take remaining space; number = chars/rows.
export type Size = number | 'auto' | 'fill';

// Inline-styled text span for rich text rendering.
export interface RichSpan {
  text: string;
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
}

export interface ComponentProps {
  // Layout
  direction?: Direction;
  width?: Size;
  height?: Size;
  padding?: number;
  align?: Align;
  justify?: Align;
  gap?: number;

  // Free positioning (absolute mode)
  absolute?: boolean;
  x?: number;
  y?: number;

  // Style
  border?: BorderStyle;
  borderColor?: AnsiColor;
  title?: string;
  titleAlign?: TitleAlign;
  titleColor?: AnsiColor;
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;

  // Grid layout (for type=grid)
  gridCols?: number;
  gridGap?: number;

  // Content
  text?: string;
  richSpans?: RichSpan[];
  placeholder?: string;
  label?: string;
  items?: string[];
  selectedIndex?: number;
  value?: string | boolean | number;
  checked?: boolean;
  progress?: number; // 0..1
  columns?: string[];
  rows?: string[][];

  // Spinner
  spinnerStyle?: SpinnerStyle;

  // Toast
  toastVariant?: ToastVariant;

  // Timer
  timerValue?: string;

  // Divider / separator orientation
  orientation?: 'horizontal' | 'vertical';

  // Color animation (text, asciitext, progressbar)
  animation?: ColorAnimation;

  // Behavior
  focusable?: boolean;
  disabled?: boolean;
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  parentId: string | null;
  children: string[];
  props: ComponentProps;
  // Editor-only state
  hidden?: boolean;
  locked?: boolean;
  name?: string;
}

// One screen / artboard in the project.
export interface Layer {
  id: string;
  name: string;
  rootId: string;
  components: Record<string, ComponentNode>;
}

// A named step in the flow timeline.
export interface TimelineStep {
  id: string;
  layerId: string;
  label?: string;
}

// A transition edge between two timeline steps.
export interface TimelineTransition {
  id: string;
  fromStepId: string;
  toStepId: string;
  event: 'keypress' | 'click' | 'custom';
  trigger?: string;
  label?: string;
}

export interface ComponentVariant {
  id: string;
  name: string;
  description?: string;
  rootType: ComponentType;
  rootNodeId: string;
  nodes: Record<string, ComponentNode>;
  createdAt: number;
}

export interface ProjectState {
  // Active-screen data (kept at top level for renderer / exporter compat)
  rootId: string;
  components: Record<string, ComponentNode>;
  termCols: number;
  termRows: number;
  theme: ThemeName;
  // Multi-screen (optional for backward compat with old saves / test fixtures)
  layers?: Layer[];
  activeLayerIndex?: number;
  // Flow timeline
  timelineSteps?: TimelineStep[];
  timelineTransitions?: TimelineTransition[];
  // Reusable component variants
  variants?: ComponentVariant[];
}

export type ThemeName = 'dracula' | 'solarized-dark' | 'tokyo-night' | 'mono';

export interface Theme {
  name: ThemeName;
  bg: string;
  fg: string;
  border: string;
  selection: string;
  accent: string;
  ansi: Record<Exclude<AnsiColor, 'default'>, string>;
}
