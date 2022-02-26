import { MenuReflection } from './menu-reflection';
import { PageReflection } from './page-reflection';

export type NodeReflection = MenuReflection | PageReflection;
export { MenuReflection, PageReflection };
export { PagesPluginReflectionKind } from './reflection-kind';
