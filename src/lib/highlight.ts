// Lightweight regex-based syntax tokenizer for generated code (Python, Go, Rust, JSON).
// No external dependencies — designed specifically for the deterministic code that
// ProjecTUI generates.

export type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'decorator' | 'type' | 'func' | 'key' | 'plain';

export interface Token { text: string; type: TokenType }

// Tokyo-Night–inspired palette used in the CodeView.
export const TOKEN_COLORS: Record<TokenType, string | undefined> = {
  keyword:   '#bb9af7',
  string:    '#9ece6a',
  comment:   '#565f89',
  number:    '#ff9e64',
  decorator: '#e0af68',
  type:      '#0db9d7',
  func:      '#7aa2f7',
  key:       '#73daca',
  plain:     undefined,
};

type Pattern = [RegExp, TokenType];

const PY_KW = /\b(from|import|class|def|return|yield|if|elif|else|for|while|try|except|finally|with|as|pass|True|False|None|in|is|not|and|or|lambda|self|raise|async|await|global|nonlocal|assert|del)\b/;
const PY_PATTERNS: Pattern[] = [
  [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, 'string'],
  [/#[^\n]*/, 'comment'],
  [/@\w+/, 'decorator'],
  [PY_KW, 'keyword'],
  [/\b[A-Z][A-Za-z0-9_]+\b/, 'type'],
  [/\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/, 'number'],
];

const GO_KW = /\b(package|import|func|return|type|struct|interface|var|const|if|else|for|range|go|defer|select|case|switch|break|continue|nil|true|false|chan|map|make|new|len|cap|append|error)\b/;
const GO_PATTERNS: Pattern[] = [
  [/"(?:[^"\\]|\\.)*"|`[^`]*`/, 'string'],
  [/\/\/[^\n]*/, 'comment'],
  [GO_KW, 'keyword'],
  [/\b[A-Z][A-Za-z0-9_]+\b/, 'type'],
  [/\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/, 'number'],
];

const RS_KW = /\b(fn|let|mut|return|pub|use|mod|struct|enum|impl|trait|if|else|for|while|loop|match|break|continue|true|false|None|Some|Ok|Err|type|where|async|await|move|ref|const|static|self|Self|crate|super)\b/;
const RS_PATTERNS: Pattern[] = [
  [/"(?:[^"\\]|\\.)*"/, 'string'],
  [/\/\/[^\n]*/, 'comment'],
  [RS_KW, 'keyword'],
  [/\b[A-Z][A-Za-z0-9_]+\b/, 'type'],
  [/\b\d+\.?\d*(?:[eE][+-]?\d+)?(?:[iu]\d+)?\b/, 'number'],
];

const JSON_PATTERNS: Pattern[] = [
  [/"(?:[^"\\]|\\.)*"(?=\s*:)/, 'key'],
  [/"(?:[^"\\]|\\.)*"/, 'string'],
  [/\b(true|false|null)\b/, 'keyword'],
  [/-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/, 'number'],
];

function tokenizeLine(line: string, patterns: Pattern[]): Token[] {
  const tokens: Token[] = [];
  let s = line;
  while (s.length > 0) {
    let best: { idx: number; len: number; type: TokenType } | null = null;
    for (const [re, type] of patterns) {
      const m = re.exec(s);
      if (m && (!best || m.index < best.idx || (m.index === best.idx && m[0].length > best.len))) {
        best = { idx: m.index, len: m[0].length, type };
      }
    }
    if (!best) {
      tokens.push({ text: s, type: 'plain' });
      break;
    }
    if (best.idx > 0) tokens.push({ text: s.slice(0, best.idx), type: 'plain' });
    tokens.push({ text: s.slice(best.idx, best.idx + best.len), type: best.type });
    s = s.slice(best.idx + best.len);
  }
  return tokens;
}

export type Lang = 'textual' | 'bubbletea' | 'ratatui' | 'blessed' | 'ncurses' | 'json';

export function tokenize(code: string, lang: Lang): Token[][] {
  const patterns: Pattern[] =
    lang === 'textual' ? PY_PATTERNS :
    lang === 'bubbletea' ? GO_PATTERNS :
    lang === 'ratatui' ? RS_PATTERNS :
    // blessed uses JS syntax, ncurses uses C++ (close to RS keywords set)
    lang === 'blessed' ? GO_PATTERNS :
    lang === 'ncurses' ? RS_PATTERNS :
    JSON_PATTERNS;

  return code.split('\n').map((line) => tokenizeLine(line, patterns));
}
