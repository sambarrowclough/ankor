import { useTransition } from 'react-spring'

export const useSnap = open => {
  const transitions = useTransition(open, {
    from: { opacity: 0, scale: 0.96 },
    enter: { opacity: 2, scale: 1 },
    leave: { opacity: 0, scale: 0.96 },
    config: { mass: 1, tension: 1000, friction: 50 }
    //config: { mass: 1, tension: 1000, friction: 50 }
    //config: { mass: 1, tension: 1800, friction: 90 }
    //config: { mass: 1, tension: 5000, friction: 200 }
  })
  return transitions
}
