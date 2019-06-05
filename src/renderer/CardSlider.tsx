const styles = require('./CardSlider.css')
import { SimpleCollapsible } from './SimpleCollapsible'
// import posed from 'react-pose'
// var CSSTransitionGroup = require('react-transition-group/CSSTransitionGroup')
// console.log(CSSTransitionGroup)
// import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import * as React from 'react'
import { Tooltip } from 'grommet-icons'
// import ReactCSSTransitionGroup from 'react-addons-css-transition-group' // ES5 with npm

// import images from '../images/*'
// console.log(images)

// import { readFileSync } from 'fs'

// import image from 'Jones_2010_Age-and-Great-Invention-p10.png'

import {
  Grommet,
  Box,
  Button,
  Grid,
  Text,
  Carousel,
  CheckBox,
  Paragraph,
  Collapsible,
} from 'grommet'
import console = require('console');
import { truncate } from 'fs';

function CardData() {
  const rtn = [
    {
      title: 'CARNATIONS',
      desc:
        "Carnations require well-drained, neutral to slightly alkaline soil, and full sun. Numerous cultivars have been selected for garden planting.[4] Typical examples include 'Gina Porto', 'Helen', 'Laced Romeo', and 'Red Rocket'.",
      url:
        'https://cdn.pixabay.com/photo/2017/07/24/02/40/pink-roses-2533389__340.jpg',
    },
    {
      title: 'CARNATIONS',
      desc:
        "Carnations require well-drained, neutral to slightly alkaline soil, and full sun. Numerous cultivars have been selected for garden planting.[4] Typical examples include 'Gina Porto', 'Helen', 'Laced Romeo', and 'Red Rocket'.",
      url:
        'https://cdn.pixabay.com/photo/2017/07/24/02/40/pink-roses-2533389__340.jpg',
    },
  ]
  return rtn
}

const ScrolledImageDefaults = { // TODO: understand these feature toggle
  props: {
    contextStruct: {
      top: null,
      left: null,
      pdfDir: null as String,
      height: null
    }
  },
  state: {
    contextStruct: {
      top: null,
      left: null,
      pdfDir: null as String,
      height: null,
    }
  }
}

export class ScrolledImage extends React.Component<typeof ScrolledImageDefaults.props,
  typeof ScrolledImageDefaults.state>{
  private stepInput: React.RefObject<HTMLInputElement>
  scrollInput = React.createRef<HTMLDivElement>();
  constructor(props) {
    super(props)
    this.scrollInput = React.createRef()
    this.state = {
      contextStruct: props.contextStruct,
    }
  }

  componentDidMount() {
    // var node = React.findDOMNode(this)
    // this.scrollInput.scrollLeft = this.scrollInput.scrollHeight
    // this.refs['thisImage'].scrollTop = this.refs['thisImage'].scrollHeight
    this.scrollInput.current.scrollTop = this.state.contextStruct.top
    this.scrollInput.current.scrollLeft = this.state.contextStruct.left
    // console.log(this.scrollInput.current.scrollTop)
    this.render() // Matt: you should never need to call this.render() btw, anytime props change or you call setstate, it'll rerender
  }

  render() {
    let imageRequire: string
    switch (this.state.contextStruct.pdfDir) {
      case 'Jones_2010_Age-and-Great-Invention':
        console.log("matched")
        // imageRequire = require('./images/Jones_2010_Age-and-Great-Invention-p10.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Jones_2010_Age-and-Great-Invention-p10.png"
        break
      case 'Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find':
        console.log("matched")
        // imageRequire = require('./images/Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find-p10.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find-p10.png"
        break
      case 'Jones-2009-Review-of-Economic-Studies-The-Burden-of-Knowledge-and-the-“Death-of-the-Renaissance-Man”-Is-Innovation-Getting-Harder':
        console.log("matched")
        // imageRequire = require('./images/Jones-2009-Review-of-Economic-Studies-The-Burden-of-Knowledge-and-the-“Death-of-the-Renaissance-Man”-Is-Innovation-Get-p24.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Jones-2009-Review-of-Economic-Studies-The-Burden-of-Knowledge-and-the-“Death-of-the-Renaissance-Man”-Is-Innovation-Get-p24.png"
        break
      case 'Wuchty-et-al_2007_The-increasing-dominance-of-teams-in-production-of-knowledge':
        console.log("matched")
        // imageRequire = require('./images/Wuchty-et-al_2007_The-increasing-dominance-of-teams-in-production-of-knowledge-p3.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Wuchty-et-al_2007_The-increasing-dominance-of-teams-in-production-of-knowledge-p3.png"
        break
      case 'nsf_big_ideas':
        console.log("matched")
        // imageRequire = require('./images/nsf_big_ideas-p11.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/nsf_big_ideas-p11.png"
        break
      case 'Wu-et-al_2019_Large-teams-develop-and-small-teams-disrupt-science-and-technology':
        console.log("matched")
        // imageRequire = require('./images/Wu-et-al_2019_Large-teams-develop-and-small-teams-disrupt-science-and-technology-p3.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Wu-et-al_2019_Large-teams-develop-and-small-teams-disrupt-science-and-technology-p3.png"
        break
      case 'Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find':
        console.log("matched")
        // imageRequire = require('./images/Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find-p10.png')
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find-p10.png"
        break
      default:
        imageRequire = "https://terpconnect.umd.edu/~xinq/images/Bloom-et-al_2017_Are-Ideas-Getting-Harder-to-Find-p10.png"
      // imageRequire = require('./images/Jones_2010_Age-and-Great-Invention-p10.png') // code block
    }
    // console.log(imageRequire)
    return (
      <div
        // href={card.url}
        style={{
          // height: '11in',
          // width: '8.5in',
          // overflow: 'scroll',

          margin: '0px',
          padding: '0px',
          maxHeight:
            (this.state.contextStruct.height < 250
              ? 250
              : this.state.contextStruct.height) + 'px',
          minHeight: '30px',
          maxWidth: 'full',
          minWidth: '100px',
          overflow: 'scroll',
          position: 'relative',
        }}
        ref={this.scrollInput}
      >
        <img
          // https://blog.vjeux.com/2013/javascript/scroll-position-with-react.html
          // src="https://cdn.pixabay.com/photo/2017/07/24/02/40/pink-roses-2533389__340.jpg"
          // src={imagePath}
          src={imageRequire}
          // src={require('./images/nsf_big_ideas-p11.png')}
          // scrollTop="700px"
          style={{
            //   width: '200%',
            width: '1275px' /* width:'670px'  7in; */,
            height: '1650px' /*'900px',*/,
            //   position: 'absolute',
            //   scrollLeft: '500px',
            //   top:
            //     showTop + 'px' /*TODO translate the numbers correctly*/,
            //   position: 'absolute',
            //   transform: 'translateX(10px)',
            //   clip: 'rect(0, 100px, 200px, 0)',
            /* clip: shape(top, right, bottom, left); NB 'rect' is the only available option */
            //   }
            //   minWidth: '300%',
            //   margin: '0px',
            //   padding: '0px',
            //   width: '100px' /* width: 7in; */,
            //   height: '100px' /* or height: 9.5in; */,
            //   clear: both;
            //   background-color: gray;
            //   page-break-after: always;
            //   overflow: 'visible',
            //   'max-width': '200%',
          }}
        />
      </div>
    )
  }
}

// TODO: declare default property... https://medium.com/@martin_hotell/react-typescript-and-defaultprops-dilemma-ca7f81c661c7


const SingleCardDefaults = {
  props: {

    originalText: "",
    similarClaim: "", // a single string
    contextStruct: {
      top: null,
      left: null,
      pdfDir: null as String,
      height: null,
      pageNumber: 0,
    }, //an element
    i: null,
    open: false,
    hovered: false,
    cardStyle: {
      transform: 'translateX(0px)',
    }
  },
  state: {
    originalText: "",
    similarClaim: "", // a single string
    contextStruct: {
      top: null,
      left: null,
      pdfDir: null as String,
      height: null,
      pageNumber: 0,
    }, //an element
    i: null,
    open: false,
    hovered: false,
    cardStyle: {
      transform: 'translateX(0px)',
    }
  }
}
export class SingleCard extends React.Component<typeof SingleCardDefaults.props, typeof SingleCardDefaults.state> {
  constructor(props) {
    super(props)
    this.state = {
      originalText: props.originalText,
      similarClaim: props.similarClaim, // a single string
      contextStruct: props.contextStruct, //an element
      i: props.i,
      open: false,
      hovered: false,
      cardStyle: props.cardStyle,
    }
  }

  handleMouseEnter = () => {
    this.setState({
      hovered: true,
    })
  }

  handleMouseLeave = () => {
    this.setState({
      hovered: false,
    })
  }

  render() {
    const { open } = this.state

    const showWidth = 1275 // scale=2 letter width 670
    const showHeight = 1650
    const showTop = -1 * this.state.contextStruct.top

    return (
      <div
        className="card"
        id="card"
        style={this.props.cardStyle}
        key={this.state.i}
      >
        <Grid
          rows={['auto', 'auto']}
          columns={['70%', '30%']}
          gap="small"
          fill={true}
          areas={[
            { name: 'headerLeft', start: [0, 0], end: [1, 0] },
            // { name: 'headerRight', start: [1, 0], end: [1, 0] },
            { name: 'main', start: [0, 1], end: [1, 1] },
          ]}
          align="center"
          alignContent="center"
          alignSelf="center"
          justify="center"
        >
          <Box gridArea="headerLeft">
            <p className="desc" >
              {/* align="center" */}
              "{this.state.similarClaim}" <br />
              from
              <b>
                {' '}
                {this.state.contextStruct.pdfDir}-p
                {this.state.contextStruct.pageNumber}
              </b>
            </p>
            <Button
              onClick={() => {
                // console.log("opened!! ")
                // this.state.open=true
                this.setState({ open: !this.state.open })
              }}
              icon={<Tooltip color="plain" />}
              plain={true}
              alignSelf="center"
              gridArea="headerRight"
            >
              {/* <Tooltip /> */}
            </Button>
          </Box>
          <Box gridArea="main">
            <Collapsible open={open} {...this.props}> {/* gridArea="main" */}
              {open && <Box>
                <ScrolledImage {...this.state} />
                {/* </div> */}
              </Box>}
            </Collapsible>
            {/* <Text>This is other content outside the Collapsible box</Text> */}
          </Box>
        </Grid>
      </div>
    )
  }
}

const CardDeckDefaults = {
  props: {
    originalText: "",
    similarClaim: "", // a single string
    contextStruct: {
      top: null,
      left: null,
      pdfDir: null as String,
      height: null,
      pageNumber: 0,
    }, //an element
    // i: null,
    // open: false,
    // hovered: false,
    cardStyle: {
      transform: 'translateX(0px)',
    }
  },
  state: {
    originalText: "",
    similarClaim: [] as any, // a single string
    contextStruct: [] as any,
    // {
    //   top: null,
    //   left: null,
    //   pdfDir: null as String,
    //   height: null,
    //   pageNumber: 0,
    // }, //an element
    // i: null,
    // open: false,
    // hovered: false,
    cardStyle: {
      transform: 'translateX(0px)',
    }
  }
}

export class CardDeck extends React.Component<typeof CardDeckDefaults.props, typeof CardDeckDefaults.state> {
  constructor(props) {
    super(props)
    this.state = {
      originalText: props.originalText,
      similarClaim: props.similarClaim,
      contextStruct: props.contextStruct,
      cardStyle: props.cardStyle,
    }
  }
  render() {
    // console.log('here we are getting N cards' + this.state.similarClaim.length)
    // const cardData = CardData()
    return (
      <section>
        {/* BIG TODO: we aim at showing the exact # of contexts per userInput. 
        Originally 4 because of the tutorial 
        TODO maybe also hidden scroll arrow for each card */}
        {this.state.similarClaim.map((aClaim, i) => {
          // console.log('similar Claim ' + i)
          {
            /* {this.state.similarClaim.map((aClaim, i) => { */
          }
          // console.log(this.state.similarClaim)
          // console.log(this.state.similarClaim[i])
          return (
            <SingleCard
              // {...this.state}
              originalText={this.state.originalText}
              similarClaim={this.state.similarClaim[i]}
              contextStruct={this.state.contextStruct[i]}
              cardStyle={this.props.cardStyle}
              key={i + this.state.similarClaim[i]}
              i={i}
              open={true}
              hovered={false} //Really??
            />
          )
        })}
      </section>
    )
  }
}

const DisplayDefaults = {
  state: {
    currentCard: 0,
    position: 0,
    cardStyle: {
      transform: 'translateX(0px)',
    },
    width: 0,
    originalText: "",
    similarClaim: [] as any, //now it is a list
    contextStruct: [] as any, //now it is a list of same length as similarClaim
    displayKey: "",
  }
}

export class Display extends React.Component<any, typeof DisplayDefaults.state> {
  constructor(props) {
    super(props)
    // console.log("Display.props")
    // console.log(props)
    this.state = {
      currentCard: 0,
      position: 0,
      cardStyle: {
        transform: 'translateX(0px)',
      },
      width: 0,
      originalText: props.originalText,
      similarClaim: props.similarClaim, //now it is a list
      contextStruct: props.contextStruct, //now it is a list of same length as similarClaim
      displayKey: props.displayKey,
    }
  }
  selfRef = React.createRef<HTMLDivElement>()

  // mountStyle() {
  //   console.log('inside mountStyle')
  //   // css for mount animation
  //   this.setState({
  //     style: {
  //       fontSize: 60,
  //       opacity: 1,
  //       transition: 'all 1s ease',
  //     },
  //   })
  // }

  setStyle() {
    // this.setState({
    //   style: {
    //     border: '1px solid #d8d8d8',
    //   },
    // })
    // console.log('inside set style')
    // console.log(this.selfRef.current.style)
    this.selfRef.current.style['border-color']='MediumSeaGreen'
    this.selfRef.current.style['border-width']='5px'
    // console.log(this.selfRef.current.style.background)
    // ((this.selfRef as any).current as any).style['border-color'] = 'MediumSeaGreen'
    // console.log(this.selfRef)
    // .style['border-color']='MediumSeaGreen'

    // // .style['border-color'] = 'MediumSeaGreen'

    // (this.selfRef.current as any).style['border-width'] = '5px'
  }

  resetStyle() {
    console.log('inside reset style')
    // The current is an HTML/DOM element
    // let thisDom:any =this.selfRef.current

    // thisDom.style['border-color'] = ''
    // thisDom.style['border-width'] = ''
    this.selfRef.current.style['border-color']=''
    this.selfRef.current.style['border-width']=''
    // (this.selfRef.current as any).style['border-color'] = ''
    //   (this.selfRef.current as any).style['border-width'] = ''
  }

  componentDidMount() {
    let boxWidth = document.getElementById('card').clientWidth
    this.setState({ width: boxWidth })

    // setTimeout(this.mountStyle, 10) // call the into animation
  }

  // func: click the slider buttons
  handleClick(type) {
    // get the card's margin-right
    let margin = window.getComputedStyle(document.getElementById('card'))
      .marginRight
    margin = JSON.parse(margin.replace(/px/i, ''))

    const cardWidth = this.state.width // the card's width
    const cardMargin = (margin as unknown) as number // the card's margin
    const cardNumber = this.state.similarClaim.length // the number of cards
    let currentCard = this.state.currentCard // the index of the current card
    let position = this.state.position // the position of the cards

    // slide cards
    if (type === 'next' && currentCard < cardNumber - 1) {
      currentCard++
      position -= (cardWidth as any) + (cardMargin as any)
    } else if (type === 'prev' && currentCard > 0) {
      currentCard--
      position += cardWidth + cardMargin
    }
    this.setCard(currentCard, position)
  }

  setCard(currentCard, position) {
    this.setState({
      currentCard: currentCard,
      position: position,
      cardStyle: {
        transform: `translateX(${position}px)`,
      },
    })
  }

  render() {
    return (
      <div
        className="cards-slider"
        id={this.state.displayKey}
        key={this.state.displayKey}
        ref={this.selfRef}
      >
        <div className="slider-btns">
          <button
            className="slider-btn btn-l"
            onClick={() => this.handleClick('prev')}
          >
            &lt;
          </button>
          <button
            className="slider-btn btn-r"
            onClick={() => this.handleClick('next')}
          >
            &gt;
          </button>
          <button className="slider-btn btn-mm">
            {this.state.currentCard + 1}/{this.state.similarClaim.length}
          </button>
        </div>
        <CardDeck {...this.state} cardStyle={this.state.cardStyle} />
      </div>
    )
  }
}
