import { describe, expect, it } from 'vitest';
import type { ComponentNode, ColorAnimation } from '@/types/component';
import type { Rect } from '@/renderer/render';
import { buildAnimationOverlay, hasNodeAnimationEnabled } from '@/lib/animationOverlay';

function makeAnimation(overrides: Partial<ColorAnimation> = {}): ColorAnimation {
  return {
    enabled: true,
    type: 'solid',
    direction: 'ltr',
    durationMs: 1000,
    loop: true,
    ...overrides,
  };
}

function makeNode(overrides: Partial<ComponentNode> = {}): ComponentNode {
  const { props: overrideProps, ...rest } = overrides;
  return {
    id: 'n1',
    type: 'container',
    parentId: null,
    children: [],
    props: {
      border: 'single',
      title: 'Demo',
      ...overrideProps,
    },
    ...rest,
  };
}

describe('animationOverlay', () => {
  const rect: Rect = { x: 2, y: 3, w: 10, h: 5 };

  it('detects enabled border animation as animated content', () => {
    const node = makeNode({ props: { borderAnimation: makeAnimation() } });
    expect(hasNodeAnimationEnabled(node)).toBe(true);
  });

  it('applies border animation colors only to border cells', () => {
    const node = makeNode({
      props: {
        borderAnimation: makeAnimation({ colors: ['brightRed'] }),
      },
    });
    const overlay = buildAnimationOverlay({ n1: node }, { n1: rect }, 500);
    const keys = Array.from(overlay.keys());
    expect(keys.length).toBeGreaterThan(0);
    keys.forEach((k) => {
      const [row, col] = k.split(',').map(Number);
      expect(
        row === rect.y ||
        row === rect.y + rect.h - 1 ||
        col === rect.x ||
        col === rect.x + rect.w - 1,
      ).toBe(true);
    });
  });

  it('applies border title animation on top border title cells', () => {
    const node = makeNode({
      props: {
        borderTitleAnimation: makeAnimation({ colors: ['brightGreen'] }),
      },
    });
    const overlay = buildAnimationOverlay({ n1: node }, { n1: rect }, 500);
    expect(overlay.get('3,6')).toBe('brightGreen');
  });

  it('lets border title animation override border animation at overlapping cells', () => {
    const node = makeNode({
      props: {
        borderAnimation: makeAnimation({ type: 'rainbow' }),
        borderTitleAnimation: makeAnimation({ colors: ['brightGreen'] }),
      },
    });
    const overlay = buildAnimationOverlay({ n1: node }, { n1: rect }, 0);
    expect(overlay.get('3,3')).toBe('brightGreen');
  });
});
