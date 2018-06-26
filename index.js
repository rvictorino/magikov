const fs = require('fs');
const csv = require('csv');

const parser = csv.parse({ delimiter: ',' });

const windowSize = 2;

const occurrences = {};

parser.on('readable', () => {
  let record = true;
  let words;

  while (record) {
    // parse line
    words = record[0].split(' ');
    let nextWord;
    let stats;
    let key;

    // count all occurrences of each word
    for (let i = 0; i < words.length - windowSize; i += 1) {
      const windowWords = [];

      for (let j = 0; j < windowSize; j += 1) {
        windowWords.push(words[i + j]);
      }

      // special case for <START> tag: use a window of size 1
      // we also store next words of single <START> tag
      if (windowWords[0] === '<START>') {
        const statStart = occurrences['<START>'] || {
          count: 0,
          items: [],
        };
        statStart.count += 1;
        statStart.items.push(windowWords[1]);
        occurrences['<START>'] = statStart;
      }


      nextWord = words[i + windowWords.length];
      key = windowWords.join(' ');


      stats = occurrences[key] || {
        count: 0,
        items: [],
      };
      stats.count += 1;
      stats.items.push(nextWord);

      // store data
      occurrences[key] = stats;
    }
  }
  record = parser.read();
});

parser.on('finish', () => {
  // write data in json file
  const jsonContent = JSON.stringify(occurrences);
  fs.writeFile('markov.json', jsonContent, 'utf8');
});


fs.createReadStream(`${__dirname}/toots_sanitized.csv`).pipe(parser);
