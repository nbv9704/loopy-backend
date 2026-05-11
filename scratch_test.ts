import ivm from 'isolated-vm';

async function test() {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = isolate.createContextSync();
  const jail = context.global;
  jail.setSync('global', jail.derefInto());

  const stdoutLines: string[] = [];
  const logCallback = function(str: string) {
    stdoutLines.push(str);
  };
  
  jail.setSync('_logCallback', new ivm.Reference(logCallback));

  context.evalSync(`
    global.console = {
      log: (...args) => {
        const serializedArgs = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg); } catch(e) { return String(arg); }
          }
          return String(arg);
        });
        _logCallback.applySync(undefined, [serializedArgs.join(' ')]);
      }
    };
  `);
  
  const script = isolate.compileScriptSync(`
    console.log("Hello from IVM", { a: 1 });
    "result_value";
  `);
  
  try {
    const res = script.runSync(context, { timeout: 1000 });
    console.log("Result:", res);
    console.log("Stdout:", stdoutLines);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
