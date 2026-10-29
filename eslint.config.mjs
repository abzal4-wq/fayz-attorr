import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  /*
   * .jsx fayllar ANIQ ko'rsatilishi shart.
   *
   * ESLint 9 (flat config) standart holatda faqat .js/.mjs/.cjs ni
   * tekshiradi. Bu qator bo'lmaganida barcha React komponentlari
   * (`components/**` dagi .jsx) "no matching configuration" deb
   * jimgina o'tkazib yuborilardi — `npm run lint` toza chiqardi, lekin
   * komponentlar umuman tekshirilmasdi.
   *
   * Natijada `rules-of-hooks` buzilishi (checkout-form.jsx da hook erta
   * `return` dan keyin turgan) ikki hafta jonli saytda turdi va
   * savatda mahsulot bo'lsa /buyurtma sahifasi har safar qulardi.
   */
  { files: ['**/*.{js,jsx,mjs}'] },
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
