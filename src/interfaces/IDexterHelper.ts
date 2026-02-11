import { Dexter } from '../Dexter.js';

export abstract class IDexterHelper {
    constructor(
        protected dexter: Dexter,
    ) {}
}