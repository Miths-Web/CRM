import { Pipe, PipeTransform } from '@angular/core';

/**
 * CurrencyInrPipe — Formats a number as Indian Rupee currency.
 *
 * Usage: {{ 125000 | currencyInr }}    → ₹1,25,000
 *        {{ 125000 | currencyInr:true }} → ₹1.25 L  (short form)
 */
@Pipe({ name: 'currencyInr', standalone: true })
export class CurrencyInrPipe implements PipeTransform {
    transform(value: number | null | undefined, short = false): string {
        if (value === null || value === undefined) return '—';

        if (short) {
            if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
            if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)} L`;
            if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`;
            return `₹${value}`;
        }

        // Indian number formatting (lakhs & crores)
        const formatted = value.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return formatted;
    }
}
