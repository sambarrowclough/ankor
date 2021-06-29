import * as Popover from '@radix-ui/react-popover'
import { useTransition, animated, useSpring, config } from 'react-spring'
import React, { useRef, useState, useLayoutEffect } from 'react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  useCommand
} from '../lib/cmdk'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  BacklogIcon,
  TodoIcon,
  CancelledIcon,
  InProgressIcon,
  DoneIcon
} from './icons'
import { styled } from '@stitches/react'
import { useAppContext } from 'pages/home'
import { byCompleted } from 'utils/helpers'

export default function Issue() {
  const { state, setIssues, setViewId } = useAppContext()
  const [open, setOpen] = React.useState(false)
  const [triggerText, setTriggerText] = useState('Team')
  const commandProps = useCommand()
  const transitions = useTransition(open, {
    from: { opacity: 0, scale: 0.96 },
    enter: { opacity: 2, scale: 1 },
    leave: { opacity: 0, scale: 0.96 },
    config: { mass: 1, tension: 1000, friction: 50 }
    //config: { mass: 1, tension: 1000, friction: 50 }
    //config: { mass: 1, tension: 1800, friction: 90 }
    //config: { mass: 1, tension: 5000, friction: 200 }
  })
  useLayoutEffect(() => {
    if (heightRef.current) {
      console.log(height)
    }
  })
  const [heightRef, height] = useHeight()
  const slideInStyles = useSpring({
    config: { mass: 1, tension: 7000, friction: 150 },
    from: { height: 200 }, // TODO: get expected full height of popover
    to: {
      height: height === 0 ? 200 : height
    }
  })
  useHotkeys('t', () => setTimeout(() => setOpen(p => !p)))

  const handelSelect = teamId => {
    setIssues(() =>
      state.Issue.filter(issue => issue.teamId === teamId)
        .sort(byCompleted)
        .reverse()
    )
    setViewId(teamId)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>{triggerText} (t)</Popover.Trigger>
      {true &&
        transitions(
          (styles, item) =>
            item && (
              <animated.div style={{ ...styles }}>
                <Popover.Content
                  sideOffset={5}
                  align={'start'}
                  as={animated.div}
                  style={{
                    ...styles,
                    transformOrigin:
                      'var(--radix-popover-content-transform-origin)',
                    borderRadius: 6,
                    fontSize: 13,
                    backgroundColor: '#fff',
                    boxShadow: 'rgba(0, 0, 0, 0.09) 0px 3px 12px',
                    color: 'black'
                  }}
                  forceMount
                >
                  <animated.div
                    style={{
                      ...slideInStyles,
                      overflow: 'hidden',
                      width: '200px'
                    }}
                  >
                    <Command
                      aria-label="Command menu"
                      dialog={false}
                      {...commandProps}
                      ref={heightRef}
                    >
                      <div style={{ marging: '0 5px' }}>
                        <CommandInput
                          placeholder={'View issues from...'}
                          style={{
                            outline: 'none',
                            border: 'none',
                            padding: '8px 12px'
                          }}
                        />
                        <span
                          style={{
                            background: '#eee',
                            borderRadius: '4px',
                            padding: '3px 5px',
                            fontSize: '10px',
                            color: '#3c4149'
                          }}
                        >
                          S
                        </span>
                      </div>
                      <div
                        style={{
                          borderBottom: '1px solid rgb(239, 241, 244)',
                          height: '1px'
                        }}
                      ></div>
                      <CommandList
                        style={{
                          maxHeight: '300px',
                          overflow: 'hidden',
                          overflowY: 'scroll',
                          listStyle: 'none',
                          padding: 0,
                          margin: 0
                        }}
                      >
                        {state.Team.map(team => (
                          <Item
                            callback={_ => {
                              handelSelect(team.id)
                              setTriggerText(team.name)
                            }}
                            value={team.name}
                          />
                        ))}
                      </CommandList>
                    </Command>
                  </animated.div>
                </Popover.Content>
              </animated.div>
            )
        )}
    </Popover.Root>
  )
}

Issue.displayName = 'Issue'

const StyledCommandItem = styled(CommandItem, {
  display: 'flex',
  padding: '7px 14px',
  display: 'flex',
  alignItems: 'center',
  color: '#282a30',

  '&[data-command-item][aria-selected] ': {
    color: '#282a30',
    background: '#f5f5f5'
  }
})

const Item = ({ value, icon, ...props }) => {
  return (
    <StyledCommandItem {...props} value={value}>
      {icon}
      <span style={{ marginLeft: '12px', marginRight: '14px' }}>{value}</span>
      <div style={{ display: 'flex', flex: 1 }}></div>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          color: '#6b6f76',
          fontWeight: '500'
        }}
      >
        {/* <Kdb>⌘</Kdb>
        <Kdb>⌥</Kdb>
        <Kdb>⇧</Kdb>
        <Kdb>1</Kdb> */}
      </span>
    </StyledCommandItem>
  )
}

const Kdb = ({ children }) => (
  <kbd style={{ marginRight: '4px', font: 'inherit' }}>{children}</kbd>
)

export function useHeight(on = true) {
  const ref = useRef()
  const [height, set] = useState(0)
  const heightRef = useRef(height)
  const [ro] = useState(
    () =>
      new ResizeObserver(packet => {
        if (ref.current && heightRef.current !== ref.current.offsetHeight) {
          heightRef.current = ref.current.offsetHeight
          set(ref.current.offsetHeight)
        }
      })
  )
  useLayoutEffect(() => {
    if (on && ref.current) {
      set(ref.current.offsetHeight)
      ro.observe(ref.current, {})
    }
    return () => ro.disconnect()
  }, [on, ref.current])
  return [ref, height]
}
