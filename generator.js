const markovChain = require('./markov.json');

const sentence = [];
const chainWindow = ['<START>'];
let current = markovChain[chainWindow.join(' ')]; // one elem only here
let nextWord = current.items[Math.floor(Math.random() * current.items.length)];
chainWindow.push(nextWord);


while (nextWord !== '<END>') {
  sentence.push(nextWord);
  current = markovChain[chainWindow.join(' ')];
  nextWord = current.items[Math.floor(Math.random() * current.items.length)];
  chainWindow.push(nextWord);
  chainWindow.shift();
}

console.log(sentence.join(' ').replace(/(^|\s+)<NL>(\s+|$)/gi, '\n'));
