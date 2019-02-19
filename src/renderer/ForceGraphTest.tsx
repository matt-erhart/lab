import * as React from "react";
import { ForceGraph2D } from "react-force-graph";

function genRandomTree(N = 500) {
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
    links: [...Array(N).keys()]
      .filter(id => id)
      .map(id => ({
        source: id,
        target: Math.round(Math.random() * (id - 1))
      }))
  };
}

/**
 * @class **ForceGraphTest**
 */
const ForceGraphTestDefaults = {
  props: {},
  state: {}
};
export  class ForceGraphTest extends React.Component<
  typeof ForceGraphTestDefaults.props,
  typeof ForceGraphTestDefaults.state
> {
  static defaultProps = ForceGraphTestDefaults.props;
  state = ForceGraphTestDefaults.state;
  render() {
    return (
      <ForceGraph2D
        graphData={genRandomTree()}
        nodeAutoColorBy="group"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 20 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            n => n + fontSize * 0.2
          ); // some padding
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fillRect(
            node.x - bckgDimensions[0] / 2,
            node.y - bckgDimensions[1] / 2,
            ...bckgDimensions
          );
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.color;
          ctx.fillText(label, node.x, node.y);
        }}
      />
    );
  }
}

export default class DynamicGraph extends React.Component<any, any> {
    state = {
      data: {
        nodes: [{ id: 0 }],
        links: []
      }
    };
    interval;
    _handleClick = node => {
      // Remove node on click
      this.setState(({ data: { nodes, links } }) => {
        const newLinks = links.filter(l => l.source !== node && l.target !== node); // Remove links attached to node
        const newNodes = nodes.slice();
        newNodes.splice(node.id, 1); // Remove node
        newNodes.forEach((n, idx) => { n.id = idx; }); // Reset node ids to array index
        return {
          data: { nodes: newNodes, links: newLinks }
        };
      });
    };
    componentDidMount() {
      this.interval = setInterval(() => {
        // Add a new connected node every second
        this.setState(({ data: { nodes, links } }) => {
          const id = nodes.length;
          return {
            data: {
              nodes: [...nodes, { id }],
              links: [...links, { source: id, target: Math.round(Math.random() * (id-1)) }]
            }
          };
        });
      }, 1000);
    }
    componentWillUnmount(){
        clearInterval(this.interval )
    }

    render() {
      const { data } = this.state;
      return <ForceGraph2D
        ref={el => { this.fg = el; }}
        enableNodeDrag={false}
        onNodeClick={this._handleClick}
        graphData={data}
      />;
    }
  }
