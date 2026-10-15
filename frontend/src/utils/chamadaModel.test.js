import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStageMap, mergeChamada, validateChamada } from './chamadaModel.js'

const members = [
  { id: '1', name: 'Ana Clara', instrument: 'Flauta', state: 'RJ' },
  { id: '2', name: 'Bruno Lima', instrument: 'Clarinete', state: 'SP' },
  { id: '3', name: 'Caio Souza', instrument: 'Trompete', state: 'MG' },
  { id: '4', name: 'Duda Reis', instrument: 'Regente', state: 'RJ' },
]

test('a chamada começa com todo mundo presente', () => {
  const rows = mergeChamada(members, [])
  assert.equal(rows.length, 4)
  assert.equal(rows.every((row) => row.status === 'presente'), true)
})

test('falta sai do mapa e o suplente do mesmo naipe entra no lugar', () => {
  const rows = mergeChamada(members, [
    { memberId: '1', status: 'falta' },
    { memberId: '2', status: 'suplente', replacesMemberId: '1' },
  ])
  assert.equal(validateChamada(rows), null)
  const map = buildStageMap(rows)
  assert.deepEqual(map.absent.map((row) => row.memberId), ['1'])
  assert.equal(map.onStage.some((row) => row.memberId === '1'), false)
  const sub = map.onStage.find((row) => row.memberId === '2')
  assert.equal(sub.replacesName, 'Ana')
  assert.equal(map.sections.some((section) => section.id === 'madeiras'), true)
  assert.equal(map.sections.some((section) => section.id === 'metais-agudos'), true)
})

test('suplente de outro naipe é recusado', () => {
  const rows = mergeChamada(members, [
    { memberId: '1', status: 'falta' },
    { memberId: '3', status: 'suplente', replacesMemberId: '1' },
  ])
  assert.match(validateChamada(rows), /mesmo naipe/)
})
