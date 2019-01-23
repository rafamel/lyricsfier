declare module 'lyricist' {
  export default class Lyricist {
    constructor(accessToken: string);
    public song(
      n: number,
      opts?: { textFormat?: 'html' | 'plain' | 'dom'; fetchLyrics?: boolean }
    ): Promise<any>;
  }
}
