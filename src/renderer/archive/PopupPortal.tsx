import * as React from "react";
import {useEffect} from "react";
import { Portal } from "../Portal";
import { Manager, Popper } from "react-popper";
import { number } from "prop-types";
import { oc } from "ts-optchain";

class VirtualReference {
  bbox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0
  };

  constructor(left = 0, top = 0, width = 2, height = 2) {
    this.bbox = {
      top,
      left,
      width,
      height,
      bottom: top - height,
      right: left + width
    };
  }

  getBoundingClientRect() {
    return this.bbox;
  }

  get clientWidth() {
    return this.getBoundingClientRect().width;
  }

  get clientHeight() {
    return this.getBoundingClientRect().height;
  }
}

const PopupPortal = ({
  referenceElement,
  boundariesElement,
  children,
  onClick,
  leftTop
}: {
  leftTop?: {left: number, top: number}; // this
  referenceElement?: Element; // or this
  boundariesElement: Element; //e.g. someRef.current
  children: React.ReactNode;
  onClick?: React.DOMAttributes<HTMLDivElement>["onClick"];
}) => {
  let refEl
  if (oc(leftTop).left()){
    refEl = new VirtualReference(leftTop.left, leftTop.top)
  } else {
    refEl = referenceElement
  }

  return (
    <Manager>
      <Portal>
        <Popper
          placement={"auto"}
          referenceElement={refEl}
          modifiers={{
            offset: {
              // offset: "-200%r-100%p-5px, -50%r-50%p"

              offset: "100%p-5px, 20"
            }, // the magic
            preventOverflow: {
              boundariesElement: boundariesElement,
              priority: ["right", "left",  "bottom",   "top",  ]
            },
            hide: {
              enabled: true
            }
          }}
        >
          {({ ref, style, placement, arrowProps, outOfBoundaries }) => {
            return (
              <div
                ref={ref}
                style={{
                  ...style,
                  cursor: "pointer",
                  display: outOfBoundaries ? "none" : "block",
                  zIndex: 5,
                  backgroundColor: "white",
                  maxHeight: "500px",
                  overflowY: "auto"
                }}
                data-placement={placement}
                onClick={onClick}
                onMouseOver={e => {console.log('mouse over')
                }}
              >
                {children}
                <div ref={arrowProps.ref} style={arrowProps.style} />
              </div>
            );
          }}
        </Popper>
      </Portal>
    </Manager>
  );
};
export default PopupPortal;
