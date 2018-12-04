import { Pipe, PipeTransform } from '@angular/core';
import * as pretty from 'pretty-bytes';

@Pipe({ name: 'prettyBytes' })
export class PrettyBytesPipe implements PipeTransform {
    transform(value: number): string {
        return pretty(value);
    }
}
