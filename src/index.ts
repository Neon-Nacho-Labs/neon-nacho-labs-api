import express, { Express } from 'express';
import config from '../config.json';
import { router } from './endpoints';
import cors from 'cors';

const bodyParser = require('body-parser')
const corsOptions = {
	// Allowed origins
	origin: [
		'http://localhost:3000',
		'https://localhost:3000',
		'http://neonnacho.xyz',
		'https://neonnacho.xyz'
	],
	optionsSuccessStatus: 200
}

const app: Express = express();
app.use( cors( corsOptions ) );
app.use( express.static( 'public' ) );
app.use( bodyParser.json() );
app.use( '/', router );

// Start the application by listening to specific port
const port = Number( process.env.PORT || config.PORT || 80 );
app.listen( port, () => {
	console.info('Express application started on port: ' + port);
});
