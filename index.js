const fs = require('fs')
const csv = require('csv')
const parser = csv.parse({
  delimiter: ','
})

const window_size = 2

let occurrences = {}

parser.on('readable', () => {
  while (record = parser.read()) {
    // parse line
    let words = record[0].split(' ')
    let nextWord
    let stats
    let key

    // count all occurrences of each word
    for (let i = 0; i < words.length - window_size; i++) {
      let windowWords = []

      for (let j = 0; j < window_size; j++) {
        windowWords.push(words[i + j])
      }

      // special case for <START> tag: use a window of size 1
      // we also store next words of single <START> tag
      if (windowWords[0] == '<START>') {
        let stat_start = occurrences['<START>'] || {
          count: 0,
          items: []
        }
        stat_start.count += 1
        stat_start.items.push(windowWords[1])
        occurrences['<START>'] = stat_start
      }


      nextWord = words[i + windowWords.length]
      key = windowWords.join(' ')


      stats = occurrences[key] || {
        count: 0,
        items: []
      }
      stats.count += 1
      stats.items.push(nextWord)

      // store data
      occurrences[key] = stats
    }
  }
})

parser.on('finish', () => {
  // write data in json file
  const jsonContent = JSON.stringify(occurrences)
  fs.writeFile('markov.json', jsonContent, 'utf8')
})


fs.createReadStream(__dirname + '/toots_sanitized.csv').pipe(parser)