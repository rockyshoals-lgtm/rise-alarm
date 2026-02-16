export interface TriviaQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  category: 'science' | 'history' | 'geography' | 'general' | 'norse' | 'biotech';
}

export const TRIVIA_POOL: TriviaQuestion[] = [
  // Science
  { question: 'What planet is known as the Red Planet?', answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctIndex: 1, category: 'science' },
  { question: 'What gas do plants absorb from the atmosphere?', answers: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], correctIndex: 2, category: 'science' },
  { question: 'How many bones are in the adult human body?', answers: ['186', '206', '216', '256'], correctIndex: 1, category: 'science' },
  { question: 'What is the chemical symbol for gold?', answers: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, category: 'science' },
  { question: 'What is the speed of light in km/s (approx)?', answers: ['150,000', '300,000', '500,000', '1,000,000'], correctIndex: 1, category: 'science' },
  { question: 'What is the largest organ in the human body?', answers: ['Liver', 'Brain', 'Lungs', 'Skin'], correctIndex: 3, category: 'science' },
  { question: 'What element does "O" represent?', answers: ['Osmium', 'Oganesson', 'Oxygen', 'Olivine'], correctIndex: 2, category: 'science' },
  { question: 'How many chromosomes do humans have?', answers: ['23', '44', '46', '48'], correctIndex: 2, category: 'science' },
  // History
  { question: 'In what year did World War II end?', answers: ['1943', '1944', '1945', '1946'], correctIndex: 2, category: 'history' },
  { question: 'Who was the first President of the United States?', answers: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'], correctIndex: 1, category: 'history' },
  { question: 'What ancient wonder was in Alexandria?', answers: ['Colossus', 'Lighthouse', 'Hanging Gardens', 'Temple of Artemis'], correctIndex: 1, category: 'history' },
  { question: 'The Renaissance began in which country?', answers: ['France', 'England', 'Spain', 'Italy'], correctIndex: 3, category: 'history' },
  { question: 'Who painted the Mona Lisa?', answers: ['Michelangelo', 'Raphael', 'Da Vinci', 'Donatello'], correctIndex: 2, category: 'history' },
  { question: 'What year did the Berlin Wall fall?', answers: ['1987', '1988', '1989', '1991'], correctIndex: 2, category: 'history' },
  // Geography
  { question: 'What is the largest continent by area?', answers: ['Africa', 'North America', 'Europe', 'Asia'], correctIndex: 3, category: 'geography' },
  { question: 'Which country has the most time zones?', answers: ['Russia', 'USA', 'China', 'France'], correctIndex: 3, category: 'geography' },
  { question: 'What is the smallest country in the world?', answers: ['Monaco', 'Vatican City', 'Liechtenstein', 'San Marino'], correctIndex: 1, category: 'geography' },
  { question: 'What is the longest river in the world?', answers: ['Amazon', 'Mississippi', 'Yangtze', 'Nile'], correctIndex: 3, category: 'geography' },
  { question: 'Mount Everest is in which mountain range?', answers: ['Andes', 'Alps', 'Himalayas', 'Rockies'], correctIndex: 2, category: 'geography' },
  // General
  { question: 'How many sides does a hexagon have?', answers: ['5', '6', '7', '8'], correctIndex: 1, category: 'general' },
  { question: 'What color do you get mixing blue and yellow?', answers: ['Purple', 'Orange', 'Green', 'Brown'], correctIndex: 2, category: 'general' },
  { question: 'How many minutes are in one day?', answers: ['1,200', '1,440', '1,560', '1,680'], correctIndex: 1, category: 'general' },
  { question: 'What note comes after "sol" in solfège?', answers: ['Fa', 'La', 'Ti', 'Do'], correctIndex: 1, category: 'general' },
  // Norse Mythology
  { question: 'What is the name of Thor\'s hammer?', answers: ['Gungnir', 'Mjölnir', 'Gram', 'Tyrfing'], correctIndex: 1, category: 'norse' },
  { question: 'Who is the Norse god of mischief?', answers: ['Freya', 'Baldur', 'Loki', 'Heimdall'], correctIndex: 2, category: 'norse' },
  { question: 'What is the Norse realm of the dead?', answers: ['Asgard', 'Niflheim', 'Alfheim', 'Vanaheim'], correctIndex: 1, category: 'norse' },
  { question: 'What tree connects the nine Norse realms?', answers: ['Yggdrasil', 'Mimameid', 'Glasir', 'Barnstokkr'], correctIndex: 0, category: 'norse' },
  { question: 'Odin sacrificed what to gain wisdom?', answers: ['His hand', 'His eye', 'His spear', 'His ravens'], correctIndex: 1, category: 'norse' },
  { question: 'What event ends the Norse world?', answers: ['Götterdämmerung', 'Ragnarök', 'Fimbulwinter', 'Völuspá'], correctIndex: 1, category: 'norse' },
  { question: 'What bridge connects Midgard to Asgard?', answers: ['Gjallarbrú', 'Bifröst', 'Vindbláinn', 'Gimlé'], correctIndex: 1, category: 'norse' },
  { question: 'What are Odin\'s two ravens called?', answers: ['Geri & Freki', 'Huginn & Muninn', 'Tanngrisnir & Tanngnjóstr', 'Arvak & Alsvid'], correctIndex: 1, category: 'norse' },
  // Biotech / FDA / Pharma
  { question: 'What does PDUFA stand for?', answers: ['Pharma Drug Use Fee Act', 'Prescription Drug User Fee Act', 'Public Drug Utility Fund Act', 'Pharma Development User Fee Act'], correctIndex: 1, category: 'biotech' },
  { question: 'What does the FDA acronym stand for?', answers: ['Federal Drug Agency', 'Food & Drug Administration', 'Federal Drug Administration', 'Food & Disease Agency'], correctIndex: 1, category: 'biotech' },
  { question: 'What is a CRL in biotech investing?', answers: ['Clinical Research Letter', 'Complete Response Letter', 'Corporate Review License', 'Controlled Release Label'], correctIndex: 1, category: 'biotech' },
  { question: 'What phase of clinical trials tests safety in healthy volunteers?', answers: ['Phase 0', 'Phase 1', 'Phase 2', 'Phase 3'], correctIndex: 1, category: 'biotech' },
  { question: 'What is a "binary event" in biotech investing?', answers: ['A stock split', 'An FDA approval/rejection decision', 'Earnings report', 'A merger vote'], correctIndex: 1, category: 'biotech' },
  { question: 'How many phases of clinical trials are there before FDA approval?', answers: ['2', '3', '4', '5'], correctIndex: 1, category: 'biotech' },
  { question: 'What is an NDA in pharma?', answers: ['Non-Disclosure Agreement', 'New Drug Application', 'National Drug Act', 'Novel Drug Assessment'], correctIndex: 1, category: 'biotech' },
  { question: 'What is a BLA?', answers: ['Basic Lab Analysis', 'Biologic License Application', 'Biotech Liability Act', 'Blood Level Assessment'], correctIndex: 1, category: 'biotech' },
  { question: 'What does "breakthrough therapy" designation mean?', answers: ['Automatic approval', 'Expedited review for serious conditions', 'Phase 3 skip', 'Priority pricing'], correctIndex: 1, category: 'biotech' },
  { question: 'What is the typical FDA standard review period?', answers: ['6 months', '10 months', '12 months', '18 months'], correctIndex: 1, category: 'biotech' },
  { question: 'What does FDA priority review reduce the target to?', answers: ['3 months', '6 months', '8 months', '10 months'], correctIndex: 1, category: 'biotech' },
  { question: 'What is an Advisory Committee (AdCom) vote?', answers: ['Internal FDA meeting', 'Expert panel recommendation to FDA', 'Congressional hearing', 'Company board vote'], correctIndex: 1, category: 'biotech' },
  { question: 'What is an orphan drug?', answers: ['A recalled medication', 'A drug for rare diseases (<200k patients)', 'An over-the-counter drug', 'A generic copy'], correctIndex: 1, category: 'biotech' },
  { question: 'What does ODIN stand for at pdufa.bio?', answers: ['Online Drug Intelligence Network', 'Omniscient Data Intelligence Node', 'Oncology Drug Info Network', 'It\'s a Norse mythology reference'], correctIndex: 3, category: 'biotech' },
  { question: 'What is a PDUFA date?', answers: ['Drug patent expiry', 'FDA target action date for a drug application', 'Clinical trial start date', 'Drug launch date'], correctIndex: 1, category: 'biotech' },
  { question: 'What percent of drugs that enter Phase 1 eventually get approved?', answers: ['~5%', '~14%', '~50%', '~75%'], correctIndex: 1, category: 'biotech' },
];

export function getRandomTrivia(count: number): TriviaQuestion[] {
  const shuffled = [...TRIVIA_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
