import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

// Standart hajmlar — admin keyin panel orqali qo'shadi/o'chiradi
const SIZES = [10, 15, 20, 30, 50, 100]

async function seedSizes() {
  for (const [i, ml] of SIZES.entries()) {
    await prisma.size.upsert({
      where: { valueMl: ml },
      update: {},
      create: { valueMl: ml, label: `${ml} ml`, sortOrder: i },
    })
  }
  console.log(`Hajmlar: ${SIZES.length} ta tayyor`)
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME va ADMIN_PASSWORD .env da to'ldirilmagan — admin yaratilmadi."
    )
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.adminUser.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, role: 'admin' },
  })
  console.log(`Admin: "${username}" tayyor`)
}

async function seedSettings() {
  await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      deliveryInfo:
        "Toshkent shahri va Toshkent viloyati bo'ylab 1–3 kun ichida bepul yetkazib beriladi.",
      deliveryPrice: 0,
    },
  })
  console.log("Do'kon sozlamalari tayyor")
}

/* ------------------------------------------------------------------
   DEMO ma'lumotlari — faqat `--demo` bayrog'i bilan.
   Bu test uchun, production bazaga tushmasligi kerak.
   Tozalash: node prisma/seed.mjs --clear-demo
   ------------------------------------------------------------------ */
const DEMO_BRANDS = [
  { name: 'Dior', slug: 'dior' },
  { name: 'Chanel', slug: 'chanel' },
  { name: 'Lattafa', slug: 'lattafa' },
  { name: 'Armaf', slug: 'armaf' },
]

const DEMO_PRODUCTS = [
  {
    name: 'Sauvage',
    slug: 'demo-dior-sauvage',
    brand: 'dior',
    gender: 'MEN',
    shortDescription: 'Bergamot va ambroksan asosidagi yangi, keskin hid.',
    image: '/demo/dior-sauvage.webp',
    prices: { 30: 320000, 50: 450000, 100: 790000 },
    featured: true,
  },
  {
    name: 'Coco Mademoiselle',
    slug: 'demo-chanel-coco-mademoiselle',
    brand: 'chanel',
    gender: 'WOMEN',
    shortDescription: 'Apelsin, jasmin va paçuli uyg\'unligi.',
    image: '/demo/chanel-coco-mademoiselle.webp',
    prices: { 30: 410000, 50: 620000 },
    featured: true,
  },
  {
    name: 'Asad',
    slug: 'demo-lattafa-asad',
    brand: 'lattafa',
    gender: 'MEN',
    shortDescription: 'Qora murch, tamaki va vanil notalari.',
    image: '/demo/lattafa-asad.webp',
    prices: { 30: 120000, 50: 180000 },
    discount: { 50: 15 },
  },
  {
    name: 'Club de Nuit Intense',
    slug: 'demo-armaf-club-de-nuit',
    brand: 'armaf',
    gender: 'UNISEX',
    shortDescription: 'Limon, olma va qora smorodina ochilishi.',
    image: '/demo/armaf-club-de-nuit.webp',
    prices: { 50: 210000, 100: 340000 },
  },
]

async function seedDemo() {
  const brandIds = {}
  for (const [i, b] of DEMO_BRANDS.entries()) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: { ...b, sortOrder: i },
    })
    brandIds[b.slug] = brand.id
  }

  const sizes = await prisma.size.findMany()
  const sizeByMl = Object.fromEntries(sizes.map((s) => [s.valueMl, s.id]))

  for (const p of DEMO_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        gender: p.gender,
        shortDescription: p.shortDescription,
        brandId: brandIds[p.brand],
        isFeatured: Boolean(p.featured),
        variants: {
          create: Object.entries(p.prices).map(([ml, price]) => {
            const discount = p.discount?.[ml] ?? 0
            return {
              sizeId: sizeByMl[Number(ml)],
              price,
              discountPercent: discount,
              // Katalogdagi narx filtri va saralash shu ustun bo'yicha ishlaydi
              finalPrice: discount ? Math.round(price * (1 - discount / 100)) : price,
              stockQty: 10,
              inStock: true,
            }
          }),
        },
      },
    })

    // Rasm upsert'dan tashqarida yangilanadi: `update: {}` mavjud yozuvga tegmaydi,
    // shuning uchun --demo ni qayta ishga tushirish eski rasmni almashtirmay qolardi.
    // Demo rasmlar loyihaning public/ papkasidan — Cloudinary'siz; publicId "local:"
    // bilan boshlanadi => o'chirishda Cloudinary chaqirilmaydi.
    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.image,
        publicId: `local:${p.slug}`,
        sortOrder: 0,
      },
    })

    console.log(`Demo mahsulot: ${p.name} (${product.slug})`)
  }
  console.log(
    `\nDemo: ${DEMO_BRANDS.length} brend, ${DEMO_PRODUCTS.length} mahsulot qo'shildi.`
  )
}

async function clearDemo() {
  const { count } = await prisma.product.deleteMany({
    where: { slug: { startsWith: 'demo-' } },
  })
  const brands = await prisma.brand.deleteMany({
    where: { slug: { in: DEMO_BRANDS.map((b) => b.slug) }, products: { none: {} } },
  })
  console.log(`Demo tozalandi: ${count} mahsulot, ${brands.count} brend o'chirildi.`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--clear-demo')) {
    await clearDemo()
    return
  }

  await seedSizes()
  await seedAdmin()
  await seedSettings()

  if (args.includes('--demo')) {
    await seedDemo()
  } else {
    console.log('\nDemo ma\'lumotsiz. Test uchun: node prisma/seed.mjs --demo')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed xatosi:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  })
