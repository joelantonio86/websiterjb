import test from 'node:test'
import assert from 'node:assert/strict'
import { canViewFinance } from './financeAccess.js'

test('andressamqxs@gmail.com consulta o financeiro sem ser o papel financeiro', () => {
  assert.equal(canViewFinance({ email: 'AndressaMQXS@gmail.com', role: 'admin' }), true)
})

test('outro e-mail sem papel financeiro fica de fora', () => {
  assert.equal(canViewFinance({ email: 'outra@gmail.com', role: 'admin' }), false)
})

test('os papéis financeiros continuam entrando', () => {
  assert.equal(canViewFinance({ email: 'financeiro@exemplo.com', role: 'financeiro-view' }), true)
  assert.equal(canViewFinance({ email: 'financeiro@exemplo.com', role: 'admin-financeiro' }), true)
})
