const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function executeRemoteCommand(hash) {
  try {
    // Connect to the remote server
    await ssh.connect({
      host: '192.168.108.128',
      username: 'user',
      password: 'sagar102.',
    });

    // Command to navigate to the directory and run the make and executable commands
    const command = `cd /home/codemonkey/Desktop/openfhe/hello_openfhe/build && make && ./hello_openfhe ${hash}`;

    // Execute the command
    const result = await ssh.execCommand(command);

    if (result.stderr) {
      throw new Error(result.stderr);
    }

    // Assuming the output is in result.stdout
    // console.log(result.stdout);

    // Disconnect from the SSH session
    ssh.dispose();

    return result.stdout;
  } catch (error) {
    console.error(
      `SSH command execution error from sshService: ${error.message}`
    );
    throw error;
  }
}

module.exports = { executeRemoteCommand };
