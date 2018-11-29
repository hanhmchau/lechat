import { NgModule } from '@angular/core';
import {
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatToolbarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatGridListModule,
    MatSlideToggleModule
} from '@angular/material';

const modules = [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatToolbarModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatGridListModule,
    MatSlideToggleModule
];

@NgModule({
    imports: modules,
    exports: modules
})
export class MaterialModule {}
