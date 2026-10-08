// Runs the belts in src/lib/thermodrive/parity.cases.json through Patrick's
// own page (v0.65) in headless Edge and saves his answers to
// parity.patrick.json. src/lib/thermodrive/parity.test.ts then holds the hub
// engine to them. Re-run after a new version of his file:
//
//   node scripts/thermodrive-parity.mjs
//
// Windows + Edge (the dev machine); point EDGE at another Chromium elsewhere.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const SOURCE = join(here, '../../TD Bulk Density/refs/From Patrick Colab/Thermodrive Visualizer 2.0.260929.html')
const CASES = join(here, '../src/lib/thermodrive/parity.cases.json')
const OUT = join(here, '../src/lib/thermodrive/parity.patrick.json')
const EDGE = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const { cases } = JSON.parse(readFileSync(CASES, 'utf8'))

// Runs inside his page after his own startup. Sets his model and inputs from
// a case, then calls his functions directly.
const runner = `
<script>
(function(){
  const CASES = ${JSON.stringify(cases)};
  const out = [];
  for (const c of CASES) {
    $('series').value = c.series; applyCascade();
    $('style').value = c.style; applyCascade();
    $('material').value = c.material; $('color').value = c.color; applyCascade();
    updateSSWAvail(); updateVGAvail();
    const p = PITCH[c.series];
    model.width = c.width; model.length = c.rows * p; model.flightPitch = c.flightRows * p;
    model.sswHin = c.sswHin; model.sswInset = c.sswInset;
    if (c.vgIndentL !== undefined) model.vgIndentL = c.vgIndentL;
    if (c.vgIndentR !== undefined) model.vgIndentR = c.vgIndentR;
    if (c.vgChannels) model.vgChannels = c.vgChannels.slice();
    if (c.vgOuterSp !== undefined) model.vgOuterSp = c.vgOuterSp;
    if (c.vgInnerSp !== undefined) model.vgInnerSp = c.vgInnerSp;
    model.vars = c.vars.map(v => Object.assign(newVar(v.startRow), v));
    if (model.vars.length < 2) model.vars.push(newVar(c.vars[0].startRow + 1));
    $('flightOn').checked = c.flightOn; $('var2On').checked = c.var2;
    $('sswOn').checked = c.sswOn; $('sswBoth').checked = c.sswBoth;
    $('vgOn').checked = c.vgOn; $('vgCount').value = String(c.vgCount); vgMode = c.vgMode;
    const s = state();
    const vars = activeVarIdx().map(i => model.vars[i]);
    const sections = c.sections.map(m => {
      secMode = m.mode; model.sectionCount = m.count || 1; model.sectionStdRows = m.std || 60;
      model.sectionRemLast = !!m.last; model.sectionManual = m.text || '';
      const r = computeSections();
      return { rows: r.rows, err: !!r.err };
    });
    const lace = lacePlacement(s, c.repairLength, s.pitch);
    out.push({
      name: c.name,
      sswPitch: s.sswOn ? s.sswPitch : null,
      finals: s.flightOn ? vars.map(v => { const f = finalSpacingInfo(s, v); return { nF: f.nF, spliceFlag: !!f.spliceFlag, removedRow: f.removedRow ?? null, finalGap: f.finalGap ?? null }; }) : [],
      segs: s.flightOn ? vars.map(v => { const g = flightSegments(s, v); return { segs: g.segs, over: !!g.over }; }) : [],
      varWarn: s.flightOn ? vars.map(v => varWarn(s, v) !== '') : [],
      msi: { ft: maxSectionInfo(s).ft },
      vgPos: s.vgOn ? vgPositions(s) : [],
      vgWarn: validateVG(s) !== '',
      drive: driveBands(s),
      lace: { mode: lace.mode, laceMM: lace.laceMM, rows: lace.rows },
      sections,
    });
  }
  const pre = document.createElement('pre'); pre.id = 'parity';
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
})();
</script>`

const html = readFileSync(SOURCE, 'utf8').replace(/<\/body>\s*<\/html>\s*$/i, `${runner}</body></html>`)
const dir = mkdtempSync(join(tmpdir(), 'td-parity-'))
try {
  const page = join(dir, 'page.html')
  writeFileSync(page, html)
  const dom = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--dump-dom', '--virtual-time-budget=5000', pathToFileURL(page).href], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  const m = dom.match(/<pre id="parity">([\s\S]*?)<\/pre>/)
  if (!m) throw new Error("Patrick's page didn't produce results; open it with the runner to see the error.")
  const json = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  const results = JSON.parse(json)
  writeFileSync(OUT, JSON.stringify({ source: 'Thermodrive Visualizer 2.0.260929.html (v0.65)', results }, null, 2) + '\n')
  console.log(`Wrote ${results.length} results to ${OUT}`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
