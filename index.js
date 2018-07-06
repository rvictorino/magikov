require('dotenv').config();
const fs = require('fs');
const csv = require('csv');
const Mastodon = require('mastodon-api');
// const markovChain = require('./toots_chain.json');

const parser = csv.parse({ delimiter: ',' });

const windowSize = 2;
const hostuxUrl = 'https://hostux.social/api/v1/';
const clientTimeout = 60000;
const maxToots = 20;
const accountId = 31687;

// const tootsChain = markovChain || { lastId: null, occurrences: {} };
// const { occurrences } = tootsChain;

const srcToken = process.env.SOURCE_ACCOUNT_TOKEN;
const dstToken = process.env.DESTINATION_ACCOUNT_TOKEN;


// lastId

// 1. get toots from Mastodon source acccount
const srcClient = new Mastodon({
  access_token: srcToken,
  timeout_ms: clientTimeout,
  api_url: hostuxUrl,
});

async function getNextToots(startingId = 0) {
  return srcClient.get(`accounts/${accountId}/statuses?limit=${maxToots}&since_id=${startingId}&exclude_replies=true`);
}

async function getNewToots(startingId = 0) {
  let lastId = startingId;
  let endOfToots;
  const newToots = [];
  let response;
  let nextToots;

  do {
    try {
      // disable linting here because async operations need to be run one after
      // the other (output is required in next operation input)
      // eslint-disable-next-line no-await-in-loop
      response = await getNextToots(lastId);
    } catch (e) {
      break;
    }
    nextToots = response.data;
    console.log(nextToots.map(t => t.id));
    endOfToots = nextToots.length === 0;
    if (!endOfToots) {
      // keep track of max toot id
      lastId = nextToots.reduce((a, b) => (a > Number(b.id) ? a : Number(b.id)), lastId);
      // keep content only
      newToots.push(...nextToots.map(t => t.content));
    }
  } while (!endOfToots);

  return {
    lastId,
    toots: newToots,
  };
}

function updateMarkovChain(toots) {
  let words;
  const occurrences = {};

  toots.toots.forEach((t) => {
    // parse line
    words = t[0].split(' ');
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
  });

  return occurrences;
}


const toots = getNewToots();
toots
  .then(console.log)
  .catch(console.error);

// const updatedMarkovChain = updateMarkovChain(toots);
// console.log(updatedMarkovChain);


// while()

// 2. filter

// 3. parse, sanitize

// 4. write / update json file


// parser.on('readable', () => {
//   let record = true;
//   let words;
//
// while (record) {
//   // parse line
//   words = record[0].split(' ');
//   let nextWord;
//   let stats;
//   let key;
//
//   // count all occurrences of each word
//   for (let i = 0; i < words.length - windowSize; i += 1) {
//     const windowWords = [];
//
//     for (let j = 0; j < windowSize; j += 1) {
//       windowWords.push(words[i + j]);
//     }
//
//     // special case for <START> tag: use a window of size 1
//     // we also store next words of single <START> tag
//     if (windowWords[0] === '<START>') {
//       const statStart = occurrences['<START>'] || {
//         count: 0,
//         items: [],
//       };
//       statStart.count += 1;
//       statStart.items.push(windowWords[1]);
//       occurrences['<START>'] = statStart;
//     }
//
//
//     nextWord = words[i + windowWords.length];
//     key = windowWords.join(' ');
//
//
//     stats = occurrences[key] || {
//       count: 0,
//       items: [],
//     };
//     stats.count += 1;
//     stats.items.push(nextWord);
//
//     // store data
//     occurrences[key] = stats;
//   }
// }
//   record = parser.read();
// });
//
// parser.on('finish', () => {
//   // write data in json file
//   const jsonContent = JSON.stringify(occurrences);
//   fs.writeFile('markov.json', jsonContent, 'utf8');
// });
//
//
// fs.createReadStream(`${__dirname}/toots_sanitized.csv`).pipe(parser);
