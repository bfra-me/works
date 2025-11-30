/**
 * @bfra.me/es/functional - Functional programming utilities
 */

export {
  createCustomKeyResolver,
  createKeyResolver,
  createLRUCache,
  createTTLCache,
  createWeakCache,
  type Cache,
  type CacheStats,
  type KeyResolverOptions,
  type LRUCacheOptions,
  type TTLCacheOptions,
  type WeakCache,
  type WeakCacheOptions,
} from './cache'
export {compose} from './compose'
export {constant} from './constant'
export {curry, type Curried} from './curry'
export {flip} from './flip'
export {identity} from './identity'
export {
  memoize,
  memoizeAsync,
  type MemoizeCacheStrategy,
  type MemoizedFunction,
  type MemoizeOptions,
} from './memoize'
export {noop, noopAsync} from './noop'
export {partial} from './partial'
export {pipe} from './pipe'
export {tap} from './tap'
