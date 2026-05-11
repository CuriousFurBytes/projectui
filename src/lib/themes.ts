import type { Theme, ThemeName } from '@/types/component';

const dracula: Theme = {
  name: 'dracula',
  bg: '#282a36',
  fg: '#f8f8f2',
  border: '#6272a4',
  selection: '#44475a',
  accent: '#bd93f9',
  ansi: {
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
};

const solarizedDark: Theme = {
  name: 'solarized-dark',
  bg: '#002b36',
  fg: '#839496',
  border: '#586e75',
  selection: '#073642',
  accent: '#268bd2',
  ansi: {
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#586e75',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
};

const tokyoNight: Theme = {
  name: 'tokyo-night',
  bg: '#1a1b26',
  fg: '#c0caf5',
  border: '#3b4261',
  selection: '#283457',
  accent: '#7aa2f7',
  ansi: {
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
};

const mono: Theme = {
  name: 'mono',
  bg: '#000000',
  fg: '#dcdcdc',
  border: '#7f7f7f',
  selection: '#1f1f1f',
  accent: '#dcdcdc',
  ansi: {
    black: '#000000',
    red: '#bbbbbb',
    green: '#bbbbbb',
    yellow: '#bbbbbb',
    blue: '#bbbbbb',
    magenta: '#bbbbbb',
    cyan: '#bbbbbb',
    white: '#dcdcdc',
    brightBlack: '#777777',
    brightRed: '#ffffff',
    brightGreen: '#ffffff',
    brightYellow: '#ffffff',
    brightBlue: '#ffffff',
    brightMagenta: '#ffffff',
    brightCyan: '#ffffff',
    brightWhite: '#ffffff',
  },
};

export const THEMES: Record<ThemeName, Theme> = {
  dracula,
  'solarized-dark': solarizedDark,
  'tokyo-night': tokyoNight,
  mono,
};

export function getTheme(name: ThemeName): Theme {
  return THEMES[name] ?? tokyoNight;
}
