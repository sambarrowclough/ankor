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
import { FixedSizeList as FList, areEqual } from 'react-window'
import { createClient } from '@supabase/supabase-js'
import * as _ from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'

import { styled } from '@stitches/react'
import { GlobalHotKeys, configure, ObserveKeys } from 'react-hotkeys'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Filter from '../components/Filter'
import Issue from '../components/Issue'
import { juration, uuidv4 } from 'utils/helpers'

const str = d => JSON.stringify(d)
const log = console.log
const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
const supabase = createClient(supabaseUrl, supabaseKey)

configure({ logLevel: 'info', ignoreTags: ['input', 'select', 'textarea'] })

const Store = require('electron-store')
let store
try {
  store = new Store()
} catch (e) {
  alert(str(e))
}

const fetchSyncBootstrapDataFromServer = ({ accessToken }) => {
  return JSON.parse(
    require('fs').readFileSync('../sync-bootstrap.json').toString()
  )
  return fetch(
    `https://linear-oauth-tester.sambarrowclough.repl.co/bootstrap?accessToken=${accessToken}`,
    {
      method: 'GET'
    }
  ).then(r => r.json())
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

const byCompleted = (a, b) => {
  return a.completedAt < b.completedAt
    ? -1
    : a.completedAt > b.completedAt
    ? 1
    : 0
}

export const getCompletedIssues = function getCompletedIssues(
  syncBootstrapState
) {
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

getCompletedIssues.displayName = 'getCompletedIssues'

export const AppContext = createContext('App')
export const useAppContext = function useAppContext() {
  return useContext(AppContext)
}
useAppContext.displayName = 'useAppContext'
AppContext.displayName = 'AppContext'

function Home() {
  const [viewComponentIsVisble, setViewComponentIsVisble] = useState(false)
  const [issues, setIssues] = useState([])
  const [viewIssuesFrom] = useState('DAY')
  const [syncBootstrapState, setSyncBootstrapState] = useState([])
  const [onboardingUrl, setOnboardingUrl] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [isLoading, setIsIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTimeTrackerLauncher, setShowTimeTrackerLauncher] = useState(false)
  const inputRef = useRef()

  // const handleIssueStateChange = () => {
  //   let completedIssues = getCompletedIssues(syncBootstrapState)
  //   if (completedIssues) {
  //     completedIssues = _.uniqBy(completedIssues, 'id')
  //   }

  //   const startOfDay = new Date()
  //   startOfDay.setHours(0, 0, 0, 0)
  //   const lastThreeDays = new Date(
  //     startOfDay.getTime() - 3 * 24 * 60 * 60 * 1000
  //   )
  //   const lastWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
  //   const lastMonth = new Date()
  //   lastMonth.setHours(0, 0, 0, 0)
  //   lastMonth.setMonth(lastMonth.getMonth() - 3)

  //   let { key, type } = filterConfig
  //   return setIssues(filter(type, key, completedIssues))

  //   switch (viewIssuesFrom) {
  //     case 'DAY':
  //       completedIssues &&
  //         setIssues(
  //           completedIssues
  //             .filter(x => {
  //               if (new Date(x.completedAt).getTime() > startOfDay) return x
  //             })
  //             .sort(byCompleted)
  //             .reverse()
  //         )
  //       break

  //     case 'THREE_DAYS':
  //       completedIssues &&
  //         setIssues(
  //           completedIssues
  //             .filter(x => {
  //               if (new Date(x.completedAt).getTime() > lastThreeDays) return x
  //             })
  //             .sort(byCompleted)
  //             .reverse()
  //         )
  //       break

  //     case 'WEEK':
  //       completedIssues &&
  //         setIssues(
  //           completedIssues
  //             .filter(x => {
  //               if (new Date(x.completedAt).getTime() > lastWeek) return x
  //             })
  //             .sort(byCompleted)
  //             .reverse()
  //         )
  //       break

  //     case 'MONTH':
  //       completedIssues &&
  //         setIssues(
  //           completedIssues
  //             .filter(x => {
  //               if (new Date(x.completedAt).getTime() > lastMonth) return x
  //             })
  //             .sort(byCompleted)
  //             .reverse()
  //         )
  //       break

  //     case 'ALL':
  //       completedIssues &&
  //         setIssues(completedIssues.sort(byCompleted).reverse())
  //       break
  //   }
  // }

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
      }
    })
    // unsubscribe from event for preventing memory leaks
    return () => {
      socket.off('DONE')
    }
  }, [])

  useEffect(() => {
    setIssues(syncBootstrapState.Issue)
  }, [syncBootstrapState])

  // Keyboard shortcuts
  useEventListener('keydown', function handler({ key }) {
    switch (key) {
      case 'j':
        break
      case 'k':
        break
      case 'f':
        break
      case 'Enter':
        break
      case 'Escape':
        setInputValue('')
        break
      default:
        break
    }
  })
  const [hoveredRowIndex, setHoveredRowIndex] = React.useState(null)

  return (
    <AppContext.Provider
      value={{
        issues,
        setIssues,
        viewComponentIsVisble,
        setViewComponentIsVisble,
        setShowTimeTrackerLauncher,
        state: syncBootstrapState,
        viewId,
        setViewId
      }}
    >
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
              <div className="header border-2 border-gray-100 flex items-center py-4 px-4 text-gray-600">
                <Issue />

                <div className="flex-1"></div>

                <Filter setIssues={setIssues} state={syncBootstrapState} />

                <Sort />

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
    </AppContext.Provider>
  )
}

const StyledContent = styled(DropdownMenu.Content, {
  minWidth: 130,
  backgroundColor: 'white',
  borderRadius: 6,
  padding: '5 0',
  border: '1px solid #F3F4F6'
  //boxShadow: '0px 5px 15px -5px hsla(206,22%,7%,.15)'
})

const StyledArrow = styled(DropdownMenu.Arrow, {
  fill: 'white'
})

const StyledRadioItem = styled(DropdownMenu.RadioItem, {
  fontSize: 13,
  padding: '5px 10px',
  borderRadius: 3,
  cursor: 'default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

  '&:focus': {
    outline: 'none',
    backgroundColor: '#F9FAFB'
    //color: 'white'
  }
})

const Sort = () => {
  const { setIssues } = useContext(AppContext)
  const [state, setState] = useState(0)
  const [open, setOpen] = useState(false)

  return (
    <GlobalHotKeys
      keyMap={{
        openSort: 's'
      }}
      handlers={{
        openSort: () => {
          log('open')
          setOpen(p => !p)
        }
      }}
    >
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger className="mx-2">
          <Button shortcut={'S'} text={'Sort by'}></Button>
        </DropdownMenu.Trigger>
        <StyledContent
          onCloseAutoFocus={e => e.preventDefault()}
          onEscapeKeyDown={() => {
            setOpen(false)
          }}
          align="end"
          className="text-gray-700"
        >
          <DropdownMenu.RadioGroup value={state} onValueChange={setState}>
            <StyledRadioItem
              onSelect={() =>
                setIssues(p => {
                  return p
                    .concat()
                    .sort((a, b) => -a.updatedAt.localeCompare(b.updatedAt))
                })
              }
              key={0}
              value={0}
            >
              Last updated
              <DropdownMenu.ItemIndicator>
                <TickIcon />
              </DropdownMenu.ItemIndicator>
            </StyledRadioItem>

            <StyledRadioItem
              onSelect={() =>
                setIssues(p => {
                  return p
                    .concat()
                    .sort((a, b) => -a.createdAt.localeCompare(b.createdAt))
                })
              }
              key={1}
              value={1}
            >
              Last created
              <DropdownMenu.ItemIndicator>
                <TickIcon />
              </DropdownMenu.ItemIndicator>
            </StyledRadioItem>
          </DropdownMenu.RadioGroup>
          <StyledArrow />
        </StyledContent>
      </DropdownMenu.Root>
    </GlobalHotKeys>
  )
}

const MainIssueWindow = ({
  hoveredRowIndex,
  setHoveredRowIndex,
  showTimeTrackerLauncher,
  inputRef,
  setSelectedTask
}) => {
  const [height, setHeight] = useState(null)
  const [width, setWidth] = useState(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState(null)
  const [isChangingDirectionWithKeys, setIsChangingDirectionWithKeys] =
    useState(false)
  const listRef = React.useRef()
  const { setShowTimeTrackerLauncher, issues } = useAppContext()
  console.log(issues)
  useEffect(() => {
    setIsChangingDirectionWithKeys(true)
    listRef.current.scrollToItem(hoveredRowIndex)
  }, [hoveredRowIndex])
  useEffect(() => {
    if (window) {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
    }
  }, [])

  const setPrev = () => {
    setHoveredRowIndex(p => {
      let direction = p - 1
      if (direction < 0) return p
      setSelectedRowIndex(direction)
      return direction
    })
  }

  const setNext = () => {
    setHoveredRowIndex(p => {
      const atBottom = issues.length - 1 === p
      let direction = p + 1
      if (atBottom) return p
      setSelectedRowIndex(direction)
      return direction
    })
  }

  useHotkeys('up', _ => setPrev())
  useHotkeys('down', _ => setNext())

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
            setSelectedTask(issues[i])
            if (!showTimeTrackerLauncher) setShowTimeTrackerLauncher(true)
            inputRef?.current?.focus()
          }
        }}
        itemSize={40}
        height={height - 90 ?? 100}
        width={width ?? 100}
        ref={listRef}
      >
        {Row}
      </FList>
    </div>
  )
}

const Row = memo(({ data, index, style }) => {
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
  setIssues
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
      //log('ENTER')
      if (!inputValue) return

      // Validate time value
      const duration = juration().parse(inputValue)
      const invalid = isNaN(duration)
      log('invalid number', invalid)
      if (invalid) return

      setIssues(prev => {
        let temp = [...prev]
        let index = temp.findIndex(x => x.id === selectedTask.id)
        temp[index].duration = duration
        return temp
      })
      setInputValue('')
      setShowTimeTrackerLauncher(false)
      logIssue(selectedTask).then(console.log)
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
      <ObserveKeys only={['down', 'up']}>
        <input
          autoFocus
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          className="outline-none bg-white text-md text-gray-600 w-full px-4 py-0"
          placeholder="Track time e.g 1h 10m"
        />
      </ObserveKeys>
    </div>
  ) : (
    ''
  )
}

const Button = forwardRef(({ onClick, text, shortcut, prefix }, ref) => (
  <button
    ref={ref}
    className="flex items-center text-gray-500 text-xs flex rounded-lg border-2 border-gray-100 px-1.5 py-1 focus:outline-none"
    onClick={onClick}
  >
    {prefix && (
      <span className="w-3.5 h-3.5 text-gray-500 stroke-current fill-current">
        {prefix}
      </span>
    )}
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

const TickIcon = () => (
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
)

Home.displayName = 'Home'

export default Home
