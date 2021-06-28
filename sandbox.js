const fs = require('fs')
const data = JSON.parse(fs.readFileSync('./sync-bootstrap-state.json').toString())
const log = console.log


let id = '42996195-aada-4efa-87f3-f98dfd5c0655'

// How do we find the obj
const item = data.IssueLabel.find(x => x.id === id)
const findType = (id) => {
  let type = ''
  let keys = Object.keys(data)
  keys.forEach(key => {
    data[key].forEach(item => {
      if (item.id === id) type = key
    })
  })
	return type
}

let type = findType(id)
log(type)

// const labels = data.IssueLabel.filter(x => 
// 		data.Issue.find(y => y.labelIds.includes(x.id) 
// )).filter(Boolean)


// const teams = data.Team.filter(x => 
// 		labels.find(y => y.teamId === x.id)
// )

// log(labels)
