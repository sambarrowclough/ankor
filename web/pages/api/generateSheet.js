import { oAuth2Client } from './hello'
import { GoogleSpreadsheet } from 'google-spreadsheet'

export default async function index(req, res) {
  if (req.method != 'POST') {
    return res.status(500).json({ text: 'method not allowed' })
  } else {
    try {
      const { issues, tokens, spreadsheetId } = req.body
      oAuth2Client.setCredentials(tokens)
      let doc = new GoogleSpreadsheet()
      if (spreadsheetId) {
        doc = new GoogleSpreadsheet(spreadsheetId)
      }
      // '1K48zEbYbgA8s1srNVLw46NXquN5sfhfUamHIUrPmPKk'
      doc.useOAuth2Client(oAuth2Client)
      if (!spreadsheetId) {
        await doc.createNewSpreadsheetDocument({ title: 'Ankor Timesheet' })
      }
      await doc.loadInfo()
      let headers = getHeaders(issues)
      let rows = getRows(issues)
      let start = shortDate(issues[0].createdAt)
      let end = shortDate(issues[issues.length - 1].createdAt)
      const sheet = await doc.addSheet({
        headerValues: headers
        //title: `${start} -> ${end}`
      })
      console.log(sheet.sheetId)
      const moreRows = await sheet.addRows(rows)
      let last = `${toLetter(headers.length - 1)}${rows.length + 2}`
      console.log(last)
      await sheet.loadCells(`A1:${last}`)

      for (let i = 5; i < headers.length; i++) {
        let cell = sheet.getCell(rows.length + 1, i)
        let letter = toLetter(i)
        cell.formula = `=SUM(${letter}2:${letter}${rows.length + 1})`
      }
      await sheet.saveUpdatedCells()
      return res
        .status(200)
        .json({ spreadsheetId: doc.spreadsheetId, gid: sheet.sheetId })
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }
}

// Utils
const getHeaders = issues => {
  let dates = []
  issues.forEach(issue => {
    //const { projectId, createdAt, title, duration, cycleId, assigneeId } = issue
    issue?.logging?.forEach(log => {
      let createdAt = shortDate(log.start)
      if (dates.indexOf(createdAt) === -1) {
        dates.push(createdAt)
      }
    })
  })
  let headers = ['Project', 'Issue', 'Asignee', 'Cycle', 'Created']
  dates.forEach(key => headers.push(key))
  return headers
}

// { Project: 'Test2', Issue: 'my //issue', Asignee: 'Tom', Cycle: '3', '2021-07-20': '2', '2021-07-21': '3', '2021-07-22': '2.5' }
const getRows = issues =>
  issues.map(issue => {
    const { projectName, createdAt, title, cycleName, assigneeName } = issue
    let row = {
      Project: projectName,
      Issue: title,
      Assignee: assigneeName,
      Cycle: cycleName,
      Created: createdAt
    }
    let day = {}
    issue?.logging?.forEach(log => {
      let diff = new Date(log.stop).getTime() - new Date(log.start).getTime()
      let date = shortDate(log.start)
      if (day[date]) {
        day[date] += diff
      } else {
        day[date] = diff
      }
    })
    row = Object.assign({ ...row }, day)
    return row
  })

function toLetter(num) {
  let letters = ''
  while (num >= 0) {
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters
    num = Math.floor(num / 26) - 1
  }
  return letters
}

const shortDate = date => new Date(date).toISOString().slice(0, 10)
