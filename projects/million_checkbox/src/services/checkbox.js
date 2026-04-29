/**
 * Checkbox state is stored as a Redis bitmap at key `cb:bitmap`.
 *
 * 1 000 000 checkboxes  →  125 000 bytes  →  ~125 KB
 *
 * Redis bitmap commands (SETBIT / GETBIT / BITCOUNT) operate on
 * individual bits, giving O(1) toggle & read per checkbox.
 *
 * A Lua script is used for atomic toggle (read-then-flip) to
 * avoid race conditions when two users toggle the same checkbox
 * at the same instant.
 */

const BITMAP_KEY = 'cb:bitmap';
const TOTAL = 1_000_000;
const BITMAP_BYTES = Math.ceil(TOTAL / 8); // 125 000

// Lua: atomically toggle a single bit and return the new value
const TOGGLE_LUA = `
local bit = redis.call('GETBIT', KEYS[1], ARGV[1])
local newBit = 1 - bit
redis.call('SETBIT', KEYS[1], ARGV[1], newBit)
return newBit
`;

export async function toggleCheckbox(redis, index) {
  if (index < 0 || index >= TOTAL) return null;
  return redis.eval(TOGGLE_LUA, 1, BITMAP_KEY, index);
}

export async function getCheckboxBuffer(redis) {
  const buf = await redis.getBuffer(BITMAP_KEY);
  if (!buf || buf.length === 0) return Buffer.alloc(BITMAP_BYTES);
  if (buf.length < BITMAP_BYTES) {
    const padded = Buffer.alloc(BITMAP_BYTES);
    buf.copy(padded);
    return padded;
  }
  return buf;
}

export async function getCheckedCount(redis) {
  return (await redis.bitcount(BITMAP_KEY)) || 0;
}
