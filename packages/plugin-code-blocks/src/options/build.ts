import assert from 'assert';

import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import type { CodeBlockPlugin } from '../plugin';
import { EBlockMode } from '../types';
import { EInvalidBlockLinkHandling, IPluginOptions } from './types';

export const buildOptions = ( plugin: CodeBlockPlugin ) => OptionGroup.factory<IPluginOptions>( plugin )
	.add( 'invalidBlockLinkHandling', {
		help: 'The kind of error to throw in case of an invalid code block reference.',
		type: ParameterType.Map,
		map: EInvalidBlockLinkHandling,
		defaultValue: EInvalidBlockLinkHandling.LOG_ERROR,
	} )
	.add( 'defaultBlockMode', {
		help: 'The default code blocks mode.',
		type: ParameterType.Map,
		map: EBlockMode,
		defaultValue: EBlockMode.EXPANDED,
	} )
	.add( 'source', {
		help: 'Root directory where all code blocks live.',
		type: ParameterType.String,
		defaultValue: 'examples',
	} )
	.add( 'logLevel', {
		help: 'The plugin log level.',
		type: ParameterType.Map,
		map: LogLevel,
		defaultValue: plugin.application.logger.level,
	} )
	.add( 'excludeMarkdownTags', {
		help: 'A list of markdown captures to omit. Should have the form `{@....}`.',
		type: ParameterType.Array,
		validate: patterns => patterns?.forEach( p => assert.match( p, /^\{@.*\}$/, `Pattern ${JSON.stringify( p )} should match "{@...}"` ) ),
	}, v => v ?? [] )
	.build();
