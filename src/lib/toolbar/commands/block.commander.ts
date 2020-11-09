import {
  Commander,
  FormatAbstractData,
  FormatEffect,
  Fragment,
  DivisionComponent,
  BranchComponent, BackboneComponent, CommandContext
} from '../../core/_api';
import { BlockComponent } from '../../components/block.component';
import { boldFormatter } from '../../formatter/bold.formatter';

export class BlockCommander implements Commander<string> {
  recordHistory = true;

  private tagName: string;

  command(context: CommandContext, tagName: string): void {
    this.tagName = tagName;
    context.selection.ranges.forEach(range => {

      range.getSuccessiveContents().forEach(scope => {
        const blockComponent = new BlockComponent(tagName);

        const parentComponent = scope.fragment.parentComponent;

        if (scope.startIndex === 0 && scope.endIndex === scope.fragment.contentLength) {
          if (scope.fragment === range.startFragment) {
            range.startFragment = blockComponent.slot;
          }
          if (scope.fragment === range.endFragment) {
            range.endFragment = blockComponent.slot;
          }
          if (parentComponent instanceof DivisionComponent) {
            const parentFragment = parentComponent.parentFragment;
            blockComponent.slot.from(scope.fragment);
            parentFragment.insertBefore(blockComponent, parentComponent);
            parentFragment.cut(parentFragment.indexOf(parentComponent), 1);
            this.effect(blockComponent.slot, parentComponent.tagName);
          } else if (parentComponent instanceof BranchComponent) {
            const index = parentComponent.indexOf(scope.fragment);
            blockComponent.slot.from(scope.fragment);
            this.effect(blockComponent.slot, parentComponent.tagName);
            const fragment = new Fragment();
            fragment.append(blockComponent);
            parentComponent.splice(index, 1, fragment);
          } else if (parentComponent instanceof BackboneComponent) {
            blockComponent.slot.from(scope.fragment);
            scope.fragment.append(blockComponent);
            this.effect(blockComponent.slot, parentComponent.tagName);
          }
        } else {
          const c = scope.fragment.cut(scope.startIndex, scope.endIndex - scope.startIndex);
          blockComponent.slot.from(c);
          if (scope.fragment === range.startFragment) {
            range.startFragment = blockComponent.slot;
            range.startIndex = range.startIndex - scope.startIndex;
          }
          if (scope.fragment === range.endFragment) {
            range.endFragment = blockComponent.slot;
            range.endIndex = range.endIndex - scope.startIndex;
          }
          scope.fragment.insert(blockComponent, scope.startIndex);
          this.effect(blockComponent.slot, '');
        }
      })
    })
  }

  private effect(fragment: Fragment, oldTagName: string) {
    if (/h[1-6]/.test(this.tagName)) {
      fragment.apply(boldFormatter, {
        state: FormatEffect.Inherit,
        startIndex: 0,
        endIndex: fragment.contentLength,
        abstractData: new FormatAbstractData({
          tag: 'strong'
        })
      })
    } else if (this.tagName === 'p') {
      const flag = /h[1-6]/.test(oldTagName);
      if (flag) {
        fragment.apply(boldFormatter, {
          state: FormatEffect.Invalid,
          startIndex: 0,
          endIndex: fragment.contentLength,
          abstractData: new FormatAbstractData({
            tag: 'strong'
          })
        })
      }
    }
  }
}
