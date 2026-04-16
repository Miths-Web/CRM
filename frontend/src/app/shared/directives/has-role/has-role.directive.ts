import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * HasRoleDirective — Shows element only if user has specified role(s).
 *
 * Usage:
 *   <button *appHasRole="'Admin'">Delete User</button>
 *   <div *appHasRole="['Admin', 'Manager']">Admin or Manager content</div>
 */
@Directive({
    selector: '[appHasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit {
    @Input('appHasRole') roles: string | string[] = [];

    private hasView = false;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private auth: AuthService
    ) { }

    ngOnInit(): void {
        const allowedRoles = Array.isArray(this.roles) ? this.roles : [this.roles];
        const userRoles = this.auth.getCurrentUser()?.roles ?? [];
        const hasAccess = allowedRoles.some(r => userRoles.includes(r));

        if (hasAccess && !this.hasView) {
            this.viewContainer.createEmbeddedView(this.templateRef);
            this.hasView = true;
        } else if (!hasAccess && this.hasView) {
            this.viewContainer.clear();
            this.hasView = false;
        }
    }
}
