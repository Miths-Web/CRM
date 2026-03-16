import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * SharedModule — reusable components, directives and pipes.
 * Import this in any feature module that needs shared UI.
 */
@NgModule({
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    exports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
})
export class SharedModule { }
