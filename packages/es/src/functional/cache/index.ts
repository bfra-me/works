/**
 * @bfra.me/es/functional/cache - Cache strategies for memoization
 */

export {createCustomKeyResolver, createKeyResolver, type KeyResolverOptions} from './key-resolver'
export {createLRUCache} from './lru'
export {createTTLCache} from './ttl'
export type {Cache, CacheStats, LRUCacheOptions, TTLCacheOptions, WeakCacheOptions} from './types'
export {createWeakCache, type WeakCache} from './weak'
