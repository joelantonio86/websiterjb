import test from 'node:test'
import assert from 'node:assert/strict'
import { blankFicha, moveSong } from './repertorioFicha.js'

test('a ficha guarda regência, intérprete, participação especial e observação', () => {
  const song = blankFicha({
    title: 'Jubileu de Ouro',
    folder: 'racionais',
    mp3: 'Jubileu_De_Ouro',
    regencia: ' Édila ',
    interprete: 'Coral',
    partEsp: 'Bola Branca',
    observacao: 'Abertura',
  })
  assert.equal(song.regencia, 'Édila')
  assert.equal(song.interprete, 'Coral')
  assert.equal(song.partEsp, 'Bola Branca')
  assert.equal(song.observacao, 'Abertura')
})

test('a ordem da ficha define o número da música', () => {
  const songs = [
    blankFicha({ title: 'Bolero de Ravel' }),
    blankFicha({ title: 'Mão de Luva' }),
    blankFicha({ title: 'Ode Alegria' }),
  ]
  const moved = moveSong(songs, 2, -1)
  assert.deepEqual(moved.map((song) => song.title), ['Bolero de Ravel', 'Ode Alegria', 'Mão de Luva'])
  assert.equal(moveSong(songs, 0, -1), songs)
})
