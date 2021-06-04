import React, {
  useState,
  useEffect,
  Fragment,
  memo,
  useRef,
  forwardRef
} from 'react'
import Head from 'next/head'
import { socket } from './socket'
import { ipcRenderer } from 'electron'
import useEventListener from '@use-it/event-listener'
import memoize from 'memoize-one'
import {
  FixedSizeList as FList,
  VariableSizeList as VList,
  areEqual
} from 'react-window'
import { createClient } from '@supabase/supabase-js'
import { usePopper } from 'react-popper'
import * as _ from 'lodash'
import { useHotkeys, useIsHotkeyPressed } from 'react-hotkeys-hook'
import { useOverlayTriggerState } from '@react-stately/overlays'
import {
  useOverlay,
  usePreventScroll,
  useModal,
  OverlayProvider,
  OverlayContainer
} from '@react-aria/overlays'
import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import { useButton } from '@react-aria/button'
import { useSpring, animated } from 'react-spring'
import { createPopper } from '@popperjs/core'
import { GlobalHotKeys, HotKeys } from 'react-hotkeys'
import loadConfig from 'next/dist/next-server/server/config'
const str = d => JSON.stringify(d)
const log = console.log
const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
const supabase = createClient(supabaseUrl, supabaseKey)

function ModalDialog(props) {
  let { title, children } = props

  // Handle interacting outside the dialog and pressing
  // the Escape key to close the modal.
  let ref = React.useRef()
  let { overlayProps, underlayProps } = useOverlay(props, ref)

  // Prevent scrolling while the modal is open, and hide content
  // outside the modal from screen readers.
  usePreventScroll()
  let { modalProps } = useModal()

  // Get props for the dialog and its title
  let { dialogProps, titleProps } = useDialog(props, ref)

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...underlayProps}
    >
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          style={{
            background: 'white',
            color: 'black',
            padding: 30
          }}
        >
          <h3 {...titleProps} style={{ marginTop: 0 }}>
            {title}
          </h3>
          {children}
        </div>
      </FocusScope>
    </div>
  )
}

function Modal({}) {
  return
}

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
let store
try {
  store = new Store()
} catch (e) {
  alert(str(e))
}
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

// https://stackoverflow.com/a/2117523
function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}

function Home() {
  const [issues, setIssues] = useState([])
  const [viewIssuesFrom, setViewIssuesFrom] = useState('DAY')
  const [syncBootstrapState, setSyncBootstrapState] = useState([])
  const [onboardingUrl, setOnboardingUrl] = useState(null)
  const [filterConfig, setFilterConfig] = useState({})
  const [stage, setStage] = useState('TYPE_SELECTION')
  const [isLoading, setIsIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState(null)
  const [currentHoverIndex, setCurrentHoverIndex] = useState(-1)
  const [filterStage, setFilterStage] = useState(-1)
  const [arrowElement, setArrowElement] = useState(null)
  const [virtualElement, setVirtualElement] = useState({
    getBoundingClientRect: generateGetBoundingClientRect()
  })
  const [showPopper, setShowPopper] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [filterBy, setFilterBy] = useState(null)
  const [height, setHeight] = useState(null)
  const [width, setWidth] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [items, setItems] = useState([])
  const [currentView, setCurrentView] = useState(null)
  let state = useOverlayTriggerState({})
  const [showTimeTrackerLauncher, setShowTimeTrackerLauncher] = useState(false)

  let openButtonRef = React.useRef()
  let closeButtonRef = React.useRef()
  const ref = React.useRef()
  const inputRef = useRef()
  const firstStageInput = useRef()
  const firstStageContainerRef = useRef()
  const secondStageContainerRef = useRef()
  const popperElement = useRef()

  let firstBtn = useRef()

  const { styles, attributes, update } = usePopper(
    virtualElement,
    popperElement.current,
    {
      modifiers: [{ name: 'arrow', options: { element: arrowElement } }]
    }
  )

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
    log(by, key)
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
      case 'ALL':
        return d.sort(byCompleted).reverse()
      default:
        return d.sort(byCompleted).reverse()
    }
    return results.sort(byCompleted).reverse()
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

    let { key, type } = filterConfig
    return setIssues(filter(type, key, completedIssues))

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
  const convertFilterByLinearType = type => {
    switch (type) {
      case 'team':
        return 'Team'
      case 'project':
        return 'Project'
      case 'label':
        return ''
      default:
        return 'Project'
    }
  }

  useEffect(() => {
    handleIssueStateChange()
  }, [filterConfig])

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
            // syncBootstrapData = await fetchSyncBootstrapDataFromServer({
            //   accessToken
            // })
            syncBootstrapData = syncBootstrapMockData
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
      if (!loggedIssues) return
      loggedIssues.forEach(x => {
        const index = all.Issue.findIndex(y => y.id === x.id)
        if (index != -1) {
          all.Issue[index].duration = x.duration
        }
      })

      // If the task has a startedAt, completedAt, and they have opted in to
      // do automatic tracking, figure out the time a task took
      let autoTrackTime = false
      if (autoTrackTime) {
        for (let i = 0; i < all.Issue.length; i++) {
          let issue = all.Issue[i]
          if (issue.completedAt && issue.startedAt) {
            let diff = new Date(issue.completedAt) - new Date(issue.startedAt)
            if (diff > 0) {
              // TODO: keep getting "Uncaught juration.stringify(): Unable to stringify a non-numeric value"
              let duration = juration().humanize(Math.round(diff))
              issue.duration = duration
              log(duration)
            }
          }
        }
      }

      //log(all.Issue.find(x => x.id === 'b6efd855-67de-45fa-810d-b70ef1826d68'))
      setSyncBootstrapState(all)
      setIsIsLoading(false)
    }
  }, [])

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

  // Keyboard shortcuts
  useEventListener('keydown', function handler({ key }) {
    //if (currentHoverIndex < 0) return
    //log(key)
    //console.log(key)
    switch (key) {
      case 't':
        setShowPopper(true)
        // HACK
        setTimeout(() => [inputRef.current.focus()], 0)
        break
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
        break
      case 'f':
        // const isEditing = filterStage != -1

        // if (!isEditing) {
        //   setFilterStage(0)
        //   // HACK to clear input when we hit f
        //   setTimeout(() => firstStageInput?.current?.focus())
        // }
        break
      //firstStageInput?.current?.focus()
      // TODO: hotkey for timetracker launcher should be in the component
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
        setShowTimeTrackerLauncher(false)
        break
      case 'Escape':
        setShowPopper(false)
        setInputValue('')
        if (filterStage == 0) {
          setFilterStage(-1)
        } else if (filterStage == 1) {
          setFilterStage(0)
        }
        break
      default:
        // Log time when hovering
        if (hoveredRowIndex > 0) {
          //setShowPopper(true)
          //if (!inputRef?.current?.value) inputRef.current.value = key
          //setTimeout(() => [inputRef.current.focus()], 0)
        }
        break
    }
  })

  useEffect(() => {
    if (window) {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
    }
  }, [])

  const toggleItemActive = index => {
    console.log(index)
  }

  //const itemData = createItemData(issues, toggleItemActive)
  const [hoveredRowIndex, setHoveredRowIndex] = React.useState(null)

  const hov = React.useMemo(
    () => ({
      hoveredRowIndex,
      setHoveredRowIndex
    }),
    [hoveredRowIndex]
  )

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
    if (inputRef?.current?.focus) {
      // HACK
      //setTimeout(() => [inputRef.current.focus()], 0)
    }
  })

  // cmd+f find
  useIsHotkeyPressed('f') &&
    useIsHotkeyPressed('cmd') &&
    useHotkeys('cmd+f', () => state.open())

  // f filter
  useIsHotkeyPressed('f') && useHotkeys('f', () => log('f'))

  // useEventListener('keydown', ({ key }) => {
  //   log('KEYDOWN: APP')

  //   if (
  //     key.toLowerCase() === 'i' &&
  //     !isVisible &&
  //     firstBtn &&
  //     !showTimeTrackerLauncher
  //   ) {
  //     console.log('Shortcut: I')
  //     //setShortcut('V')
  //     setItems([
  //       { type: 'header', name: 'Quicklinks' },
  //       { name: 'All issues', type: 'all', id: uuid() },
  //       { name: 'My issues', type: 'my', id: uuid() },
  //       { type: 'header', name: 'Project' },
  //       ...syncBootstrapState.Project.map(x => ({
  //         ...x,
  //         type: 'Project'
  //       })),
  //       { type: 'header', name: 'Team' },
  //       ...syncBootstrapState.Team.map(x => ({
  //         ...x,
  //         type: 'Team'
  //       }))
  //     ])
  //     setPosition(firstBtn.current.getBoundingClientRect())
  //     setIsVisible(true)

  //     return
  //   }

  //   // ESC
  //   if (key === 'Escape') {
  //     if (showTimeTrackerLauncher) {
  //       setShowTimeTrackerLauncher(false)
  //     }

  //     if (isReportOpen) {
  //       setIsReportOpen(false)
  //     }

  //     return
  //   }
  // })
  // useButton ensures that focus management is handled correctly,
  // across all browsers. Focus is restored to the button once the
  // dialog closes.
  let { buttonProps: openButtonProps } = useButton(
    {
      onPress: () => state.open()
    },
    openButtonRef
  )

  let { buttonProps: closeButtonProps } = useButton(
    {
      onPress: () => state.close()
    },
    closeButtonRef
  )

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
      ) : isLoading ? (
        <div>loading</div>
      ) : (
        <>
          {/* <OverlayProvider>
            <>
              <button {...openButtonProps} ref={openButtonRef}>
                Open Dialog
              </button>
              {state.isOpen && (
                <OverlayContainer>
                  <ModalDialog
                    title="Enter your name"
                    isOpen
                    onClose={state.close}
                    isDismissable
                  >
                    <form
                      style={{
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <label>
                        First Name: <input placeholder="John" />
                      </label>
                      <label>
                        Last Name: <input placeholder="Smith" />
                      </label>
                      <button
                        {...closeButtonProps}
                        ref={closeButtonRef}
                        style={{ marginTop: 10 }}
                      >
                        Submit
                      </button>
                    </form>
                  </ModalDialog>
                </OverlayContainer>
              )}
            </>
          </OverlayProvider>
 */}
          <div>
            {filterStage === 0 ? (
              <div
                ref={firstStageContainerRef}
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 16px 60px'
                }}
                className="z-50 fixed top-10 bg-white rounded-lg right-10 left-10 bottom-20 flex-col overflow-hidden overflow-y-scroll"
              >
                <div className="border-b-2 border-gray-50 mb-3">
                  {/* <div className="px-2 py-4  ml-3 mt-3">
                  <input
                    ref={firstStageInput}
                    className="outline-none text-lg "
                    placeholder="Filter by..."
                  />
                </div> */}
                </div>

                {/* // TODO scroll on */}
                <div className="filter-table flex-col overflow-x-scroll">
                  {[
                    // 'status',
                    // 'priority',
                    // 'assigne',
                    // 'subscriber',
                    // 'creator',
                    // 'estimate',
                    // 'label',
                    // 'cycle',
                    'project',
                    // 'milestone',
                    // 'relationship',
                    'team',
                    'all'
                    // 'due_date',
                    // 'auto_closed'
                  ].map(type => (
                    <div>
                      <a
                        onClick={e => {
                          if (type === 'all') {
                            setFilterStage(-1)
                            setFilterConfig({})
                            return setFilterBy(type)
                          }

                          setFilterStage(1)
                          setFilterBy(type)
                        }}
                        href="#"
                        className="filter-row flex hover:bg-gray-100 transition-all py-2 px-2 rounded-md text-gray-500 text-sm items-center mx-2"
                      >
                        <div className="filter-icon mx-2">
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z"
                            ></path>
                          </svg>
                        </div>
                        <div className="filter-content">Filter by {type}</div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : filterStage === 1 ? (
              <>
                <div className="flex z-50 fixed top-0 bg-white rounded-lg left-10 flex-col ">
                  <div className="pill flex rounded-md bg-white text-xs text-gray-400 py-1 px-2 mx-3 mt-3">
                    <div className="mr-1">{filterBy}</div>
                  </div>
                </div>

                <div
                  style={{
                    boxShadow: 'rgba(0, 0, 0, 0.2) 0px 16px 60px'
                  }}
                  className="z-40 fixed top-10 bg-white rounded-lg right-10 left-10 bottom-20 flex-col overflow-hidden overflow-y-scroll"
                >
                  {false && (
                    <div className="border-b-2 border-gray-50 mb-3">
                      <div className="px-2 py-4  ml-3 mt-3 flex items-center">
                        <a
                          href="#"
                          onClick={() => {
                            setFilterStage(0)
                          }}
                          className="bg-gray-100 w-6 h-6 rounded-full mr-2 flex items-center pl-1 text-gray-400"
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M10.25 6.75L4.75 12L10.25 17.25"
                            ></path>
                            <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M19.25 12H5"
                            ></path>
                          </svg>
                        </a>
                        <input
                          className="outline-none text-lg "
                          placeholder={`Filter by ${filterBy}`}
                        />
                      </div>
                    </div>
                  )}
                  {/* // TODO scroll on */}
                  <div className="filter-table flex-col overflow-x-scroll my-2">
                    {syncBootstrapState[
                      convertFilterByLinearType(filterBy)
                    ]?.map(({ id, name }) => (
                      <div>
                        <a
                          onClick={e => {
                            setFilterConfig({
                              key: id,
                              type: filterBy.toUpperCase()
                            })
                            setFilterStage(-1)
                          }}
                          href="#"
                          className="filter-row flex hover:bg-gray-100 transition-all py-2 px-2 rounded-md text-gray-500 text-sm items-center mx-2"
                        >
                          <div className="filter-icon mx-2">
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z"
                              ></path>
                            </svg>
                          </div>
                          <div className="filter-content">
                            View issues from {name}
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              ''
            )}

            <div className="header border-2 border-gray-100 flex items-center py-4 px-4 text-gray-600">
              <div className="flex items-center mr-2">
                <div className="header-burger-menu mr-4 items-center">
                  {/* <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
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
                 */}
                </div>
                {/* <div className="header-show">
                  {filterBy}
                  {
                    syncBootstrapState[
                      convertFilterByLinearType(
                        filterConfig.type?.toLowerCase()
                      )
                    ]?.find(x => x.id === filterConfig.key)?.name
                  }
                </div> */}
              </div>

              <Button
                ref={firstBtn}
                // onClick={_ => {
                //   alert(1)
                // }}
                prefix={<ArrowsExpandIcon />}
                text={currentView ?? 'Issues'}
                shortcut={'I'}
              />

              <Popover
                triggerRef={firstBtn}
                shortcut={'I'}
                syncBootstrapState={syncBootstrapState}
                placeholder={'View issues from...'}
                onSelectItem={e => {
                  setFilterConfig({
                    key: e.item.id,
                    type: e.item.type.toUpperCase()
                  })
                  setIsVisible(false)
                  setCurrentView(e.item.name)
                }}
              />

              <div className="flex-1"></div>

              {/* <button
                className="border-2 border-gray-100 px-1.5 py-1 rounded-lg fill-current text-gray-500 flex items-center mr-2"
                onClick={_ => alert(1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-xs">Filter</span>
              </button>
              <button
                className="mr-2 border-2 border-gray-100 px-1.5 py-1 rounded-lg fill-current text-gray-500 flex items-center "
                onClick={_ => alert(1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-xs">Group</span>
              </button>
              <button
                className="mr-2 border-2 border-gray-100 px-1.5 py-1 rounded-lg fill-current text-gray-500 flex items-center "
                onClick={_ => alert(1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                </svg>
                <span className="ml-1 text-xs">Sort</span>
              </button>
               */}

              <Button
                prefix={<PieChartIcon />}
                shortcut={'R'}
                text={'Report'}
                onClick={_ => setIsReportOpen(p => !p)}
              />

              {/* <button
                className="fill-current text-gray-500"
                onClick={e => setFilterStage(0)}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z"
                  ></path>
                </svg>
              </button>
             */}
            </div>

            <div className="relative">
              <ReportPanel
                issues={issues}
                isReportOpen={isReportOpen}
                setIsReportOpen={setIsReportOpen}
              />

              <div className="task-list text-gray-700 ">
                <FList
                  itemCount={issues.length}
                  itemData={{
                    issues,
                    hoveredRowIndex,
                    setHoveredRowIndex,
                    toggleItemActive,
                    toggleItemActive: i => {
                      setSelectedTask(issues[i])
                      if (!showTimeTrackerLauncher)
                        setShowTimeTrackerLauncher(true)
                      inputRef?.current?.focus()
                    }
                  }}
                  itemSize={40}
                  height={height - 90 ?? 100}
                  width={width ?? 100}
                  ref={ref}
                >
                  {Row}
                </FList>
              </div>
            </div>

            <TrackTimeLauncher
              inputRef={inputRef}
              selectedTask={selectedTask}
              inputValue={inputValue}
              setInputValue={setInputValue}
              showTimeTrackerLauncher={showTimeTrackerLauncher}
              setShowTimeTrackerLauncher={setShowTimeTrackerLauncher}
            />
          </div>
        </>
      )}
    </Fragment>
  )
}

const PieChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-3.5 w-3.5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
)

const TrackTimeLauncher = ({
  inputRef,
  selectedTask,
  inputValue,
  setInputValue,
  showTimeTrackerLauncher,
  setShowTimeTrackerLauncher
}) => {
  //log(selectedTask)

  // const handlers = {
  //   close: () => {
  //     log(1111)
  //   }
  // }

  // return (
  //   <HotKeys keyMap={{ close: 'esc' }} handlers={handlers}>
  //     <div>hello</div>
  //   </HotKeys>
  // )

  useHotkeys(
    'esc',
    () => {
      if (showTimeTrackerLauncher) setShowTimeTrackerLauncher(false)
    },
    { enableOnTags: ['INPUT'] }
  )
  return showTimeTrackerLauncher ? (
    <div
      className="max-w-xs py-3 outline-none bg-white shadow-2xl border-2 border-gray-50 flex-col"
      style={{
        left: '50%',
        bottom: '20px',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        color: '#eee',
        borderRadius: '8px',
        minWidth: '320px'
        //display: showPopper ? 'flex' : 'none'
      }}
    >
      {selectedTask?.title && (
        <div className="flex mb-2">
          <div
            // style={{
            //   overflow: 'hidden',
            //   lineHeight: 'normal',
            //   textAlign: 'left',
            //   whiteSpace: 'nowrap',
            //   overflow: 'hidden',
            //   textOverflow: 'ellipsis',
            //   color: 'rgb(40, 42, 48)',
            //   fontWeight: 500,
            //   fontSize: '13px',
            //   flexShrink: 1,
            //   maxWidth: '251px'
            // }}
            className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-gray-400 px-2 py-1 mx-4 bg-gray-100 rounded"
          >
            {selectedTask.title}
          </div>
          <div className="flex-1"></div>
        </div>
      )}
      <input
        // onFocus={_ => setTrackTimeLauncherFocus(true)}
        // onBlur={_ => setTrackTimeLauncherFocus(false)}
        autoFocus
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        // defaultValue={
        //   selectedTask.duration
        //     ? juration().humanize(selectedTask.duration)
        //     : ''
        // }
        className="outline-none bg-white text-md text-gray-600 w-full px-4 py-0"
        placeholder="Track time e.g 1h 10m"
        //placeholder="Time taken. e.g 1h 20m"
      />
    </div>
  ) : (
    ''
  )
}

const ArrowsExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    //class="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      //stroke="#374151"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 8V4m0 0h4M3 4l4 4m8 0V4m0 0h-4m4 0l-4 4m-8 4v4m0 0h4m-4 0l4-4m8 4l-4-4m4 4v-4m0 4h-4"
    />
  </svg>
)

const Button = forwardRef(({ onClick, text, shortcut, prefix }, ref) => (
  <button
    ref={ref}
    className="flex items-center text-gray-500 text-xs flex rounded-lg border-2 border-gray-100 px-1.5 py-1 focus:outline-none"
    onClick={onClick}
  >
    <span className="w-3.5 h-3.5 text-gray-500 stroke-current">{prefix}</span>
    <span
      style={{ maxWidth: '75px' }}
      className="mx-1.5 overflow-hidden whitespace-nowrap overflow-ellipsis"
    >
      {text}
    </span>
    <span
      style={{ fontSize: '10px' }}
      className="bg-gray-100 rounded px-1.5 py-.5 text-gray-500"
    >
      {shortcut}
    </span>
  </button>
))

const ReportPanel = ({ isReportOpen, setIsReportOpen, issues }) => {
  const [total, setTotal] = useState('0')
  const styles = useSpring({
    config: { mass: 1, tension: 1400, friction: 70 },
    opacity: isReportOpen ? 1 : 0
  })

  useEffect(() => {
    let total = issues?.reduce((a, i) => {
      if (i.duration) {
        a += i.duration
      }
      return a
    }, 0)
    total && setTotal(juration().humanize(total))
  }, [issues])

  useHotkeys('r', ({}) => {
    setIsReportOpen(p => !p)
  })
  return (
    <div>
      {isReportOpen && (
        <div className="z-50 absolute top-0 left-20 bottom-0 right-0 bg-gray-100 p-7 text-sm text-gray-500">
          <span className="mr-7">Total</span>
          <span>{total}</span>
        </div>
      )}
    </div>
  )
}

function generateGetBoundingClientRect(x = 0, y = 0) {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x
  })
}

const virtualElement = {
  getBoundingClientRect: generateGetBoundingClientRect()
}

const SubHeader = ({ syncBootstrapState, setIssues }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [teamName, setTeamName] = useState(null)

  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState(null)

  const handleClick = ({ id, name }) => {
    setTeamName(name)
    setIssues(() => syncBootstrapState.Issue.filter(x => x.teamId === id))
    setIsOpen(false)
    setProjectName(null)
    setTeamSearchValue(null)
    setTeams(syncBootstrapState.Team)
  }

  const handleProjectClick = ({ id, name }) => {
    setProjectName(name)
    setIssues(() => syncBootstrapState.Issue.filter(x => x.projectId === id))
    setIsProjectOpen(false)
    setTeamName(null)
  }

  const [projectReferenceElement, setProjectReferenceElement] = useState(null)
  const [projectPopperElement, setProjectPopperElement] = useState(null)
  const { styles: projectStyles, attributes: projectAttributes } = usePopper(
    projectReferenceElement,
    projectPopperElement,
    {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            // TODO: positions towards the bottom should have -140
            offset: [0, 5]
          }
        }
      ]
    }
  )

  // Esc to close dialog
  // Enter to search top result
  useEventListener('keyup', ({ key }) => {
    console.log(key)
    let isSearching = teamSearchValue != null
    if (isSearching && key === 'Enter' && teams.length) {
      handleClick(teams[0])
    } else if (isSearching && key === 'Escape') {
      setIsOpen(false)
    }
  })

  // Clickoutside close
  useEventListener('click', ({ target }) => {
    //if (target.contains(referenceElement.current)) return
    //if (!target?.contains(popperElement?.current)) return setIsOpen(false)
  })

  const [teamSearchValue, setTeamSearchValue] = useState(null)
  const [teams, setTeams] = useState()
  useEffect(() => {
    if (!teamSearchValue) return setTeams(syncBootstrapState.Team)
    setTeams(
      syncBootstrapState.Team.filter(x =>
        x?.name?.toLowerCase().includes(teamSearchValue?.trim()?.toLowerCase())
      )
    )
  }, [teamSearchValue])

  useEffect(() => {
    setTeams(syncBootstrapState.Team)
  }, [])

  return (
    <>
      <div className="flex border-b-2 border-gray-50 px-5 py-2">
        <button
          ref={setReferenceElement}
          onClick={() => {
            setIsOpen(p => !p)
            setIsProjectOpen(false)
          }}
          className="flex items-center border-gray-100 border-2  px-2 py-1 rounded-md flex-shrink-0"
        >
          <div className="mr-2">{teamName ?? 'Teams'}</div>
          <svg width="13" height="9" viewBox="0 0 13 9" fill="currentcolor">
            <path
              d="M10.1611 0.314094L5.99463 4.48054L1.82819 0.314094C1.4094 -0.104698 0.732886 -0.104698 0.314094 0.314094C-0.104698 0.732886 -0.104698 1.4094 0.314094 1.82819L5.24295 6.75705C5.66175 7.17584 6.33825 7.17584 6.75705 6.75705L11.6859 1.82819C12.1047 1.4094 12.1047 0.732886 11.6859 0.314094C11.2671 -0.0939598 10.5799 -0.104698 10.1611 0.314094Z"
              transform="translate(0.77832 0.998535)"
            ></path>
          </svg>
        </button>

        <button
          ref={setProjectReferenceElement}
          onClick={() => {
            setIsProjectOpen(p => !p)
            setIsOpen(false)
          }}
          className="flex items-center border-gray-100 border-2  px-2 py-1 rounded-md flex-shrink-0"
        >
          <div className="mr-2">{projectName ?? 'Projects'}</div>
          <svg width="13" height="9" viewBox="0 0 13 9" fill="currentcolor">
            <path
              d="M10.1611 0.314094L5.99463 4.48054L1.82819 0.314094C1.4094 -0.104698 0.732886 -0.104698 0.314094 0.314094C-0.104698 0.732886 -0.104698 1.4094 0.314094 1.82819L5.24295 6.75705C5.66175 7.17584 6.33825 7.17584 6.75705 6.75705L11.6859 1.82819C12.1047 1.4094 12.1047 0.732886 11.6859 0.314094C11.2671 -0.0939598 10.5799 -0.104698 10.1611 0.314094Z"
              transform="translate(0.77832 0.998535)"
            ></path>
          </svg>
        </button>

        <div className="flex-1"></div>
      </div>

      {isOpen && (
        <ul
          className="text-sm z-50 border-2 rounded-md border-gray-100 py-0.5 bg-white"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <li>
            <input
              autoFocus
              placeholder="Search a team"
              value={teamSearchValue}
              className="px-4 py-1 outline-none border-b-2 border-gray-50"
              onChange={({ target: { value } }) => {
                setTeamSearchValue(value)
              }}
            />
          </li>
          {teams.map(({ name, id }) => (
            <li
              onClick={() => handleClick({ id, name })}
              className="flex items-center px-5 py-1 hover:bg-gray-100 transition-all "
            >
              <div className="mr-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#6B6F76">
                  <path d="M1 3C1 1.89543 1.89543 1 3 1H9C10.1046 1 11 1.89543 11 3V3.5H6C4.61929 3.5 3.5 4.61929 3.5 6V11H3C1.89543 11 1 10.1046 1 9V3Z"></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7 5C5.89543 5 5 5.89543 5 7V13C5 14.1046 5.89543 15 7 15H13C14.1046 15 15 14.1046 15 13V7C15 5.89543 14.1046 5 13 5H7ZM10 10C10.9665 10 11.5 9.2165 11.5 8.25C11.5 7.2835 10.9665 6.5 10 6.5C9.0335 6.5 8.5 7.2835 8.5 8.25C8.5 9.2165 9.0335 10 10 10ZM7 12.5616C7 11.5144 7.9841 10.746 9 11C9.47572 11.7136 10.5243 11.7136 11 11C12.0159 10.746 13 11.5144 13 12.5616V13.0101C13 13.2806 12.7806 13.5 12.5101 13.5H7.48995C7.21936 13.5 7 13.2806 7 13.0101V12.5616Z"
                  ></path>
                </svg>
              </div>
              <div>{name}</div>
            </li>
          ))}
        </ul>
      )}

      {isProjectOpen && (
        <ul
          className="text-sm z-50 border-2 rounded-md border-gray-100 py-0.5 bg-white"
          ref={setProjectPopperElement}
          style={projectStyles.popper}
          {...projectAttributes.popper}
        >
          {syncBootstrapState.Project.map(({ name, id }) => (
            <li
              onClick={() => handleProjectClick({ id, name })}
              className="flex items-center px-5 py-1 hover:bg-gray-100 transition-all"
            >
              <div className="mr-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#6B6F76">
                  <path d="M1 3C1 1.89543 1.89543 1 3 1H9C10.1046 1 11 1.89543 11 3V3.5H6C4.61929 3.5 3.5 4.61929 3.5 6V11H3C1.89543 11 1 10.1046 1 9V3Z"></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7 5C5.89543 5 5 5.89543 5 7V13C5 14.1046 5.89543 15 7 15H13C14.1046 15 15 14.1046 15 13V7C15 5.89543 14.1046 5 13 5H7ZM10 10C10.9665 10 11.5 9.2165 11.5 8.25C11.5 7.2835 10.9665 6.5 10 6.5C9.0335 6.5 8.5 7.2835 8.5 8.25C8.5 9.2165 9.0335 10 10 10ZM7 12.5616C7 11.5144 7.9841 10.746 9 11C9.47572 11.7136 10.5243 11.7136 11 11C12.0159 10.746 13 11.5144 13 12.5616V13.0101C13 13.2806 12.7806 13.5 12.5101 13.5H7.48995C7.21936 13.5 7 13.2806 7 13.0101V12.5616Z"
                  ></path>
                </svg>
              </div>
              <div>{name}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const Row = memo(({ data, index, style }) => {
  // Data passed to List as "itemData" is available as props.data
  const { issues, toggleItemActive, setHoveredRowIndex, hoveredRowIndex } = data
  const item = issues[index]
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
          duration == null ? 'rounded-full bg-yellow-400' : ''
        } mr-3`}
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

const Popover = ({
  placeholder,
  shortcut,
  onSelectItem,
  syncBootstrapState,
  triggerRef
}) => {
  // TODO: why does it render so many times?
  //log('Popover: render')

  // State
  const [query, setQuery] = useState('')
  const [viewProps, setViewProps] = useState()
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [pending, setPending] = useState(true)
  const [position, setPosition] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [hoverIndex, setHoverIndex] = useState(0)
  const [popper, setPopper] = useState()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const ref = useRef(null)
  const inputRef = useRef()
  const lsRef = useRef()

  // Effects
  useEffect(() => {
    if (!query) return setViewProps(items)
  }, [query])
  useEffect(() => {
    setHoverIndex(0)
  }, [query])
  useEffect(() => {
    setViewProps(items)
  }, [items])
  useEffect(() => {
    const click = () => {
      setIsVisible(true)
      setPending(false)
      ref.current.focus()
      setItems([
        { type: 'header', name: 'Project' },
        ...syncBootstrapState.Project.map(x => ({
          ...x,
          type: 'Project'
        })),
        { type: 'header', name: 'Team' },
        ...syncBootstrapState.Team.map(x => ({
          ...x,
          type: 'Team'
        }))
      ])
    }
    triggerRef.current.addEventListener('click', click)
    return () => triggerRef.current.removeEventListener('click', click)
  }, [triggerRef])
  useEffect(() => {
    setPosition(triggerRef.current.getBoundingClientRect())
  }, [triggerRef])
  useEffect(() => {
    ref?.current?.blur()
  }, [ref])
  useEffect(() => {
    setLoading(false)
  }, [])

  // Shortcuts
  useHotkeys('i', () => {
    setIsVisible(true)
    setPending(true)
    ref.current.focus()
    setItems([
      { type: 'header', name: 'Project' },
      ...syncBootstrapState.Project.map(x => ({
        ...x,
        type: 'Project'
      })),
      { type: 'header', name: 'Team' },
      ...syncBootstrapState.Team.map(x => ({
        ...x,
        type: 'Team'
      }))
    ])
  })
  useHotkeys(
    'esc',
    () => {
      if (pending) return
      ref.current.blur()
      setQuery('')
      setIsVisible(false)
      setPending(true)
    },
    { enableOnTags: ['INPUT'] }
  )
  useHotkeys(
    'enter',
    () => {
      if (pending) return
      ref.current.blur()
      setQuery('')
      setIsVisible(false)
      setPending(true)
      onSelectItem({
        hoverIndex,
        item: viewProps[hoverIndex]
      })
    },
    { enableOnTags: ['INPUT'] }
  )

  // Up/Down
  useEventListener('keydown', e => {
    if (e.code === 'ArrowDown' && isVisible && viewProps.length) {
      if (hoverIndex >= viewProps.length - 1) return
      lsRef.current.scrollToItem(hoverIndex + 1)
      setHoverIndex(p => p + 1)
      return
    }
    // TODO: up moves cursor position in input left
    if (e.code === 'ArrowUp' && isVisible && viewProps.length) {
      if (hoverIndex === 0) return
      lsRef.current.scrollToItem(hoverIndex - 1)
      setHoverIndex(p => p - 1)
      return
    }
  })

  // Animation
  const styles = useSpring({
    config: { mass: 1, tension: 1400, friction: 70 },
    opacity: isVisible ? 1 : 0
  })

  // Positioning
  useEffect(() => {
    if (!position) return
    if (!popper) return
    //log('Popper: mount')
    const virtualElement = {
      getBoundingClientRect: () => position
    }
    let instance = createPopper(virtualElement, popper, {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'offset',
          options: {
            // TODO: positions towards the bottom should have -140
            offset: [0, 5]
          }
        }
      ]
    })
    return () => {
      //log('Popper: unmount')
      instance.destroy()
    }
  }, [position, popper])

  if (loading) return ''

  return (
    <>
      <animated.div style={{ ...styles, zIndex: '50' }}>
        {isVisible && (
          <div
            className="fixed left-0 top-0 bottom-0 right-0"
            onClick={({ target }) => {
              if (target.contains(popper)) setIsVisible(false)
            }}
          >
            <div
              ref={x => setPopper(x)}
              className="z-50 bg-white border-2 border-gray-100 rounded-lg py-1 text-gray-700"
            >
              <div className="flex items-center">
                <input
                  type="text"
                  onFocus={_ => {
                    log('FOCUS')
                  }}
                  onBlur={_ => {
                    log('BLUR')
                  }}
                  value={query}
                  className="outline-none border-b-2 border-gray-100 w-full mb-0 py-2 px-4 text-sm"
                  placeholder={placeholder}
                  ref={ref}
                  onChange={e => {
                    log('CHANGE', pending)
                    if (pending) {
                      setPending(false)
                    } else {
                      setQuery(e.target.value)

                      setViewProps(_ =>
                        items.filter(x =>
                          x?.name
                            ?.toLowerCase()
                            .includes(e.target.value?.toLowerCase())
                        )
                      )
                    }
                  }}
                />

                <div
                  style={{
                    fontSize: '11px'
                  }}
                  className="absolute right-4 bg-gray-100 text-gray-500 rounded px-2 py-0.5"
                >
                  {shortcut}
                </div>
              </div>
              <div>
                <VList
                  ref={lsRef}
                  className="py-0"
                  width={250}
                  height={230}
                  itemCount={viewProps?.length}
                  itemSize={index => (viewProps[index].header ? 30 : 40)}
                  itemData={viewProps}
                >
                  {e => {
                    let { data, index, style, key } = e
                    //log('POPOVER: List render')
                    let item = viewProps[index]
                    let isHovered = hoverIndex === index
                    let isSelected = selectedIndex === item.id
                    if (item.type === 'header')
                      return (
                        <div
                          style={{
                            ...style
                          }}
                          className={`text-xs text-gray-400 flex items-center px-4`}
                        >
                          {item.name}
                        </div>
                      )

                    return (
                      <div
                        onClick={() => {
                          onSelectItem({
                            hoverIndex,
                            item: viewProps[hoverIndex]
                          })
                          setSelectedIndex(item.id)
                        }}
                        onMouseEnter={() => setHoverIndex(index)}
                        className={`text-sm ${
                          isHovered ? 'text-gray-800' : 'text-gray-600'
                        } flex items-center px-4`}
                        key={index}
                        style={{
                          ...style,
                          background: `${isHovered ? '#f8f9fb' : ''} `
                        }}
                      >
                        <div
                          className={`fill-current ${
                            isHovered ? 'text-gray-700' : 'text-gray-500'
                          } mr-4`}
                        >
                          <svg width="16" height="16" viewBox="-1 -1 15 15">
                            <path d="M10.5714 7C10.5714 8.97245 8.97245 10.5714 7 10.5714L6.99975 3.42857C8.9722 3.42857 10.5714 5.02755 10.5714 7Z"></path>
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M7 12.5C10.0376 12.5 12.5 10.0376 12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C3.96243 1.5 1.5 3.96243 1.5 7C1.5 10.0376 3.96243 12.5 7 12.5ZM7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14Z"
                            ></path>
                          </svg>
                        </div>
                        <div>{item.name}</div>
                        <div className="flex-1"></div>
                        {isSelected && (
                          <div className="fill-current text-gray-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-3.5 w-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                        )}

                        {item.shortcut?.split('').map((x, i) => (
                          <div
                            className={`${
                              i === item.shortcut.split('').length - 1
                                ? ''
                                : 'mr-1'
                            } text-xs text-gray-500 bg-gray-100 rounded px-1 py-0.5`}
                          >
                            {x}
                          </div>
                        ))}
                      </div>
                    )
                  }}
                </VList>
              </div>
            </div>
          </div>
        )}
      </animated.div>
    </>
  )
}

export default Home
