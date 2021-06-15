import React, {
  useState,
  useEffect,
  createContext,
  useContext,
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
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { styled } from '@stitches/react'
import { VariableSizeList as List } from 'react-window'
import { FocusOn } from 'react-focus-on'
import { GlobalHotKeys, HotKeys, configure } from 'react-hotkeys'

import loadConfig from 'next/dist/next-server/server/config'
const str = d => JSON.stringify(d)
const log = console.log
const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
const supabase = createClient(supabaseUrl, supabaseKey)

configure({ ignoreTags: ['select', 'textarea'] })

const MenuContext = createContext('menu')

const StyledCheckbox = styled(Checkbox.Root, {
  appearance: 'none',
  backgroundColor: 'transparent',
  border: 'none',
  padding: 0,
  boxShadow: 'inset 0 0 0 2px #4EA7FC',
  width: 17,
  height: 17,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',

  '&:focus': {
    outline: 'none'
    //boxShadow: "inset 0 0 0 1px dodgerblue, 0 0 0 1px dodgerblue"
  },

  "&[data-state='checked']": {
    backgroundColor: '#4EA7FC'
  }
})

// const data = [
//   { type: 'header', text: 'Status', height: 20 },
//   { type: 'row', text: 'Done', count: '200', checked: false },
//   { type: 'row', text: 'In Progress', count: '200', checked: false },
//   { type: 'row', text: 'Backlog', count: '200', checked: false },
//   { type: 'row', text: 'Cancelled', count: '200', checked: false },
//   { type: 'header', text: 'Project', height: 20 },
//   { type: 'row', text: 'Ankor', count: '200', checked: false },
//   { type: 'row', text: 'Worlds', count: '200', checked: false },
//   { type: 'row', text: 'Inspyr', count: '200', checked: false },
//   { type: 'row', text: 'Vasai', count: '200', checked: false },
//   { type: 'header', text: 'Team', height: 20 },
//   { type: 'row', text: 'Engineering', count: '200', checked: false },
//   { type: 'row', text: 'Design', count: '200', checked: false },
//   { type: 'row', text: 'Production', count: '200', checked: false },
//   { type: 'row', text: 'Marketing', count: '200', checked: false }
// ]

function Filter({ syncBootstrapState, setIssues }) {
  const [open, setOpen] = useState(false)
  const [hoverRowIndex, setHoverRowIndex] = useState(1)
  const inputRef = useRef()
  const listRef = useRef()
  const menuContentRef = useRef()
  const [items, setItems] = useState([
    { type: 'header', name: 'Quick links' },
    { type: 'Unlogged', name: 'Unlogged issues' },
    { type: 'header', name: 'Project' },
    ...syncBootstrapState.Project.map(y => ({ ...y, type: 'Project' })),
    { type: 'header', name: 'Team' },
    ...syncBootstrapState.Team.map(y => ({ ...y, type: 'Team' }))
  ])

  //setIssues(p => p.filter(x => x.duration == null))
  return (
    <>
      <Button shortcut={'F'} text={'Filter'} onClick={_ => setOpen(p => !p)} />

      <MenuContext.Provider
        value={{
          items,
          setItems,
          open,
          setOpen,
          menuContentRef,
          hoverRowIndex,
          setHoverRowIndex,
          listRef
        }}
      >
        <GlobalHotKeys
          keyMap={{
            open: 'f'
          }}
          handlers={{
            open: () => {
              if (document?.activeElement === inputRef?.current) return
              setOpen(p => !p)
            }
          }}
        >
          {open && (
            <div
              tabindex="0"
              className="z-50 flex px-2 py-2 flex-col bg-gray-50 rounded-xl border-2 border-gray-100"
              style={{
                //...style,
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '400px',
                transform: 'translate(-50%,-50%)'
              }}
            >
              <MenuInput placeholder={'Filter by'} />
              <ul ref={menuContentRef}>
                <List
                  ref={listRef}
                  itemData={{
                    items,
                    hoverRowIndex
                  }}
                  height={250}
                  itemCount={items.length}
                  itemSize={index => (items[index].type === 'header' ? 30 : 40)}
                  // TODO: figure out width of modal
                  width={380}
                >
                  {({ index, style, data }) => {
                    const { items, hoverRowIndex } = data
                    const type = items[index].type
                    const text = items[index].name
                    const isHovered = index === hoverRowIndex
                    const checked = items[index].checked
                    if (type === 'header') {
                      return <MenuItemTitle style={style}>{text}</MenuItemTitle>
                    }

                    //log("render");

                    return (
                      <MenuItem
                        setIssues={setIssues}
                        index={index}
                        checked={checked}
                        syncBootstrapState={syncBootstrapState}
                        onMouseEnter={_ => {
                          log('MOUSE ENTER CHANGE')
                          setHoverRowIndex(index)
                        }}
                        onClick={_ => console.log(index)}
                        text={text}
                        count={index}
                        style={{
                          ...style,
                          backgroundColor: `${isHovered ? '#eee' : ''}`
                        }}
                      >
                        Row {index}
                      </MenuItem>
                    )
                  }}
                </List>
              </ul>
            </div>
          )}
        </GlobalHotKeys>
      </MenuContext.Provider>
    </>
  )
}

const MenuInput = forwardRef(({ placeholder }) => {
  const {
    items,
    setItems,
    setOpen,
    menuContentRef,
    setHoverRowIndex,
    hoverRowIndex,
    listRef,
    inputRef
  } = useContext(MenuContext)

  const [lastCheckedRowIndex, setLastCheckedRowIndex] = useState(hoverRowIndex)

  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  return (
    <FocusOn
      shards={[menuContentRef]}
      onEscapeKey={() => {
        setOpen(false)
        setItems(items)
        log('ESCAPE CHANGE')
        setHoverRowIndex && setHoverRowIndex(1)
      }}
      onClickOutside={_ => {
        log('click outside')
        setOpen(false)
      }}
    >
      <HotKeys
        keyMap={{
          multiSelectDown: 'shift+down',
          multiSelectUp: 'shift+up',
          select: 'enter',
          down: 'down',
          up: 'up'
        }}
        handlers={{
          // TODO: holding down Down key should keep moving the hoverRowIndex down
          up: () => {
            setHoverRowIndex(p => {
              let index = p - 1

              // HACK: Stay in bounds
              log(index)
              if (index <= 1) {
                listRef.current.scrollToItem(1)
                return 1
              }

              // Skip headers
              if (items[index]?.type === 'header') {
                index = index - 1
              }
              listRef.current.scrollToItem(index)
              return index
            })
          },
          down: () => {
            setHoverRowIndex(p => {
              let index = p + 1

              // HACK: Stay in bounds
              if (index >= items.length) {
                listRef.current.scrollToItem(items.length - 1)
                return items.length - 1
              }

              // Skip headers
              if (items[index]?.type === 'header') {
                index = index + 1
              }
              listRef.current.scrollToItem(index)
              return index
            })
          },
          select: _ => log('SELECT', hoverRowIndex),
          multiSelectUp: () => {
            return
            log('up')
            // Get the latest state value from an event handlers
            // https://stackoverflow.com/a/60316873
            setLastCheckedRowIndex(p => {
              let index = p
              if (items[index]?.type === 'header') {
                index = index - 1
              }
              setItems(i => {
                const temp = i.concat()
                if (temp[index]) {
                  temp[index].checked = false
                }
                return temp
              })
              listRef.current.scrollToItem(index - 1)
              return index - 1
            })
          },
          multiSelectDown: () => {
            return
            // Get the latest state value from an event handlers
            // https://stackoverflow.com/a/60316873
            setLastCheckedRowIndex(p => {
              let index = p
              if (items[index]?.type === 'header') {
                index = index + 1
              }
              setItems(i => {
                const temp = i.concat()
                if (temp[index]) {
                  temp[index].checked = true
                }
                return temp
              })
              listRef.current.scrollToItem(index)
              return index + 1
            })
          }
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => {
            const { value } = e.target
            if (loading) {
              return setLoading(false)
            }
            log('INPUT CHANGE')
            setHoverRowIndex && setHoverRowIndex(1)
            setQuery(value)
            setItems(
              items.filter(x => {
                if (x.type === 'header') return x
                return x.name.toLowerCase().includes(value.toLowerCase())
              })
            )
          }}
          class="w-full flex bg-gray-50 p-1 outline-none focus:outline-none px-3 py-2 border-b-2 border-gray-100"
          placeholder={placeholder}
        />
      </HotKeys>
    </FocusOn>
  )
})

const MenuItemTitle = ({ style, children }) => (
  <span style={{ ...style }} class="text-xs px-2 mt-3 text-gray-400">
    {children}
  </span>
)

//TODO: don't scroll-x
const MenuItem = ({
  onClick,
  style,
  text,
  count,
  checked = false,
  index,
  setIssues,
  syncBootstrapState,
  ...rest
}) => {
  //const [checked, setChecked] = useState(false);
  const { setItems, hoverRowIndex } = useContext(MenuContext)

  return (
    <li
      data-is-hovered={index === hoverRowIndex}
      data-index={index}
      {...rest}
      onClick={onClick}
      style={{ ...style }}
      className="text-gray-600 px-2  flex items-center rounded-lg  transition-all"
    >
      <span class="mr-2">
        <StyledCheckbox
          onCheckedChange={c =>
            setItems(p => {
              //log(c.target.checked)
              const temp = p.concat()
              //log(temp[index])
              temp[index].checked = c.target.checked
              const checked = temp.filter(x => x.checked)

              let completedIssues = getCompletedIssues(syncBootstrapState)
              if (completedIssues) {
                completedIssues = _.uniqBy(completedIssues, 'id')
              }

              const filtered = checked.reduce((acc, item) => {
                acc.push(
                  ...filter(
                    item.type.toUpperCase(),
                    item.id,
                    completedIssues
                    //syncBootstrapState.Issue
                  )
                )
                return acc
              }, [])

              setIssues(filtered)
              return temp
            })
          }
          defaultChecked={false}
          checked={checked}
        >
          <Checkbox.Indicator as={CheckIcon} />
        </StyledCheckbox>
      </span>
      <span class="mr-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.95771 5.65304L8.54114 5.46826C8.56107 5.31564 8.57143 5.15939 8.57143 5C8.57143 4.84061 8.56107 4.68436 8.54114 4.53174L9.95771 4.34695C9.98564 4.56069 10 4.77866 10 5C10 5.22134 9.98564 5.43931 9.95771 5.65304ZM9.62057 3.08606C9.452 2.67957 9.23136 2.30014 8.967 1.95608L7.83429 2.82654C8.02343 3.07275 8.18093 3.34371 8.301 3.63328L9.62057 3.08606ZM8.04393 1.033L7.17343 2.16574C6.92725 1.97654 6.65629 1.81909 6.36672 1.69901L6.91394 0.379402C7.32043 0.547966 7.69986 0.768607 8.04393 1.033ZM5.65304 0.0422614L5.46826 1.45884C5.31564 1.43892 5.15939 1.42857 5 1.42857C4.84061 1.42857 4.68436 1.43892 4.53174 1.45884L4.34696 0.0422614C4.56069 0.0143816 4.77866 0 5 0C5.22134 0 5.43931 0.0143816 5.65304 0.0422614ZM3.08606 0.379403L3.63328 1.69901C3.34371 1.81909 3.07275 1.97654 2.82654 2.16574L1.95608 1.033C2.30014 0.768607 2.67957 0.547966 3.08606 0.379403ZM1.033 1.95608L2.16574 2.82654C1.97654 3.07275 1.81909 3.34371 1.69901 3.63328L0.379403 3.08606C0.547966 2.67957 0.768607 2.30014 1.033 1.95608ZM0.0422614 4.34696C0.0143816 4.56069 0 4.77866 0 5C0 5.22134 0.0143816 5.43931 0.0422614 5.65304L1.45884 5.46826C1.43892 5.31564 1.42857 5.15939 1.42857 5C1.42857 4.84061 1.43892 4.68436 1.45884 4.53174L0.0422614 4.34696ZM0.379403 6.91394L1.69901 6.36672C1.81909 6.65629 1.97654 6.92725 2.16574 7.17343L1.033 8.04393C0.768607 7.69986 0.547966 7.32043 0.379403 6.91394ZM1.95608 8.967L2.82654 7.83429C3.07275 8.02343 3.34371 8.18093 3.63328 8.301L3.08606 9.62057C2.67957 9.452 2.30014 9.23136 1.95608 8.967ZM4.34696 9.95771L4.53174 8.54114C4.68436 8.56107 4.84061 8.57143 5 8.57143C5.15939 8.57143 5.31564 8.56107 5.46826 8.54114L5.65305 9.95771C5.43931 9.98564 5.22134 10 5 10C4.77866 10 4.56069 9.98564 4.34696 9.95771ZM6.91394 9.62057L6.36672 8.301C6.65629 8.18093 6.92725 8.02343 7.17343 7.83429L8.04393 8.967C7.69986 9.23136 7.32043 9.452 6.91394 9.62057ZM8.967 8.04393L7.83429 7.17343C8.02343 6.92725 8.18093 6.65629 8.301 6.36672L9.62057 6.91394C9.452 7.32043 9.23143 7.69986 8.967 8.04393Z"
            fill="#BEC2C8"
          />
        </svg>
      </span>
      <span class="text-gray-600">
        {text} {count && <span class="text-gray-300">- {count}</span>}
      </span>
    </li>
  )
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

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
    case 'UNLOGGED':
      results = d.filter(p => p.duration == null)
      break
    case 'ALL':
      return d.sort(byCompleted).reverse()
    default:
      return d.sort(byCompleted).reverse()
  }

  // if (filterByUnlogged) {
  //   return results
  //     .filter(x => x.duration == null)
  //     .sort(byCompleted)
  //     .reverse()
  // }
  return results.sort(byCompleted).reverse()
}

const byCompleted = (a, b) => {
  return a.completedAt < b.completedAt
    ? -1
    : a.completedAt > b.completedAt
    ? 1
    : 0
}

const getCompletedIssues = syncBootstrapState => {
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
  const [isVisible, setIsVisible] = useState(false)
  const [items, setItems] = useState([])
  const [currentView, setCurrentView] = useState(null)
  let state = useOverlayTriggerState({})
  const [showTimeTrackerLauncher, setShowTimeTrackerLauncher] = useState(false)

  let openButtonRef = React.useRef()
  let closeButtonRef = React.useRef()

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

  const handleIssueStateChange = () => {
    let completedIssues = getCompletedIssues(syncBootstrapState)
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
        // if (!inputValue) return
        // log('sdffdssffssf')
        // setShowPopper(false)
        // setIssues(prev => {
        //   const temp = [...prev]
        //   temp[hoveredRowIndex].duration = juration().parse(inputValue)
        //   return temp
        // })
        // setInputValue('')
        // logIssue(issues[hoveredRowIndex]).then(console.log)
        // //setShowTimeTrackerLauncher(false)
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
          <div>
            {filterStage === 0 ? (
              <div
                ref={firstStageContainerRef}
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 16px 60px'
                }}
                className="z-50 fixed top-10 bg-white rounded-lg right-10 left-10 bottom-20 flex-col overflow-hidden overflow-y-scroll"
              >
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

              <Filter
                setIssues={setIssues}
                syncBootstrapState={syncBootstrapState}
              />

              <Button
                prefix={<PieChartIcon />}
                shortcut={'R'}
                text={'Report'}
                onClick={_ => setIsReportOpen(p => !p)}
              />
            </div>

            <div className="relative">
              <ReportPanel
                issues={issues}
                isReportOpen={isReportOpen}
                setIsReportOpen={setIsReportOpen}
              />

              <MainIssueWindow
                issues={issues}
                hoveredRowIndex={hoveredRowIndex}
                setHoveredRowIndex={setHoveredRowIndex}
                showTimeTrackerLauncher={showTimeTrackerLauncher}
                setShowTimeTrackerLauncher={setShowTimeTrackerLauncher}
                inputRef={inputRef}
                setSelectedTask={setSelectedTask}
              />
            </div>

            <TrackTimeLauncher
              issues={issues}
              setIssues={setIssues}
              filterByUnlogged={filterByUnlogged}
              inputRef={inputRef}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
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

const MainIssueWindow = ({
  issues,
  hoveredRowIndex,
  setHoveredRowIndex,
  showTimeTrackerLauncher,
  setShowTimeTrackerLauncher,
  inputRef,
  setSelectedTask
}) => {
  const [height, setHeight] = useState(null)
  const [width, setWidth] = useState(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState(null)

  const [isChangingDirectionWithKeys, setIsChangingDirectionWithKeys] =
    useState()
  const ref = React.useRef()

  useEffect(() => {
    if (window) {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
    }
  }, [])

  useHotkeys(
    'up, k',
    () => {
      setIsChangingDirectionWithKeys(true)
      let direction = hoveredRowIndex - 1
      ref.current.scrollToItem(direction)
      setHoveredRowIndex(direction)
      setSelectedRowIndex(direction)
    },
    { enableOnTags: ['INPUT'] },
    [hoveredRowIndex]
  )
  useHotkeys(
    'down, j',
    () => {
      setIsChangingDirectionWithKeys(true)
      let direction = hoveredRowIndex + 1
      ref.current.scrollToItem(direction)
      setHoveredRowIndex(direction)
      setSelectedRowIndex(direction)
    },
    { enableOnTags: ['INPUT'] },
    [hoveredRowIndex]
  )

  return (
    <div
      onMouseOver={_ => setIsChangingDirectionWithKeys(false)}
      className="task-list text-gray-700"
    >
      <FList
        itemCount={issues.length}
        itemData={{
          issues,
          hoveredRowIndex,
          setHoveredRowIndex,
          isChangingDirectionWithKeys,
          selectedRowIndex,
          toggleItemActive: i => {
            setSelectedRowIndex(i)
            // TODO: use selectedRowIndex instead
            setSelectedTask(issues[i])
            if (!showTimeTrackerLauncher) setShowTimeTrackerLauncher(true)
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
  )
}

const Row = memo(({ data, index, style }) => {
  // Data passed to List as "itemData" is available as props.data
  const {
    issues,
    toggleItemActive,
    setHoveredRowIndex,
    hoveredRowIndex,
    isChangingDirectionWithKeys,
    selectedRowIndex
  } = data
  const item = issues[index]
  const { title, duration } = item
  const isHovered = hoveredRowIndex === index
  const isSelected = selectedRowIndex === index

  // useEffect(() => {
  //   log(hoveredRowIndex)
  // }, [hoveredRowIndex])

  return (
    <div
      className={`${
        isHovered ? 'hovered bg-gray-50' : ''
      } flex items-center px-6 mr-2 border-b-2 border-gray-50`}
      onMouseEnter={() => {
        if (isChangingDirectionWithKeys) return
        setHoveredRowIndex(index)
      }}
      onClick={() => {
        log(item)
        toggleItemActive(index)
      }}
      style={{
        ...style,
        boxShadow: `${
          isSelected ? 'rgb(202, 211, 255) 0px 0px 0px 1px inset' : ''
        }`
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
          maxWidth: '400px'
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
  issues,
  inputRef,
  selectedTask,
  setSelectedTask,
  inputValue,
  setInputValue,
  showTimeTrackerLauncher,
  setShowTimeTrackerLauncher,
  setIssues,
  filterByUnlogged
}) => {
  useHotkeys(
    'esc',
    () => {
      if (showTimeTrackerLauncher) setShowTimeTrackerLauncher(false)
    },
    { enableOnTags: ['INPUT'] }
  )
  useHotkeys(
    'enter',
    () => {
      log('ENTER')
      if (!inputValue) return

      // Remove currently hovered item from issues
      if (filterByUnlogged) {
        log(issues[issues.findIndex(x => x.id === selectedTask.id) + 1])
        setSelectedTask(
          issues[issues.findIndex(x => x.id === selectedTask.id) + 1]
        )
        setIssues(prev => {
          let temp = [...prev]
          let index = temp.findIndex(x => x.id === selectedTask.id)
          temp[index].duration = juration().parse(inputValue)
          return temp.filter((x, i) => selectedTask.id !== x.id)
        })
        setInputValue('')
        logIssue(selectedTask).then(console.log)
      } else {
        setIssues(prev => {
          let temp = [...prev]
          let index = temp.findIndex(x => x.id === selectedTask.id)
          temp[index].duration = juration().parse(inputValue)
          return temp
        })
        setInputValue('')
        logIssue(selectedTask).then(console.log)
      }
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
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-gray-400 px-2 py-1 mx-4 bg-gray-100 rounded">
            {selectedTask.title}
          </div>
          <div className="flex-1"></div>
        </div>
      )}
      <input
        autoFocus
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        className="outline-none bg-white text-md text-gray-600 w-full px-4 py-0"
        placeholder="Track time e.g 1h 10m"
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
    <span className="w-3.5 h-3.5 text-gray-500 stroke-current fill-current">
      {prefix}
    </span>
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
    return () => triggerRef?.current?.removeEventListener('click', click)
  }, [triggerRef, ref])
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
      ref?.current?.blur()
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
      ref?.current?.blur()
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
