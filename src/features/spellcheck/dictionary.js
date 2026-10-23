/** Optional English dictionary: fetched only when spellcheck schedules idle work. */
import Typo from 'typo-js';
import aff from './dict/en_US.aff?raw';
import dic from './dict/en_US.dic?raw';

export function createDictionary() {
    return new Typo('en_US', aff, dic);
}
