import * as React from 'react'

import {
  Box,
  Button,
  Collapsible,
  Heading,
  Grommet,
  Text,
  Anchor,
} from 'grommet'
import { grommet } from 'grommet/themes'
import { Tooltip } from 'grommet-icons'

export class SimpleCollapsible extends React.Component<any, any> {
  state = {
    open: false,
  }

  render() {
    const { open } = this.state
    return (
      <Grommet theme={grommet}>
        <Box align="start" gap="small">
          <Button
            onClick={() => this.setState({ open: !open })}
            icon={<Tooltip color="plain" />}
            plain={true}
          />
          <Collapsible open={open} {...this.props}>
            <Box
              background="light-2"
              round="medium"
              pad="medium"
              align="center"
              justify="center"
            >
              {/* <Text>
                <Anchor> This is </Anchor>This is a box inside a Collapsible
                component
              </Text> */}
              <div
                // href={card.url}
                style={{
                  height: '200px',
                  width: '200px',
                  overflow: 'scroll',
                }}
              >
                <img
                  src="https://cdn.pixabay.com/photo/2017/07/24/02/40/pink-roses-2533389__340.jpg"
                  style={{
                    width: '500px',
                  }}
                />
              </div>
            </Box>
          </Collapsible>
          {/* <Text>This is other content outside the Collapsible box</Text> */}
        </Box>
      </Grommet>
    )
  }
}
