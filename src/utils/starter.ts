import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { initProject, readProject, saveProject, addCastToProject, listProjects } from './projects.js';
import { seedBankEntries } from './promptbank.js';
import { writeTemplateSeeds } from './templates.js';

// Starter seed — the UI should never open onto blank panels. First visit
// gets a clearly-labeled demo project + prompt bank + template library, so
// every tab has something real to show and every key has something to act on.
export function seedStarter(dir: string = process.cwd()): boolean {
  const flag = join(dir, '.timmy', '.seeded');
  if (existsSync(flag)) return false;
  writeTemplateSeeds(dir);
  seedBankEntries(dir);
  if (!listProjects(dir).includes('demo-north')) {
    initProject('demo-north', { template: 'callsheet' }, dir);
    const proj = readProject('demo-north', dir);
    if (proj) {
      proj.kind = 'callsheet';
      proj.beats = [
        { at: 0, dur: 3, label: 'HOOK', text: 'rain on the ridge lookout — something moves' },
        { at: 3, dur: 4, label: 'SC12', text: 'confrontation on the deck, phone insert' },
        { at: 7, dur: 3, label: 'SC13', text: 'Danny makes the call, wide establishing' }
      ];
      proj.sheet = {
        day: 17, of: 32, sunrise: '5:51 AM', sunset: '8:26 PM', weather: '68F/54F partly cloudy, 10% rain',
        continuity: { flags: ['wardrobe', 'hair', 'props', 'weather', 'injury'], hours_rule: 'unshowered 24h · cut on right arm scabbed · non-lethal' },
        coverage: { must_get: ['Danny/Claire confrontation (SC12)', 'phone insert', 'wide establishing'] }
      };
      saveProject(proj, dir);
      addCastToProject('demo-north', { id: 'C1', name: 'Jack Rivers (Danny)', hair: 'windblown', wardrobe: 'blood-stain shirt, cell phone cracked screen', emotion: 'wired', age: '30s', props: ['cell phone', 'compass'] }, dir);
      addCastToProject('demo-north', { id: 'C2', name: 'Mia Anderson (Claire)', hair: 'braided crown', wardrobe: 'rain shell, hood up', emotion: 'quietly furious', age: '30s', props: ['polaroid of the location'] }, dir);
    }
  }
  mkdirSync(join(dir, '.timmy'), { recursive: true });
  writeFileSync(flag, new Date().toISOString(), 'utf8');
  return true;
}
