// one-off: wraps card groups of the landing pages in <Repeat id label> (the markup of the cards is not touched).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as espree from "espree";

const ROOT = "src/landing/pages";
const SPECS = {
  "HomePage.jsx": [
    [103, "home.perks", "Hero highlights"],
    [217, "home.stats", "Platform numbers"],
    [339, "home.categories", "Food categories"],
    [494, "home.services", "What we bring cards"],
    [643, "home.story", "Story highlights"],
    [812, "home.help", "Help & partner cards"],
  ],
  "ServicesPage.jsx": [
    [469, "services.tools", "Dashboard tool cards"],
    [613, "services.points", "Highlight chips"],
    [706, "services.features", "Feature cards"],
  ],
  "AboutPage.jsx": [
    [229, "about.numbers", "Numbers"],
    [343, "about.pillars", "Pillars"],
    [452, "about.timeline", "Timeline"],
    [630, "about.impact", "Impact numbers"],
  ],
};

for (const [file, specs] of Object.entries(SPECS)) {
  const path = join(ROOT, file);
  let code = readFileSync(path, "utf8");
  if (code.includes("<Repeat")) { console.log(`${file}: already wrapped`); continue; }
  const ast = espree.parse(code, { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true }, loc: true, range: true });

  const parents = [];
  const walk = (n) => {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "JSXElement") parents.push(n);
    for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); }
  };
  walk(ast);

  const edits = [];
  for (const [line, id, label] of specs) {
    const parent = parents.find((p) => p.children.some((c) => c.type === "JSXElement" && c.loc.start.line === line));
    if (!parent) throw new Error(`${file}:${line} no group starts here`);
    const kids = parent.children.filter((c) => c.type === "JSXElement");
    // the group is every element child of the parent: the cards are all that is in there
    if (kids[0].loc.start.line !== line) throw new Error(`${file}:${line} group does not start at the first child (${kids[0].loc.start.line})`);
    edits.push({ at: kids[0].range[0], text: `<Repeat id="${id}" label="${label}">\n` });
    edits.push({ at: kids[kids.length - 1].range[1], text: `\n</Repeat>` });
    console.log(`${file}: ${id} wraps ${kids.length} cards`);
  }
  edits.sort((a, b) => b.at - a.at).forEach((e) => { code = code.slice(0, e.at) + e.text + code.slice(e.at); });
  code = code.replace(/^(import [^\n]+\n)/m, `$1import Repeat from "../components/Repeat";\n`);
  writeFileSync(path, code);
}
