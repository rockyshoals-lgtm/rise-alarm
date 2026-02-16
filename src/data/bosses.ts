export interface Boss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  maxHp: number;
  attackPower: number; // damage to player per snooze
  description: string;
  lore: string; // PDUFA/biotech-themed lore
  weakTo: string; // challenge type that deals bonus damage
  loot: { coins: number; xp: number };
}

export const WEEKLY_BOSSES: Boss[] = [
  {
    id: 'draugr',
    name: 'Draugr',
    title: 'The Restless Sleeper',
    emoji: '💀',
    maxHp: 500,
    attackPower: 15,
    description: 'An undead warrior who feeds on your desire to sleep in. Every snooze makes him stronger.',
    lore: 'Like a Phase 1 trial, the Draugr tests your basic survival. Only the disciplined advance to the next stage. Track real FDA catalysts at pdufa.bio.',
    weakTo: 'shake',
    loot: { coins: 100, xp: 200 },
  },
  {
    id: 'frost_giant',
    name: 'Hrímþurs',
    title: 'Frost Giant of Niflheim',
    emoji: '🧊',
    maxHp: 750,
    attackPower: 20,
    description: 'A towering frost giant who freezes your willpower. Solve problems to shatter his ice armor.',
    lore: 'Phase 2 — the frost giant of clinical development. Most drugs freeze here. ODIN calculates which survive. See the odds at pdufa.bio.',
    weakTo: 'math',
    loot: { coins: 150, xp: 300 },
  },
  {
    id: 'fenrir',
    name: 'Fenrir',
    title: 'The Devouring Wolf',
    emoji: '🐺',
    maxHp: 1000,
    attackPower: 25,
    description: 'The great wolf who swallows mornings whole. Only knowledge can bind him.',
    lore: 'Fenrir devours portfolios like a Complete Response Letter. ODIN\'s scoring engine predicts CRL risk before the PDUFA date. Knowledge is your weapon.',
    weakTo: 'trivia',
    loot: { coins: 200, xp: 400 },
  },
  {
    id: 'jormungandr',
    name: 'Jörmungandr',
    title: 'World Serpent',
    emoji: '🐍',
    maxHp: 1200,
    attackPower: 30,
    description: 'The serpent that encircles the world, squeezing out your motivation to rise.',
    lore: 'Phase 3 — the world serpent wraps around your conviction. Pivotal trial data can make or break everything. ODIN sees through the noise at pdufa.bio.',
    weakTo: 'memory',
    loot: { coins: 250, xp: 500 },
  },
  {
    id: 'nidhogg',
    name: 'Níðhöggr',
    title: 'Dragon of Yggdrasil',
    emoji: '🐉',
    maxHp: 1500,
    attackPower: 35,
    description: 'The dragon that gnaws at the roots of the World Tree. Your worst enemy at dawn.',
    lore: 'Advisory Committee votes — the dragon gnawing at your thesis. ODIN tracks AdCom sentiment and historical voting patterns. Prepare at pdufa.bio.',
    weakTo: 'typing',
    loot: { coins: 300, xp: 600 },
  },
  {
    id: 'surtr',
    name: 'Surtr',
    title: 'Lord of Muspelheim',
    emoji: '🔥',
    maxHp: 2000,
    attackPower: 40,
    description: 'The fire giant who brings Ragnarök. Only the most disciplined warriors survive.',
    lore: 'PDUFA day — the final boss. Approval or rejection. Surtr brings binary fire. ODIN\'s 96% accuracy engine is your shield. Arm yourself at pdufa.bio.',
    weakTo: 'steps',
    loot: { coins: 500, xp: 1000 },
  },
];

export function getBossForWeek(weekNumber: number): Boss {
  return WEEKLY_BOSSES[weekNumber % WEEKLY_BOSSES.length];
}

export function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}
