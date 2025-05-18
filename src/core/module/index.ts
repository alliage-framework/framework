import { KernelEventHandlers } from '../kernel/index.js';

export interface IModule {
  getKernelEventHandlers(): KernelEventHandlers;
}

export interface ModuleConstructor {
  new (): IModule;
}

export abstract class AbstractModule implements IModule {
  public getKernelEventHandlers() {
    return {};
  }
}
