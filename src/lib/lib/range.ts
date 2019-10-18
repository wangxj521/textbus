export class TBRange {
  get commonAncestorContainer() {
    return this.rawRange.commonAncestorContainer;
  }

  get startContainer() {
    return this.rawRange.startContainer;
  }

  get startOffset() {
    return this.rawRange.startOffset;
  }

  get endContainer() {
    return this.rawRange.endContainer;
  }

  get endOffset() {
    return this.rawRange.endOffset;
  }

  readonly startMark = document.createElement('span');
  readonly endMark = document.createElement('span');

  private marked = false;

  constructor(public rawRange: Range, private context: Document) {
    const beforeRange = this.context.createRange();
    const afterRange = this.context.createRange();

    if (rawRange.startContainer.nodeType === 3) {
      const startParent = rawRange.startContainer.parentNode;
      beforeRange.setStart(rawRange.startContainer, 0);
      beforeRange.setEnd(rawRange.startContainer, rawRange.startOffset);
      const contents = beforeRange.extractContents();
      if (contents.textContent) {
        startParent.insertBefore(contents, rawRange.startContainer);
        // 当内容被完全提取后，会留下一个空的，鼠标不能选中的脏文本节点，这会影响程序判断，所以这里需要删除掉
        if (rawRange.startContainer.textContent === '') {
          rawRange.startContainer.parentNode.removeChild(rawRange.startContainer);
        }
      }
    }

    if (rawRange.endContainer.nodeType === 3) {
      const nextSibling = rawRange.endContainer.nextSibling;
      const endParent = rawRange.endContainer.parentNode;

      afterRange.setStart(rawRange.endContainer, rawRange.endOffset);
      afterRange.setEndAfter(rawRange.endContainer);
      const contents = afterRange.extractContents();
      // 确保不是一个空的脏文本节点时，再插入到文档中
      if (contents.textContent) {
        if (nextSibling) {
          endParent.insertBefore(contents, nextSibling);
        } else {
          endParent.appendChild(contents);
        }
      }
    }
  }

  mark() {
    if (!this.marked) {
      const {startContainer, endContainer, startOffset, endOffset} = this.rawRange;

      let endParent: HTMLElement;
      let endNext: Node;
      if (endContainer.nodeType === 1) {
        endParent = endContainer as HTMLElement;
        endNext = endContainer.childNodes[endOffset];
      } else {
        endParent = endContainer.parentNode as HTMLElement;
        endNext = endContainer.nextSibling;
      }
      if (endNext) {
        endParent.insertBefore(this.endMark, endNext);
      } else {
        endParent.appendChild(this.endMark);
      }

      if (startContainer.nodeType === 1) {
        startContainer.insertBefore(this.startMark, startContainer.childNodes[startOffset]);
      } else {
        const startParent = startContainer.parentNode;
        startParent.insertBefore(this.startMark, this.rawRange.startContainer);
      }

      this.marked = true;
      this.apply();
    }
    return this;
  }

  removeMarksAndRestoreRange() {
    if (this.marked) {
      const s = this.findEmptyContainer(this.startMark);
      const e = this.findEmptyContainer(this.endMark);
      this.rawRange.setStartAfter(s);
      this.rawRange.setEndBefore(e);
      s.parentNode.removeChild(s);
      e.parentNode.removeChild(e);
      this.marked = false;
    }
    return this;
  }

  apply() {
    this.rawRange.setStartAfter(this.startMark);
    this.rawRange.setEndBefore(this.endMark);
  }

  getRangesAfterAndBeforeWithinContainer(scope: Node): { before: Range, after: Range } {
    const beforeRange = this.context.createRange();
    const afterRange = this.context.createRange();

    beforeRange.setStartBefore(scope);
    afterRange.setEndAfter(scope);
    this.mark();
    beforeRange.setEndBefore(this.startMark);
    afterRange.setStartAfter(this.endMark);
    return {
      before: beforeRange,
      after: afterRange
    };
  }

  private findEmptyContainer(node: Node): Node {
    if ((node.parentNode as HTMLElement).innerText) {
      return node;
    }
    return this.findEmptyContainer(node.parentNode);
  }
}
