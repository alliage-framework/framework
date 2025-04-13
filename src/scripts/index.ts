#!/usr/bin/env node

import * as url from 'url';
import * as fs from 'fs';

import { BuildScript } from './build.js';
import { RunScript } from './run.js';
import { ScriptConstructor } from '../core/script/index.js';
import { InstallScript } from './install.js';
import { ArgumentsParser, CommandBuilder, Arguments } from '../core/utils/cli.js';

const scripts: { [name: string]: ScriptConstructor } = {
  install: InstallScript,
  build: BuildScript,
  run: RunScript,
};

export async function execute() {
  const args = await ArgumentsParser.parse(
    CommandBuilder.create()
      .setDescription('Runs a script')
      .addArgument('script', {
        describe: 'The script to run',
        type: 'string',
        choices: Object.keys(scripts),
      })
      .addOption('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      }),
    Arguments.create({}, process.argv.slice(2)),
  );

  const scriptName = args.get('script');
  if (scriptName) {
    const script = new scripts[scriptName]({ is_main_script: true });
    await script.execute(args, args.get('env'));
  }
}

export { BuildScript } from './build.js';
export { RunScript } from './run.js';
export { InstallScript } from './install.js';

/* v8 ignore next 3 */
if (import.meta.url === url.pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  execute();
}
