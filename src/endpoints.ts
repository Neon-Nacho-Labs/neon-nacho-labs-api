import { Router } from 'express';
import { ENDPOINT_BASE } from './constants';
import { createJailedToken } from './utils/jail-token';

export const router: Router = Router();

router.get( ENDPOINT_BASE + "/test", ( request, response ) => {
	response.json( {
		message: 'nice job – you called the api 🎉'
	} );
});

router.post( ENDPOINT_BASE + "/create-jailed-token", async ( request, response ) => {
	response.json(
		await createJailedToken( request.body.user_address, request.body.token_address, request.body.token_id )
	);
});
