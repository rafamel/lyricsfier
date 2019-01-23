import getAllFiles from './get-all-files';
import getData from './get-data';
import { series } from 'promist';
import logger from 'loglevel';
import chalk from 'chalk';
import path from 'path';
import findSong from './lyrics/find-song';
import getLyrics from './lyrics/get-lyrics';
import hasLyrics from './lyrics/has-lyrics';
import { ISong } from './types';
import fs from 'fs';
import toLrc from './lyrics/to-lrc';
import pify from 'pify';
import store from './store';

logger.setDefaultLevel('info');

const EXTENSIONS = [
  '.aiff',
  '.ape',
  '.asf',
  '.flac',
  '.mp2',
  '.mp3',
  '.mpc',
  '.mp4',
  '.m4a',
  '.m4v',
  '.acc',
  '.ogg',
  '.wav',
  '.wma'
];

export default async function main(dir: string, token: string) {
  if (!token) {
    throw Error('No Genius token was provided');
  }
  store.tokens.genius = token;

  logger.info(chalk.green('Recursively getting files'));
  const files: string[] = await series.filter(
    await getAllFiles(dir),
    async (name) => {
      return (
        name[0] !== '.' &&
        EXTENSIONS.includes(path.parse(name).ext) &&
        !(await hasLyrics(name))
      );
    }
  );

  if (!files.length) {
    logger.warn(chalk.yellow('No files to search lyrics for in: ') + dir);
    return;
  }

  logger.info(chalk.green('Getting files metadata'));
  const objArr: Array<{ file: string; meta: ISong }> = await series.map(
    files,
    async (file) => {
      try {
        const meta = await getData(file);
        return { file, meta };
      } catch (e) {
        logger.error(chalk.red('ERROR: ') + e.message);
      }
    }
  );

  logger.info(chalk.green('Getting lyrics'));
  for (const obj of objArr) {
    if (!obj) continue;
    try {
      const { file, meta } = obj;
      logger.info('Getting lyrics for: ' + meta.artist + ', ' + meta.title);
      const songId = await findSong(meta);
      const lyrics = await getLyrics(songId);
      const { ext } = path.parse(file);
      const regex = new RegExp(ext + '$');
      const destPath = file.replace(regex, '.lrc');
      logger.info('Writing lyrics for: ' + meta.artist + ', ' + meta.title);
      await pify(fs.writeFile)(destPath, toLrc(lyrics));
    } catch (e) {
      logger.error(chalk.red('ERROR ') + e.message);
    }
  }
}
