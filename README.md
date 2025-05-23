# Alliage

<!-- <p align="center">
  <img src="./docs/assets/logo.svg" width="70%">
<p> -->

Alliage is your **minimalist**, **modular**, and **unopinionated** Node.js framework, empowering you to build precisely what you need, nothing more, nothing less.

## The Alliage Philosophy: Nothing and Anything

Alliage operates on a unique dual principle:

- **It does nothing by default**: As an unopinionated framework, Alliage doesn't impose built-in features you might not need.
- **It can do anything you want**: Alliage's power lies in its extensibility. You define its functionality through modules, making your imagination the only limit.

## Core Concepts: How Alliage Works

Every Alliage application follows a simple lifecycle, managed by the `alliage-scripts` command:

1.  ⚙️ **Installation**: Sets up your project, manages files, and installs dependencies.
2.  🛠 **Build**: Handles tasks like code transpilation or creating executables.
3.  🚀 **Run**: Executes your application.

You control these stages using:

```bash
npx alliage-scripts [install|build|run]
```

Executing any script initializes the **Kernel**. The Kernel then triggers a sequence of events. Modules, acting as event listeners, subscribe to these events and execute their logic.

Here's a visual representation of the process:

<img src="./docs/assets/diagram.svg" />

**Event Breakdown:**

- **`init`**: Triggered for every script, before any other specific event.
- **`install`**: Triggered only by the `install` script.
- **`build`**: Triggered only by the `build` script.
- **`run`**: Triggered only by the `run` script.

Modules selectively listen to these events, ensuring code runs only when relevant.

## Getting Started

### Installation

1.  Install the core package:

    ```bash
    npm install alliage
    ```

2.  Create an empty `alliage-modules.json` file at your project root. This file will map your modules.
    ```bash
    echo "{}" > alliage-modules.json
    ```

## Building with Modules

Modules are the fundamental building blocks in Alliage. They are essentially event listeners, making them powerful yet simple to create.

### Creating Your First Module

A module is a class that extends `AbstractModule` and implements `getKernelEventHandlers()`. This method returns an object mapping event names to handler methods.

**JavaScript**

```javascript
import { AbstractModule } from '@alliage/framework';

export class MyFirstModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
      run: this.onRun,
    };
  }

  onInit = async (args, env, container) => {
    console.log('Initialization phase!');
  };

  onRun = async (args, env, container) => {
    console.log('Application is running!');
  };
}
```

**TypeScript**

```typescript
import { AbstractModule, Arguments, PrimitiveContainer } from '@alliage/framework';

export class MyFirstModule extends AbstractModule {
  getKernelEventHandlers(): KernelEventHandlersMap {
    return {
      init: this.onInit,
      run: this.onRun,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    console.log('Initialization phase!');
  };

  onRun = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    console.log('Application is running!');
  };
}
```

### Registering Modules

Modules are registered in your `alliage-modules.json` file. To register `MyFirstModule` (assuming it's saved in `./src/my-first-module.js` or `.ts`):

```json
{
  "my-first-module": {
    "module": "./src/my-first-module",
    "deps": []
  }
}
```

**Configuration Details:**

- `"my-first-module"`: A unique name for your module.
- `module`: The path to the module file (relative, absolute, or a Node module name).
- `deps`: An array of other module names that this module depends on. Dependencies are loaded and executed first.

Example with dependencies:

```json
{
  "my-first-module": {
    "module": "./src/my-first-module",
    "deps": ["my-second-module"]
  },
  "my-second-module": {
    "module": "./src/my-second-module",
    "deps": []
  }
}
```

Here, `my-second-module` will be processed before `my-first-module`.

### Seeing It in Action

Run your application:

```bash
npx alliage-scripts run
```

Expected output:

```bash
Initialization phase!
Application is running!
```

If you run the `install` script:

```bash
$(npm bin)/alliage-scripts install
```

Expected output:

```bash
Initialization phase!
```

## Advanced Features

### Argument Parsing

Alliage includes a basic argument parsing feature, suitable for simple CLI needs. For complex CLIs, consider dedicated libraries.

Event handlers receive three arguments: `args`, `env`, and `container`.
The `args` parameter is an instance of the `Arguments` class, providing:

- `get(name: string): boolean | number | string | undefined`: Retrieves a parsed argument's value. Initially, only `"script"` (e.g., `"install"`, `"build"`, `"run"`) is available.
- `getRemainingArgs(): string[]`: Returns arguments not parsed by the initial command. This is useful for custom CLI logic.
- `getCommand(): string`: Returns the executed command string.
- `getParent(): Arguments | null`: Returns the `Arguments` instance from which the current one was parsed (if any).

#### Configuring Commands with `CommandBuilder`

To parse `remainingArgs`, use `CommandBuilder`:

```typescript
import { CommandBuilder, ArgumentsParser } from '@alliage/framework';

// Inside an event handler, e.g., onRun
async onRun(args, env, container) {
  const builder = CommandBuilder.create()
    .setDescription('My custom command description.')
    .addArgument('arg1', {
      describe: 'Description for arg1.',
      type: 'string', // "string", "number", or "boolean"
    })
    .addArgument('arg2', {
      describe: 'Description for arg2.',
      type: 'number',
      choices: [1, 2, 3], // Restricts accepted values
    })
    .addOption('myOption', { // Options are non-mandatory and position-independent
      describe: 'Description for myOption.',
      type: 'string',
      default: 'defaultValue', // Default value if not provided
    });

  const parsedArgs = ArgumentsParser.parse(builder, args);
  console.log(parsedArgs.get('arg1'));
}
```

This configuration supports commands like:
```bash
npx alliage-scripts run value1 2 --myOption=custom
npx alliage-scripts run --myOption=another testValue 1
````

But would reject:

```bash
# Value not allowed for arg2
npx alliage-scripts run test1 42 --myOption=ok

# Missing Arg1 (if not made optional)
npx alliage-scripts run --myOption=ok 1
```

#### Parsing with `ArgumentsParser`

After configuring `CommandBuilder`, parse the arguments:

**JavaScript**

```javascript
import { CommandBuilder, ArgumentsParser } from '@alliage/framework';

// Assuming 'builder' is a configured CommandBuilder instance
// and 'initialArgs' is the Arguments object passed to your event handler.

async onRun(initialArgs, env, container) {
  const builder = CommandBuilder.create()... (configured as above)
  const parsedArgs = ArgumentsParser.parse(builder, initialArgs);

  console.log('Arg1:', parsedArgs.get('arg1'));
  console.log('Arg2:', parsedArgs.get('arg2'));
  console.log('MyOption:', parsedArgs.get('myOption'));
  console.log('Parent args match initial:', parsedArgs.getParent() === initialArgs);
}
```

### Environment-Specific Configuration

The `env` variable passed to event handlers reflects the `--env` option used with `alliage-scripts` (defaults to `"production"`). This allows for environment-specific logic.

You can also configure modules in `alliage-modules.json` to load only in specific environments using the `envs` property:

```json
{
  "my-prod-module": {
    "module": "./src/my-prod-module",
    "deps": [],
    "envs": ["production", "test"]
  },
  "my-dev-module": {
    "module": "./src/my-dev-module",
    "deps": [],
    "envs": ["development"]
  }
}
```

- `my-prod-module` loads in `"production"` or `"test"` environments.
- `my-dev-module` loads only in `"development"`.
  If `envs` is omitted or empty, the module loads in all environments.

### Sharing Data Between Modules: The `PrimitiveContainer`

Modules can share data using the `PrimitiveContainer` (the third argument, `container`, in event handlers). It's a simple key-value store.

**Module A (Setting Data):**

**JavaScript**

```javascript
import { AbstractModule } from '@alliage/framework';

export class DataSetterModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    container.set('sharedMessage', 'Hello from DataSetterModule!');
  };
}
```

**TypeScript**

```typescript
import { AbstractModule, Arguments, PrimitiveContainer } from '@alliage/framework';

export class DataSetterModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args: Arguments, env: string, container: PrimitiveContainer) => {
    container.set('sharedMessage', 'Hello from DataSetterModule!');
  };
}
```

**Module B (Getting Data):**

**JavaScript**

```javascript
import { AbstractModule } from '@alliage/framework';

export class DataGetterModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      run: this.onRun,
    };
  }

  onRun = async (args, env, container) => {
    const message = container.get('sharedMessage');
    console.log(message); // Outputs: Hello from DataSetterModule!
  };
}
```

**TypeScript**

```typescript
import { AbstractModule, Arguments, PrimitiveContainer } from '@alliage/framework';

export class DataGetterModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      run: this.onRun,
    };
  }

  onRun = async (args: Arguments, env: string, container: PrimitiveContainer): Promise<void> => {
    const message = container.get<string>('sharedMessage');
    console.log(message); // Outputs: Hello from DataSetterModule!
  };
}
```

After registering both modules and running `npx alliage-scripts run`, you'll see:

```bash
Hello from DataSetterModule!
```

⚠️ **Important**: The `PrimitiveContainer` is writable **only** during the `init` event. In `install`, `build`, and `run` events, it's read-only. This design choice prevents complex state management issues and encourages predictable data flow.

This powerful feature enables you to create small, focused modules that collaborate, adhering to the Single Responsibility Principle.

## The Alliage Way

Alliage's core philosophy is simplicity and modularity. It provides the essentials, allowing you to compose your application with small, logical blocks. This ensures your project contains only the features you need, promoting clean and maintainable code.

If you've journeyed this far, you understand that Alliage is intentionally simple. This simplicity is its strength. Build what you need, extend as you grow, and enjoy a framework that adapts to you, not the other way around.

## Expanding Alliage: Official Modules and Distributions

While Alliage provides the core foundation, its true power is unlocked through its modular ecosystem. Here are some official resources to enhance your Alliage applications:

### Core Functionality: Alliage Core

For a set of foundational features that many applications will benefit from, the [Alliage Core](https://github.com/alliage-framework/core) modules provide robust solutions, including:

-   Event management
-   Dependency injection
-   Build pipelines
-   Configuration loader
-   Autoloading
-   Automatic module installation
-   And more...

### TypeScript Support

If you prefer developing your applications in TypeScript, the official [Alliage TypeScript module](https://github.com/alliage-framework/typescript) offers seamless integration and type safety.

### API Development

Building APIs with Alliage is straightforward with these dedicated modules:

-   **[Alliage Web](https://github.com/alliage-framework/web)**: Provides the essential tools for building a web server.
-   **[Alliage REST](https://github.com/alliage-framework/rest)**: Extends Alliage Web with capabilities tailored for creating RESTful APIs.

### Ready-to-Use Solutions: Alliage Distributions

For a more opinionated, ready-to-use setup, explore the [Alliage distributions](https://github.com/alliage-framework/dists). These provide pre-configured project structures and common module combinations to get you started quickly.