import { useEffect, useRef, useState } from 'react'
import Draggable, { DraggableEventHandler } from 'react-draggable'
import { useWindowSize } from 'usehooks-ts'
import './App.css'
import data from './box.json'

const ratioOfMSize = 140 / 210
const ratioOfLSize = 290 / 210

const BoxStatus = (props: { status: string }) => {
  const [color] = useState(() => {
    let background = 'white'
    let font = 'black'
    switch (props.status) {
      case '配備待ち':
        background = 'white'
        font = 'black'
        break
      case '検証進捗 1/7':
        background = '#ecb33a'
        font = 'white'
        break
      case '完了':
        background = '#0FBA81'
        font = 'white'
        break
    }
    return { background, font }
  })
  return (
    <div
      className="box-status"
      style={{ color: color?.font, backgroundColor: color?.background }}
    >
      {props.status}
    </div>
  )
}

const Box = (props: {
  number: string
  size: string
  status: string
  isExchange: boolean
  onDrag: DraggableEventHandler
  onStop: DraggableEventHandler
}) => {
  const container = useRef<HTMLDivElement>(null)
  const { width: windowWidth } = useWindowSize()
  const [height, setHeight] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!container.current) return
    const rect = container.current.getBoundingClientRect()
    const ratio = props.size === 'M' ? ratioOfMSize : ratioOfLSize
    setHeight(`${rect.width * ratio}px`)
  }, [container.current, windowWidth])

  return (
    <Draggable
      onStart={() => {
        setDragging(true)
      }}
      onStop={(evt, data) => {
        setDragging(false)
        props.onStop(evt, data)
      }}
      onDrag={props.onDrag}
      position={{ x: 0, y: 0 }}
    >
      <div
        ref={container}
        style={{
          height,
          zIndex: dragging ? 100 : 0,
          opacity: dragging ? 0.85 : 1
        }}
        className={['box', props.isExchange && 'exchange'].join(' ')}
      >
        <div className="box-hline" />
        <div className="box-vline" />
        <div className="box-number">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="box-icon"
          >
            <path d="M22 20V7L20 3H4L2 7.00353V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20ZM4 9H20V19H4V9ZM5.236 5H18.764L19.764 7H4.237L5.236 5ZM15 11H9V13H15V11Z"></path>
          </svg>
          <span>{props.number}</span>
        </div>
        <BoxStatus status={props.status} />
      </div>
    </Draggable>
  )
}

const id = (() => {
  let start = 0
  return () => String(start++)
})()

const setId = (box: any) => {
  return { ...box, id: id() }
}

const datas = data.boxes.map(setId)

function getPositionAtCenter(element: HTMLElement) {
  const { top, left, width, height } = element.getBoundingClientRect()
  return {
    x: left + width / 2,
    y: top + height / 2
  }
}

function getDistanceBetweenElements(a: HTMLElement, b: HTMLElement) {
  const aPosition = getPositionAtCenter(a)
  const bPosition = getPositionAtCenter(b)

  return Math.hypot(aPosition.x - bPosition.x, aPosition.y - bPosition.y)
}

function App() {
  const { width: windowWidth } = useWindowSize()
  const [boxs, setBoxs] = useState(datas)
  const [exchangeIndex, setExchangeIndex] = useState<number>()
  const [dragIndex, setDragIndex] = useState<number>()

  useEffect(() => {
    document.documentElement.style.fontSize =
      (document.documentElement.clientWidth / 750) * 32 + 'px'
  }, [windowWidth])

  const onDrag: DraggableEventHandler = (_, data) => {
    const dragNode = data.node
    const boxNodes = data.node.parentNode?.childNodes
    if (!boxNodes) return

    const distances: { index: number; distance: number }[] = []
    boxNodes.forEach((el, index) => {
      if (el !== dragNode) {
        distances.push({
          index,
          distance: getDistanceBetweenElements(dragNode, el as HTMLElement)
        })
      } else {
        setDragIndex(index)
      }
    })
    distances.sort((a, b) => {
      return a.distance - b.distance
    })
    if (distances[0] && distances[0].distance < 80) {
      setExchangeIndex(distances[0].index)
    } else {
      setExchangeIndex(undefined)
    }
  }

  const onStop: DraggableEventHandler = () => {
    if (
      exchangeIndex !== undefined &&
      dragIndex !== undefined &&
      exchangeIndex >= 0 &&
      dragIndex >= 0
    ) {
      const dragBox = { ...boxs[dragIndex] }
      const exchangeBox = { ...boxs[exchangeIndex] }
      boxs[dragIndex] = { ...exchangeBox }
      boxs[exchangeIndex] = { ...dragBox }
      setBoxs([...boxs])
    }
    setExchangeIndex(undefined)
    setDragIndex(undefined)
  }
  return (
    <div className="app">
      <header className="header">东门 Locker</header>
      <div className="container">
        {boxs.map((box, index) => {
          return (
            <Box
              key={box.id}
              number={box.number}
              size={box.size}
              status={box.status}
              isExchange={exchangeIndex === index}
              onStop={onStop}
              onDrag={onDrag}
            />
          )
        })}
      </div>
    </div>
  )
}

export default App
