const path = require('path');
const dir = (file) => path.join(CONFIG_DIR, file);
const series = (...x) => `(${x.map((x) => x || 'shx echo').join(') && (')})`;
// prettier-ignore
const scripts = (x) => Object.entries(x)
  .reduce((m, [k, v]) => (m.scripts[k] = v || 'shx echo') && m, { scripts: {} });
// prettier-ignore
const {
  OUT_DIR, DOCS_DIR, CONFIG_DIR, EXTENSIONS, TYPESCRIPT, DOCS_ON_BUILD , BIN_ENTRY, BIN_OUT_DIR
} = require('./project.config');
const DOT_EXT = '.' + EXTENSIONS.replace(/,/g, ',.');

process.env.LOG_LEVEL = 'disable';
module.exports = scripts({
  build: series(
    'nps validate',
    `jake run:zero["shx rm -r ${OUT_DIR} ${BIN_OUT_DIR}"]`,
    `shx mkdir ${OUT_DIR} ${BIN_OUT_DIR}`,
    `shx cp package.json ${OUT_DIR}/package.json`,
    TYPESCRIPT && DOCS_ON_BUILD && 'nps docs',
    'nps private.build',
    `pkg --out-path ${BIN_OUT_DIR} --targets node8-linux-x86,node8-macos-x86,node8-win-x86 ${BIN_ENTRY}`
  ),
  publish: `nps build && cd ${OUT_DIR} && npm publish`,
  watch: series(
    `jake run:zero["shx rm -r ${OUT_DIR}"]`,
    `shx mkdir ${OUT_DIR}`,
    `shx cp package.json ${OUT_DIR}/package.json`,
    `onchange "./src/**/*.{${EXTENSIONS}}" --initial --kill -- ` +
      'jake clear run:exec["shx echo ⚡"] run:zero["concurrently \\"nps lint\\" \\"nps private.build\\""]'
  ),
  fix: {
    default: 'nps fix.format fix.md',
    format: [
      'prettier',
      `--write "./**/*.{${EXTENSIONS},.json,.scss}"`,
      `--config "${dir('.prettierrc.js')}"`,
      `--ignore-path "${dir('.prettierignore')}"`
    ].join(' '),
    md: "mdspell --en-us '**/*.md' '!**/node_modules/**/*.md'"
  },
  types: TYPESCRIPT && 'tsc --noEmit',
  lint: {
    default: !TYPESCRIPT
      ? `eslint ./src ./test --ext ${DOT_EXT} -c ${dir('.eslintrc.js')}`
      : [
          'concurrently',
          `"eslint ./src ./test --ext ${DOT_EXT} -c ${dir('.eslintrc.js')}"`,
          `"tslint ./{src,test}/**/*.{ts,tsx} -c ${dir('tslint.json')}"`,
          '-n eslint,tslint',
          '-c yellow,blue'
        ].join(' '),
    // TODO enable mdspell again when issue is fixed
    md: series(
      `markdownlint *.md --config ${dir('markdown.json')}`
      // "mdspell -r --en-us '**/*.md' '!**/node_modules/**/*.md'"
    ),
    scripts: 'jake lintscripts[' + __dirname + ']'
  },
  test: {
    default: series('nps lint types', 'cross-env NODE_ENV=test jest'),
    watch:
      `onchange "./{src,test}/**/*.{${EXTENSIONS}}" --initial --kill -- ` +
      'jake clear run:exec["shx echo ⚡"] run:zero["nps test"]'
  },
  validate: series(
    'nps test lint.md lint.scripts',
    'jake run:zero["npm outdated"]',
    process.env.MSG &&
      `jake run:conditional["\n${process.env.MSG}","","exit 1",Yes,6]`
  ),
  update: series('npm update --save/save-dev', 'npm outdated'),
  clean: series(
    `jake run:zero["shx rm -r ${OUT_DIR} ${DOCS_DIR} coverage"]`,
    'shx rm -rf node_modules'
  ),
  docs:
    TYPESCRIPT &&
    series(
      `jake run:zero["shx rm -r ${DOCS_DIR}"]`,
      `typedoc --out ${DOCS_DIR} ./src`
    ),
  // Private
  private: {
    build: !TYPESCRIPT
      ? `babel src --out-dir ${OUT_DIR} --extensions ${DOT_EXT} --source-maps inline`
      : [
          'concurrently',
          `"babel src --out-dir ${OUT_DIR} --extensions ${DOT_EXT} --source-maps inline"`,
          `"tsc --emitDeclarationOnly --outDir ${OUT_DIR}"`,
          '-n babel,tsc',
          '-c green,magenta'
        ].join(' ')
  }
});
