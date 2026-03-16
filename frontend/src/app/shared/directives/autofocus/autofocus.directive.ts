import { Directive, ElementRef, AfterViewInit } from '@angular/core';

/**
 * AutoFocusDirective — Automatically focuses the host element when it appears in the DOM.
 *
 * Usage: <input appAutoFocus placeholder="Search..." />
 *        <textarea appAutoFocus></textarea>
 */
@Directive({
    selector: '[appAutoFocus]',
    standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
    constructor(private el: ElementRef<HTMLElement>) { }

    ngAfterViewInit(): void {
        // Small delay ensures element is fully rendered before focusing
        setTimeout(() => this.el.nativeElement.focus(), 50);
    }
}
