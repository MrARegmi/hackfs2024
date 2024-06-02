const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function executeTestCommand(secretKey, encryptedDataString) {
  try {
    await ssh.connect({
      host: '192.168.108.128',
      username: 'user',
      password: 'sagar102.',
    });

    console.log('i am inside test');
    const commands = `cd /home/codemonkey/Desktop/openfhe/hello_openfhe/build && make && ./test ${secretKey} ${encryptedDataString}`;

    const result = await ssh.execCommand(commands);

    if (result.stderr) {
      throw new Error(result.stderr);
    }

    ssh.dispose();

    return result.stdout;
  } catch (error) {
    console.error(`SSH command execution error from test: ${error.message}`);
    throw error;
  }
}

module.exports = { executeTestCommand };
