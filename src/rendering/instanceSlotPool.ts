export interface SlotRelease {
  vacated: number;
  swappedFrom: number | null;
}

export class InstanceSlotPool {
  private readonly idBySlot: number[];
  private readonly slotById = new Map<number, number>();
  private used = 0;

  constructor(readonly capacity: number) {
    if (capacity < 1) {
      throw new Error('InstanceSlotPool capacity must be at least 1.');
    }
    this.idBySlot = Array.from({ length: capacity }, () => -1);
  }

  get size(): number {
    return this.used;
  }

  has(id: number): boolean {
    return this.slotById.has(id);
  }

  get(id: number): number | undefined {
    return this.slotById.get(id);
  }

  ids(): number[] {
    return [...this.slotById.keys()];
  }

  acquire(id: number): number | null {
    const existing = this.slotById.get(id);
    if (existing !== undefined) {
      return existing;
    }

    if (this.used >= this.capacity) {
      return null;
    }

    const slot = this.used;
    this.used += 1;
    this.idBySlot[slot] = id;
    this.slotById.set(id, slot);
    return slot;
  }

  release(id: number): SlotRelease | null {
    const slot = this.slotById.get(id);
    if (slot === undefined) {
      return null;
    }

    const last = this.used - 1;
    this.slotById.delete(id);

    if (slot !== last) {
      const movedId = this.idBySlot[last];
      if (movedId !== undefined && movedId !== -1) {
        this.idBySlot[slot] = movedId;
        this.slotById.set(movedId, slot);
      }
    }

    this.idBySlot[last] = -1;
    this.used -= 1;
    return { vacated: slot, swappedFrom: slot === last ? null : last };
  }

  reset(): void {
    this.slotById.clear();
    this.idBySlot.fill(-1);
    this.used = 0;
  }
}
