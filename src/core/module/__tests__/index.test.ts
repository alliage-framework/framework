import { describe, it, expect } from 'vitest';
import { AbstractModule } from '../../..';

describe('core/module', () => {
  describe('AbstractModule', () => {
    it('should implement the `getKernelEventHandlers` method', () => {
      class ConcreteModule extends AbstractModule {}

      const concreteModule = new ConcreteModule();
      expect(concreteModule.getKernelEventHandlers).toBeInstanceOf(Function);
      expect(concreteModule.getKernelEventHandlers()).toEqual({});
    });
  });
}); 