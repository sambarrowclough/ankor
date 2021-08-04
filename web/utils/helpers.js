import { supabase } from '../lib/supabase'

export const logIssue = async issue => {
  // let { data: gotIssue, error: getError } = await supabase
  //   .from('loggedIssues')
  //   .select('*')
  //   .eq('id', issue.id)

  // if (!gotIssue[0]) {
  //   gotIssue = [{ id: issue.id, logging: issue.logging }]
  // } else {
  //   gotIssue[0].logging = issue.logging
  // }

  let savedIssue = {
    id: issue.id,
    logging: issue.logging
  }

  const { data, error: saveError } = await supabase
    .from('loggedIssues')
    .insert([savedIssue], { upsert: true })

  if (saveError) {
    throw new Error(saveError.message)
  }

  return data
}
logIssue.displayName = 'logIssue'

// YYYY-MM-DD -> "2021-07-30"
export function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

export const byCompleted = (a, b) => {
  return a.completedAt < b.completedAt
    ? -1
    : a.completedAt > b.completedAt
    ? 1
    : 0
}
byCompleted.displayName = 'byCompleted'

// Find the type of an object from its id
// e.g '42996195-aada-4efa-87f3-f98dfd5c0655' -> Project
export const findType = (id, state) => {
  if (!state) throw new Error('State required')
  let type = ''
  let keys = Object.keys(state)
  keys.forEach(key => {
    state[key].forEach(item => {
      if (item.id === id) type = key
    })
  })
  return type
}
findType.displayName = 'findType'

/*
 * juration - a natural language duration parser
 * https://github.com/domchristie/juration
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */
export function juration() {
  var UNITS = {
    seconds: {
      patterns: ['second', 'sec', 's'],
      value: 1,
      formats: {
        chrono: '',
        micro: 's',
        short: 'sec',
        long: 'second'
      }
    },
    minutes: {
      patterns: ['minute', 'min', 'm(?!s)'],
      value: 60,
      formats: {
        chrono: ':',
        micro: 'm',
        short: 'min',
        long: 'minute'
      }
    },
    hours: {
      patterns: ['hour', 'hr', 'h'],
      value: 3600,
      formats: {
        chrono: ':',
        micro: 'h',
        short: 'hr',
        long: 'hour'
      }
    },
    days: {
      patterns: ['day', 'dy', 'd'],
      value: 86400,
      formats: {
        chrono: ':',
        micro: 'd',
        short: 'day',
        long: 'day'
      }
    },
    weeks: {
      patterns: ['week', 'wk', 'w'],
      value: 604800,
      formats: {
        chrono: ':',
        micro: 'w',
        short: 'wk',
        long: 'week'
      }
    },
    months: {
      patterns: ['month', 'mon', 'mo', 'mth'],
      value: 2628000,
      formats: {
        chrono: ':',
        micro: 'm',
        short: 'mth',
        long: 'month'
      }
    },
    years: {
      patterns: ['year', 'yr', 'y'],
      value: 31536000,
      formats: {
        chrono: ':',
        micro: 'y',
        short: 'yr',
        long: 'year'
      }
    }
  }

  var stringify = function (seconds, options) {
    if (!_isNumeric(seconds)) {
      throw 'juration.stringify(): Unable to stringify a non-numeric value'
    }

    if (
      typeof options === 'object' &&
      options.format !== undefined &&
      options.format !== 'micro' &&
      options.format !== 'short' &&
      options.format !== 'long' &&
      options.format !== 'chrono'
    ) {
      throw (
        "juration.stringify(): format cannot be '" +
        options.format +
        "', and must be either 'micro', 'short', or 'long'"
      )
    }

    var defaults = {
      format: 'short',
      units: undefined
    }

    var opts = _extend(defaults, options)

    var units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
      values = []
    var remaining = seconds
    var activeUnits = 0
    for (
      var i = 0, len = units.length;
      i < len && (opts.units == undefined || activeUnits < opts.units);
      i++
    ) {
      var unit = UNITS[units[i]]
      values[i] = Math.floor(remaining / unit.value)
      if (values[i] > 0 || activeUnits > 0) activeUnits++

      if (opts.format === 'micro' || opts.format === 'chrono') {
        values[i] += unit.formats[opts.format]
      } else {
        values[i] += ' ' + _pluralize(values[i], unit.formats[opts.format])
      }
      remaining = remaining % unit.value
    }
    var output = ''
    for (i = 0, len = values.length; i < len; i++) {
      if (values[i].charAt(0) !== '0' && opts.format != 'chrono') {
        output += values[i] + ' '
      } else if (opts.format == 'chrono') {
        output += _padLeft(values[i] + '', '0', i == values.length - 1 ? 2 : 3)
      }
    }
    return output
      .replace(/\s+$/, '')
      .replace(/^(00:)+/g, '')
      .replace(/^0/, '')
  }

  var parse = function (string) {
    // returns calculated values separated by spaces
    for (var unit in UNITS) {
      for (var i = 0, mLen = UNITS[unit].patterns.length; i < mLen; i++) {
        var regex = new RegExp(
          '((?:\\d+\\.\\d+)|\\d+)\\s?(' +
            UNITS[unit].patterns[i] +
            's?(?=\\s|\\d|\\b))',
          'gi'
        )
        string = string.replace(regex, function (str, p1, p2) {
          return ' ' + (p1 * UNITS[unit].value).toString() + ' '
        })
      }
    }

    var sum = 0,
      numbers = string
        .replace(/(?!\.)\W+/g, ' ') // replaces non-word chars (excluding '.') with whitespace
        .replace(/^\s+|\s+$|(?:and|plus|with)\s?/g, '') // trim L/R whitespace, replace known join words with ''
        .split(' ')

    for (var j = 0, nLen = numbers.length; j < nLen; j++) {
      if (numbers[j] && isFinite(numbers[j])) {
        sum += parseFloat(numbers[j])
      } else if (!numbers[j]) {
        throw 'juration.parse(): Unable to parse: a falsey value'
      } else {
        // throw an exception if it's not a valid word/unit
        throw (
          'juration.parse(): Unable to parse: ' +
          numbers[j].replace(/^\d+/g, '')
        )
      }
    }
    return sum
  }

  // _padLeft('5', '0', 2); // 05
  var _padLeft = function (s, c, n) {
    if (!s || !c || s.length >= n) {
      return s
    }

    var max = (n - s.length) / c.length
    for (var i = 0; i < max; i++) {
      s = c + s
    }

    return s
  }

  var _pluralize = function (count, singular) {
    return count == 1 ? singular : singular + 's'
  }

  var _isNumeric = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }

  var _extend = function (obj, extObj) {
    for (var i in extObj) {
      if (extObj[i] !== undefined) {
        obj[i] = extObj[i]
      }
    }
    return obj
  }

  return {
    parse: parse,
    stringify: stringify,
    humanize: stringify
  }
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function filter(by, key, d) {
  let results = []
  if (by) {
    by = by.toUpperCase()
  }
  if (!d) return results
  switch (by) {
    case 'CONTENT':
      results = d.filter(x => x.title.includes(key))
      break

    case 'STATUS':
      results = d.filter(x => x.stateId === key)
      break

    case 'PRIORITY':
      results = d.filter(x => x.priority == key)
      break

    case 'ASSIGNEE':
      results = d.filter(x => x.assigneeId === key)
      break

    case 'SUBSCRIBER':
      results = d.filter(x => x.subscriberIds.includes(key))
      break

    case 'CREATOR':
      results = d.filter(x => x.creatorId === key)
      break

    case 'ESTIMATE':
      results = d.filter(x => x.estimate === key)
      break

    case 'ISSUELABEL':
      results = d.filter(x => x.labelIds.includes(key))
      break

    case 'CYCLE':
      results = d.filter(x => x.cycleId == key)
      break

    case 'PROJECT':
      results = d.filter(x => x.projectId == key)
      break

    case 'MILESTONE':
      // TODO
      break

    case 'RELATIONSHIP':
      // TODO
      break

    case 'TEAM':
      results = d.filter(x => x.teamId === key)
      break

    case 'DUE_DATE':
      // TODO
      break

    case 'AUTO_CLOSED':
      // TODO
      break
    case 'UNLOGGED':
      results = d.filter(p => p.duration == null)
      break
    case 'ALL':
      return d.sort(byCompleted).reverse()
    default:
      return d.sort(byCompleted).reverse()
  }

  return results.sort(byCompleted).reverse()
}

filter.displayName = 'filter'
