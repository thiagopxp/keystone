/** @jsx jsx */
import { jsx } from '@emotion/core';
import {
  imageType,
  defaultType,
  blockquoteType,
  listItemType,
  orderedListType,
  unorderedListType,
} from '../constants';
import * as embed from './embed';
import * as image from './image';
import * as link from './link';
import * as heading from './heading';
import { hasAncestorBlock, hasBlock } from '../utils';
import { ToolbarButton } from '../ToolbarButton';

let handleListButtonClick = (editor, editorState, type) => {
  let isList = hasBlock(editorState, listItemType);
  let isOrderedList = hasAncestorBlock(editorState, type);

  let otherListType = type === orderedListType ? unorderedListType : orderedListType;

  if (isList && isOrderedList) {
    editor.setBlocks(defaultType);
    editor.unwrapBlock(type);
  } else if (isList) {
    editor.unwrapBlock(otherListType);
    editor.wrapBlock(type);
  } else {
    editor.setBlocks(listItemType).wrapBlock(type);
  }
};

export let blocks = {
  [embed.type]: embed,
  [imageType]: image,
  [defaultType]: {
    renderNode({ attributes, children }) {
      return <p {...attributes}>{children}</p>;
    },
  },
  [blockquoteType]: {
    ToolbarElement({ editor, editorState }) {
      let hasBlockquote = hasAncestorBlock(editorState, blockquoteType);

      return (
        <ToolbarButton
          isActive={hasBlockquote}
          onClick={() => {
            if (hasBlockquote) {
              editor.unwrapBlock(blockquoteType);
            } else {
              editor.wrapBlock(blockquoteType);
            }
          }}
        >
          blockquote
        </ToolbarButton>
      );
    },
    renderNode({ attributes, children }) {
      return (
        <blockquote
          {...attributes}
          css={{
            borderLeft: '4px solid #eee',
            color: '#666',
            fontStyle: 'italic',
            margin: 0,
            marginBottom: '1em',
            paddingLeft: '1em',
          }}
        >
          {children}
        </blockquote>
      );
    },
  },
  // technically link isn't a block, it's an inline but it's easier to have it here
  [link.type]: link,
  [listItemType]: {
    renderNode({ attributes, children }) {
      return <li {...attributes}>{children}</li>;
    },
  },
  [heading.type]: heading,
  [orderedListType]: {
    ToolbarElement({ editor, editorState }) {
      return (
        <ToolbarButton
          isActive={hasAncestorBlock(editorState, orderedListType)}
          onClick={() => {
            handleListButtonClick(editor, editorState, orderedListType);
          }}
        >
          ordered list
        </ToolbarButton>
      );
    },
    renderNode({ attributes, children }) {
      return <ol {...attributes}>{children}</ol>;
    },
  },
  [unorderedListType]: {
    ToolbarElement({ editor, editorState }) {
      return (
        <ToolbarButton
          isActive={hasAncestorBlock(editorState, unorderedListType)}
          onClick={() => {
            handleListButtonClick(editor, editorState, unorderedListType);
          }}
        >
          unordered list
        </ToolbarButton>
      );
    },
    renderNode({ attributes, children }) {
      return <ul {...attributes}>{children}</ul>;
    },
  },
};

export let blockTypes = Object.keys(blocks);

// making it an array so we can add more in the future
export let blockPlugins = [
  {
    renderNode(props, editor, next) {
      let block = blocks[props.node.type];
      if (block) {
        return block.renderNode(props, editor);
      }
      next();
    },
  },
];
