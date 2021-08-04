import React, { useState, useEffect, useRef } from 'react'

import * as _ from 'lodash'
import { useHotkeys } from 'react-hotkeys-hook'
import { styled } from '@stitches/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { animated } from 'react-spring'
import 'vercel-toast/dist/vercel-toast.css'
import { createToast } from 'vercel-toast'

import Filter from '../components/Filter'
import Issue from '../components/Issue'
import { juration, uuidv4, logIssue } from '../utils/helpers'
import { useAppContext, AppContext } from '../utils/useApp'
import { MainWindow, Button, DayPicker } from '../components'
import { socket } from '../lib/socket'
import { useSnap, formatDate } from '../utils/useSnap'
import { supabase } from '../lib/supabase'

const log = console.log
const str = data => JSON.stringify(data, null, 2)
const parse = data => JSON.parse(data)

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
  const { data, error } = await supabase.from('loggedIssues').select('*')

  if (error) {
    throw new Error(error.message)
  }

  return data
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
  if (!syncBootstrapData) return fail('Failed to fetch data from Linear!')
  const all = JSON.parse(syncBootstrapData.data.syncBootstrap.state)

  // Pair logged issues to Linear issues
  const loggedIssues = await getLoggedIssues()
  if (!loggedIssues) return
  loggedIssues.forEach(({ logging, id }) => {
    if (logging) {
      let duration = logging.reduce((acc, item) => {
        let { duration } = item
        acc += duration
        return acc
      }, 0)
      let durationString = juration().humanize(duration / 1000)
      const index = all.Issue.findIndex(y => y.id === id)
      all.Issue[index].durationString = durationString
      all.Issue[index].logging = logging
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
  const [url, setUrl] = useState('')
  const [issues, setIssues] = useState([])
  const [viewId, setViewId] = useState(null)
  const [state, setState] = useState({})
  const [showTimeTrackerLauncher, setShowTimeTrackerLauncher] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState()
  const [isReportOpen, setIsReportOpen] = useState()
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState('0')

  useEffect(() => {
    let total = issues?.reduce((a, i) => {
      if (i.duration) {
        a += i.duration
      }
      return a
    }, 0)
    setTotal(juration().humanize(total))
  }, [issues])
  // useEffect(async () => {
  //   // Dev
  //   // let { data } = JSON.parse(
  //   //   require('fs').readFileSync('../sync-bootstrap.json').toString()
  //   // )
  //   // setState(JSON.parse(data.syncBootstrap.state))
  // })

  // useEffect(() => {
  //   let newwindow = window.open(
  //     'https://google.com',
  //     'name',
  //     'height=500,width=600'
  //   )
  //   if (window.focus) {
  //     newwindow.focus()
  //   }
  // }, [])

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
            setUrl(null)
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
        setUrl(url)
      }
    })()
  }, [])

  const [active, setActive] = useState(false)
  const range = useRef({
    from: undefined,
    to: undefined
  })

  if (url) {
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
          setUrl(null)
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
        href={url}
      >
        Login with Linear
      </a>
    )
  } else if (loading) {
    return (
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
    )
  } else {
    return (
      <AppContext.Provider
        value={{
          setLoading,
          setState,
          setUrl,
          total,
          range,
          setActive,
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
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <nav
            style={{
              //background: '#ccc',
              position: 'relative',
              width: '220px',
              height: '100%',
              maxWidth: '330px',
              minWidth: '220px',
              boxSizing: 'border-box',
              flexShrink: 0,
              display: 'flex',
              height: 'auto',
              borderRight: '1px solid rgb(239, 241, 244)',
              flexDirection: 'column'
            }}
          >
            <button
              className={`${
                active ? 'bg-gray-100' : ''
              }  text-left mt-6 ml-3 rounded-md hover:bg-gray-100 mr-3 py-1 px-2 text-gray-700 text-sm`}
              onClick={async () => {
                setActive(true)
                const client = new LinearClient({
                  accessToken: parse(localStorage.getItem('user')).accessToken
                })
                let viewer = await client.viewer
                let { id } = viewer
                setIssues(prev => prev.filter(x => x.assigneeId === id))
              }}
            >
              My Issues
            </button>
            <div className="flex flex-1"></div>
            <Gsheets />
            <Logout />
          </nav>
          <div
            style={{
              display: 'flex',
              flexShrink: 'initial',
              flexBasis: 'initial',
              flexDirection: 'column',
              flexGrow: '1',
              position: 'relative',
              overflow: 'auto',
              placeItems: 'stretch'
            }}
          >
            <Header />

            <div className="relative">
              <MainWindow />
              <div className="border-t-2 border-gray-50 flex items-center">
                <div className="flex-1"></div>
                <div className="mr-2 mt-2 text-xs text-gray-300">
                  Total: {total}
                </div>
              </div>
            </div>

            <TrackTimeLauncher />
          </div>
        </div>
      </AppContext.Provider>
    )
  }
}

const Gsheets = () => {
  const { issues, state } = useAppContext()
  const [url, setUrl] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [gid, setGid] = useState(null)
  useEffect(async () => {
    fetch(`api/hello`)
      .then(r => r.json())
      .then(({ url }) => {
        setUrl(url)
      })
  }, [])

  useEffect(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('spreadsheetId')
      .eq('id', getUser().id)
    if (data.length && data[0].spreadsheetId) {
      setSpreadsheetId(data[0].spreadsheetId)
    }
  }, [])

  const handleConnect = async event => {
    event.preventDefault()
    let id = uuidv4()
    ok('Connecting to Google Sheets...')

    const unsubscribe = await supabase
      .from(`googleAuth:state=eq.${id}`)
      .on('INSERT', async payload => {
        console.log('googleAuth:payload', payload)
        ok('Setting up Google Sheets...')

        newwindow.close()
        const { tokens } = payload.new

        let body = issues.map(issue => {
          issue.projectName = state.Project.find(
            x => x.id === issue.projectId
          )?.name
          issue.cycleName = state.Cycle.find(
            x => x.id === issue.cycleId
          )?.number
          issue.assigneeName = state.User.find(
            x => x.id === issue.assigneId
          )?.name
          return issue
        })

        const { data, error } = await supabase
          .from('users')
          .update({ tokens })
          .eq('id', getUser().id)

        if (error) {
          alert(str(error))
        }

        // Send issues to api/generateSheet
        fetch('api/generateSheet', {
          method: 'POST',
          body: str({ issues: body, tokens }),
          headers: {
            'content-type': 'application/json'
          }
        })
          .then(r => r.json())
          .then(async ({ spreadsheetId }) => {
            setSpreadsheetId(spreadsheetId)
            ok('Connected to Google Sheets')

            const { data, error } = await supabase
              .from('users')
              .update({ spreadsheetId })
              .eq('id', getUser().id)
            if (error) {
              return alert(str(error))
            }
          })
      })
      .subscribe()

    let authUrl = `${url}&state=${id}`

    let newwindow = window.open(authUrl, 'name', 'height=500,width=600')
    if (window.focus) {
      newwindow.focus()
    }
  }

  const handleDisconnect = e => {
    setSpreadsheetId(null)
    fetch('api/revokeSheet', {
      method: 'GET',
      //body: str({ issues: body, tokens }),
      headers: {
        'content-type': 'application/json'
      }
    }).then(r => {
      r.json().then(({ message }) => {
        if (r.status !== 200) {
          return fail(message)
        } else {
          return ok('Disconnected from Google Sheets')
        }
      })
    })
  }

  const handleBuildSheet = async () => {
    ok('Building spreadsheet...')
    let body = issues.map(issue => {
      issue.projectName = state.Project.find(
        x => x.id === issue.projectId
      )?.name
      issue.cycleName = state.Cycle.find(x => x.id === issue.cycleId)?.number
      issue.assigneeName = state.User.find(x => x.id === issue.assigneId)?.name
      return issue
    })

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', getUser().id)

    if (!data.length) {
      return
    }

    let tokens = data[0].tokens

    // Send issues to api/generateSheet
    fetch('api/generateSheet', {
      method: 'POST',
      body: str({ issues: body, tokens, spreadsheetId }),
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(r => {
        if (r.status !== 200) {
          r.json().then(({ message }) => {
            fail(message)
          })
        } else {
          return r.json()
        }
      })
      .then(r => {
        console.log(r)
        if (r?.spreadsheetId && r?.gid) {
          setSpreadsheetId(r.spreadsheetId)
          // https://docs.google.com/spreadsheets/d/1CQu20vTVex-0iKSKj1As1YbRIBmXD02wC_CMYcfQHns/edit#gid=1859623370
          let sheet = `https://docs.google.com/spreadsheets/d/${r.spreadsheetId}/edit#gid=${r.gid}`
          createToast('Spreadsheet built', {
            action: {
              text: 'Open Sheet',
              callback(toast) {
                window.open(sheet)
                toast.destory()
              }
            },
            cancel: 'Close'
          })
        }

        if (r?.gid) {
          setGid(r.gid)
        }
      })
  }

  return (
    <div className="ml-4 mb-8 flex-col items-center text-xs text-gray-600 border-b-2 border-t-2 pt-10  border-gray-50 pb-10 mr-4">
      <div className="flex items-center mb-2">
        <svg
          width="17"
          height="22"
          viewBox="0 0 19 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.5714 24H1.71429C0.767429 24 0 23.2326 0 22.2857V1.71429C0 0.767429 0.767429 0 1.71429 0H12.5714L18.2857 5.71429V22.2857C18.2857 23.2326 17.5183 24 16.5714 24Z"
            fill="#43A047"
          ></path>
          <path
            d="M18.2858 5.71429H12.5715V0L18.2858 5.71429Z"
            fill="#C8E6C9"
          ></path>
          <path
            d="M12.5715 5.71423L18.2858 11.4285V5.71423H12.5715Z"
            fill="#2E7D32"
          ></path>
          <path
            d="M13.1429 11.4286H5.14286H4V12.5714V13.7143V14.8572V16V17.1429V18.2857V19.4286H14.2857V18.2857V17.1429V16V14.8572V13.7143V12.5714V11.4286H13.1429ZM5.14286 12.5714H7.42857V13.7143H5.14286V12.5714ZM5.14286 14.8572H7.42857V16H5.14286V14.8572ZM5.14286 17.1429H7.42857V18.2857H5.14286V17.1429ZM13.1429 18.2857H8.57143V17.1429H13.1429V18.2857ZM13.1429 16H8.57143V14.8572H13.1429V16ZM13.1429 13.7143H8.57143V12.5714H13.1429V13.7143Z"
            fill="#E8F5E9"
          ></path>
        </svg>
        <span className="ml-2 text-md text-gray-400">Google Sheets</span>
      </div>

      {spreadsheetId ? (
        <button
          onClick={handleDisconnect}
          className="rounded border-red-100 border-2 px-2 py-1 mt-2 mr-4"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          href={url}
          className="rounded border-blue-100 border-2 px-2 py-1 mt-2 mr-4"
        >
          Connect
        </button>
      )}

      <div className="flex flex-1"></div>

      {spreadsheetId && (
        <button
          onClick={handleBuildSheet}
          className="rounded border-gray-100 border-2 px-2 py-1 mt-2 mr-4"
        >
          Build Sheet
        </button>
      )}
    </div>
  )
}

const Logout = () => {
  const { setUrl, setState, setLoading } = useAppContext()
  return (
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
            setUrl(null)
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
        setUrl(url)
      }}
      className="flex items-center ml-4 mt-3 mb-2 text-xs text-gray-400"
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
  )
}

const ok = msg => createToast(msg, { timeout: 5000 })
const fail = msg => createToast(msg, { type: 'error', timeout: 5000 })

const getUser = () => parse(localStorage.getItem('user'))

const Header = () => {
  return (
    <div className="header  flex items-center py-4 px-4 text-gray-600 pt-7">
      <Issue />
      <div className="flex-1"></div>
      <DayPicker />
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

// const DateComponent = () => {
//   const { setIssues, state: appState } = useAppContext()
//   const [state, setState] = useState(0)
//   const [open, setOpen] = useState(false)
//   const [dateText, setDateText] = useState('Date')
//   useHotkeys('d', () => setOpen(p => !p))
//   const snap = useSnap(open)
//   return (
//     false && (
//       <DropdownMenu.Root open={open} onOpenChange={setOpen}>
//         <DropdownMenu.Trigger className="mx-2">
//           <Button shortcut={'D'} text={dateText}></Button>
//         </DropdownMenu.Trigger>
//         {snap(
//           (styles, item) =>
//             item && (
//               <animated.div style={{ ...styles }}>
//                 <StyledContent
//                   style={{ ...styles }}
//                   onCloseAutoFocus={e => e.preventDefault()}
//                   onEscapeKeyDown={() => {
//                     setOpen(false)
//                   }}
//                   align="start"
//                   className="text-gray-700"
//                 >
//                   <DropdownMenu.RadioGroup
//                     value={state}
//                     onValueChange={setState}
//                   >
//                     <StyledRadioItem
//                       onSelect={_ => {
//                         const latest = viewIssuesFrom(appState.Issue, 'DAY')
//                         setIssues(latest)
//                         setDateText('Today')
//                       }}
//                       key={0}
//                       value={0}
//                     >
//                       Today
//                       <DropdownMenu.ItemIndicator>
//                         <TickIcon />
//                       </DropdownMenu.ItemIndicator>
//                     </StyledRadioItem>

//                     <StyledRadioItem
//                       onSelect={() => {
//                         const latest = viewIssuesFrom(appState.Issue, 'WEEK')
//                         if (latest) setIssues(latest)
//                         setDateText('Week')
//                       }}
//                       key={1}
//                       value={1}
//                     >
//                       Last week
//                       <DropdownMenu.ItemIndicator>
//                         <TickIcon />
//                       </DropdownMenu.ItemIndicator>
//                     </StyledRadioItem>

//                     <StyledRadioItem
//                       onSelect={() => {
//                         const latest = viewIssuesFrom(appState.Issue, 'MONTH')
//                         setIssues(latest)
//                         setDateText('Month')
//                       }}
//                       key={2}
//                       value={2}
//                     >
//                       Last month
//                       <DropdownMenu.ItemIndicator>
//                         <TickIcon />
//                       </DropdownMenu.ItemIndicator>
//                     </StyledRadioItem>

//                     <StyledRadioItem
//                       onSelect={() => {
//                         const latest = viewIssuesFrom(appState.Issue, 'YEAR')
//                         setIssues(latest)
//                         setDateText('Year')
//                       }}
//                       key={3}
//                       value={3}
//                     >
//                       Last year
//                       <DropdownMenu.ItemIndicator>
//                         <TickIcon />
//                       </DropdownMenu.ItemIndicator>
//                     </StyledRadioItem>

//                     <StyledRadioItem
//                       onSelect={() => {
//                         const latest = viewIssuesFrom(appState.Issue, 'ALL')
//                         setIssues(latest)
//                         setDateText('Date')
//                       }}
//                       key={4}
//                       value={4}
//                     >
//                       View all issues
//                       <DropdownMenu.ItemIndicator>
//                         <TickIcon />
//                       </DropdownMenu.ItemIndicator>
//                     </StyledRadioItem>
//                   </DropdownMenu.RadioGroup>
//                   <StyledArrow />
//                 </StyledContent>
//               </animated.div>
//             )
//         )}
//       </DropdownMenu.Root>
//     )
//   )
// }
