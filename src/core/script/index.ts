import path from 'path';

import { Kernel, ModuleMap } from '../kernel/index.js';
import { Arguments } from '../utils/cli.js';
import { pathToFileURL } from 'url';

const LOCAL_MODULE_PATTERN = /^\.{0,2}\//;

export interface ModulesDefinition {
  [key: string]: {
    module: string;
    deps: string[];
    envs?: string[];
  };
}

export abstract class AbstractScript {
  private kernel: Kernel | undefined;

  public constructor(private primitiveContainerData: Record<string, unknown>) {}

  public async init() {
    this.kernel = await this.loadKernel(this.primitiveContainerData);
  }

  private async loadKernel(primitiveContainerData: Record<string, unknown>) {
    const modulesDefinition: ModulesDefinition = (
      await import(pathToFileURL(path.resolve('./alliage-modules.json')).href, {
        with: {
          type: 'json',
        },
      })
    ).default;

    const loadedModules = await Promise.all(
      Object.entries(modulesDefinition).map(async ([name, def]) => {
        const module = LOCAL_MODULE_PATTERN.test(def.module)
          ? await import(pathToFileURL(path.resolve(def.module)).href)
          : await import(def.module);
        return [name, [module.default, def.deps, def.envs ?? []]] as const;
      }),
    );

    const modules: ModuleMap = loadedModules.reduce((acc, [name, [module, deps, envs]]) => {
      return {
        ...acc,
        [name]: [module, deps, envs],
      };
    }, {});

    return new Kernel(modules, primitiveContainerData);
  }

  protected getKernel() {
    if (!this.kernel) {
      throw new Error('Script not initialized');
    }
    return this.kernel;
  }

  public async execute(_args?: Arguments, _env?: string) {
    await this.init();
  }
}

export interface ScriptConstructor {
  new (primitiveContainerData: Record<string, unknown>): AbstractScript;
}
