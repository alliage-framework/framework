import path from 'path';
import { vi, describe, it, expect } from 'vitest';

import { AbstractScript } from '..';
import { Kernel } from '../../kernel';

vi.mock('../../kernel', () => {
  const KernelMock = vi.fn();
  KernelMock.prototype.build = vi.fn();
  KernelMock.prototype.install = vi.fn();
  KernelMock.prototype.run = vi.fn();
  return { Kernel: KernelMock };
});

describe('core/script', () => {
  describe('AbstractScript', () => {
    vi.doMock(path.resolve('./relative/path/1'), () => ({ default: { name: 'module1' } }));
    vi.doMock(path.resolve('../relative/path/2'), () => ({ default: { name: 'module2' } }));
    vi.doMock('/relative/path/3', () => ({ default: { name: 'module3' } }));
    vi.doMock('global-module', () => ({ default: { name: 'module4' } }));

    vi.doMock(
      path.resolve('./alliage-modules.json'),
      () => ({ default: {
        module1: {
          module: './relative/path/1',
          deps: ['module2'],
          envs: ['dev'],
        },
        module2: {
          module: '../relative/path/2',
          deps: ['module3'],
        },
        module3: {
          module: '/relative/path/3',
          deps: ['module4'],
          envs: ['dev', 'production'],
        },
        module4: {
          module: 'global-module',
          deps: [],
        },
      }})
    );

    it('should load the kernel when instanciated', async () => {
      let kernelMock;
      class ConcreteScript extends AbstractScript {
        async execute() {
          await super.execute();
          kernelMock = this.getKernel();
        }
      }

      const script = new ConcreteScript({ initial_value: 'test' });
      await script.execute();
      
      expect(Kernel).toHaveBeenCalledWith(
        {
          module1: [{ name: 'module1' }, ['module2'], ['dev']],
          module2: [{ name: 'module2' }, ['module3'], []],
          module3: [{ name: 'module3' }, ['module4'], ['dev', 'production']],
          module4: [{ name: 'module4' }, [], []],
        },
        { initial_value: 'test' },
      );
      expect(kernelMock).toBeInstanceOf(Kernel);
    });

    it('should throw an error if the kernel is not initialized', async () => {
      class ConcreteScript extends AbstractScript {
        async execute() {
          this.getKernel();
        }
      }

      const script = new ConcreteScript({ initial_value: 'test' });
      await expect(script.execute()).rejects.toThrow('Script not initialized');
    });
  });
});