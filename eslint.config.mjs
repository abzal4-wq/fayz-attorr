import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Sayt matnlari o'zbek tilida. Apostrof o'zbek orfografiyasining bir qismi
      // ("ko'rish", "o'zingiz", "do'kon") va deyarli har bir jumlada uchraydi.
      // Har birini &apos; ga aylantirish matnni o'qib bo'lmas holga keltiradi va
      // tarjima fayllari bilan ishlashni qiyinlashtiradi. Qoida o'chirildi.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'lib/generated/**',
    ],
  },
]

export default eslintConfig
