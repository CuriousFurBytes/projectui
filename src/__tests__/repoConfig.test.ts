import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

function readJson(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

describe('Repository tooling configuration', () => {
  it('defines lint-staged and stylelint scripts in package.json', () => {
    const pkg = readJson('package.json');
    expect(pkg.scripts?.lint).toBeTypeOf('string');
    expect(pkg.scripts?.stylelint).toBeTypeOf('string');
    expect(pkg.scripts?.['lint:fix']).toBeTypeOf('string');
    expect(pkg['lint-staged']).toBeTruthy();
  });

  it('has pre-commit hook configuration', () => {
    expect(fs.existsSync('.husky/pre-commit')).toBe(true);
  });

  it('has CI matrix workflow and Playwright trace upload config', () => {
    const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
    expect(workflow).toContain('strategy:');
    expect(workflow).toContain('matrix:');
    expect(workflow).toContain('node-version');
    expect(workflow).toContain('os:');
    expect(workflow).toContain('PLAYWRIGHT_TRACE: on');
    expect(workflow).toContain('actions/upload-artifact');
  });

  it('has stylelint configuration', () => {
    expect(fs.existsSync('.stylelintrc.json')).toBe(true);
  });

  it('has contributor and RFC/issue templates', () => {
    expect(fs.existsSync('CONTRIBUTING.md')).toBe(true);
    expect(fs.existsSync('.github/ISSUE_TEMPLATE/bug_report.yml')).toBe(true);
    expect(fs.existsSync('.github/ISSUE_TEMPLATE/feature_request.yml')).toBe(true);
    expect(fs.existsSync('.github/ISSUE_TEMPLATE/config.yml')).toBe(true);
    expect(fs.existsSync('.github/PULL_REQUEST_TEMPLATE.md')).toBe(true);
    expect(fs.existsSync('docs/rfcs/0000-rfc-template.md')).toBe(true);
  });
});
