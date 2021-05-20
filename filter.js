const fs = require('fs')
let print = console.log
let read = (path) => fs.readFileSync(path).toString()
let parse = (data) => JSON.parse(data)
let str = (data) => JSON.stringify(data, null, 2)

let d = read("./sync-bootstrap-state.json")
d = parse(d).Issue

let filter = (by, key, d) => {
  switch (by) {
    case "CONTENT":
      results = d.filter(x => x.title.includes(key))
      break;

    case "STATUS":
      results = d.filter(x => x.stateId === key)
      break;

    case "PRIORITY":
      results = d.filter(x => x.priority == key)
      break;

    case "ASSIGNEE":
      results = d.filter(x => x.assigneeId === key)
      break;

    case "SUBSCRIBER":
      results = d.filter(x => x.subscriberIds.includes(key))
      break;

    case "CREATOR":
      results = d.filter(x => x.creatorId === key)
      break;

    case "ESTIMATE":
      results = d.filter(x => x.estimate === key)
      break;

    case "LABEL":
      results = d.filter(x => x.labelIds.includes(key))
      break;

    case "CYCLE":
      results = d.filter(x => x.cycleId == key)
      break;

    case "PROJECT":
      results = d.filter(x => x.projectId == key)
      break;

    case "MILESTONE":
      // TODO
      break;

    case "RELATIONSHIP":
      // TODO
      break;

    case "TEAM":
      results = d.filter(x => x.teamId === key)
      break;

    case "DUE_DATE":
      // TODO
      break;

    case "AUTO_CLOSED":
      // TODO
      break;
  }
  return results
}

print(filter("TEAM", "558052bc-564a-4672-bfb2-6b6f31c63f3d", d))
