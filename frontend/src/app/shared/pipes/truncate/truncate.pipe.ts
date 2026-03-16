import { Pipe, PipeTransform } from '@angular/core';

/**
 * TruncatePipe — Truncates long strings to a maximum length.
 *
 * Usage: {{ longText | truncate:50 }}
 *        {{ longText | truncate:100:'...' }}
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
    transform(value: string | null | undefined, limit = 80, trail = '…'): string {
        if (!value) return '';
        return value.length > limit ? value.substring(0, limit) + trail : value;
    }
}
