import React, { useState, useRef, useEffect } from 'react'
import { useCombobox } from 'downshift'
import * as Popover from '@radix-ui/react-popover'
import { styled, keyframes } from '@stitches/react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import { useHotkeys } from 'react-hotkeys-hook'
import { useAppContext, filter, getCompletedIssues } from '../pages/home'

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 }
})
const fadeOut = keyframes({
  '0%': { opacity: 1 },
  '100%': { opacity: 0 }
})
const StyledCheckbox = styled(Checkbox.Root, {
  appearance: 'none',
  backgroundColor: 'transparent',
  border: 'none',
  padding: 0,
  boxShadow: 'inset 0 0 0 1px gainsboro',
  width: 15,
  height: 15,
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

let filters = [
  { name: 'Filter by label', hasNext: true, type: 'IssueLabel' },
  { name: 'Filter by team', hasNext: true, type: 'Team' },
  { name: 'Filter by project', hasNext: true, type: 'Project' }
]

const StyledContent = styled(Popover.Content, {
  borderRadius: 3,
  fontSize: 13,
  color: '#555',

  '&[data-state="open"]': {
    animation: `${fadeIn} 50ms ease-in-out`
  },

  '&[data-state="closed"]': {
    animation: `${fadeOut} 100ms ease-in-out`
  }
})

export default function Filter({}) {
  const { state, issues, setIssues, filterConfig } = useAppContext()
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  useHotkeys('f', () => setTimeout(() => setOpen(p => !p)))
  useEffect(() => {
    // Apply to filter to issues
    let completedIssues = getCompletedIssues(state)
    let { key, type } = filterConfig
    let inViewIssues = filter(type, key, completedIssues)
    const filtered = selectedItems.reduce((acc, item) => {
      let type = findType(item.id, state)
      console.log(item.name, type)
      acc.push(...filter(type, item.id, issues))
      return acc
    }, [])
    console.log(inViewIssues, state.IssueLabel)
    setIssues(filtered.length ? filtered : filter(type, key, completedIssues))
  }, [selectedItems])
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>Filter (f)</Popover.Trigger>
      {/* <span style={{ marginLeft: '9px', fontSize: '13px' }}>
        Filters ({selectedItems.length})
      </span> */}
      <Popover.Anchor />
      <StyledContent
        className="bg-white z-50"
        sideOffset={20}
        onOpenAutoFocus={e => e.preventDefault()}
        align="center"
      >
        <DropdownCombobox
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          open={open}
          setOpen={setOpen}
        />
      </StyledContent>
    </Popover.Root>
  )
}

function DropdownCombobox({ selectedItems, setSelectedItems }) {
  const { state, filterConfig } = useAppContext()
  const [inputItems, setInputItems] = useState(filters)
  const [type, setType] = useState(null)
  const comboboxRef = useRef()
  const listRef = useRef()

  useEffect(() => {
    switch (type) {
      case 'IssueLabel':
        // Get available labels for filtering.
        // E.g if the currently in view issues only have three types of labels
        // such as Done, Features, In Progress - we only want to view them filter types
        let completedIssues = getCompletedIssues(state)
        let { key, type } = filterConfig
        let inViewIssues = filter(type, key, completedIssues)
        let a = []
        inViewIssues.forEach(x =>
          x.labelIds.forEach(y => (y ? a.push(y) : null))
        )
        let availableFilters = [...new Set(a)]
        let items = availableFilters.map(x => {
          let found = state.IssueLabel.find(y => y.id === x)
          if (found) return found
        })
        setInputItems(items)
        //setInputItems([{ name: "No label", id: null }].concat(state.IssueLabel));
        break
      case 'Team':
        setInputItems(state.Team)
        //setInputItems([{ name: "No team", id: null }].concat(state.Team));
        break
      case 'Project':
        setInputItems(state.Project)
        //setInputItems([{ name: "No project", id: null }].concat(state.Project));
        break
      default:
        return
    }
  }, [type])

  const {
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    closeMenu,
    setHighlightedIndex
  } = useCombobox({
    items: inputItems,
    isOpen: true,
    defaultIsOpen: true,
    selectedItem: null,
    defaultHighlightedIndex: 0,
    circularNavigation: true,
    stateReducer: (filterState, actionAndChanges) => {
      let {
        changes,
        type: changeType,
        props: { items }
      } = actionAndChanges
      let selectedItem = items[filterState.highlightedIndex]
      switch (changeType) {
        case useCombobox.stateChangeTypes.InputChange:
          // Hit Space to select item
          if (changes.inputValue === ' ') {
            return {
              ...changes,
              inputValue: '',
              highlightedIndex: filterState.highlightedIndex,
              selectedItem
            }
          }
          return changes
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return {
            ...changes,
            inputValue: '',
            highlightedIndex: !selectedItem.hasNext
              ? state[type].indexOf(selectedItem)
              : filterState.highlightedIndex,
            selectedItem
          }
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: false, // keep menu open after selection.
            highlightedIndex: filterState.highlightedIndex,
            inputValue: '' // don't add the item string as input value at selection.
          }
        case useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem:
          return { ...changes }
        case useCombobox.stateChangeTypes.InputBlur:
          return {
            ...changes,
            inputValue: '' // don't add the item string as input value at selection.
          }
        default:
          return { ...changes }
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) {
        return
      }

      // Goto next level filtering
      if (selectedItem.hasNext) {
        setType(selectedItem.type)
        return
      }

      const index = selectedItems.indexOf(selectedItem)

      if (index > 0) {
        setSelectedItems([
          ...selectedItems.slice(0, index),
          ...selectedItems.slice(index + 1)
        ])
      } else if (index === 0) {
        setSelectedItems([...selectedItems.slice(1)])
      } else {
        setSelectedItems([...selectedItems, selectedItem])
      }
    },
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        (state[type] || filters).filter(item =>
          item.name.toLowerCase().includes(inputValue.toLowerCase())
        )
      )
    }
  })

  return (
    <div
      ref={comboboxRef}
      style={{
        borderRadius: '8px',
        boxShadow: 'rgba(0, 0, 0, 0.09) 0px 3px 12px'
      }}
    >
      <div style={{ borderBottom: '1px solid #eee' }} {...getComboboxProps()}>
        <input
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 10px',
            borderRadius: '8px'
          }}
          {...getInputProps()}
        />
      </div>
      <ul
        ref={listRef}
        style={{
          listStyleType: 'none',
          margin: '0',
          padding: '0',
          maxHeight: '200px',
          overflow: 'hidden',
          overflowY: 'scroll'
        }}
        {...getMenuProps()}
      >
        {true &&
          inputItems.map((item, index) => {
            if (item.hasNext) {
              return (
                <li
                  style={{
                    background: `${highlightedIndex === index ? '#eee' : ''}`,
                    display: 'flex',
                    padding: '7px 10px'
                  }}
                  key={`${item.name}${index}`}
                  {...getItemProps({
                    item,
                    index
                  })}
                >
                  <span>{item.name}</span>
                </li>
              )
            }
            let team = state.Team.find(x => x.id === item.teamId)?.name
            return (
              <li
                style={{
                  background: `${highlightedIndex === index ? '#eee' : ''}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 10px'
                }}
                key={`${item}${index}`}
                {...getItemProps({ item, index })}
              >
                <StyledCheckbox
                  checked={selectedItems.includes(item)}
                  value={item.name}
                  style={{ marginRight: '10px' }}
                >
                  <Checkbox.Indicator as={CheckIcon} />
                </StyledCheckbox>
                {team && <span style={{ color: '#ccc' }}>{team} - </span>}
                <span>{item.name}</span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

// Helpers

// Find the type of an object from its id
// e.g '42996195-aada-4efa-87f3-f98dfd5c0655' -> Project
const findType = (id, state) => {
  let type = ''
  let keys = Object.keys(state)
  keys.forEach(key => {
    state[key].forEach(item => {
      if (item.id === id) type = key
    })
  })
  return type
}
