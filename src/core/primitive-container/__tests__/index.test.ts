import { describe, it, expect } from 'vitest';
import { PrimitiveContainer, FrozenContainerError } from '../../..';

describe('core/primitive-container', () => {
  const pc = new PrimitiveContainer({ initial_value: 'test' });
  const value = { foo: 'bar' };
  describe('#get / #set / #delete', () => {
    it('should have an initial value', () => {
      expect(pc.get('initial_value')).toBe('test');
    });

    it('should allow to set a value and to get it', () => {
      pc.set('value', value);

      expect(pc.get<typeof value>('value')).toBe(value);
    });

    it('should allow to clear a value', () => {
      pc.delete('value');

      expect(pc.get<typeof value>('value')).toBeUndefined();
    });
  });

  describe('#clear', () => {
    it('should clear all the values', () => {
      pc.set('value1', 'value1')
        .set('value2', 'value2')
        .set('value3', 'value3');

      pc.clear();

      expect(pc.get<string>('value1')).toBeUndefined();
      expect(pc.get<string>('value2')).toBeUndefined();
      expect(pc.get<string>('value3')).toBeUndefined();
    });
  });

  describe('#freeze', () => {
    it("should throw error whenever we try to update the container's content once frozen", () => {
      pc.freeze();

      expect(() => pc.set('value', 'value')).toThrowError(FrozenContainerError);
      expect(() => pc.delete('value')).toThrowError(FrozenContainerError);
      expect(() => pc.clear()).toThrowError(FrozenContainerError);
    });
  });
}); 