import { Pipe, PipeTransform } from '@angular/core';
const emoji = require('node-emoji');

@Pipe({ name: 'emojify' })
export class EmojifyPipe implements PipeTransform {
    transform(value: string): string {
        return emoji.emojify(value);
    }
}
