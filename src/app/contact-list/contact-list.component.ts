import { Component, EventEmitter, Input, Output, Inject } from '@angular/core';
import Message from '../models/message';
import Contact from '../models/contact';
import { MessageService } from './../services/message.service';
import Preview from '../models/preview';
const getUrls = require('get-urls');
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

interface DialogData {
    onConnect: EventEmitter<string>,
    contacts: Contact[]
}

@Component({
    selector: 'app-contact-list',
    templateUrl: './contact-list.component.html',
    styleUrls: ['./contact-list.component.css']
})
export class ContactListComponent {
    @Input() contacts: Contact[];
    @Output() onConnect = new EventEmitter<string>();

    constructor(public dialog: MatDialog) {}

    openDialog() {
        const dialogRef = this.dialog.open(ContactModalComponent, {
            maxWidth: '100vw',
            width: '25vw',
            data: {
                onConnect: this.onConnect,
                contacts: this.contacts
            }
        });
    }
}

@Component({
    styleUrls: ['./contact-modal.component.css'],
    selector: 'app-contact-modal',
    templateUrl: 'contact-modal.component.html'
})
export class ContactModalComponent {
    private contactGroups: Map<string, Contact[]>;
    private contacts: Contact[];
    constructor(
        public dialogRef: MatDialogRef<ContactModalComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData
    ) {
        this.contacts = dialogData.contacts;
        this.contactGroups = this.alphabetizeContacts(this.contacts);
    }

    connect(id: string) {
        this.dialogData.onConnect.emit(id);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    
    private alphabetizeContacts(contacts: Contact[]): Map<string, Contact[]> {
        const contactMap = new Map<string, Contact[]>();
        contacts = contacts.sort((a, b) => a.name.localeCompare(b.name));
        contacts.forEach(contact => {
            const firstLetter = contact.name.charAt(0).toUpperCase();
            const array = contactMap.get(firstLetter) || [];
            array.push(contact);
            contactMap.set(firstLetter, array);
        });
        return contactMap;
    }
}
