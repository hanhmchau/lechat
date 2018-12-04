import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service';
import { Component } from '@angular/core';
import { MessageService } from './../services/message.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    showSpinner = false;
    error: string;
    emailFormControl = new FormControl('', [
        Validators.required,
        Validators.email
    ]);
    passwordFormControl = new FormControl('', [
        Validators.required,
        Validators.minLength(4)
    ]);

    constructor(public authService: AuthService, public router: Router) {}

    ngOnInit(): void {}

    login(): void {
        const email = this.emailFormControl.value;
        const password = this.passwordFormControl.value;
        this.authService.login(email, password).subscribe(
            () => {
                this.router.navigate(['/']);
            },
            err => {
                this.error = err.message;
            }
        );
    }
}
