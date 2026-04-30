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
  | 'modal';

export type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'thick';
export type Direction = 'row' | 'column';
export type Align = 'start' | 'center' | 'end' | 'stretch';

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

export interface ComponentProps {
  // Layout
  direction?: Direction;
  width?: Size;
  height?: Size;
  padding?: number;
  align?: Align;
  justify?: Align;
  gap?: number;

  // Style
  border?: BorderStyle;
  title?: string;
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;

  // Content
  text?: string;
  placeholder?: string;
  label?: string;
  items?: string[];
  selectedIndex?: number;
  value?: string | boolean | number;
  checked?: boolean;
  progress?: number; // 0..1
  columns?: string[];
  rows?: string[][];

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

export interface ProjectState {
  rootId: string;
  components: Record<string, ComponentNode>;
  termCols: number;
  termRows: number;
  theme: ThemeName;
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
