import * as React from "react";
import { Portal } from "./Portal";
import { Manager, Popper } from "react-popper";

const PopupPortal = ({
  referenceElement,
  boundariesElement,
  children,
  onClick
}: {
  referenceElement: Element;
  boundariesElement: Element; //e.g. someRef.current
  children: React.ReactNode;
  onClick?: React.DOMAttributes<HTMLDivElement>["onClick"];
}) => (
  <Manager>
    <Portal>
      <Popper
        placement={"left"}
        referenceElement={referenceElement}
        modifiers={{
          offset: {
            offset: '0, 5px'
            // offset: "-100%r-100%p-5px, -50%r-50%p"
          }, // the magic
          preventOverflow: {
            boundariesElement: boundariesElement,
            priority: ["left", "right", "bottom", "top"]
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
export default PopupPortal;
