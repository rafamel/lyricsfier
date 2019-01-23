import * as mm from 'music-metadata';
import { ISong } from '~/types';

export default async function getData(filePath: string): Promise<ISong> {
  const metadata = await mm.parseFile(filePath, {
    duration: false,
    native: false,
    skipCovers: true
  });

  const { album, title, artist } = metadata.common;
  if (!title || !album || !artist) {
    throw Error('Data is not available for song');
  }
  return { title, album, artist };
}
