import { restoreFs, setVirtualFs } from '#plugintestbed';

import { globMatch } from './utils';

process.chdir( __dirname );
afterEach( restoreFs );
describe( 'Globs matching', () => {
	beforeEach( () => {
		setVirtualFs( {
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
