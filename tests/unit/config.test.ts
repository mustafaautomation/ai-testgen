import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, writeDefaultConfig } from '../../src/core/config';
import { DEFAULT_CONFIG } from '../../src/core/types';

const TMP_DIR = path.join(__dirname, '.tmp-config');

describe('config', () => {
  afterEach(() => {
    if (fs.existsSync(TMP_DIR)) {
      fs.rmSync(TMP_DIR, { recursive: true });
    }
  });

  it('should return default config when no file found', () => {
    const config = loadConfig();
    expect(config.provider.type).toBe(DEFAULT_CONFIG.provider.type);
    expect(config.output.format).toBe(DEFAULT_CONFIG.output.format);
  });

  it('should load config from JSON file', () => {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const configPath = path.join(TMP_DIR, 'test-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        provider: { type: 'anthropic', model: 'claude-sonnet-4-6' },
        output: { format: 'gherkin' },
      }),
      'utf-8',
    );

    const config = loadConfig(configPath);
    expect(config.provider.type).toBe('anthropic');
    expect(config.output.format).toBe('gherkin');
  });

  it('should write default config', () => {
    const configPath = path.join(TMP_DIR, 'default.json');
    writeDefaultConfig(configPath);
    expect(fs.existsSync(configPath)).toBe(true);
  });
});
