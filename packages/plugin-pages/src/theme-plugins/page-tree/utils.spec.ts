import { ContainerReflection, DeclarationReflection, ReflectionKind } from 'typedoc';

import { popReflection } from './utils';

class StubReflection extends DeclarationReflection {
	private static _counter = 0;
	public constructor( parent?: ContainerReflection ){
		super( `Reflection ${StubReflection._counter++}`, ReflectionKind.Accessor, parent );
		if( parent ){
			parent.children = [
				...( parent.children ?? [] ),
				this,
			];
		}
	}
}

it( 'should pop reflection correctly', () => {
	const grandParent = new StubReflection();
	const parent = new StubReflection( grandParent );
	const self = new StubReflection( parent );
	const [ child1, child2 ] = [ new StubReflection( self ), new StubReflection( self ) ];
	const grandChild = new StubReflection( child1 );

	popReflection( self );

	expect( self.parent ).toBeNil();
	expect( self.children ).toBeNil();

	expect( grandParent.parent ).toBeNil();
	expect( grandParent.children ).toEqual( [ parent ] );

	expect( parent.parent ).toBe( grandParent );
	expect( parent.children ).toEqual( [ child1, child2 ] );

	expect( child1.parent ).toBe( parent );
	expect( child1.children ).toEqual( [ grandChild ] );

	expect( child2.parent ).toBe( parent );
	expect( child2.children ).toBeNil();

	expect( grandChild.parent ).toBe( child1 );
	expect( grandChild.children ).toBeNil();
} );
