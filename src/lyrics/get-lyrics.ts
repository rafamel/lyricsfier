import Lyricist from 'lyricist';
import store from '~/store';

export default async function getLyrics(songId: number): Promise<string> {
  const lyricist = new Lyricist(store.tokens.genius);
  const data = await lyricist.song(songId, { fetchLyrics: true });
  if (!data.lyrics) throw Error('No lyrics for song ' + songId);
  return data.lyrics;
}
