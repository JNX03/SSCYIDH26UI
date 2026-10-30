import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HALLOWEEN_TRACK,HALLOWEEN_EMBED_TRACK} from '../src/lobby-music.js';
test('the lobby embeds the exact requested Halloween recording through its official provider',()=>{
 assert.equal(HALLOWEEN_TRACK,'https://soundcloud.com/kahoot-lobby-music/halloween-original');
 assert.equal(HALLOWEEN_EMBED_TRACK,'https://api.soundcloud.com/tracks/732989191');
 const source=readFileSync(new URL('../src/lobby-music.js',import.meta.url),'utf8');
 assert.match(source,/https:\/\/w\.soundcloud\.com\/player\//);
 assert.match(source,/isHost&&phase==='lobby'/);
 assert.match(source,/current\?\.container!==container/);
 assert.match(source,/current\.widget\?\.pause/);
});
