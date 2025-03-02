export class FrozenContainerError extends Error {}

export class PrimitiveContainer {
  private isFrozen: boolean;

  private container: Map<string, unknown>;

  public constructor(data: Record<string, unknown>) {
    this.container = new Map<string, unknown>(Object.entries(data));
    this.isFrozen = false;
  }

  public freeze() {
    this.isFrozen = true;
  }

  public get<T>(name: string): T {
    return this.container.get(name) as T;
  }

  private throwIfFrozen() {
    if (this.isFrozen) {
      throw new FrozenContainerError('The container is frozen.');
    }
  }

  set(name: string, value: unknown) {
    this.throwIfFrozen();
    this.container.set(name, value);
    return this;
  }

  delete(name: string) {
    this.throwIfFrozen();
    this.container.delete(name);
    return this;
  }

  clear() {
    this.throwIfFrozen();
    this.container.clear();
    return this;
  }
}
