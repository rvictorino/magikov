const markovChain = require('./markov.json')

let sentence = []
let current = markovChain['<START>']
let nextWord = current.items[Math.floor(Math.random()*current.items.length)]

while(nextWord != '<END>') {
  sentence.push(nextWord)
  current = markovChain[nextWord]
  nextWord = current.items[Math.floor(Math.random()*current.items.length)]
}

console.log(sentence.join(' ').replace(/(^|\s+)<NL>(\s+|$)/gi, '\n'))
