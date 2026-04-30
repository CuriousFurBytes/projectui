import type { BorderStyle } from '@/types/component';

export interface BoxChars {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
}

export const BOX: Record<Exclude<BorderStyle, 'none'>, BoxChars> = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  thick: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
};
