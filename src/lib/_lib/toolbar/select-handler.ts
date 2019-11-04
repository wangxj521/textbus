import { merge, Observable, Subject } from 'rxjs';

import { SelectHandlerOption, SelectHandlerItemOption, Handler } from './help';
import { Matcher, MatchDelta } from '../matcher';
import { Formatter } from '../edit-frame/fomatter/formatter';
import { Dropdown } from './utils/dropdown';

export class SelectHandler {
  readonly elementRef: HTMLElement;
  options: SelectOptionHandler[] = [];

  constructor(private handler: SelectHandlerOption) {

    const dropdownInner = document.createElement('span');
    dropdownInner.classList.add('tanbo-editor-select-button', ...handler.classes || []);
    handler.mini && dropdownInner.classList.add('tanbo-editor-select-button-mini');

    const menu = document.createElement('div');
    menu.classList.add('tanbo-editor-toolbar-menu');

    handler.options.forEach(option => {
      const item = new SelectOptionHandler(option);
      menu.appendChild(item.elementRef);
      if (option.default) {
        dropdownInner.innerText = option.label;
      }
      item.onMatched.subscribe(option => {
        dropdownInner.innerText = option.label;
      });
      this.options.push(item);
    });

    this.elementRef = new Dropdown(
      dropdownInner,
      menu,
      merge(...this.options.map(item => item.onApply)),
      handler.tooltip
    ).elementRef;
  }
}

export class SelectOptionHandler implements Handler {
  readonly elementRef = document.createElement('button');
  onApply: Observable<void>;
  onMatched: Observable<SelectHandlerItemOption>;
  matcher: Matcher;
  execCommand: Formatter;
  private eventSource = new Subject<void>();
  private matchedEvent = new Subject<SelectHandlerItemOption>();

  constructor(private option: SelectHandlerItemOption) {
    this.onApply = this.eventSource.asObservable();
    this.onMatched = this.matchedEvent.asObservable();
    this.elementRef.classList.add('tanbo-editor-toolbar-menu-item');
    this.elementRef.type = 'button';
    if (option.classes) {
      this.elementRef.classList.add(...(option.classes || []));
    }
    this.elementRef.innerText = option.label;
    this.elementRef.addEventListener('click', () => {
      this.eventSource.next();
    });
    this.execCommand = option.execCommand;
    this.matcher = new Matcher(option.match);
  }

  updateStatus(matchDelta: MatchDelta): void {
    this.elementRef.disabled = matchDelta.disable;
    if (matchDelta.overlap) {
      this.matchedEvent.next(this.option);
    }
  }
}