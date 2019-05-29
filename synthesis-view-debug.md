##### Migrating the synthesis view
This readme file documents the plans and errors happened when migrating the symposium augmented/with-slide-bar document editor into a *ctrl-4* view in App.tsx.


Here are several points:

0. If any part looks confusing, the original codebase is in this [ts-react-parcel](https://github.com/xeniaqian94/ts-react-parcel/tree/master/src/components)

1. `Package.json` were updated to slightly newer Slate version, Grommet library, CSS transition library, etc. Suggest to do a `yarn install` to update. 

2. The main entrance point for the entire `ctrl-4` view is defined as the `SynthesisEditor`. 

~~~~
  case "synthesisOutlineRealEditor":
        if (featureToggles.showDocList) {
          return <SynthesisEditor />;
~~~~

3. The `SynthesisEditor` is the **parent component**. has an overal grid layout (2*2).  
~~~~
          areas={[
            { name: 'header', start: [0, 0], end: [1, 0] },
            { name: 'main', start: [0, 1], end: [1, 1] },
            { name: 'sidebar', start: [1, 1], end: [1, 1] },
          ]}
~~~~
The **main grid** corresponds to `SlateRichTextEditor.tsx`, the first **child component**. It is a Slate rich-styled (toolbar + input area) editor. 

The **sidebar grid** is the sidebar, the second **child component**. It renders a variable called `listviews`, which we will describe later.

4. The `SlateRichTextEditor.tsx` renders a toolbar and a Slate generic editor. In the editor, there are several plugin functions, defined in the same `SlateRichTextEditor.tsx` file. Several plugin functions directly from the Slate example, except one. 

~~~~
      <div>
        <Toolbar>
          {this.renderMarkButton('bold', 'format_bold')}
          {this.renderMarkButton('italic', 'format_italic')}
          {this.renderMarkButton('underlined', 'format_underlined')}
          {this.renderMarkButton('code', 'code')}
          {this.renderBlockButton('heading-one', 'looks_one')}
          {this.renderBlockButton('heading-two', 'looks_two')}
          {this.renderBlockButton('block-quote', 'format_quote')}
          {this.renderBlockButton('numbered-list', 'format_list_numbered')}
          {this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
          {this.renderMarkButton(
            'recontextualize_hook',
            this.RECONTEXTUALIZE_HOOK_ICON
          )}{' '}
        </Toolbar>
        <Editor
          spellCheck
          autoFocus
          placeholder="Enter some rich text..."
          ref={this.ref as any}
          // ref={this.refRealEditor as any}
          value={this.state.value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          // onMouseDown={this.onMouseDown}
          // onMouseUp={this.onMouseUp}
          decorateNode={this.decorateNode}
          onClick={this.onClick}
          // plugins={plugins}
        />
      </div>
      
  ~~~~
  In the above code block, the most important plugin function is the `onChange` method. It listens any editor value (i.e. user input values) change, bind it to the **parent component**'s `onUpdate()` method, in order to update its **sidebar sibling component**, specifically, the `listview` variable.
  
  ~~~~
    onUpdate(value, selected_or_whole) {
    // For sibling communication https://stackoverflow.com/questions/24147331/react-the-right-way-to-pass-form-element-state-to-sibling-parent-elements
    if (selected_or_whole === 1) {
      if (value.fragment.text.includes('[x]')) {
        this.setState({ editorSelectedValue: value.fragment.text })
      } else {
        this.setState({
          editorSelectedValue:
            ' o(╥﹏╥)o NO CONTEXT FOR THIS SELECTION (。_。)',
        })
      }
      this.setState({
        numOfX: (value.document.text.match(/\[x|x\]/g) || []).length,
      })
    }
    this.setState({ editorValue: value })
    this.getContextMapping(value)
  }
  ~~~~

5. The `listview` variable contains a set of value to render in the sidebar. These value are similar claims to any one of the period-splitted user input claims. It loops through each value, bind CSSTransition to it, and use a `Display` component to style it. 

~~~~
    const listItems =
      this.state.contextMapping != null ? (
        this.state.contextMapping.map(
          (item, index) => {
            this.refsCollection[item.userInput.toString()] = React.createRef()
            return (
              <CSSTransition
                in={true}
                appear={true}
                enter={true}
                timeout={2000}
                classNames="fade"
                // unmountOnExit
                key={'CSSTransition' + item.userInput.substring(0, 10)}
              >
                <div key={'Display' + item.userInput.substring(0, 10)}>
                  <Display
                    // ref={this.refsCollection[item.userInput.toString()]}
                    ref={c =>
                      (this.refsCollection[item.userInput.toString()] = c)
                    }
                    originalText={item.userInput}
                    contextStruct={item.contextStruct}
                    similarClaim={item.similarClaim}
                    displayKey={item.userInput}
                    key={item.userInput} //Must use a key value unique to the element from https://stackoverflow.com/questions/43642351/react-list-rendering-wrong-data-after-deleting-item.
                  />
                </div>
              </CSSTransition>
            )
          }
          // <div>{item.userInput}</div>
        )
      ) : (
        <div />
      )
~~~~

6. The `Display` component is defined in `CardSlider.tsx`, basically. It displays a horizontal deck (Slider) of cards for a single user input claim. You may understand them as a set of claims in `state.json` from most similar to least similar w.r.t. a sentence in user input. 

The `Display` component renders a `CardDeck` with auxiliary slider buttons. 
The `CardDeck` component groups all similar claims for a single user input sentence. Therefore, it renders multiple `SingleCard`.

~~~~
export class CardDeck extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      originalText: props.originalText,
      similarClaim: props.similarClaim,
      contextStruct: props.contextStruct,
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
            />
          )
        })}
      </section>
    )
  }
}
~~~~

Each `SingleCard` is a collapsible component, who a user input claim, a similar claim in database, and a scrollable image for context. 

7. All above data (claims, contexts, images) are fake data for now. They are read from static JSON files, e.g. `store/mapping.json`, `store/state.json`, `renderer/images.json`.

Thanks for your attention until this very buttom! Please let me know of any question. 
