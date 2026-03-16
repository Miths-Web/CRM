import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * ClickOutsideDirective — Fires when user clicks outside the host element.
 *
 * Usage: <div appClickOutside (clickOutside)="close()">...</div>
 */
@Directive({
    selector: '[appClickOutside]',
    standalone: true
})
export class ClickOutsideDirective {
    @Output() clickOutside = new EventEmitter<void>();

    constructor(private el: ElementRef) { }

    @HostListener('document:click', ['$event.target'])
    onClick(target: HTMLElement): void {
        if (!this.el.nativeElement.contains(target)) {
            this.clickOutside.emit();
        }
    }
}
