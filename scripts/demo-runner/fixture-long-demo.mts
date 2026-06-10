process.stdout.write("started\n");
setInterval(() => {
  process.stdout.write("tick\n");
}, 50);
