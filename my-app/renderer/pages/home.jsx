import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { sync } from './data'
import { usePopper } from 'react-popper'
import { FixedSizeList as List } from 'react-window'
let log = console.log
function Home() {
  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-javascript-tailwindcss)</title>
      </Head>
      hello
      <FloatingComboBox sync={sync} />
    </React.Fragment>
  )
}

const FloatingComboBox = () => {
  const all = getViewProps()
  const [query, setQuery] = useState()
  const [viewProps, setViewProps] = useState()
  useEffect(() => {
    if (!query) return setViewProps(all)
    setViewProps(_ =>
      all.filter(x => x?.name?.toLowerCase().includes(query?.toLowerCase()))
    )
  }, [query])
  useEffect(() => {
    setViewProps(all)
  }, [])

  let visible = true
  let virtualReference = {
    getBoundingClientRect() {
      return {
        top: 50,
        left: 10,
        bottom: 20,
        right: 100,
        width: 90,
        height: 10
      }
    }
  }
  const [popperElement, setPopperElement] = React.useState(null)
  const { styles, attributes, update } = usePopper(
    virtualReference,
    popperElement,
    { strategy: 'fixed' }
  )
  const handleOnClick = () => {
    let { top, left } = ref.current.getBoundingClientRect()
    virtualReference = {
      getBoundingClientRect() {
        return {
          top: top + 30,
          left: left,
          bottom: top,
          right: left,
          width: 0,
          height: 0
        }
      }
    }
    update()
  }

  const ref = useRef()

  return (
    <>
      <div
      // ref={setPopperElement}
      // style={styles.popper}
      // {...attributes.popper}
      // className="border-2"
      >
        <List
          width={500}
          height={100}
          itemCount={viewProps?.length}
          itemSize={25}
          itemData={viewProps}
        >
          {({ data, index, style, key }) => {
            let item = viewProps[index]
            return (
              <div className="Row" key={key} style={style}>
                {item.type} > {item.name}
              </div>
            )
          }}
        </List>
      </div>
    </>
  )

  return (
    <div>
      <buttton ref={ref} onClick={handleOnClick}>
        trigger
      </buttton>
      <div
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="border-2"
      >
        <input autoFocus onChange={e => setQuery(e.target.value)} />
        {viewProps && (
          <List
            width={500}
            height={100}
            itemCount={viewProps?.length}
            itemSize={25}
            itemData={viewProps}
          >
            {({ data, index, style, key }) => {
              let item = viewProps[index]
              return (
                <div className="Row" key={key} style={style}>
                  {item.type} > {item.name}
                </div>
              )
            }}
          </List>
        )}
      </div>
    </div>
  )
}

const getViewProps = () => {
  const allowed = ['Team', 'Project']
  let all = []
  Object.keys(sync).forEach(key => {
    if (!allowed.includes(key)) return
    sync[key].forEach(({ id, name }) => {
      all.push({
        id,
        name,
        type: key
      })
    })
  })
  return all
}

export default Home
