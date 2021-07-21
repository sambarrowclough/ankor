import React, { useState, useEffect, Fragment, useRef, forwardRef } from 'react'
import Head from 'next/head'
import useEventListener from '@use-it/event-listener'
import { createClient } from '@supabase/supabase-js'
import * as _ from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import { styled } from '@stitches/react'
import { GlobalHotKeys, configure } from 'react-hotkeys'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { animated } from 'react-spring'

import Filter from '../components/Filter'
import Issue from '../components/Issue'
import { juration, uuidv4, logIssue } from '../utils/helpers'
import { useAppContext, AppContext } from '../utils/useApp'
import { MainWindow, Button } from '../components'
import { socket } from '../lib/socket'
import { useSnap } from '../utils/useSnap'

const log = console.log
const str = data => JSON.stringify(data, null, 2)
const parse = data => JSON.parse(data)
const supabaseUrl = 'https://sncjxquqyxhfzyafxhes.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMTUyNjkxMiwiZXhwIjoxOTI3MTAyOTEyfQ.rV5CqAiEe3Iihp90geJgyvEmy0pW8ZRmlETuQ36G4KU'
const supabase = createClient(supabaseUrl, supabaseKey)

// const user = {
//   // accessToken:
//   //   'lin_oauth_53ecb93b8bbee57463dd5b581dc962aae6c3f5bd69696b423108fa99ba0cc785',
//   // createdAt: '2021-07-20T13:35:54.368048Z',
//   // email: 'myemail@gmail.com',
//   // id: 'ca374563-1543-4731-9bfb-aa38f6ce5dad',
//   // awaitingWebhookSetup: false
// }

configure({ logLevel: 'info', ignoreTags: ['input', 'select', 'textarea'] })

const fetchSyncBootstrapDataFromServer = ({ accessToken }) => {
  // return JSON.parse(
  //   require('fs').readFileSync('../sync-bootstrap.json').toString()
  // )
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

const getStateWithLoggedIssues = async accessToken => {
  let syncBootstrapData
  if (!accessToken) {
    throw new Error('Access token required to get data from Linear')
  }
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

  // Pair logged issues to Linear issues
  const loggedIssues = await getLoggedIssues()
  if (!loggedIssues) return
  loggedIssues.forEach(x => {
    const index = all.Issue.findIndex(y => y.id === x.id)
    if (index != -1) {
      all.Issue[index].duration = x.duration
    }
  })
  return all
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

const byDateUpdated = (a, b) => -a.updatedAt.localeCompare(b.updatedAt)
const byDateCreated = (a, b) => -a.updatedAt.localeCompare(b.createAt)

const Sort = () => {
  const { setIssues } = useAppContext()
  const [state, setState] = useState(0)
  const [open, setOpen] = useState(false)
  useHotkeys('s', () => setOpen(p => !p))
  const snap = useSnap(open)
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger className="mx-2">
        <Button shortcut={'S'} text={'Sort by'}></Button>
      </DropdownMenu.Trigger>
      {snap(
        (styles, item) =>
          item && (
            <animated.div style={{ ...styles }}>
              <StyledContent
                style={{ ...styles }}
                onCloseAutoFocus={e => e.preventDefault()}
                onEscapeKeyDown={() => {
                  setOpen(false)
                }}
                align="start"
                className="text-gray-700"
              >
                <DropdownMenu.RadioGroup value={state} onValueChange={setState}>
                  <StyledRadioItem
                    onSelect={() =>
                      setIssues(p => {
                        return p.concat().sort(byDateUpdated)
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
                        return p.concat().sort(byDateCreated)
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
            </animated.div>
          )
      )}
    </DropdownMenu.Root>
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

const TrackTimeLauncher = ({}) => {
  const {
    inputRef,
    selectedIssue,
    showTimeTrackerLauncher,
    setShowTimeTrackerLauncher,
    setIssues
  } = useAppContext()
  const [inputValue, setInputValue] = useState('')
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
        let index = temp.findIndex(x => x.id === selectedIssue.id)
        temp[index].duration = duration
        return temp
      })
      setInputValue('')
      setShowTimeTrackerLauncher(false)
      logIssue(selectedIssue).then(console.log)
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
      }}
    >
      {selectedIssue?.title && (
        <div className="flex mb-2">
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-gray-400 px-2 py-1 mx-4 bg-gray-100 rounded">
            {selectedIssue.title}
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

const ReportPanel = ({}) => {
  const [total, setTotal] = useState('0')
  const { isReportOpen, setIsReportOpen, issues } = useAppContext()
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

const { LinearClient } = require('@linear/sdk')

const subscribe = async (client, teamId) => {
  let response
  try {
    response = await client.webhookCreate({
      enabled: true,
      resourceTypes: ['Issue', 'Project', 'Cycle', 'IssueLabel'],
      url: 'https://linear-webhook-websocket-server.sambarrowclough.repl.co/webhooks',
      teamId
    })
  } catch (e) {
    console.log('Something went wrong', e)
  }

  if (response) {
    console.log('Subscribed', response)
  }
}

export default function Home() {
  const [issues, setIssues] = useState([])
  const [viewId, setViewId] = useState(null)
  const [state, setState] = useState({})
  const [showTimeTrackerLauncher, setShowTimeTrackerLauncher] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState()
  const [isReportOpen, setIsReportOpen] = useState()
  const [loading, setLoading] = useState(true)
  const [onboardingUrl, setOnboardingUrl] = useState(null)
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
  // useEffect(async () => {
  //   // Dev
  //   // let { data } = JSON.parse(
  //   //   require('fs').readFileSync('../sync-bootstrap.json').toString()
  //   // )
  //   // setState(JSON.parse(data.syncBootstrap.state))
  // })

  useEffect(() => {
    socket.on('DONE', function (payload) {
      console.log('CLIENT#received', payload)
      if (payload && payload.data && payload.data.title) {
        setState(prev => {
          let temp = { ...prev }
          temp.Issue.push(payload.data)
          return temp
        })

        // Emit msg to backend to open up window
        //ipcRenderer.send('DONE', 'DONE')
      }
    })
    // unsubscribe from event for preventing memory leaks
    return () => {
      socket.off('DONE')
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      let user = parse(localStorage.getItem('user'))
      if (!user) {
        const id = uuidv4()
        const unsubscribe = await supabase
          .from(`users:id=eq.${id}`)
          .on('INSERT', async payload => {
            console.log('Change received!', payload)
            const { new: user } = payload
            //ipcRenderer.send('DONE', 'DONE')
            console.log('USER', str(user))
            const { accessToken } = user
            let data = await getStateWithLoggedIssues(accessToken)

            const linearClient = new LinearClient({ accessToken })
            let teams = await linearClient.teams()
            let teamIds = teams.nodes.map(x => x.id)
            console.log(teamIds)
            await Promise.all(
              teamIds.map(teamId => subscribe(linearClient, teamId))
            )
            user.awaitingWebhookSetup = false
            localStorage.setItem('user', str(user))
            setOnboardingUrl(null)
            const canceled = data.WorkflowState.map(x =>
              x.name === 'Canceled' ? x.id : null
            ).filter(Boolean)
            const issues = data.Issue.filter(x => !canceled.includes(x.stateId))
            data.Issue = issues
            setState(data)
            setLoading(false)
          })
          .subscribe()

        const url = `https://linear.app/oauth/authorize?client_id=51b71a2c9fd2dcb50f362420d10fee4d&redirect_uri=https://linear-oauth-tester.sambarrowclough.repl.co/oauth&response_type=code&scope=read,write,issues:create&state=${id}`

        setOnboardingUrl(url)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      let user = parse(localStorage.getItem('user'))
      //const user = store.get('user')
      if (user?.accessToken) {
        let data = await getStateWithLoggedIssues(user.accessToken)

        if (user?.awaitingWebhookSetup) {
          const { accessToken } = user
          const linearClient = new LinearClient({ accessToken })
          let teams = await linearClient.teams()
          let teamIds = teams.nodes.map(x => x.id)
          console.log(teamIds)
          await Promise.all(
            teamIds.map(teamId => subscribe(linearClient, teamId))
          )
          user.awaitingWebhookSetup = false
          //store.set('user', user)
        }

        // Remove cancelled issues
        const canceled = data.WorkflowState.map(x =>
          x.name === 'Canceled' ? x.id : null
        ).filter(Boolean)
        const issues = data.Issue.filter(x => !canceled.includes(x.stateId))
        data.Issue = issues
        setState(data)
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (state?.Issue) {
      setIssues(state.Issue)
    }
  }, [state])

  if (onboardingUrl) {
    return (
      <a
        className="text-sm text-gray-600"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)'
        }}
        onClick={event => {
          setLoading(true)
          setOnboardingUrl(null)
          event.preventDefault()
          let newwindow = window.open(
            event.target.href,
            'name',
            'height=500,width=600'
          )
          if (window.focus) {
            newwindow.focus()
          }
          //require('electron').shell.openExternal(event.target.href)
        }}
        href={onboardingUrl}
      >
        Login with Linear
      </a>
    )
  }

  return loading ? (
    <div
      className="text-sm text-gray-600"
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%,-50%)'
      }}
    >
      Loading...
    </div>
  ) : (
    <AppContext.Provider
      value={{
        issues,
        setIssues,
        state,
        viewId,
        setViewId,
        showTimeTrackerLauncher,
        setShowTimeTrackerLauncher,
        selectedIssue,
        setSelectedIssue,
        isReportOpen,
        setIsReportOpen
      }}
    >
      <Header />

      <div className="relative">
        <ReportPanel />

        <MainWindow />
        <div className="border-t-2 border-gray-50 flex items-center">
          <button
            onClick={async () => {
              localStorage.removeItem('user')

              const id = uuidv4()
              const unsubscribe = await supabase
                .from(`users:id=eq.${id}`)
                .on('INSERT', async payload => {
                  console.log('Change received!', payload)
                  const { new: user } = payload
                  //ipcRenderer.send('DONE', 'DONE')
                  console.log('USER', str(user))
                  const { accessToken } = user
                  let data = await getStateWithLoggedIssues(accessToken)

                  const linearClient = new LinearClient({ accessToken })
                  let teams = await linearClient.teams()
                  let teamIds = teams.nodes.map(x => x.id)
                  console.log(teamIds)
                  await Promise.all(
                    teamIds.map(teamId => subscribe(linearClient, teamId))
                  )
                  user.awaitingWebhookSetup = false
                  localStorage.setItem('user', str(user))
                  setOnboardingUrl(null)
                  const canceled = data.WorkflowState.map(x =>
                    x.name === 'Canceled' ? x.id : null
                  ).filter(Boolean)
                  const issues = data.Issue.filter(
                    x => !canceled.includes(x.stateId)
                  )
                  data.Issue = issues
                  setState(data)
                  setLoading(false)
                })
                .subscribe()

              const url = `https://linear.app/oauth/authorize?client_id=51b71a2c9fd2dcb50f362420d10fee4d&redirect_uri=https://linear-oauth-tester.sambarrowclough.repl.co/oauth&response_type=code&scope=read,write,issues:create&state=${id}`

              setOnboardingUrl(url)
              //setState(null)
            }}
            className="flex items-center ml-6 mt-2 text-xs text-gray-400"
          >
            <svg
              className="mr-1 w-3.5 h-3.5 "
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 16L21 12M21 12L17 8M21 12L7 12M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
                stroke="#374151"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Logout
          </button>
          <div className="flex-1"></div>
          <div className="mr-2 mt-2 text-xs text-gray-300">Total: {total}</div>
        </div>
      </div>

      <TrackTimeLauncher />
    </AppContext.Provider>
  )
}

const Header = () => {
  const DATES = ['DAY', 'THREE_DAYS', 'WEEK', 'MONTH', 'YEAR', 'ALL']
  return (
    <div className="header border-2 border-gray-100 flex items-center py-4 px-4 text-gray-600 pt-7">
      <Issue />
      <div className="flex-1"></div>
      <DateComponent />
      <Sort />
      <Filter />
    </div>
  )
}

const viewIssuesFrom = (issues, date) => {
  if (!issues) return
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const lastThreeDays = new Date(startOfDay.getTime() - 3 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date()
  lastMonth.setHours(0, 0, 0, 0)
  lastMonth.setMonth(lastMonth.getMonth() - 3)
  var lastYear = new Date(2012, 7, 25)
  lastYear.setFullYear(lastYear.getFullYear() - 1)

  switch (date) {
    case 'DAY':
      return issues
        .filter(x => {
          if (new Date(x.completedAt).getTime() > startOfDay) return x
        })
        .sort(byDateUpdated)
      break

    case 'THREE_DAYS':
      return issues
        .filter(x => {
          if (new Date(x.completedAt).getTime() > lastThreeDays) return x
        })
        .sort(byDateUpdated)
      break

    case 'WEEK':
      return issues
        .filter(x => {
          if (new Date(x.completedAt).getTime() > lastWeek) return x
        })
        .sort(byDateUpdated)
      break

    case 'MONTH':
      return issues
        .filter(x => {
          if (new Date(x.completedAt).getTime() > lastMonth) return x
        })
        .sort(byDateUpdated)
      break

    case 'YEAR':
      return issues
        .filter(x => {
          if (new Date(x.completedAt).getTime() > lastYear) return x
        })
        .sort(byDateUpdated)
      break

    case 'ALL':
      return issues.sort(byDateUpdate)
      break
  }
}

const DateComponent = () => {
  const { setIssues, state: appState } = useAppContext()
  const [state, setState] = useState(0)
  const [open, setOpen] = useState(false)
  const [dateText, setDateText] = useState('Date')
  useHotkeys('d', () => setOpen(p => !p))
  const snap = useSnap(open)
  return (
    false && (
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger className="mx-2">
          <Button shortcut={'D'} text={dateText}></Button>
        </DropdownMenu.Trigger>
        {snap(
          (styles, item) =>
            item && (
              <animated.div style={{ ...styles }}>
                <StyledContent
                  style={{ ...styles }}
                  onCloseAutoFocus={e => e.preventDefault()}
                  onEscapeKeyDown={() => {
                    setOpen(false)
                  }}
                  align="start"
                  className="text-gray-700"
                >
                  <DropdownMenu.RadioGroup
                    value={state}
                    onValueChange={setState}
                  >
                    <StyledRadioItem
                      onSelect={_ => {
                        const latest = viewIssuesFrom(appState.Issue, 'DAY')
                        setIssues(latest)
                        setDateText('Today')
                      }}
                      key={0}
                      value={0}
                    >
                      Today
                      <DropdownMenu.ItemIndicator>
                        <TickIcon />
                      </DropdownMenu.ItemIndicator>
                    </StyledRadioItem>

                    <StyledRadioItem
                      onSelect={() => {
                        const latest = viewIssuesFrom(appState.Issue, 'WEEK')
                        if (latest) setIssues(latest)
                        setDateText('Week')
                      }}
                      key={1}
                      value={1}
                    >
                      Last week
                      <DropdownMenu.ItemIndicator>
                        <TickIcon />
                      </DropdownMenu.ItemIndicator>
                    </StyledRadioItem>

                    <StyledRadioItem
                      onSelect={() => {
                        const latest = viewIssuesFrom(appState.Issue, 'MONTH')
                        setIssues(latest)
                        setDateText('Month')
                      }}
                      key={2}
                      value={2}
                    >
                      Last month
                      <DropdownMenu.ItemIndicator>
                        <TickIcon />
                      </DropdownMenu.ItemIndicator>
                    </StyledRadioItem>

                    <StyledRadioItem
                      onSelect={() => {
                        const latest = viewIssuesFrom(appState.Issue, 'YEAR')
                        setIssues(latest)
                        setDateText('Year')
                      }}
                      key={3}
                      value={3}
                    >
                      Last year
                      <DropdownMenu.ItemIndicator>
                        <TickIcon />
                      </DropdownMenu.ItemIndicator>
                    </StyledRadioItem>

                    <StyledRadioItem
                      onSelect={() => {
                        const latest = viewIssuesFrom(appState.Issue, 'ALL')
                        setIssues(latest)
                        setDateText('Date')
                      }}
                      key={4}
                      value={4}
                    >
                      View all issues
                      <DropdownMenu.ItemIndicator>
                        <TickIcon />
                      </DropdownMenu.ItemIndicator>
                    </StyledRadioItem>
                  </DropdownMenu.RadioGroup>
                  <StyledArrow />
                </StyledContent>
              </animated.div>
            )
        )}
      </DropdownMenu.Root>
    )
  )
}
