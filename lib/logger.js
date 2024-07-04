function write (logPath, data) { // return -1: path not access -2: error when write data true(1): write success
	const fs = require("node:fs");
	fs.access(logPath, fs.constants.F_OK, function(error) {
		if (error) {
			return -1;
		}
		else {
			try {
				fs.appendFileSync(logPath,Date.now().toString() + data + "\n");
			}
			catch (error) {
				return -2;
			}
			return true;
		}
	})
};
function stream (logPath, data) {
	fs.appendFileSync(logPath,Date.now().toString() + " "+ data + "\n");
}
module.exports = {
	write: write,
	stream: stream,
}
