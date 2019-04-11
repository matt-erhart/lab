import * as React from "react";

const BLOCK_TAGS = {
  p: "paragraph",
  li: "list-item",
  ul: "bulleted-list",
  ol: "numbered-list",
  blockquote: "quote",
  pre: "code",
  h1: "heading-one",
  h2: "heading-two",
  h3: "heading-three",
  h4: "heading-four",
  h5: "heading-five",
  h6: "heading-six"
};

const MARK_TAGS = {
  strong: "bold",
  em: "italic",
  u: "underline"
};

const rules = [
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName.toLowerCase()];

      if (block) {
        return {
          object: "block",
          type: block,
          nodes: next(el.childNodes),
          data: {
            id: el.getAttribute("id")
          }
        };
      }
      return undefined;
    }
  },
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName.toLowerCase()];

      if (mark) {
        return {
          object: "mark",
          type: mark,
          nodes: next(el.childNodes)
        };
      }
      return undefined;
    }
  },
  {
    // Special case for code blocks, which need to grab the nested childNodes.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() == "pre") {
        const code = el.childNodes[0];
        const childNodes =
          code && code.tagName.toLowerCase() == "code"
            ? code.childNodes
            : el.childNodes;

        return {
          object: "block",
          type: "code",
          nodes: next(childNodes)
        };
      }
      return undefined;
    }
  },
  {
    // Special case for images, to grab their src.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() == "img") {
        return {
          object: "block",
          type: "image",
          nodes: next(el.childNodes),
          data: {
            src: el.getAttribute("src")
          }
        };
      }
      return undefined;
    }
  },
  {
    // Special case for i, grab data
    deserialize(el, next) {
      if (
        el.tagName.toLowerCase() == "i" &&
        el.getAttribute("data-slatetype") === "graph"
      ) {
        return {
          object: "inline",
          type: "graph",
          nodes: next(el.childNodes),
          data: {
            id: el.getAttribute("data-id"),
            slateType: el.getAttribute("data-slatetype"),
            isNode: el.getAttribute("data-isnode")
          }
        };
      }
      return undefined;
    }
  },
  {
    // Special case for links, to grab their href.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() == "a") {
        return {
          object: "inline",
          type: "link",
          nodes: next(el.childNodes),
          data: {
            href: el.getAttribute("href")
          }
        };
      }
      return undefined;
    }
  },
  {
    serialize(obj, children) {
      if (obj.object == "block") {
        switch (obj.type) {
          case "claim":
            return <p data-type="claim">{children}</p>;
          default:
            return <p>{children}</p>;
        }
      } else if (obj.object == "inline") {
        switch (obj.type) {
          case "graph":
            const { id, text, isNode } = obj.data.toJS();
            return (
              <i
                id={id}
                data-slatetype="graph"
                data-id={id}
                data-isnode={isNode}
              >
                {children}
              </i>
            );
          default:
            return <span>{children}</span>;
        }
      }
      return null;
    }
  }
];

import Html from "slate-html-serializer";
export const htmlSerializer = new Html({ rules });

// todo serialize to html
