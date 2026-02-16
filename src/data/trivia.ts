export interface TriviaQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  category: 'science' | 'history' | 'geography' | 'general' | 'norse';
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
];

export function getRandomTrivia(count: number): TriviaQuestion[] {
  const shuffled = [...TRIVIA_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
