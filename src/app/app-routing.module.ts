import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
    {
        path: '',
        component: ChatContainerComponent,
        pathMatch: 'full',
        canActivate: [AuthGuard]
    },
    {
        path: 'sign-in',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    { path: '**', component: NotFoundComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
