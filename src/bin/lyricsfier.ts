#!/usr/bin/env node

import program from 'commander';
import main from '~/index';
import chalk from 'chalk';
import fs from 'fs';
import pify from 'pify';
import path from 'path';

(async () => {
  const pkg = JSON.parse(
    await pify(fs.readFile)(path.join(__dirname, '../package.json'))
  );
  program
    .version(pkg.version)
    .description(pkg.description)
    .name('lyricsfier <dir>')
    .option('-t, --token <token>', 'Provide Genius access token')
    .parse(process.argv);

  if (program.args.length !== 1) return program.help();

  main(program.args[0], program.token).catch(async (e) => {
    // eslint-disable-next-line no-console
    console.log('\n' + chalk.red('Error: ') + e.message);
    process.exit(1);
  });
})();
