import test from 'node:test'
import assert from 'node:assert/strict'
import { filterMembers, uniqueMemberInstruments } from './memberFilters.js'

const members = [
  { id: '1', name: 'Maurilio', instrument: 'Trombone Baixo', city: 'Fortaleza', state: 'CE' },
  { id: '2', name: 'Diego', instrument: 'Trombone baixo ', city: 'Rio de Janeiro', state: 'RJ' },
  { id: '3', name: 'Ana', instrument: 'Trombone', city: 'São Paulo', state: 'SP' },
  { id: '4', name: 'Lia', instrument: 'Baixo', city: 'Belo Horizonte', state: 'MG' },
]

test('pesquisar trombone baixo encontra os dois, mesmo com espaço ou caixa diferente', () => {
  const found = filterMembers(members, { name: 'trombone baixo' })
  assert.deepEqual(found.map((member) => member.id), ['1', '2'])
})

test('o filtro de instrumento agrupa a mesma grafia e não traz trombone nem baixo', () => {
  const options = uniqueMemberInstruments(members)
  assert.deepEqual(options, ['Baixo', 'Trombone', 'Trombone Baixo'])
  const found = filterMembers(members, { instrument: 'Trombone Baixo' })
  assert.deepEqual(found.map((member) => member.id), ['1', '2'])
})

test('a busca por nome continua encontrando a pessoa', () => {
  const found = filterMembers(members, { name: 'diego' })
  assert.deepEqual(found.map((member) => member.id), ['2'])
})
