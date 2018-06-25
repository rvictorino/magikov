const fs = require('fs');
const csv = require('fast-csv');

const removeMentionsHashTag = [/([@#])([a-z\d_]+)/gi, '']
const removeLinks = [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig, '']
const keepWords = [/[^\w\s\d]*/ig, '']
const countNLAsWord = [/(?:\r\n|\r|\n)/g, ' <NL> ']
const oneSpace = [/(\s+)/g, ' ']
const leadingTrailingSpaces = [/(^\s|\s$)/g, '']

csv.fromPath("Toots.csv", {headers: true})
  .transform( (obj) => {
    return {
      content: `<START> ${obj.content
        .replace(...removeMentionsHashTag)
        .replace(...removeLinks)
        // .replace(...keepWords)
        .replace(...countNLAsWord)
        .replace(...oneSpace)
        .replace(...leadingTrailingSpaces)
      } <END>`
    }
  })
  .pipe(csv.createWriteStream({headers: true}))
  .pipe(fs.createWriteStream("toots_sanitized.csv", {encoding: "utf8"}));
