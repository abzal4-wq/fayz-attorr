// Test ishga tushishidan oldin import yechuvchini ro'yxatdan o'tkazadi.
import { register } from 'node:module'

register('./resolver.mjs', import.meta.url)
