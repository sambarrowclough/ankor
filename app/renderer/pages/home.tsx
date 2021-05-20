import React, { useState, useEffect, Fragment, memo, useRef } from 'react'
import Head from 'next/head'
import { Menu, Transition } from '@headlessui/react'
import { socket } from './socket'
import { ipcRenderer } from 'electron'
import useEventListener from '@use-it/event-listener'
import memoize from 'memoize-one'
import { FixedSizeList as List, areEqual } from 'react-window'
import { createClient } from '@supabase/supabase-js'
import { usePopper } from 'react-popper'
import * as _ from 'lodash'

const log = console.log
const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
const supabase = createClient(supabaseUrl, supabaseKey)

/*
 * juration - a natural language duration parser
 * https://github.com/domchristie/juration
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

function juration() {
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

const CalendarIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M4.75 8.75C4.75 7.64543 5.64543 6.75 6.75 6.75H17.25C18.3546 6.75 19.25 7.64543 19.25 8.75V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V8.75Z"
    ></path>
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M8 4.75V8.25"
    ></path>
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M16 4.75V8.25"
    ></path>
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M7.75 10.75H16.25"
    ></path>
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="7.25"
      stroke="currentColor"
      stroke-width="1.5"
    ></circle>
    <path stroke="currentColor" stroke-width="1.5" d="M12 8V12L14 14"></path>
  </svg>
)

const Store = require('electron-store')

const store = new Store()
//store.delete('user')

// store.set('unicorn', '🦄')
// console.log(store.get('unicorn'))
// //=> '🦄'

// // Use dot-notation to access nested properties
// store.set('foo.bar', true)
//console.log(store.get('user'))
//=> {bar: true}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// store.delete('unicorn')
// console.log(store.get('unicorn'))

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const fetchSyncBootstrapData = () => {
  return fetch('https://api.linear.app/graphql', {
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      //"authorization": "Bearer " + d.access_token, // production
      authorization: 'BTpr3hGL7FCp0dVGWJYJcZM8aZRLZfJTcUEAOmDC', // person api
      'content-type': 'application/json',
      'sec-ch-ua':
        '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      user: '2e80bdba-fcc3-4d4a-8ea8-f684abe1379a'
    },
    referrer: 'https://linear.app/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: '{"query":"query SyncBootstrap($syncGroups: [String!], $onlyModels: [String!]) {\\n  syncBootstrap(syncGroups: $syncGroups, onlyModels: $onlyModels) { \\n    state, subscribedSyncGroups, lastSyncId, databaseVersion\\n  }\\n}"}',
    method: 'POST',
    mode: 'cors',
    credentials: 'include'
  }).then(r => r.json())
}

const fetchSyncBootstrapDataFromServer = ({ accessToken }) => {
  return fetch(
    `https://linear-oauth-tester.sambarrowclough.repl.co/bootstrap?accessToken=${accessToken}`,
    {
      method: 'GET'
    }
  ).then(r => r.json())
}

function timeConversion(duration: number) {
  const portions: string[] = []

  const msInHour = 1000 * 60 * 60
  const hours = Math.trunc(duration / msInHour)
  if (hours > 0) {
    portions.push(hours + 'h')
    duration = duration - hours * msInHour
  }

  const msInMinute = 1000 * 60
  const minutes = Math.trunc(duration / msInMinute)
  if (minutes > 0) {
    portions.push(minutes + 'm')
    duration = duration - minutes * msInMinute
  }

  const seconds = Math.trunc(duration / 1000)
  if (seconds > 0) {
    portions.push(seconds + 's')
  }

  return portions.join(' ')
}

const getLoggedIssues = async () => {
  // https://linear-webhook-websocket-server.sambarrowclough.repl.co/logIssue
  try {
    const opts = {
      method: 'GET',
      headers: { 'content-type': 'application/json' }
    }
    return await fetch(
      'https://linear-webhook-websocket-server.sambarrowclough.repl.co/logIssue',
      opts
    ).then(r => r.json())
  } catch (e) {
    console.log('Something went wrong', e)
  }
}

const logIssue = async ({ id, duration }) => {
  try {
    const opts = {
      body: JSON.stringify({ duration, id }),
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    }
    return await fetch(
      'https://linear-webhook-websocket-server.sambarrowclough.repl.co/logIssue',
      opts
    )
  } catch (e) {
    console.log('Something went wrong', e)
  }
}

const handleLogTime = async ({ id, duration }) => {
  let issue = getCompletedIssues().find(x => x.id === id)
  if (!issue) return console.log(`Issue ${id} not found`)
  issue['duration'] = duration
  issue['loggedAt'] = new Date().toISOString()
  setIssues(prev => {
    const index = prev.findIndex(x => x.id === id)
    let temp = [...prev]
    temp.splice(index, 1)
    return [...temp, issue].sort(byCompleted).reverse()
  })

  try {
    const opts = {
      body: JSON.stringify({ duration, id }),
      method: 'POST',
      headers: { 'content-type': 'application/json' }
    }
    await fetch(
      'https://linear-webhook-websocket-server.sambarrowclough.repl.co/logIssue',
      opts
    )
  } catch (e) {
    console.log('Something went wrong', e)
  }
}

// This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure Row components.
// This is only needed since we are passing multiple props with a wrapper object.
// If we were only passing a single, stable value (e.g. items),
// We could just pass the value directly.
const createItemData = memoize((items, toggleItemActive) => ({
  items,
  toggleItemActive
}))

function Home() {
  const [issues, setIssues] = useState([])
  const [viewIssuesFrom, setViewIssuesFrom] = useState('DAY')
  const [syncBootstrapState, setSyncBootstrapState] = useState([])
  const [onboardingUrl, setOnboardingUrl] = useState(null)

  useEffect(() => {
    socket.on('DONE', function (payload) {
      console.log('CLIENT#received', payload)
      if (payload && payload.data && payload.data.title) {
        setSyncBootstrapState(prev => {
          let temp = { ...prev }
          temp.Issue.push(payload.data)
          return temp
        })

        // Emit msg to backend to open up window
        ipcRenderer.send('DONE', 'DONE')

        setCurrentHoverIndex(0)
      }
    })
    // unsubscribe from event for preventing memory leaks
    return () => {
      socket.off('DONE')
    }
  }, [])

  const byCompleted = (a, b) => {
    return a.completedAt < b.completedAt
      ? -1
      : a.completedAt > b.completedAt
      ? 1
      : 0
  }

  const getCompletedIssues = () => {
    const completed =
      syncBootstrapState &&
      syncBootstrapState.WorkflowState &&
      syncBootstrapState.WorkflowState.map(x =>
        x.type === 'completed' ? x : null
      ).filter(Boolean)

    const completedIds = completed && completed.map(x => x.id)
    let completedIssues =
      syncBootstrapState &&
      syncBootstrapState.Issue &&
      syncBootstrapState.Issue.map(x => {
        if (completedIds.find(y => y === x.stateId) != null) return x
      }).filter(Boolean)

    return completedIssues
  }

  let filter = (by, key, d) => {
    let results = []
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

      case 'LABEL':
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
    }
    return results
  }

  const handleIssueStateChange = () => {
    let completedIssues = getCompletedIssues()
    if (completedIssues) {
      completedIssues = _.uniqBy(completedIssues, 'id')
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const lastThreeDays = new Date(
      startOfDay.getTime() - 3 * 24 * 60 * 60 * 1000
    )
    const lastWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date()
    lastMonth.setHours(0, 0, 0, 0)
    lastMonth.setMonth(lastMonth.getMonth() - 3)

    switch (viewIssuesFrom) {
      case 'DAY':
        completedIssues &&
          setIssues(
            completedIssues
              .filter(x => {
                if (new Date(x.completedAt).getTime() > startOfDay) return x
              })
              .sort(byCompleted)
              .reverse()
          )
        break

      case 'THREE_DAYS':
        completedIssues &&
          setIssues(
            completedIssues
              .filter(x => {
                if (new Date(x.completedAt).getTime() > lastThreeDays) return x
              })
              .sort(byCompleted)
              .reverse()
          )
        break

      case 'WEEK':
        completedIssues &&
          setIssues(
            completedIssues
              .filter(x => {
                if (new Date(x.completedAt).getTime() > lastWeek) return x
              })
              .sort(byCompleted)
              .reverse()
          )
        break

      case 'MONTH':
        completedIssues &&
          setIssues(
            completedIssues
              .filter(x => {
                if (new Date(x.completedAt).getTime() > lastMonth) return x
              })
              .sort(byCompleted)
              .reverse()
          )
        break

      case 'ALL':
        completedIssues &&
          setIssues(completedIssues.sort(byCompleted).reverse())
        break
    }
  }

  useEffect(() => {
    handleIssueStateChange()
  }, [viewIssuesFrom])

  useEffect(() => {
    handleIssueStateChange()
  }, [syncBootstrapState])

  useEffect(async () => {
    const userLocal = store.get('user')
    // Handle new users
    if (!userLocal) {
      const id = uuidv4()
      const unsubscribe = supabase
        //.from('users')
        .from(`users:id=eq.${id}`)
        .on('INSERT', async payload => {
          console.log('Change received!', payload)
          const { new: user } = payload
          store.set('user', user)
          ipcRenderer.send('DONE', 'DONE')
          let syncBootstrapData
          const { accessToken } = user
          try {
            syncBootstrapData = await fetchSyncBootstrapDataFromServer({
              accessToken
            })
          } catch (e) {
            console.error(
              'Something went wrong getting syncBoostrap data from Linear',
              e
            )
          }
          if (!syncBootstrapData)
            return alert('Failed to fetch data from Linear!')
          const all = JSON.parse(syncBootstrapData.data.syncBootstrap.state)
          setSyncBootstrapState(all)
          setOnboardingUrl(null)
        })
        .subscribe()
      const url = `https://linear.app/oauth/authorize?client_id=51b71a2c9fd2dcb50f362420d10fee4d&redirect_uri=https://linear-oauth-tester.sambarrowclough.repl.co/oauth&response_type=code&scope=read&state=${id}`
      setOnboardingUrl(url)
    } else {
      let syncBootstrapData
      const { accessToken } = userLocal
      try {
        syncBootstrapData = await fetchSyncBootstrapDataFromServer({
          accessToken
        })
      } catch (e) {
        console.error(
          'Something went wrong getting syncBoostrap data from Linear',
          e
        )
      }
      if (!syncBootstrapData) return alert('Failed to fetch data from Linear!')
      const all = JSON.parse(syncBootstrapData.data.syncBootstrap.state)
      const log = console.log
      // Map logged issues to Linear issues
      const loggedIssues = await getLoggedIssues()
      loggedIssues.forEach(x => {
        const index = all.Issue.findIndex(y => y.id === x.id)
        if (index != -1) {
          all.Issue[index].duration = x.duration
        }
      })
      //log(all.Issue.find(x => x.id === 'b6efd855-67de-45fa-810d-b70ef1826d68'))
      setSyncBootstrapState(all)
    }
  }, [])

  const [currentHoverIndex, setCurrentHoverIndex] = useState(-1)

  // Keyboard shortcuts
  useEventListener('keydown', function handler({ key }) {
    //if (currentHoverIndex < 0) return
    //console.log(key)
    switch (key) {
      case 't':
        setShowPopper(true)
        // HACK
        setTimeout(() => [inputRef.current.focus()], 0)
      case 'j':
        setCurrentHoverIndex(prev => {
          //console.log(prev)
          return prev + 2
        })
      case 'k':
        setCurrentHoverIndex(prev => {
          //console.log(prev)
          return prev - 1
        })
      case 'Enter':
        if (!inputValue) return
        setShowPopper(false)
        setIssues(prev => {
          const temp = [...prev]
          temp[hoveredRowIndex].duration = juration().parse(inputValue)
          return temp
        })
        setInputValue('')
        console.log(issues[hoveredRowIndex])
        logIssue(issues[hoveredRowIndex]).then(console.log)

      case 'Escape':
        setShowPopper(false)
        setInputValue('')
    }
  })

  const toggleItemActive = index => {
    //console.log(index)
  }

  const itemData = createItemData(issues, toggleItemActive)
  const [hoveredRowIndex, setHoveredRowIndex] = React.useState(null)

  const hov = React.useMemo(
    () => ({
      hoveredRowIndex,
      setHoveredRowIndex
    }),
    [hoveredRowIndex]
  )

  const ref = React.useRef()

  const [height, setHeight] = useState(null)
  const [width, setWidth] = useState(null)

  useEffect(() => {
    if (window) {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
    }
  }, [])

  const popperElement = useRef(null)
  function generateGetBoundingClientRect(x = 0, y = 0) {
    return () => ({
      width: 0,
      height: 0,
      top: 300,
      right: 500,
      bottom: 20,
      left: 200
    })
  }

  useEventListener('mousedown', ({ clientX, clientY, target }) => {
    if (target.closest('.hovered') == null) return

    setShowPopper(true)
    setVirtualElement(prev => {
      let temp = { ...prev }
      temp.getBoundingClientRect = generateGetBoundingClientRect(
        clientX,
        clientY
      )
      return temp
    })
    //update()

    //console.log(clientX, clientY, hoveredRowIndex)
    if (inputRef) {
      // HACK
      setTimeout(() => [inputRef.current.focus()], 0)
    }
  })

  const [arrowElement, setArrowElement] = useState(null)
  const [virtualElement, setVirtualElement] = useState({
    getBoundingClientRect: generateGetBoundingClientRect()
  })
  const [showPopper, setShowPopper] = useState(false)
  const { styles, attributes, update } = usePopper(
    virtualElement,
    popperElement.current,
    {
      modifiers: [{ name: 'arrow', options: { element: arrowElement } }]
    }
  )
  const inputRef = useRef()

  const [inputValue, setInputValue] = useState(null)

  return (
    <Fragment>
      <Head>
        <title>Home - Nextron (with-typescript-tailwindcss)</title>
      </Head>
      {onboardingUrl ? (
        <a
          onClick={event => {
            event.preventDefault()
            require('electron').shell.openExternal(event.target.href)
          }}
          href={onboardingUrl}
        >
          Login with Linear
        </a>
      ) : (
        <div>
          <div className="header border-2 border-gray-100 flex justify-between py-4 px-4 text-gray-600">
            <div className="flex ">
              <div className="header-burger-menu mr-4">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M4.75 5.75H19.25"
                  ></path>
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M4.75 18.25H19.25"
                  ></path>
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M4.75 12H19.25"
                  ></path>
                </svg>
              </div>
              <div className="header-show">Inbox</div>
            </div>
            <div className="header-calendar">
              <Menu as="div" className="relative inline-block text-left ml-2">
                {({ open }) => (
                  <>
                    <div>
                      <Menu.Button>
                        <CalendarIcon />
                      </Menu.Button>
                    </div>

                    <Transition
                      show={open}
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items
                        static
                        className="z-40 origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                onClick={() => setViewIssuesFrom('DAY')}
                                href="#"
                                className={classNames(
                                  active
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                Today
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                onClick={() => setViewIssuesFrom('THREE_DAYS')}
                                href="#"
                                className={classNames(
                                  active
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                Last 3 days
                              </a>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <a
                                onClick={() => setViewIssuesFrom('WEEK')}
                                href="#"
                                className={classNames(
                                  active
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                Last week
                              </a>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <a
                                onClick={() => setViewIssuesFrom('MONTH')}
                                href="#"
                                className={classNames(
                                  active
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                Last Month
                              </a>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <a
                                onClick={() => setViewIssuesFrom('ALL')}
                                href="#"
                                className={classNames(
                                  active
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                All
                              </a>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
          </div>

          <div className="task-list text-gray-700 ">
            <List
              itemCount={issues.length}
              itemData={{ ...itemData, ...hov }}
              itemSize={40}
              height={height ?? 100}
              width={width ?? 100}
              ref={ref}
            >
              {Row}
            </List>
          </div>

          {showPopper ? (
            <div
              ref={popperElement}
              className="py-1 outline-none bg-white"
              style={{
                ...styles.popper,
                color: '#eee',
                borderRadius: '8px',
                background: '#111'
                //display: showPopper ? 'flex' : 'none'
              }}
              {...attributes.popper}
            >
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="outline-none bg-white text-sm text-gray-600 w-40 px-4 py-0"
                style={{
                  color: '#eee',
                  borderRadius: '8px',
                  background: '#111'
                  //display: showPopper ? 'flex' : 'none'
                }}
                ref={inputRef}
                //placeholder="Time taken. e.g 1h 20m"
              />
              <div ref={setArrowElement} style={styles.arrow} />
            </div>
          ) : (
            ''
          )}
        </div>
      )}
    </Fragment>
  )
}

const Row = memo(({ data, index, style }) => {
  // Data passed to List as "itemData" is available as props.data
  const { items, toggleItemActive, setHoveredRowIndex, hoveredRowIndex } = data
  const item = items[index]
  const { title, duration } = item
  const isHovered = hoveredRowIndex === index

  return (
    <div
      className={`${
        isHovered ? 'hovered bg-gray-50' : ''
      } flex items-center px-6 mr-2 border-b-2 border-gray-50`}
      onMouseEnter={() => setHoveredRowIndex(index)}
      onClick={() => toggleItemActive(index)}
      style={{
        ...style
      }}
    >
      <div
        className={`w-2 h-2 ${
          duration == null ? 'rounded-full bg-indigo-400' : ''
        } mr-2`}
      ></div>
      <div
        style={{
          overflow: 'hidden',
          lineHeight: 'normal',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'rgb(40, 42, 48)',
          fontWeight: 500,
          fontSize: '13px',
          flexShrink: 1,
          maxWidth: '251px'
        }}
      >
        {title}
      </div>
      <div className="flex-1"></div>
      {duration != undefined && (
        <div className="text-xs text-gray-300">
          {juration().humanize(duration)}
        </div>
      )}
    </div>
  )
}, areEqual)

export default Home
