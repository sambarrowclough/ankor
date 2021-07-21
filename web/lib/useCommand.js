import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDescendants } from 'use-descendants'
import { matchSorter } from 'match-sorter'

const inputs = ['select', 'button', 'textarea']

const useCommand = ({
  search: searchProp = '',
  selected: selectedProp = 0,
  ordering = true,
  filter = defaultFilter,
  loop = false,
  element,
  ...props
} = {}) => {
  const { ref: listRef, ...listProps } = useDescendants()
  const [selected, setSelected] = useState(selectedProp)
  const [search, setSearch] = useState(searchProp)
  const commandRef = useRef()
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const filterList = filter(listProps.map, search)

  useKeydown({
    setSelected,
    listProps,
    selectedRef,
    loop,
    element: element || commandRef.current
  })

  const handleSearch = useCallback(e => {
    if (e) {
      setSearch(e.target.value)
    } else {
      setSearch(e)
    }
  }, [])

  return {
    search,
    selected,
    setSelected,
    setSearch: handleSearch,
    filterList,
    ordering,
    listRef,
    commandRef,
    ...listProps,
    ...props
  }
}

useCommand.displayName = 'useCommand'

export default useCommand

// Helpers

function defaultFilter(map, filter) {
  const values = Object.values(map.current)

  if (!values.length) {
    return null
  }

  const filterList = matchSorter(values, filter, {
    keys: [
      props => {
        return props?.value || null
      }
    ]
  })

  return filterList
}

const useKeydown = ({ setSelected, selectedRef, listProps, loop, element }) => {
  const setLast = useCallback(() => {
    setSelected(listProps.list.current.length - 1)
  }, []) // eslint-disable-line

  const setFirst = useCallback(() => {
    setSelected(0)
  }, []) // eslint-disable-line

  const setNext = useCallback(() => {
    setSelected(selected => {
      const atBottom = selected === listProps.list.current.length - 1

      if (atBottom) {
        if (loop) {
          // Loop back to the top
          return (selected + 1) % listProps.list.current.length
        }
      } else {
        return selected + 1
      }

      return selected
    })
    // We can assume `loop` is stable
  }, []) // eslint-disable-line

  const setPrev = useCallback(() => {
    setSelected(selected => {
      const atTop = selected === 0

      if (atTop) {
        if (loop) {
          // Loop back to bottom
          return listProps.list.current.length - 1
        }
      } else {
        return selected - 1
      }

      return selected
    })
    // We can assume `loop` is stable
  }, []) // eslint-disable-line

  const handleKey = useCallback(
    e => {
      // Spacebar
      //console.log(e.keyCode === 32);
      switch (e.key) {
        case 'Home': {
          e.preventDefault()
          setFirst()
          break
        }
        case 'End': {
          e.preventDefault()
          setLast()
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setNext()
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setPrev()
          break
        }
        case 'Enter': {
          const cb = listProps.list.current[selectedRef.current]?.callback

          if (!cb) {
            return
          }

          if (document.activeElement) {
            // Ignore [Enter] when button, select, textarea, or contentEditable is focused
            if (
              inputs.indexOf(document.activeElement.tagName.toLowerCase()) !==
                -1 ||
              document.activeElement.contentEditable === 'true'
            ) {
              return
            }

            // Ignore [Enter] on inputs that aren't a CommandInput
            if (!document.activeElement.hasAttribute('data-command-input')) {
              return
            }
          }

          cb()

          break
        }
        default:
          break
      }
    },
    [] // eslint-disable-line
  )

  useEffect(() => {
    if (element) {
      element.addEventListener('keydown', handleKey)
    }
    return () => element?.removeEventListener('keydown', handleKey)
  }, [element, handleKey])
}
