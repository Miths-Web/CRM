import { Pipe, PipeTransform } from '@angular/core';

/**
 * PhonePipe — Formats a raw phone number for display.
 *
 * Usage: {{ '+919876543210' | phone }}  → +91 98765 43210
 */
@Pipe({ name: 'phone', standalone: true })
export class PhonePipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';
        const digits = value.replace(/\D/g, '');

        // Indian mobile: 10 digits starting with +91
        if (digits.length === 12 && digits.startsWith('91')) {
            const num = digits.slice(2);
            return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
        }
        if (digits.length === 10) {
            return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        }
        return value; // return as-is if format unknown
    }
}
