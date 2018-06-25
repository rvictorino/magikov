const request = require('request-promise-native')
const mastodon = require('mastodon-api')

const fs = require('fs')

const csv = require('csv')
const parser = csv.parse({delimiter: ','})

let occurrences = {}

parser.on('readable', () => {
  while(record = parser.read()){
    // parse line
    let words = record[0].split(' ')
    let word
    let nextWord
    let stats

    // count all occurrences of each word
    for(let i=0; i < words.length-1; i++) {
      word = words[i]
      nextWord = words[i+1]
      stats = occurrences[word] || {count: 0, items: []}
      stats.count++
      stats.items.push(nextWord)

      // store data
      occurrences[word] = stats
    }
  }
})

parser.on('finish', () => {
  // write data in json file
  const jsonContent = JSON.stringify(occurrences)
  fs.writeFile('markov.json', jsonContent, 'utf8')
})


fs.createReadStream(__dirname+'/toots_sanitized.csv').pipe(parser)
