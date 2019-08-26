export type Box = {
  // absolute position of box with css
  id?: string
  left: number
  top: number
  width: number
  height: number
}

export type BoxEdges = {
  // makes some calculations easier than Box
  minX: number // left
  minY: number // top
  maxX: number // right
  maxY: number // bottom
}

export type Point2d = {
  x: number
  y: number
}

export const boxToEdges = (box: Box): BoxEdges => {
  const { left, top, width, height } = box
  return {
    minX: left,
    minY: top,
    maxX: left + width,
    maxY: top + height,
  }
}

export const edgesToBox = (edges: BoxEdges): Box => {
  const { minX, maxX, minY, maxY } = edges
  return {
    left: minX,
    top: minY,
    width: Math.abs(maxX - minX),
    height: Math.abs(maxY - minY),
  }
}

export const pointsToBox = (points: {
  first: Point2d
  second: Point2d
}): Box => {
  const { first, second } = points
  const [minX, maxX] = [
    Math.min(first.x, second.x),
    Math.max(first.x, second.x),
  ]
  const [minY, maxY] = [
    Math.min(first.y, second.y),
    Math.max(first.y, second.y),
  ]

  return edgesToBox({ minX, maxX, minY, maxY })
}
