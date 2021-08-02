import React, { useState, useRef } from 'react'
import Helmet from 'react-helmet'
import DayPicker, { DateUtils } from 'react-day-picker'
import 'react-day-picker/lib/style.css'
import { styled, keyframes } from '@stitches/react'
import { violet, mauve, blackA } from '@radix-ui/colors'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useAppContext } from '../utils/useApp'

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#6B6F76">
    <path d="M11 1C13.2091 1 15 2.79086 15 5V11C15 13.2091 13.2091 15 11 15H5C2.79086 15 1 13.2091 1 11V5C1 2.79086 2.79086 1 5 1H11ZM13.5 6H2.5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V6Z"></path>
  </svg>
)

// # eb5757
const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#eb5757"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="feather feather-x-circle"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
)

const scaleIn = keyframes({
  '0%': { opacity: 0, transform: 'scale(0.97)' },
  '100%': { opacity: 1, transform: 'scale(1)' }
})
const StyledContent = styled(PopoverPrimitive.Content, {
  borderRadius: 4,
  //padding: 20,
  //width: 260,
  backgroundColor: 'white',
  boxShadow:
    'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  transformOrigin: 'var(--radix-popover-content-transform-origin)',
  animation: `${scaleIn} 0.175s ease-out`,
  '&:focus': {
    boxShadow: `hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px, 0 0 0 2px ${violet.violet7}`
  }
})

const StyledArrow = styled(PopoverPrimitive.Arrow, {
  fill: 'white'
})

const StyledClose = styled(PopoverPrimitive.Close, {
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: violet.violet11,
  position: 'absolute',
  top: 5,
  right: 5,

  '&:hover': { backgroundColor: violet.violet4 },
  '&:focus': { boxShadow: `0 0 0 2px ${violet.violet7}` }
})

// Exports
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverContent = StyledContent
export const PopoverArrow = StyledArrow
export const PopoverClose = StyledClose

const IconButton = styled('button', {
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 35,
  width: 35,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: violet.violet11,
  backgroundColor: 'white',
  boxShadow: `0 2px 10px ${blackA.blackA7}`,
  '&:hover': { backgroundColor: violet.violet3 },
  '&:focus': { boxShadow: `0 0 0 2px black` }
})

export const Picker = () => {
  let { setIssues, state, range } = useAppContext()
  let { from, to } = range.current
  const modifiers = { start: from, end: to }

  function handleResetClick() {
    setIssues(state.Issue)
    range.current = {
      from: undefined,
      to: undefined
    }
  }

  function handleDayClick(day) {
    range.current = DateUtils.addDayToRange(day, range.current)
    let { from, to } = range.current
    from = new Date(from).getTime()
    to = new Date(to).getTime()
    setIssues(_ => {
      return state.Issue.filter(x => {
        let created = new Date(x.createdAt).getTime()
        let completed = new Date(x.completedAt).getTime()
        if (created > from && completed < to) return x
      })
    })
  }

  return (
    <div className="RangeExample">
      <Popover>
        <div className="relative">
          {to && from && (
            <button
              className="absolute -right-0 -top-1"
              onClick={handleResetClick}
            >
              <CrossIcon />
            </button>
          )}
          <PopoverTrigger as={IconButton} aria-label="Update dimensions">
            <CalendarIcon />
          </PopoverTrigger>
        </div>
        <PopoverContent sideOffset={5}>
          <DayPicker
            className="Selectable"
            numberOfMonths={1}
            selectedDays={[from, { from, to }]}
            modifiers={modifiers}
            onDayClick={handleDayClick}
          />
        </PopoverContent>
      </Popover>
      <Helmet>
        <style>{`
  
  .DayPicker:not(.DayPicker--interactionDisabled) .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--selected):not(.DayPicker-Day--outside):hover {
    background-color: ${violet.violet10};
  }
  .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--selected):hover {
    background-color: #eee !important;
    color: #222 !important;
  }
  .DayPicker-Day {
    color: #3c4149;
    font-size: 13px;
    cursor: var(--pointer);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    line-height: 28px;
    position: relative;
    padding: 0px !important;
  }
  
  span.DayPicker-NavButton.DayPicker-NavButton--prev {
    width: 22px;
    height: 30px;
    background-size: 7px 12px;
    background-position: center center;
    margin: -5px 10px 0px 0px;
    background-image: url(data:image/svg+xml;utf8,%3Csvg%20width=%227%22%20height=%2212%22%20viewBox=%220%200%207%2012%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M6%2011L1.70711%206.70711C1.31658%206.31658%201.31658%205.68342%201.70711%205.29289L6%201%22%20stroke=%22%2390959D%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E);
  }
  span.DayPicker-NavButton.DayPicker-NavButton--next {
    width: 22px;
    height: 30px;
    background-size: 7px 12px;
    background-position: center center;
    margin: -5px -10px 0px 0px;
    background-image: url(data:image/svg+xml;utf8,%3Csvg%20width=%227%22%20height=%2212%22%20viewBox=%220%200%207%2012%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M1%201L5.29289%205.29289C5.68342%205.68342%205.68342%206.31658%205.29289%206.70711L1%2011%22%20stroke=%22%2390959D%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E%0A%20%20)
  }
    .Selectable .DayPicker-Day--selected:not(.DayPicker-Day--start):not(.DayPicker-Day--end):not(.DayPicker-Day--outside) {
      background-color: #f0f8ff !important;
      color: ${violet.violet10};
    }
    .Selectable .DayPicker-Day {
      border-radius: 5px !important;
    }
    .Selectable .DayPicker-Day--start {
      border-top-left-radius: 50% !important;
      border-bottom-left-radius: 50% !important;
    }
    .Selectable .DayPicker-Day--end {
      border-top-right-radius: 50% !important;
      border-bottom-right-radius: 50% !important;
    }
  
    .DayPicker-Day--selected:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside) {
      background-color: ${violet.violet10};
    }
    .DayPicker-Day--selected:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside):hover {
      background-color: ${violet.violet10};
  }
  `}</style>
      </Helmet>
    </div>
  )
}

// class Example extends React.Component {
//   static defaultProps = {
//     numberOfMonths: 1
//   }

//   constructor(props) {
//     super(props)
//     this.handleDayClick = this.handleDayClick.bind(this)
//     this.handleResetClick = this.handleResetClick.bind(this)
//     this.state = this.getInitialState()
//   }

//   getInitialState() {
//     return {
//       from: undefined,
//       to: undefined
//     }
//   }

//   handleDayClick(day) {
//     let { setIssues } = useAppContext()

//     const range = DateUtils.addDayToRange(day, this.state)
//     this.setState(range)

//     let { from, to } = range
//     from = new Date(from).getTime()
//     to = new Date(to).getTime()

//     let issues = issues.filter(x => {
//       let created = new Date(x.createdAt).getTime()
//       let completed = new Date(x.completedAt).getTime()

//       if (created > from && completed < to) return x
//     })

//     setIssues(issues)
//   }

//   handleResetClick() {
//     this.setState(this.getInitialState())
//   }

//   render() {
//     const { from, to } = this.state
//     const modifiers = { start: from, end: to }
//     return (
//       <div className="RangeExample">
//         {/* <p>
//           {!from && !to && 'Please select the first day.'}
//           {from && !to && 'Please select the last day.'}
//           {from &&
//             to &&
//             `Selected from ${from.toLocaleDateString()} to
//                 ${to.toLocaleDateString()}`}{' '}
//           {from && to && (
//             <button className="link" onClick={this.handleResetClick}>
//               Reset
//             </button>
//           )}
//         </p> */}
//         <Popover>
//           <PopoverTrigger as={IconButton} aria-label="Update dimensions">
//             <CalendarIcon />
//           </PopoverTrigger>
//           <PopoverContent sideOffset={5}>
//             <DayPicker
//               className="Selectable"
//               numberOfMonths={this.props.numberOfMonths}
//               selectedDays={[from, { from, to }]}
//               modifiers={modifiers}
//               onDayClick={this.handleDayClick}
//             />
//           </PopoverContent>
//         </Popover>
//         <Helmet>
//           <style>{`

// .DayPicker:not(.DayPicker--interactionDisabled) .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--selected):not(.DayPicker-Day--outside):hover {
//   background-color: ${violet.violet10};
// }
// .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--selected):hover {
//   background-color: #eee !important;
//   color: #222 !important;
// }
// .DayPicker-Day {
//   color: #3c4149;
//   font-size: 13px;
//   cursor: var(--pointer);
//   border-radius: 50%;
//   width: 24px;
//   height: 24px;
//   line-height: 28px;
//   position: relative;
//   padding: 0px !important;
// }

// span.DayPicker-NavButton.DayPicker-NavButton--prev {
//   width: 22px;
//   height: 30px;
//   background-size: 7px 12px;
//   background-position: center center;
//   margin: -5px 10px 0px 0px;
//   background-image: url(data:image/svg+xml;utf8,%3Csvg%20width=%227%22%20height=%2212%22%20viewBox=%220%200%207%2012%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M6%2011L1.70711%206.70711C1.31658%206.31658%201.31658%205.68342%201.70711%205.29289L6%201%22%20stroke=%22%2390959D%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E);
// }
// span.DayPicker-NavButton.DayPicker-NavButton--next {
//   width: 22px;
//   height: 30px;
//   background-size: 7px 12px;
//   background-position: center center;
//   margin: -5px -10px 0px 0px;
//   background-image: url(data:image/svg+xml;utf8,%3Csvg%20width=%227%22%20height=%2212%22%20viewBox=%220%200%207%2012%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M1%201L5.29289%205.29289C5.68342%205.68342%205.68342%206.31658%205.29289%206.70711L1%2011%22%20stroke=%22%2390959D%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E%0A%20%20)
// }
//   .Selectable .DayPicker-Day--selected:not(.DayPicker-Day--start):not(.DayPicker-Day--end):not(.DayPicker-Day--outside) {
//     background-color: #f0f8ff !important;
//     color: ${violet.violet10};
//   }
//   .Selectable .DayPicker-Day {
//     border-radius: 5px !important;
//   }
//   .Selectable .DayPicker-Day--start {
//     border-top-left-radius: 50% !important;
//     border-bottom-left-radius: 50% !important;
//   }
//   .Selectable .DayPicker-Day--end {
//     border-top-right-radius: 50% !important;
//     border-bottom-right-radius: 50% !important;
//   }

//   .DayPicker-Day--selected:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside) {
//     background-color: ${violet.violet10};
//   }
//   .DayPicker-Day--selected:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside):hover {
//     background-color: ${violet.violet10};
// }
// `}</style>
//         </Helmet>
//       </div>
//     )
//   }
// }
