import type { Content } from './content';

export interface Grade {
    id: string;
    name: string;
    contents: Content[];
}
