import request from 'superagent';
// eslint-disable-next-line import/no-unresolved
import toAscii from 'translitterify';
import leven from 'leven';
import store from '~/store';
import { ISong } from '~/types';

async function find(opts: ISong): Promise<number | void> {
  const title = toAscii(opts.title.replace(/\(.*\)/g, '')).trim();
  const album = toAscii(opts.album).trim();
  const artist = toAscii(opts.artist).trim();

  const { body }: any = await request
    .get(`https://api.genius.com/search?q=${title}`)
    .set('Authorization', 'Bearer ' + store.tokens.genius)
    .send();

  if (
    body.meta.status !== 200 ||
    !body.response ||
    !body.response.hits ||
    !body.response.hits.length
  ) {
    throw Error(`Bad response on search for ${artist}, ${album}, ${title}`);
  }

  for (const songInfo of body.response.hits) {
    if (
      !songInfo.result ||
      !songInfo.result.id ||
      !songInfo.result.primary_artist ||
      !songInfo.result.primary_artist.name
    ) {
      continue;
    }
    const name = toAscii(songInfo.result.primary_artist.name).trim();
    const distance = leven(name.toLowerCase(), artist.toLowerCase());
    if (distance <= 2) return songInfo.result.id;
  }
}

export default async function findSong(opts: ISong): Promise<number> {
  const artists = opts.artist.split(',');
  for (const artist of artists) {
    const res = await find({ ...opts, artist });
    if (res) return res;
  }
  throw Error(`No song found for ${opts.artist}, ${opts.album}, ${opts.title}`);
}
