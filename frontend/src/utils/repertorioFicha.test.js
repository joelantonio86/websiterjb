import test from 'node:test'
import assert from 'node:assert/strict'
import { blankFicha, moveSong, songKey, toggleOrderedSong } from './repertorioFicha.js'

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

test('desmarcar e marcar de novo devolve a ficha e o lugar da música', () => {
  const saved = [
    blankFicha({ title: 'Abertura', folder: 'racionais', mp3: 'Abertura', regencia: 'Joel' }),
    blankFicha({
      title: 'Jubileu de Ouro',
      folder: 'racionais',
      mp3: 'Jubileu_De_Ouro',
      regencia: 'Édila',
      interprete: 'Coral',
      partEsp: 'Bola Branca',
      observacao: 'Abertura',
    }),
    blankFicha({ title: 'Final', folder: 'racionais', mp3: 'Final' }),
  ]
  const catalog = { title: 'Jubileu de Ouro', folder: 'racionais', mp3: 'Jubileu_De_Ouro' }
  const removed = toggleOrderedSong(saved, catalog, saved)
  assert.deepEqual(removed.map((song) => song.title), ['Abertura', 'Final'])

  const restored = toggleOrderedSong(removed, catalog, saved)
  assert.deepEqual(restored.map((song) => song.title), ['Abertura', 'Jubileu de Ouro', 'Final'])
  assert.equal(restored[1].regencia, 'Édila')
  assert.equal(restored[1].interprete, 'Coral')
  assert.equal(restored[1].partEsp, 'Bola Branca')
  assert.equal(restored[1].observacao, 'Abertura')
  assert.equal(songKey(restored[1]), 'racionais-Jubileu_De_Ouro')
})

test('remarcar devolve a música ao lugar, mesmo com uma nova no fim', () => {
  const saved = [
    blankFicha({ title: 'Abertura', folder: 'racionais', mp3: 'Abertura', regencia: 'Joel' }),
    blankFicha({ title: 'Final', folder: 'racionais', mp3: 'Final' }),
  ]
  const withNew = toggleOrderedSong(saved, { title: 'Bolero', folder: 'diversas', mp3: 'Bolero' }, saved)
  const removed = toggleOrderedSong(withNew, saved[0], saved)
  const restored = toggleOrderedSong(removed, { title: 'Abertura', folder: 'racionais', mp3: 'Abertura' }, saved)
  assert.deepEqual(restored.map((song) => song.title), ['Abertura', 'Final', 'Bolero'])
  assert.equal(restored[0].regencia, 'Joel')
})

test('música nova entra no fim, sem ficha', () => {
  const current = [blankFicha({ title: 'Abertura', folder: 'racionais', mp3: 'Abertura', regencia: 'Joel' })]
  const added = toggleOrderedSong(current, { title: 'Bolero', folder: 'diversas', mp3: 'Bolero' }, current)
  assert.deepEqual(added.map((song) => song.title), ['Abertura', 'Bolero'])
  assert.equal(added[1].regencia, '')
  assert.equal(added[0].regencia, 'Joel')
})
