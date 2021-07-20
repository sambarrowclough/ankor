import { useAppContext, AppContext } from 'utils/useApp'
import { juration, logIssue } from 'utils/helpers'
import { PlayIcon, PauseIcon } from 'components/icons'

export const Stopwatch = ({ isRunning, startTime, id }) => {
  const { issues, setIssues } = useAppContext()
  return isRunning ? (
    <button
      className="focus:outline-none"
      onClick={e => {
        let elapsedTime = Math.round((Date.now() - startTime) / 1000)
        setIssues(prev => {
          let temp = [...prev]
          let i = temp.findIndex(x => x.id === id)
          if (temp[i].duration) {
            temp[i].duration += elapsedTime
          } else {
            temp[i].duration = elapsedTime
          }
          temp[i].isRunning = false
          return temp
        })

        const issue = issues.find(x => x.id === id)
        logIssue(issue).then(console.log)
        e.stopPropagation()
      }}
    >
      <PauseIcon />
    </button>
  ) : (
    <button
      className="focus:outline-none"
      onClick={e => {
        setIssues(prev => {
          let temp = [...prev]
          let i = temp.findIndex(x => x.id === id)
          temp[i].isRunning = true
          temp[i].startTime = Date.now()
          return temp
        })
        e.stopPropagation()
      }}
    >
      <PlayIcon />
    </button>
  )
}
