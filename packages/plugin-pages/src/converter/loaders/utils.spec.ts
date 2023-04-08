
import { vol } from 'memfs';

import { globMatch } from './utils';

jest.mock( 'fs', () => jest.requireActual( 'memfs' ).fs );

process.chdir( __dirname );
afterEach( () => vol.reset() );
describe( 'Globs matching', () => {
	beforeEach( () => {
		vol.fromNestedJSON( {
			'packages': {
				foo: {
					'pages': { 'foo-page.md': '' },
					'foo-readme.md': '',
				},
				bar: {
					'pages': { 'bar-page.md': '' },
					'bar-readme.md': '',
				},
			},
			'pages': { 'root-page.md': '' },
			'root-readme.md': '',
		} );
	} );
	it( 'should match anything', () => {
		expect( globMatch( [
			'**/*',
		] ) ).not.toBeEmpty();
	} );
	it( 'should match files correctly', () => {
		expect( globMatch( [
			'packages/*/pages/**/*.md',
			'pages/**/*.md',
		] ) ).toIncludeSameMembers( [
			'packages/foo/pages/foo-page.md',
			'packages/bar/pages/bar-page.md',
			'pages/root-page.md',
		] );
	} );
	it( 'should support excluded patterns', () => {
		expect( globMatch( [
			'packages/*/pages/**/*.md',
			'pages/**/*.md',
			'!**/{foo,root}-page.md',
		] ) ).toIncludeSameMembers( [
			'packages/bar/pages/bar-page.md',
		] );
	} );
} );
