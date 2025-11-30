import type {Cache, CacheStats, LRUCacheOptions} from './types'

/**
 * Node in the doubly-linked list for O(1) LRU operations.
 */
interface LRUNode<K, V> {
  key: K
  value: V
  prev: LRUNode<K, V> | undefined
  next: LRUNode<K, V> | undefined
}

/**
 * Creates an LRU (Least Recently Used) cache with O(1) lookup and eviction.
 *
 * Uses a doubly-linked list and hash map for constant-time operations.
 *
 * @param options - LRU cache configuration
 * @returns A cache instance with LRU eviction policy
 *
 * @example
 * ```ts
 * const cache = createLRUCache<string, number>({ maxSize: 100 })
 * cache.set('key', 42)
 * cache.get('key') // => 42
 * ```
 */
export function createLRUCache<K, V>(options: LRUCacheOptions): Cache<K, V> {
  const {maxSize} = options

  if (maxSize < 1) {
    throw new Error('LRU cache maxSize must be at least 1')
  }

  const cache = new Map<K, LRUNode<K, V>>()
  let head: LRUNode<K, V> | undefined
  let tail: LRUNode<K, V> | undefined

  let hits = 0
  let misses = 0
  let evictions = 0

  function moveToHead(node: LRUNode<K, V>): void {
    if (node === head) {
      return
    }

    // Remove node from current position
    if (node.prev !== undefined) {
      node.prev.next = node.next
    }
    if (node.next !== undefined) {
      node.next.prev = node.prev
    }
    if (node === tail) {
      tail = node.prev
    }

    // Move to head
    node.prev = undefined
    node.next = head
    if (head !== undefined) {
      head.prev = node
    }
    head = node
    if (tail === undefined) {
      tail = node
    }
  }

  function evictLRU(): void {
    if (tail === undefined) {
      return
    }

    const nodeToRemove = tail
    cache.delete(nodeToRemove.key)
    evictions++

    if (tail.prev === undefined) {
      head = undefined
      tail = undefined
    } else {
      tail.prev.next = undefined
      tail = tail.prev
    }
  }

  return {
    get(key: K): V | undefined {
      const node = cache.get(key)
      if (node === undefined) {
        misses++
        return undefined
      }

      hits++
      moveToHead(node)
      return node.value
    },

    set(key: K, value: V): void {
      const existingNode = cache.get(key)

      if (existingNode !== undefined) {
        existingNode.value = value
        moveToHead(existingNode)
        return
      }

      // Evict if at capacity
      if (cache.size >= maxSize) {
        evictLRU()
      }

      // Create new node at head
      const newNode: LRUNode<K, V> = {
        key,
        value,
        prev: undefined,
        next: head,
      }

      if (head !== undefined) {
        head.prev = newNode
      }
      head = newNode
      if (tail === undefined) {
        tail = newNode
      }

      cache.set(key, newNode)
    },

    has(key: K): boolean {
      return cache.has(key)
    },

    delete(key: K): boolean {
      const node = cache.get(key)
      if (node === undefined) {
        return false
      }

      // Remove from linked list
      if (node.prev !== undefined) {
        node.prev.next = node.next
      }
      if (node.next !== undefined) {
        node.next.prev = node.prev
      }
      if (node === head) {
        head = node.next
      }
      if (node === tail) {
        tail = node.prev
      }

      return cache.delete(key)
    },

    clear(): void {
      cache.clear()
      head = undefined
      tail = undefined
    },

    getStats(): CacheStats {
      return {
        hits,
        misses,
        evictions,
        size: cache.size,
      }
    },

    resetStats(): void {
      hits = 0
      misses = 0
      evictions = 0
    },
  }
}
