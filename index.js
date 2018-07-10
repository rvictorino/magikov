require('dotenv').config();
const fs = require('fs');
const csv = require('csv');
const queryString = require('querystring');
const sanitizeHtml = require('sanitize-html');
const Mastodon = require('mastodon-api');
// const markovChain = require('./toots_chain.json');

const parser = csv.parse({
  delimiter: ','
});

const windowSize = 2;
const hostuxUrl = 'https://hostux.social/api/v1/';
const clientTimeout = 60000;
const maxToots = 20;
const accountId = '31687';
const tootsFile = './toots.json';

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

async function getNextToots(startingId = '', maxId = '') {
  let params = {
    limit: maxToots,
    since_id: startingId,
    exclude_replies: true,
  };
  if (maxId) {
    params['max_id'] = maxId;
  }
  return srcClient.get(`accounts/${accountId}/statuses?${queryString.stringify(params)}`);
}

async function getNewToots(currentToots) {
  let lastId = currentToots.lastId;
  const newToots = currentToots.toots;
  let maxId;
  let endOfToots;
  let response;
  let nextToots;
  console.log(lastId)

  do {
    console.log('executing request')
    try {
      // disable linting here because async operations need to be run one after
      // the other (output is required in next operation input)
      // eslint-disable-next-line no-await-in-loop
      response = await getNextToots(lastId, maxId);
    } catch (e) {
      break;
    }
    nextToots = response.data;
    endOfToots = !nextToots.length > 0;
    if (!endOfToots) {
      // keep track of max toot id
      maxId = nextToots[nextToots.length - 1].id
      // keep content only
      newToots.push(...nextToots.map(t => ({
        id: t.id,
        content: t.content,
        account_id: t.account.id,
        reblog: t.reblog,
        visibility: t.visibility,
        mentions: t.mentions,
      })));
    }
  }
  while (!endOfToots);

  lastId = newToots.reduce((a, b) => (a > Number(b.id) ? a : Number(b.id)), 0)

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


const filterToots = (toots) => ({
  lastId: toots.lastId,
  toots: toots.toots
    .filter(t => t.reblog === null && t.account_id === accountId && t.visibility === 'public')
    .map((t) => {
      return sanitizeHtml(t.content, {
          allowedTags: ['br', 'p'],
          allowedAttributes: [],
        })
        .replace(/<br \/>/gi, '\n')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n')
    }),
})

let currentToots;
fs.readFile(tootsFile, (err, data) => {
  if (err) {
    currentToots = {
      lastId: 0,
      toots: [],
    };
  } else {
    currentToots = JSON.parse(data);
  }
  getNewToots(currentToots)
    .then((toots) => {
      const jsonToots = JSON.stringify(filterToots(toots));
      fs.writeFile(tootsFile, jsonToots, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('file saved.');
        }
      })
    })
    .catch(console.error);
});



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