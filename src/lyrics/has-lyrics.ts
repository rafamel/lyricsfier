import path from 'path';
import pify from 'pify';
import fs from 'fs';

export default async function hasLyrics(mediaPath: string): Promise<boolean> {
  const { ext } = path.parse(mediaPath);
  const regex = new RegExp(ext + '$');
  mediaPath = mediaPath.replace(regex, '.lrc');
  try {
    await pify(fs.access)(mediaPath, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
