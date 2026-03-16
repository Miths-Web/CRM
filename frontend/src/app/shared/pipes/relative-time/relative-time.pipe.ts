import { Pipe, PipeTransform } from '@angular/core';

/**
 * RelativeTimePipe — Converts an ISO date string to a human-friendly relative time.
 *
 * Usage: {{ someDate | relativeTime }}
 * Output examples: "just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        if (!value) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        const diffWk = Math.floor(diffDay / 7);
        const diffMo = Math.floor(diffDay / 30);
        const diffYr = Math.floor(diffDay / 365);

        if (diffSec < 10) return 'just now';
        if (diffSec < 60) return `${diffSec} seconds ago`;
        if (diffMin < 60) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
        if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
        if (diffDay < 7) return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
        if (diffWk < 4) return diffWk === 1 ? '1 week ago' : `${diffWk} weeks ago`;
        if (diffMo < 12) return diffMo === 1 ? '1 month ago' : `${diffMo} months ago`;
        return diffYr === 1 ? '1 year ago' : `${diffYr} years ago`;
    }
}
