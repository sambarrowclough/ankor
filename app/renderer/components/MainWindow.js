import { useAppContext, AppContext } from 'utils/useApp'
import React, {
  useState,
  useEffect,
  Fragment,
  memo,
  useRef,
  forwardRef,
  useLayoutEffect
} from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { FixedSizeList as FList, areEqual } from 'react-window'
import { juration } from 'utils/helpers'

export const MainWindow = ({}) => {
  const { issues, setShowTimeTrackerLauncher, setSelectedIssue } =
    useAppContext()
  const [hoveredRowIndex, setHoveredRowIndex] = useState(0)
  const [selectedRowIndex, setSelectedRowIndex] = useState(0)
  const [height, setHeight] = useState(null)
  const [width, setWidth] = useState(null)
  const [isChangingDirectionWithKeys, setIsChangingDirectionWithKeys] =
    useState(false)
  useLayoutEffect(() => {
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
    <FList
      height={height - 100}
      itemCount={issues.length}
      itemSize={40}
      width={width}
    >
      {({ index, style }) => {
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
              setSelectedRowIndex(index)
              setShowTimeTrackerLauncher(true)
              setSelectedIssue(issues[index])
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
      }}
    </FList>
  )
}
