import { AuthService } from './../services/auth.service';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { MessageService } from './../services/message.service';
import { FormControl, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    showSpinner = false;
    type = 'password';
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

    togglePassword(): void {
        this.type = this.type === 'password' ? 'text' : 'password';
    }

    register(): void {
        const email = this.emailFormControl.value;
        const password = this.passwordFormControl.value;
        this.authService.register(email, password).subscribe(
            () => {
                this.router.navigate(['/']);
            },
            err => {
                this.error = err.message;
            }
        );
    }
}
