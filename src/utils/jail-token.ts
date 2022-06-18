// import sha256 from 'crypto-js/sha256';

require( 'dotenv' ).config();
const Moralis = require( 'moralis/node' );
const ETH_CHAIN = 'goerli';

const createAndSaveImage = async ( tokenImageURL: string, uniqueName: string ) => {
	console.log( 'in createImage' );

	const { createCanvas, loadImage } = require('canvas');
	const fs = require('fs');

	if ( tokenImageURL.search('ipfs://') > -1) {
		tokenImageURL = tokenImageURL.replace('ipfs://', 'https://ipfs.io/ipfs/');
	}

	// Load the original token image
	const imageLayer1 = await loadImage( tokenImageURL );
	// Load the original token image
	const imageLayer2 = await loadImage( 'public/assets/jail.png' );

	// Only support square image for now
	const widthAndHeight = Math.min( imageLayer1.width, imageLayer1.height, imageLayer2.width, imageLayer2.height )

	// Draw the layers
	const canvas = createCanvas( widthAndHeight, widthAndHeight );
	const canvasContext = canvas.getContext("2d");

	canvasContext?.drawImage( imageLayer1, 0, 0, widthAndHeight, widthAndHeight );
	canvasContext?.drawImage( imageLayer2, 0, 0, widthAndHeight, widthAndHeight );

	const imageDataURL = canvas.toDataURL( 'image/jpeg', 0.6 );

	const imageHash = await uploadToIPFS( uniqueName, { base64: imageDataURL } );
	// console.log( imageURL );

	return 'ipfs://' + imageHash;
}

const createAndSaveMetaData = async ( tokenAddress: string, tokenId: string, tokenName: string, imageURL: string, uniqueName: string ) => {
	const metadata = {
		description: 'Naughty NFTs go to jail. A random experiment by Neon Nacho Labs.',
		image: imageURL,
		name: tokenName.trim() + ' in jail',
		attributes: [
			{
				trait_type: 'Parent Name',
				value: tokenName
			},
			{
				trait_type: 'Parent Address',
				value: tokenAddress
			},
			{
				trait_type: 'Parent ID',
				value: tokenId
			}
		]
	};
console.log( metadata );
	const metadataHash = await uploadToIPFS( uniqueName, {
		base64: btoa( JSON.stringify( metadata ) )
	});

	return {
		metadata,
		metadataHash
	};
}

const uploadToIPFS = async ( dataName: string, data: number[] | { base64: string; } | { size: number; type: string; } | { uri: string; } ) => {
	const file = new Moralis.File( dataName, data );
	await file.saveIPFS( {useMasterKey: true} );
	// console.log(file.hash(), file);
	return file.hash();
}

export const createJailedToken = async ( userAddress: string, tokenAddress: string, tokenId: string ) => {
	// Initialize Moralis
	await Moralis.start( {
		serverUrl: process.env.MORALIS_SERVER_URL,
		appId: process.env.MORALIS_APP_ID,
		masterKey: process.env.MORALIS_MASTER_KEY,
	});

	// Check that user owns the token
	const tokenIdOwners = await Moralis.Web3API.token.getTokenIdOwners({
		address: tokenAddress,
		token_id: tokenId,
		chain: ETH_CHAIN,
	});

	if ( ! tokenIdOwners.result ) {
		return { error: 'Couldn‘t find token' };
	}

	if ( tokenIdOwners.result.length > 1 ) {
		return { error: 'Token has multiple owners' };
	}
console.log( userAddress, tokenIdOwners.result[0].owner_of );

	if ( userAddress.toLowerCase() != tokenIdOwners.result[0].owner_of.toLowerCase() ) {
		return { error: 'You don‘t own that token' };
	}

	// Get token image from metadata
	const tokenMetadata = JSON.parse( tokenIdOwners.result[0].metadata );
console.log( tokenMetadata );
	if ( ! tokenMetadata.image ) {
		return { error: 'Could‘t find token image' };
	}

	// Create token image and upload to IPFS
	const imageURL = await createAndSaveImage( tokenMetadata.image, tokenAddress + '-' + tokenId );
console.log( imageURL );

	// Create JSON metadata and upload to IPFS
	const metadata = await createAndSaveMetaData( tokenAddress, tokenId, tokenMetadata.name, imageURL, tokenAddress + '-' + tokenId + '-metadata' );
console.log( metadata );

	// Return URL to JSON metadata
	return metadata;
}