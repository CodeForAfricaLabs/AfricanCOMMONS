var fs = require('fs-extra')

var downloadFile = require('download-file')
var Papa = require('papaparse')

var utils = require('./utils')

var args = process.argv.slice(2);
switch (args[0]) {
  case '--download':
    download()
    break
  case '--publish':
    publish()
    break
  default:
    create_projects()
    create_users()
}



// Download the data
function download() {
  console.log('Download started')
  var files = [
    {
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4gM-ByCoxuTAlX4qtRHn05IfPgjBB_pPk6aGfjkRFhYl_IFx9__s9NUfxJKnj3HvtkIWhBvoMLLei/pub?gid=297467500&single=true&output=csv',
      filename: 'categories.csv'
    },
    {
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4gM-ByCoxuTAlX4qtRHn05IfPgjBB_pPk6aGfjkRFhYl_IFx9__s9NUfxJKnj3HvtkIWhBvoMLLei/pub?gid=0&single=true&output=csv',
      filename: 'projects.csv'
    },
    {
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4gM-ByCoxuTAlX4qtRHn05IfPgjBB_pPk6aGfjkRFhYl_IFx9__s9NUfxJKnj3HvtkIWhBvoMLLei/pub?gid=577365421&single=true&output=csv',
      filename: 'organisations.csv'
    },
    {
      url: 'https://raw.githubusercontent.com/HacksHackersAfrica/github-africa/master/step4.json',
      filename: 'users.json'
    }
  ]

  for (var i = files.length - 1; i >= 0; i--) {
    var options = {
      directory: './dist/_data',
      filename: files[i].filename
    }
    downloadFile(files[i].url, options, function(err, path){
      if (err) throw err
      switch (path) {
        case options.directory + '/projects.csv':
          create_projects()
          break
        case options.directory + '/users.json':
          create_users()
          break
      }
      console.log('Download complete - ' + path)
    })
  }
  
}


// Create the projects' files
function create_projects() {

  console.log('Processing projects.')

  var data_url = './dist/_data/projects.csv'

  fs.readFile(data_url, 'utf8', function (err, data) {

    if (err) throw err

    // Clean the projects folder first
    fs.emptyDirSync('./dist/_projects')

    var projects = Papa.parse(data, {'header': true}).data

    // create the files
    for (var i = 0; i <= projects.length - 1; i++) {
      var content = ''

      content = '---\n'

      content += 'layout: item\n'
      content += 'body_class: item\n'

      content += 'title: ' + projects[i].Name + '\n'
      content += 'countries: ' + projects[i].Country + '\n'
      content += 'category: ' + projects[i].Category + '\n'
      content += 'site_url: ' + projects[i].Url + '\n'
      content += 'github_url: ' + projects[i].Github + '\n'
      content += 'related: ' + projects[i].Related + '\n'
      content += 'description: >\n  ' + projects[i].Description.replace('\n', '\n  ') + '\n'
      
      content += '---\n'

      fs.outputFileSync('./dist/_projects/' + utils.slugify(projects[i].Name) + '.md', content)
      
    }

    console.log('Finished processing ' + projects.length + ' projects.')
  })
}


// JSON to CSV
function create_users() {
  console.log('Processing users.')

  // Move file because of UTF8 issues with Jekyll
  fileToMove = './dist/_data/users.json'
  filePath = './dist/js/data/users.json'
  if (fs.existsSync(fileToMove)) {
    fs.moveSync(fileToMove, filePath)
  }
  
  var users = fs.readJsonSync(filePath)

  // Shuffle the users for save into CSV and use in front page
  users = utils.shuffleArray(users)

  // Save to CSV
  fs.outputFileSync('./dist/_data/users.csv', Papa.unparse(users))

  console.log('Finished processing ' + users.length + ' users.')
}


// Publish to gh-pages
function publish() {
  console.log('Starting Github Pages publish...')
  var ghpages = require('gh-pages')
  ghpages.publish('dist', function(err) {
    if (err) throw err
    console.log('Completed Github pages publish.')
  });
}
