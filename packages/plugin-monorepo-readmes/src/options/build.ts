import { LogLevel, ParameterType } from 'typedoc';

import { OptionGroup } from '@knodes/typedoc-pluginutils';

import type { MonorepoReadmePlugin } from '../plugin';
import { IPluginOptions } from './types';

export const buildOptions = ( plugin: MonorepoReadmePlugin ) => OptionGroup.factory<IPluginOptions>( plugin )
	.add( 'rootFiles', {
		help: 'A list of file names used to infer packages root.',
		type: ParameterType.Array,
		defaultValue: [ 'package.json' ],
	} )
	.add( 'logLevel', {
		help: 'The plugin log level.',
		type: ParameterType.Map,
		map: LogLevel,
		defaultValue: plugin.application.logger.level,
	} )
	.add( 'readme', {
		help: 'Specify name of readme files',
		type: ParameterType.Array,
		defaultValue: [],
	} )
	.build();
