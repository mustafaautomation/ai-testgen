#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { loadConfig, writeDefaultConfig } from './core/config';
import { Generator } from './core/generator';
import { validateTypeScript, validateGherkin, validateMarkdown } from './core/validator';
import { setLogLevel } from './utils/logger';
import { OutputFormat } from './core/types';

dotenv.config();

const program = new Command();

program
  .name('ai-testgen')
  .description('AI-powered test case generator from PRDs, OpenAPI specs, and user stories')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate test cases from input file')
  .argument('<file>', 'Input file (PRD, OpenAPI spec, or user stories)')
  .option('-f, --format <type>', 'Output format: playwright, api, gherkin, markdown', 'playwright')
  .option('-o, --output <dir>', 'Output directory', './generated-tests')
  .option('-c, --config <path>', 'Path to config file')
  .option('--style <type>', 'Test style: descriptive, concise, bdd', 'descriptive')
  .option('--no-negative', 'Skip negative test cases')
  .option('--no-boundary', 'Skip boundary test cases')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (file: string, options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    config.output.format = options.format as OutputFormat;
    config.output.dir = options.output;
    config.output.style = options.style;
    if (options.negative === false) config.options.includeNegative = false;
    if (options.boundary === false) config.options.includeBoundary = false;

    const generator = new Generator(config);
    const result = await generator.generate(file, options.format as OutputFormat, config.output.dir);

    console.log(`\nGenerated ${result.summary.totalTests} tests in ${result.files.length} file(s)`);
    console.log(`Format: ${result.format}`);
    console.log(`Output: ${config.output.dir}`);
  });

program
  .command('from-spec')
  .description('Generate API tests from OpenAPI spec')
  .argument('<file>', 'OpenAPI spec file (YAML or JSON)')
  .option('-o, --output <dir>', 'Output directory', './generated-tests')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (file: string, options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    config.output.format = 'api';
    config.output.dir = options.output;

    const generator = new Generator(config);
    const result = await generator.generate(file, 'api', config.output.dir);

    console.log(`\nGenerated ${result.summary.totalTests} API tests from spec`);
  });

program
  .command('plan')
  .description('Generate test plan in Markdown')
  .argument('<file>', 'Input file')
  .option('-o, --output <dir>', 'Output directory', './generated-tests')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (file: string, options) => {
    if (options.verbose) setLogLevel('debug');

    const config = loadConfig(options.config);
    config.output.format = 'markdown';
    config.output.dir = options.output;

    const generator = new Generator(config);
    const result = await generator.generate(file, 'markdown', config.output.dir);

    console.log(`\nGenerated test plan with ${result.summary.totalScenarios} scenarios`);
  });

program
  .command('validate')
  .description('Validate generated test files')
  .argument('<file>', 'File to validate')
  .option('-f, --format <type>', 'Format: playwright, gherkin, markdown')
  .action((file: string, options) => {
    const content = fs.readFileSync(file, 'utf-8');
    const format = options.format || detectFormat(file);

    let result;
    switch (format) {
      case 'playwright':
      case 'api':
        result = validateTypeScript(content);
        break;
      case 'gherkin':
        result = validateGherkin(content);
        break;
      case 'markdown':
        result = validateMarkdown(content);
        break;
      default:
        console.error(`Unknown format: ${format}`);
        process.exit(1);
    }

    if (result.valid) {
      console.log(`Validation passed for ${file}`);
    } else {
      console.error(`Validation failed for ${file}:`);
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize ai-testgen configuration')
  .action(() => {
    writeDefaultConfig('ai-testgen.config.json');
    console.log('Done! Edit ai-testgen.config.json, set your API key, and run:');
    console.log('  npx ai-testgen generate <input-file>');
  });

function detectFormat(filePath: string): string {
  if (filePath.endsWith('.spec.ts') || filePath.endsWith('.test.ts')) return 'playwright';
  if (filePath.endsWith('.feature')) return 'gherkin';
  if (filePath.endsWith('.md')) return 'markdown';
  return 'playwright';
}

program.parse();
