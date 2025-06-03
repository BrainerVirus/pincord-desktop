import { BrowserWindow, app } from 'electron';
import path from 'node:path';
import { isDev } from './util.js';

app.on('ready', () => {
	const mainWindow = new BrowserWindow({});

	if (isDev()) {
		// Load the file with the hash fragment pointing to home route
		mainWindow.loadURL('http://localhost:5123');
	} else {
		// Load the file with the hash fragment pointing to home route
		mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'), {
			hash: '/',
		});
	}
});
