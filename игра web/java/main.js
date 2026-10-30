import { Game } from './Game.js';

const $ = id => document.getElementById(id);
const ids = [
  'bar', 'pause', 'restart', 'overlay', 'ot', 'op', 
  'gMenu', 'gPause', 'gVol', 'gSettings', 'gWon', 'gLose',
  'bPlay', 'bSettings', 'bResume', 'bRestart2', 'bToMenu', 'bToMenu2', 
  'bBack', 'bAgain', 'bLoseAgain', 'bLoseMenu', 'vol', 'mute'
];

const ui = {};
ids.forEach(i => { 
  const el = $(i);
  if (el) ui[i] = el; 
  else console.warn(`Элемент с id="${i}" не найден в HTML!`);
});

new Game($('c'), ui);

$('full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
  $('full').blur();
};