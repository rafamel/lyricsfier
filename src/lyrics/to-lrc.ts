export default function toLrc(
  lyrics: string,
  last: string = '10:00.00'
): string {
  return lyrics
    .split('\n')
    .filter((x: string) => Boolean(x.trim()))
    .map((x: string, i) => (i === 0 ? `[00:00.00] ${x}` : `[${last}] ${x}`))
    .join('\n');
}
