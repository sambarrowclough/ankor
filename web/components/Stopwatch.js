import { useAppContext, AppContext } from '../utils/useApp'
import { juration, logIssue } from '../utils/helpers'
import { PlayIcon, PauseIcon } from '../components/icons'

export const Stopwatch = ({ isRunning, startTime, id }) => {
  const { issues, setIssues } = useAppContext()

  const handleStartTimer = e => {
    setIssues(prev => {
      let temp = prev.concat()
      let index = temp.findIndex(x => x.id === id)
      temp[index].isRunning = true

      // start timer
      let now = new Date().toISOString()
      let entry = {
        start: now
      }
      if (temp[index].logging) {
        temp[index].logging.push(entry)
      } else {
        temp[index].logging = [entry]
      }
      console.log(temp[index].logging)

      return temp
    })
    e.stopPropagation()
  }

  const handleStopTimer = e => {
    e.stopPropagation()
    setIssues(prev => {
      let temp = prev.concat()
      let index = temp.findIndex(x => x.id === id)
      temp[index].isRunning = false

      // End stopwatch
      if (temp[index].logging) {
        let now = new Date().toISOString()
        let last = temp[index].logging.length - 1
        let issue = temp[index].logging[last]
        issue.stop = now
        let start = temp[index].logging[last].start
        let stop = temp[index].logging[last].stop
        let duration = new Date(stop).getTime() - new Date(start).getTime()
        let durationString = juration().humanize(duration / 1000)
        issue.durationString = durationString
        issue.duration = duration
      }

      // Build the total duration
      let duration = temp[index].logging.reduce((acc, item) => {
        let { duration } = item
        acc += duration
        return acc
      }, 0)
      temp[index].duration = duration
      temp[index].durationString = juration().humanize(duration / 1000)

      logIssue(temp[index]).then(console.log)

      return temp
    })
  }

  return isRunning ? (
    <button className="focus:outline-none" onClick={handleStopTimer}>
      <PauseIcon />
    </button>
  ) : (
    <button className="focus:outline-none" onClick={handleStartTimer}>
      <PlayIcon />
    </button>
  )
}
