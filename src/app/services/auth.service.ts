import { Injectable } from '@angular/core';
import {
    AngularFirestore,
    AngularFirestoreCollection,
    DocumentReference,
    DocumentChangeAction,
    Action,
    DocumentSnapshot
} from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Observer } from 'rxjs';
import Contact from '../models/contact';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private contactCollectionRef: AngularFirestoreCollection<Contact>;

    constructor(public afAuth: AngularFireAuth, private db: AngularFirestore) {
        this.contactCollectionRef = db.collection('contacts');
    }

    getNameFromEmail(email: string): string {
        const str = email.trim().substring(0, email.indexOf('@'));
        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    register(email: string, password: string): Observable<Contact> {
        return Observable.create((observer: Observer<Contact>) => {
            this.afAuth.auth
                .createUserWithEmailAndPassword(email, password)
                .then(value => {
                    const user = value.user;
                    const contact: Contact = {
                        id: user.uid,
                        isOnline: true,
                        name: this.getNameFromEmail(email)
                    };
                    observer.next(contact);
                    localStorage.setItem(
                        'currentUser',
                        JSON.stringify(contact)
                    );
                    this.contactCollectionRef.doc(user.uid).set(contact);
                })
                .catch(err => {
                    observer.error(err);
                });
        });
    }

    login(email: string, password: string): Observable<Contact> {
        return Observable.create((observer: Observer<Contact>) => {
            this.afAuth.auth
                .signInWithEmailAndPassword(email, password)
                .then(value => {
                    const user = value.user;
                    this.contactCollectionRef
                        .doc(user.uid)
                        .get()
                        .subscribe(snapshot => {
                            const contact = {
                                ...snapshot.data,
                                id: user.uid,
                                name: this.getNameFromEmail(email)
                            };
                            observer.next(contact);
                            localStorage.setItem(
                                'currentUser',
                                JSON.stringify(contact)
                            );
                        });
                })
                .catch(err => {
                    observer.error(err);
                });
        });
    }

    logOut() {
        localStorage.removeItem('currentUser');
    }

    getCurrentUser(): Contact {
        const json = localStorage.getItem('currentUser');
        if (json) {
            return JSON.parse(json);
        }
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('currentUser');
    }
}
