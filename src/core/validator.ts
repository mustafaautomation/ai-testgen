import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTypeScript(content: string): ValidationResult {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-testgen-'));
  const filePath = path.join(tmpDir, 'test.ts');

  try {
    fs.writeFileSync(filePath, content, 'utf-8');

    // Write a minimal tsconfig for validation
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'CommonJS',
        strict: false,
        skipLibCheck: true,
        noEmit: true,
        moduleResolution: 'node',
      },
      include: ['test.ts'],
    };
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), JSON.stringify(tsconfig), 'utf-8');

    execSync('npx tsc --noEmit', { cwd: tmpDir, timeout: 15000, stdio: 'pipe' });

    return { valid: true, errors: [] };
  } catch (err) {
    const error = err as { stderr?: Buffer; stdout?: Buffer };
    const output = error.stderr?.toString() || error.stdout?.toString() || 'Unknown error';
    const errors = output.split('\n').filter((l: string) => l.includes('error TS'));

    logger.debug(`TypeScript validation failed: ${errors.length} errors`);
    return { valid: false, errors };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

export function validateGherkin(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content.includes('Feature:')) {
    errors.push('Missing Feature: keyword');
  }

  if (!content.includes('Scenario:') && !content.includes('Scenario Outline:')) {
    errors.push('Missing Scenario: keyword');
  }

  const hasGWT = /\b(Given|When|Then)\b/.test(content);
  if (!hasGWT) {
    errors.push('Missing Given/When/Then steps');
  }

  return { valid: errors.length === 0, errors };
}

export function validateMarkdown(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content.includes('#')) {
    errors.push('Missing Markdown headers');
  }

  if (content.trim().length < 100) {
    errors.push('Content seems too short for a test plan');
  }

  return { valid: errors.length === 0, errors };
}
