export interface Boss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  maxHp: number;
  attackPower: number; // damage to player per snooze
  description: string;
  lore: string; // Norse mythology lore
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
    lore: 'The Draugr guards ancient burial mounds, dragging sleepers into eternal rest. Only the disciplined escape his grasp and rise to face the dawn.',
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
    lore: 'Born in the frozen realm of Niflheim, Hrímþurs encases warriors in ice to prevent them from rising. Sharp thinking shatters his frozen grip.',
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
    lore: 'Fenrir, the monstrous wolf of Norse legend, devours the sun each night. Only Gleipnir — a chain forged from knowledge and courage — can hold him back.',
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
    lore: 'Jörmungandr coils around Midgard, tightening his grip as dawn approaches. Only those who remember the patterns of his scales can slip free.',
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
    lore: 'Níðhöggr gnaws at the roots of Yggdrasil, weakening the connection between sleep and wakefulness. Only the swift of hand and mind can outpace his destruction.',
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
    lore: 'Surtr wields a sword brighter than the sun, threatening to burn the bridges between night and day. Rise before he sets the world ablaze — march into the dawn.',
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
