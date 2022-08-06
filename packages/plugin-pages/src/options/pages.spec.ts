import { noop } from 'lodash';

import { MockPlugin, mockPlugin } from '#plugintestbed';

import { PagesPlugin } from '../plugin';
import { validatePages } from './pages';
import { IRootPageNode } from './types';

let plugin: MockPlugin<PagesPlugin>;
beforeEach( () => {
	plugin = mockPlugin<PagesPlugin>();
} );

it( 'should throw if inconsistent "moduleRoot" option given', () => expect( () => validatePages( plugin )( [
	{ name: 'A', moduleRoot: true },
	{ name: 'B' },
] as IRootPageNode[] ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' ) );
it( 'should warn if using legacy "title" property (#133)', () => {
	jest.spyOn( plugin.application.logger, 'warn' ).mockImplementation( noop );
	jest.spyOn( plugin.application.logger, 'error' ).mockImplementation( noop );
	validatePages( plugin )( [
		{ title: 'A' },
	] );
	expect( plugin.application.logger.warn ).toHaveBeenCalledTimes( 1 );
	expect( plugin.application.logger.warn ).toHaveBeenCalledWith( expect.toInclude( 'Page "A" is using deprecated "title" property. Use "name" instead.' ) );
} );
describe( 'Glob', () => {
	it( 'should throw if page has a `match` property, but no `template`', () => {
		expect( () => validatePages( plugin )( [
			{ match: 'A' },
		] ) ).toThrow( 'Page "Unnamed" has a "match" or "template" property, but it should have both or none' );
	} );
	it( 'should throw if page has a `template` property, but no `match`', () => {
		expect( () => validatePages( plugin )( [
			{ template: [] },
		] ) ).toThrow( 'Page "Unnamed" has a "match" or "template" property, but it should have both or none' );
	} );
	it( 'should throw if page has a `template` property with invalid child', () => {
		expect( () => validatePages( plugin )( [
			{ match: 'foo', template: [
				{ asd: false },
			] },
		] ) ).toThrow( 'Page "TEMPLATE 1" ⇒ "Unnamed" should have a name' );
	} );
	it( 'should check for root nodes through templates (root in page)', () => {
		expect( () => validatePages( plugin )( [
			{ match: 'foo', template: [
				{ match: 'bar', template: [
					{ match: 'qux', template: [
						{ name: 'test' },
					] },
				] },
			] },
			{ moduleRoot: true, name: 'fail' },
		] ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' );
	} );
	it( 'should check for root nodes through templates (root in template)', () => {
		expect( () => validatePages( plugin )( [
			{ match: 'foo', template: [
				{ match: 'bar', template: [
					{ match: 'qux', template: [
						{ moduleRoot: true, name: 'fail' },
					] },
				] },
			] },
			{ name: 'test' },
		] ) ).toThrow( 'Every root pages should set `moduleRoot` to true, or none' );
	} );
	it( 'should pass with empty array', () => {
		expect( () => validatePages( plugin )( [] ) ).not.toThrow();
	} );
	it( 'should pass with nil value', () => {
		expect( () => validatePages( plugin )( undefined ) ).not.toThrow();
	} );
} );
