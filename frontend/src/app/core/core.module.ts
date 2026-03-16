import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CoreModule — Singleton services module.
 * All global services (Auth, Api, Storage) are providedIn: 'root'
 * so this module is kept for organization purposes.
 */
@NgModule({
    imports: [CommonModule],
    exports: []
})
export class CoreModule { }
