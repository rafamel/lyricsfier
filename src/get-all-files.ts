import fs from 'fs';
import path from 'path';
import pify from 'pify';
import { parallel } from 'promist';
import chalk from 'chalk';
import logger from 'loglevel';

async function getAll(dir: string, arr: string[]) {
  try {
    await pify(fs.access)(dir, fs.constants.F_OK);
  } catch (e) {
    logger.warn(chalk.yellow('File omitted: ') + dir);
    return null;
  }

  logger.debug('Reading dir: ' + dir);
  const data = await pify(fs.stat)(dir);
  if (data.isDirectory()) {
    const contents = await pify(fs.readdir)(dir);
    await parallel.each(contents, (x: string) =>
      getAll(path.join(dir, x), arr)
    );
    return null;
  }
  arr.push(dir);
}

export default async function getAllFiles(dir: string): Promise<string[]> {
  const arr: string[] = [];
  await getAll(dir, arr);
  return arr;
}
