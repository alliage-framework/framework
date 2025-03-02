import path from 'path';

import { AbstractScript } from '..';
import { Kernel } from '../../kernel';

jest.mock('../../kernel', () => {
  const KernelMock = jest.fn();
  KernelMock.prototype.build = jest.fn();
  KernelMock.prototype.install = jest.fn();
  KernelMock.prototype.run = jest.fn();
  return { Kernel: KernelMock };
});

describe('core/script', () => {
  describe('AbstractScript', () => {
    jest.doMock(path.resolve('./relative/path/1'), () => ({ name: 'module1' }), {
      virtual: true,
    });
    jest.doMock(path.resolve('../relative/path/2'), () => ({ name: 'module2' }), { virtual: true });
    jest.doMock('/relative/path/3', () => ({ name: 'module3' }), { virtual: true });
    jest.doMock('global-module', () => ({ name: 'module4' }), { virtual: true });

    jest.doMock(
      path.resolve('./alliage-modules.json'),
      () => ({
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
      }),
      { virtual: true },
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
